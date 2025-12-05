import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExamRecord {
  // 考试标识（组合键）
  academicYear: string;
  gradeLevel: string;
  month: number;
  type: string;
  // 关联的所有assessment IDs
  assessmentIds: number[];
  // 统计信息
  schoolCount: number;
  schoolNames: string[];
  studentCount: number;
  scoreCount: number;
  createdAt: string;
}

export const useUploadHistory = () => {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // 获取所有考试记录
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          id,
          academic_year,
          grade_level,
          month,
          type,
          created_at,
          schools (name)
        `)
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      if (!assessments || assessments.length === 0) {
        setRecords([]);
        return;
      }

      // 按考试（学年+年级+月份+类型）分组
      const examMap = new Map<string, {
        academicYear: string;
        gradeLevel: string;
        month: number;
        type: string;
        assessmentIds: number[];
        schoolNames: string[];
        createdAt: string;
      }>();

      assessments.forEach(assessment => {
        const key = `${assessment.academic_year}-${assessment.grade_level}-${assessment.month}-${assessment.type}`;
        
        if (!examMap.has(key)) {
          examMap.set(key, {
            academicYear: assessment.academic_year,
            gradeLevel: assessment.grade_level,
            month: assessment.month,
            type: assessment.type,
            assessmentIds: [],
            schoolNames: [],
            createdAt: assessment.created_at,
          });
        }
        
        const exam = examMap.get(key)!;
        exam.assessmentIds.push(assessment.id);
        const schoolName = (assessment.schools as any)?.name;
        if (schoolName && !exam.schoolNames.includes(schoolName)) {
          exam.schoolNames.push(schoolName);
        }
        // 保持最早的创建时间
        if (assessment.created_at < exam.createdAt) {
          exam.createdAt = assessment.created_at;
        }
      });

      // 获取每场考试的成绩统计
      const examRecords: ExamRecord[] = await Promise.all(
        Array.from(examMap.values()).map(async (exam) => {
          // 统计该考试的成绩数量
          const { count: scoreCount, error: scoreError } = await supabase
            .from('individual_scores')
            .select('id', { count: 'exact', head: true })
            .in('assessment_id', exam.assessmentIds);

          if (scoreError) {
            console.error('获取成绩统计失败:', scoreError);
          }

          // 统计参考学生数量（去重）
          const { data: studentData, error: studentError } = await supabase
            .from('individual_scores')
            .select('student_id')
            .in('assessment_id', exam.assessmentIds);

          if (studentError) {
            console.error('获取学生统计失败:', studentError);
          }

          const uniqueStudents = new Set(studentData?.map(s => s.student_id) || []);

          return {
            academicYear: exam.academicYear,
            gradeLevel: exam.gradeLevel,
            month: exam.month,
            type: exam.type,
            assessmentIds: exam.assessmentIds,
            schoolCount: exam.schoolNames.length,
            schoolNames: exam.schoolNames,
            studentCount: uniqueStudents.size,
            scoreCount: scoreCount || 0,
            createdAt: exam.createdAt,
          };
        })
      );

      // 按创建时间倒序排列
      examRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRecords(examRecords);
    } catch (error) {
      console.error('获取上传历史失败:', error);
      toast({
        title: "获取上传历史失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteExam = useCallback(async (assessmentIds: number[]) => {
    setIsDeleting(true);
    try {
      // 1. 删除 assessment_subjects 关联记录
      const { error: subjectError } = await supabase
        .from('assessment_subjects')
        .delete()
        .in('assessment_id', assessmentIds);

      if (subjectError) {
        console.error('删除考试科目配置失败:', subjectError);
        throw subjectError;
      }

      // 2. 删除该考试的所有成绩记录
      const { error: scoresError } = await supabase
        .from('individual_scores')
        .delete()
        .in('assessment_id', assessmentIds);

      if (scoresError) {
        console.error('删除成绩记录失败:', scoresError);
        throw scoresError;
      }

      // 3. 删除考试记录本身
      const { error: assessmentError } = await supabase
        .from('assessments')
        .delete()
        .in('id', assessmentIds);

      if (assessmentError) {
        console.error('删除考试记录失败:', assessmentError);
        throw assessmentError;
      }

      toast({
        title: "删除成功",
        description: "考试记录及相关数据已删除",
      });

      // 刷新列表
      await fetchHistory();
    } catch (error) {
      console.error('删除考试记录失败:', error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [toast, fetchHistory]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    records,
    isLoading,
    isDeleting,
    fetchHistory,
    deleteExam,
  };
};
