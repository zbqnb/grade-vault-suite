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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const header = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: 1 // 只讀取第2行，即科目行
      })[0] as any[];

      const subHeader = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: 2 // 只讀取第3行，即指標行
      })[0] as any[];

      const body = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: 3 // 從第4行開始讀取為數據體
      }) as any[][];

      if (body.length < 1) {
        throw new Error('文件格式不正確，未找到有效的學生數據');
      }

      const columnMapping: { [key: number]: { subject: string; metric: string } } = {};
      let currentSubject = ''; 

      for (let col = 4; col < subHeader.length; col++) {
        if (header[col]) {
          currentSubject = header[col];
        }
        const metric = subHeader[col];
        if (currentSubject && metric) {
          columnMapping[col] = { subject: currentSubject, metric };
        }
      }

      const records: ParsedRecord[] = [];
      for (const rowData of body) {
        if (!rowData || rowData.length < 4) continue;
        
        const [schoolName, studentName, className, studentNumber] = rowData;
        if (!schoolName || !studentName || !className || !studentNumber) continue;

        for (const [colIndex, mapping] of Object.entries(columnMapping)) {
          if (mapping.metric === '成绩' && mapping.subject !== '总分') {
            const scoreValue = parseFloat(rowData[parseInt(colIndex)]);
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
        throw new Error('未找到有效的成績數據');
      }
      
      // 保留了調試功能，方便您在控制台校驗解析結果
      const groupedForDebugging = records.reduce((acc, record) => {
        const key = `${record.studentName} (${record.studentNumber})`;
        if (!acc[key]) {
          acc[key] = { studentName: record.studentName, scores: [] };
        }
        acc[key].scores.push({ subject: record.subjectName, score: record.scoreValue });
        return acc;
      }, {} as { [key: string]: { studentName: string; scores: { subject: string; score: number }[] } });
      
      console.clear(); 
      console.log("=============== Excel 文件解析結果校驗 ===============");
      console.table(Object.values(groupedForDebugging));
      console.log("======================================================");

      await saveToDatabase(records, metadata);
      
      toast({
        title: "上傳成功",
        description: `成功導入 ${records.length} 條成績記錄`,
      });

      return records;
    } catch (error) {
      console.error('Excel解析或保存錯誤:', error);
      toast({
        title: "上傳失敗",
        description: error instanceof Error ? error.message : "發生未知錯誤",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDatabase = async (records: ParsedRecord[], metadata: UploadMetadata) => {
    try {
      // 1. 準備基礎數據並去重
      const uniqueSchools = [...new Set(records.map(r => r.schoolName))].map(name => ({ name }));
      const uniqueSubjects = [...new Set(records.map(r => r.subjectName))].map(name => ({ name }));

      // 2. 批量 Upsert 學校和科目，並獲取 ID 映射
      const [schoolsResult, subjectsResult] = await Promise.all([
        supabase.from('schools').upsert(uniqueSchools, { onConflict: 'name' }).select('id, name'),
        supabase.from('subjects').upsert(uniqueSubjects, { onConflict: 'name' }).select('id, name'),
      ]);
      if (schoolsResult.error) throw schoolsResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      const schoolMap = new Map<string, number>(schoolsResult.data.map(s => [s.name, s.id]));
      const subjectMap = new Map<string, number>(subjectsResult.data.map(s => [s.name, s.id]));

      // 3. 準備並批量 Upsert 考試 (Assessments)
      // 升級 #2: 從 insert 改為 upsert，防止重複上傳時因考試記錄已存在而報錯
      const assessmentUpserts = uniqueSchools.map(({ name }) => ({
        school_id: schoolMap.get(name)!,
        academic_year: metadata.academicYear,
        grade_level: metadata.gradeLevel,
        month: metadata.month,
        type: metadata.assessmentType
      }));
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .upsert(assessmentUpserts, { onConflict: 'school_id,academic_year,grade_level,month,type' })
        .select('id, school_id');
      if (assessmentsError) throw assessmentsError;
      const assessmentMap = new Map<number, number>(assessments.map(a => [a.school_id, a.id]));

      // 4. 準備並批量 Upsert 班級 (Classes)
      const uniqueClasses = [...new Set(records.map(r => JSON.stringify({
        name: r.className,
        school_id: schoolMap.get(r.schoolName)!,
        academic_year: metadata.academicYear,
        grade_level: metadata.gradeLevel,
      })))].map(s => JSON.parse(s));
      const { error: classesError } = await supabase.from('classes').upsert(uniqueClasses, { onConflict: 'school_id,academic_year,grade_level,name' });
      if (classesError) throw classesError;
      
      // 5. 準備並批量 Upsert 學生 (Students)
      // 首先獲取班級 ID 映射
      const { data: classesData, error: classesQueryError } = await supabase.from('classes').select('id, name, school_id').in('school_id', [...schoolMap.values()]);
      if (classesQueryError) throw classesQueryError;
      const classMap = new Map<string, number>(classesData.map(c => [`${c.name}__${c.school_id}`, c.id]));

      const studentUpserts = [...new Set(records.map(r => JSON.stringify({
        class_id: classMap.get(`${r.className}__${schoolMap.get(r.schoolName)!}`),
        student_number: r.studentNumber,
        name: r.studentName,
      })))].map(s => JSON.parse(s));
      const { error: studentsError } = await supabase.from('students').upsert(studentUpserts, { onConflict: 'class_id,student_number' });
      if (studentsError) throw studentsError;

      // 6. 準備最終的成績數據 (Scores)
      // 獲取學生 ID 映射
      const { data: studentsData, error: studentsQueryError } = await supabase.from('students').select('id, student_number, class_id').in('class_id', [...classMap.values()]);
      if (studentsQueryError) throw studentsQueryError;
      const studentMap = new Map<string, number>(studentsData.map(s => [`${s.student_number}__${s.class_id}`, s.id]));

      const scoreUpserts = records.map(record => {
        const schoolId = schoolMap.get(record.schoolName)!;
        const classId = classMap.get(`${record.className}__${schoolId}`);
        const studentId = studentMap.get(`${record.studentNumber}__${classId!}`);
        const assessmentId = assessmentMap.get(schoolId);
        const subjectId = subjectMap.get(record.subjectName);
        
        if (studentId && subjectId && assessmentId) {
          return {
            student_id: studentId,
            subject_id: subjectId,
            assessment_id: assessmentId,
            score_value: record.scoreValue
          };
        }
        return null;
      }).filter(Boolean);

      // 7. 批量 Upsert 成績
      // 升級 #3: 從 insert 改為 upsert，可以安全地重複上傳同一個文件，數據會被覆蓋而不是報錯
      if (scoreUpserts.length > 0) {
        const { error: scoresError } = await supabase
          .from('individual_scores')
          .upsert(scoreUpserts, { onConflict: 'assessment_id,student_id,subject_id' });
        if (scoresError) throw scoresError;
      }

    } catch (error) {
      console.error('數據庫保存錯誤:', error);
      throw new Error('數據保存失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  return {
    parseExcelFile,
    isLoading
  };
};
