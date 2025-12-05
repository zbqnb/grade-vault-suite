import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadRecord {
  assessmentId: number;
  schoolName: string;
  gradeLevel: string;
  academicYear: string;
  month: number;
  type: string;
  createdAt: string;
  studentCount: number;
  scoreCount: number;
}

export const useUploadHistory = () => {
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // 获取最近的考试记录（按创建时间倒序，限制20条）
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          id,
          academic_year,
          grade_level,
          month,
          type,
          created_at,
          school_id,
          schools (name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (assessmentError) throw assessmentError;

      if (!assessments || assessments.length === 0) {
        setRecords([]);
        return;
      }

      // 获取每个考试的成绩统计
      const recordsWithStats: UploadRecord[] = await Promise.all(
        assessments.map(async (assessment) => {
          // 统计该考试的成绩数量
          const { count: scoreCount, error: scoreError } = await supabase
            .from('individual_scores')
            .select('id', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          if (scoreError) {
            console.error('获取成绩统计失败:', scoreError);
          }

          // 统计参考学生数量（去重）
          const { data: studentData, error: studentError } = await supabase
            .from('individual_scores')
            .select('student_id')
            .eq('assessment_id', assessment.id);

          if (studentError) {
            console.error('获取学生统计失败:', studentError);
          }

          const uniqueStudents = new Set(studentData?.map(s => s.student_id) || []);

          return {
            assessmentId: assessment.id,
            schoolName: (assessment.schools as any)?.name || '未知学校',
            gradeLevel: assessment.grade_level,
            academicYear: assessment.academic_year,
            month: assessment.month,
            type: assessment.type,
            createdAt: assessment.created_at,
            studentCount: uniqueStudents.size,
            scoreCount: scoreCount || 0,
          };
        })
      );

      setRecords(recordsWithStats);
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

  const deleteUpload = useCallback(async (assessmentId: number) => {
    setIsDeleting(true);
    try {
      // 1. 先删除 assessment_subjects 关联记录
      const { error: subjectError } = await supabase
        .from('assessment_subjects')
        .delete()
        .eq('assessment_id', assessmentId);

      if (subjectError) {
        console.error('删除考试科目配置失败:', subjectError);
        throw subjectError;
      }

      // 2. 删除该考试的所有成绩记录
      const { error: scoresError } = await supabase
        .from('individual_scores')
        .delete()
        .eq('assessment_id', assessmentId);

      if (scoresError) {
        console.error('删除成绩记录失败:', scoresError);
        throw scoresError;
      }

      // 3. 删除考试记录本身
      const { error: assessmentError } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (assessmentError) {
        console.error('删除考试记录失败:', assessmentError);
        throw assessmentError;
      }

      toast({
        title: "删除成功",
        description: "上传记录及相关数据已删除",
      });

      // 刷新列表
      await fetchHistory();
    } catch (error) {
      console.error('删除上传记录失败:', error);
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
    deleteUpload,
  };
};
