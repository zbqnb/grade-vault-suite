import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ParsedRecord {
  studentNumber: string;
  studentName: string;
  className: string;
  subjectName: string;
  scoreValue: number;
  schoolName: string;
}

interface UploadMetadata {
  academicYear: string;
  gradeLevel: string;
  month: number;
  assessmentType: string;
}

export const useExcelParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const parseExcelFile = async (file: File, metadata: UploadMetadata) => {
    setIsLoading(true);
    
    try {
      // 读取Excel文件
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 4) {
        throw new Error('文件格式不正确，至少需要4行数据');
      }

      // 解析第2行（科目名称）和第3行（指标名称）
      const subjectRow = jsonData[1]; // 第2行
      const metricRow = jsonData[2];  // 第3行
      
      // 建立列映射
      const columnMapping: { [key: number]: { subject: string; metric: string } } = {};
      
      for (let col = 4; col < subjectRow.length; col++) { // 从E列(索引4)开始
        const subject = subjectRow[col];
        const metric = metricRow[col];
        
        if (subject && metric) {
          columnMapping[col] = { subject, metric };
        }
      }

      // 解析数据行（从第4行开始）
      const records: ParsedRecord[] = [];
      
      for (let row = 3; row < jsonData.length; row++) { // 从第4行开始（索引3）
        const rowData = jsonData[row];
        
        if (!rowData || rowData.length < 4) continue;
        
        const schoolName = rowData[0];    // A列
        const studentName = rowData[1];   // B列
        const className = rowData[2];     // C列  
        const studentNumber = rowData[3]; // D列
        
        if (!schoolName || !studentName || !className || !studentNumber) continue;

        // 处理成绩数据
        for (const [colIndex, mapping] of Object.entries(columnMapping)) {
          const col = parseInt(colIndex);
          
          // 只处理"成绩"列，且科目不是"总分"
          if (mapping.metric === '成绩' && mapping.subject !== '总分') {
            const scoreValue = parseFloat(rowData[col]);
            
            if (!isNaN(scoreValue)) {
              records.push({
                studentNumber: studentNumber.toString(),
                studentName,
                className,
                subjectName: mapping.subject,
                scoreValue,
                schoolName
              });
            }
          }
        }
      }

      if (records.length === 0) {
        throw new Error('未找到有效的成绩数据');
      }

      // 保存到数据库
      await saveToDatabase(records, metadata);
      
      toast({
        title: "上传成功",
        description: `成功导入 ${records.length} 条成绩记录`,
      });

      return records;

    } catch (error) {
      console.error('Excel解析错误:', error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "文件解析失败",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDatabase = async (records: ParsedRecord[], metadata: UploadMetadata) => {
    try {
      // 去重集合
      const uniqueSchoolNames = [...new Set(records.map(r => r.schoolName))];
      const uniqueClassKeys = [...new Set(records.map(r => `${r.className}__${r.schoolName}`))];
      const uniqueSubjectNames = [...new Set(records.map(r => r.subjectName))];

      // 1) 批量 upsert 学校并获取映射
      if (uniqueSchoolNames.length > 0) {
        const schoolUpserts = uniqueSchoolNames.map(name => ({ name }));
        const { data: upsertedSchools, error: schoolsUpsertError } = await supabase
          .from('schools')
          .upsert(schoolUpserts, { onConflict: 'name' })
          .select('id, name');
        if (schoolsUpsertError) throw schoolsUpsertError;
        var schoolMap = new Map<string, number>((upsertedSchools || []).map(s => [s.name, s.id]));
        // 若有缺失，补充查询
        if (schoolMap.size !== uniqueSchoolNames.length) {
          const { data: fetchedSchools, error: schoolsFetchError } = await supabase
            .from('schools')
            .select('id, name')
            .in('name', uniqueSchoolNames);
          if (schoolsFetchError) throw schoolsFetchError;
          schoolMap = new Map<string, number>((fetchedSchools || []).map(s => [s.name, s.id]));
        }
      } else {
        var schoolMap = new Map<string, number>();
      }

      // 2) 批量插入 assessments（每个学校一条）并建立映射
      const assessmentInserts = uniqueSchoolNames.map(schoolName => ({
        school_id: schoolMap.get(schoolName)!,
        academic_year: metadata.academicYear,
        grade_level: metadata.gradeLevel,
        month: metadata.month,
        type: metadata.assessmentType
      }));
      let assessmentMap = new Map<string, number>();
      if (assessmentInserts.length > 0) {
        const { data: insertedAssessments, error: assessmentsInsertError } = await supabase
          .from('assessments')
          .insert(assessmentInserts)
          .select('id, school_id');
        if (assessmentsInsertError) throw assessmentsInsertError;
        const schoolIdToName = new Map<number, string>([...schoolMap.entries()].map(([name, id]) => [id, name]));
        for (const a of insertedAssessments || []) {
          const schoolName = schoolIdToName.get(a.school_id);
          if (schoolName) assessmentMap.set(schoolName, a.id);
        }
        // 若有未建立映射的，回查（例如重复插入被约束拦截时）
        if (assessmentMap.size !== uniqueSchoolNames.length) {
          const { data: fetchedAssessments, error: assessmentsFetchError } = await supabase
            .from('assessments')
            .select('id, school_id, academic_year, grade_level, month, type')
            .eq('academic_year', metadata.academicYear)
            .eq('grade_level', metadata.gradeLevel)
            .eq('month', metadata.month)
            .eq('type', metadata.assessmentType)
            .in('school_id', uniqueSchoolNames.map(n => schoolMap.get(n)!));
          if (assessmentsFetchError) throw assessmentsFetchError;
          for (const a of fetchedAssessments || []) {
            const schoolName = [...schoolMap.entries()].find(([, id]) => id === a.school_id)?.[0];
            if (schoolName) assessmentMap.set(schoolName, a.id);
          }
        }
      }

      // 3) 批量 upsert 班级与科目
      const classUpserts = uniqueClassKeys.map(key => {
        const [className, schoolName] = key.split('__');
        const schoolId = schoolMap.get(schoolName)!;
        return {
          name: className,
          school_id: schoolId,
          academic_year: metadata.academicYear,
          grade_level: metadata.gradeLevel
        };
      });
      if (classUpserts.length > 0) {
        const { error: classesUpsertError } = await supabase
          .from('classes')
          .upsert(classUpserts, { onConflict: 'name,school_id,academic_year' });
        if (classesUpsertError) throw classesUpsertError;
      }

      const subjectUpserts = uniqueSubjectNames.map(name => ({ name }));
      if (subjectUpserts.length > 0) {
        const { error: subjectsUpsertError } = await supabase
          .from('subjects')
          .upsert(subjectUpserts, { onConflict: 'name' });
        if (subjectsUpsertError) throw subjectsUpsertError;
      }

      // 获取班级与科目映射
      const [classesQuery, subjectsQuery] = await Promise.all([
        supabase
          .from('classes')
          .select('id, name, school_id, academic_year')
          .eq('academic_year', metadata.academicYear)
          .in('school_id', uniqueSchoolNames.map(n => schoolMap.get(n)!)),
        supabase
          .from('subjects')
          .select('id, name')
          .in('name', uniqueSubjectNames)
      ]);
      if (classesQuery.error) throw classesQuery.error;
      if (subjectsQuery.error) throw subjectsQuery.error;

      const classMap = new Map<string, number>((classesQuery.data || []).map(c => [`${c.name}_${c.school_id}`, c.id]));
      const subjectMap = new Map<string, number>((subjectsQuery.data || []).map(s => [s.name, s.id]));

      // 4) 批量 upsert 学生（需要先解析到 class_id）
      const uniqueStudents = new Map<string, { number: string; name: string; classId: number }>();
      for (const r of records) {
        const schoolId = schoolMap.get(r.schoolName)!;
        const classId = classMap.get(`${r.className}_${schoolId}`);
        if (!classId) continue;
        const key = `${r.studentNumber}__${classId}`;
        if (!uniqueStudents.has(key)) {
          uniqueStudents.set(key, { number: r.studentNumber, name: r.studentName, classId });
        }
      }
      const studentUpserts = Array.from(uniqueStudents.values()).map(s => ({
        student_number: s.number,
        name: s.name,
        class_id: s.classId
      }));
      if (studentUpserts.length > 0) {
        const { error: studentsUpsertError } = await supabase
          .from('students')
          .upsert(studentUpserts, { onConflict: 'student_number,class_id' });
        if (studentsUpsertError) throw studentsUpsertError;
      }

      // 获取学生映射
      const { data: fetchedStudents, error: studentsFetchError } = await supabase
        .from('students')
        .select('id, student_number, class_id')
        .in('class_id', Array.from(new Set(Array.from(uniqueStudents.values()).map(s => s.classId))));
      if (studentsFetchError) throw studentsFetchError;
      const studentMap = new Map<string, number>((fetchedStudents || []).map(s => [`${s.student_number}_${s.class_id}`, s.id]));

      // 5) 生成成绩插入列表，并分片批量插入
      const scoreInserts = records.map(record => {
        const schoolId = schoolMap.get(record.schoolName)!;
        const classId = classMap.get(`${record.className}_${schoolId}`);
        const subjectId = subjectMap.get(record.subjectName);
        const studentId = classId ? studentMap.get(`${record.studentNumber}_${classId}`) : undefined;
        const assessmentId = assessmentMap.get(record.schoolName)!;
        return subjectId && studentId ? {
          student_id: studentId,
          subject_id: subjectId,
          assessment_id: assessmentId,
          score_value: record.scoreValue
        } : null;
      }).filter(Boolean) as Array<{ student_id: number; subject_id: number; assessment_id: number; score_value: number }>;

      if (scoreInserts.length > 0) {
        const CHUNK_SIZE = 1000; // 分片避免单次请求过大
        for (let i = 0; i < scoreInserts.length; i += CHUNK_SIZE) {
          const chunk = scoreInserts.slice(i, i + CHUNK_SIZE);
          const { error: scoresError } = await supabase
            .from('individual_scores')
            .insert(chunk);
          if (scoresError) throw scoresError;
        }
      }

    } catch (error) {
      console.error('数据库保存错误:', error);
      throw new Error('数据保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return {
    parseExcelFile,
    isLoading
  };
};
