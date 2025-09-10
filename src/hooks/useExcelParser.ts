import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SupabaseClient } from '@supabase/supabase-js'; // 建議導入類型以獲得更好的TS支持

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
      // 1. 讀取 Excel 文件
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 4) {
        throw new Error('文件格式不正確，至少需要4行數據');
      }

      // 2. 解析多級標題行
      const subjectRow = jsonData[1]; // 第2行 (主標題 - 科目)
      const metricRow = jsonData[2];  // 第3行 (子標題 - 指標)
      
      // --- 核心解析邏輯修正 ---
      // 能夠正確處理第2行合併儲存格的情況
      const columnMapping: { [key: number]: { subject: string; metric: string } } = {};
      let currentSubject = ''; 

      for (let col = 4; col < metricRow.length; col++) { // 從E列(索引4)開始
        // 如果科目行有值，更新當前處理的科目
        if (subjectRow[col]) {
          currentSubject = subjectRow[col];
        }
        
        const metric = metricRow[col];
        
        // 使用 "記住" 的科目和當前的指標來建立映射
        if (currentSubject && metric) {
          columnMapping[col] = { subject: currentSubject, metric };
        }
      }

      // 3. 解析學生數據行
      const records: ParsedRecord[] = [];
      const debugLogs: any[] = []; // 用於控制台輸出的數據

      for (let row = 3; row < jsonData.length; row++) {
        const rowData = jsonData[row];
        if (!rowData || !rowData[0]) continue; // 如果行不存在或沒有學校名稱，則跳過
        
        const schoolName = rowData[0];
        const studentName = rowData[1];
        const className = rowData[2];
        const studentNumber = rowData[3];
        
        if (!schoolName || !studentName || !className || !studentNumber) continue;

        const studentScores: { [key: string]: number | string } = {
          '學校名': schoolName,
          '學生': studentName,
        };
        let totalScoreFromExcel = 0;

        for (const [colIndex, mapping] of Object.entries(columnMapping)) {
          const col = parseInt(colIndex);
          const scoreValue = parseFloat(rowData[col]);

          if (!isNaN(scoreValue)) {
            // 如果是 "成绩" 指標，則處理
            if (mapping.metric === '成绩') {
              if (mapping.subject !== '总分') {
                // 這是一門單科成績
                records.push({
                  studentNumber: studentNumber.toString(),
                  studentName,
                  className,
                  subjectName: mapping.subject,
                  scoreValue,
                  schoolName
                });
                studentScores[mapping.subject] = scoreValue;
              } else {
                // 這是Excel中的總分
                totalScoreFromExcel = scoreValue;
              }
            }
          }
        }
        studentScores['总分'] = totalScoreFromExcel;
        debugLogs.push(studentScores);
      }

      if (records.length === 0) {
        throw new Error('未找到有效的成績數據');
      }

      // 4. 在控制台打印日誌 (按照您的要求)
      console.clear(); 
      console.log("=============== Excel 文件解析結果校驗 ===============");
      console.log(`共解析出 ${records.length} 條單科成績記錄，涉及 ${debugLogs.length} 名學生。`);
      console.log("👇👇👇 以下是準備傳入後端的數據預覽，請核對：");
      console.table(debugLogs);
      console.log("======================================================");

      // 5. 保存到數據庫
      await saveToDatabase(records, metadata);
      
      toast({
        title: "上傳成功",
        description: `成功導入 ${debugLogs.length} 名學生的 ${records.length} 條成績記錄`,
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
      const assessmentUpserts = [...schoolMap.values()].map(schoolId => ({
        school_id: schoolId,
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
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      // 7. 批量 Upsert 成績
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
