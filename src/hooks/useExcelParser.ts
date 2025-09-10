import { useState } from 'react';
// 修正 #1：直接從 CDN 導入 xlsx 模塊以解決路徑解析問題
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs';
// 修正 #2：直接從 CDN 導入 Supabase 客戶端創建函數
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { useToast } from '@/hooks/use-toast';

// --- Supabase 客戶端初始化 ---
// 由於無法訪問您的項目配置，請在此處填寫您的 Supabase URL 和 Anon Key
// 您可以在 Supabase 項目的 Settings > API 中找到這些信息
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// 檢查佔位符是否已被替換，如果沒有，則在控制台發出警告
if (SUPABASE_URL === "YOUR_SUPABASE_URL" || SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY") {
    console.warn("Supabase 尚未配置，請在 useExcelParser.ts 文件中填寫您的 URL 和 Key。");
}

// 創建 Supabase 客戶端實例
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- 初始化結束 ---


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
      let currentSubject = ''; // 用于处理合并单元格的变量

      // 从E列(索引4)开始, 循环以指标行的长度为准
      for (let col = 4; col < metricRow.length; col++) {
        // 如果当前列在科目行有值，说明这是一个新科目的开始，更新currentSubject
        if (subjectRow[col]) {
          currentSubject = subjectRow[col];
        }
        
        const metric = metricRow[col];
        
        // 只要有“记住”的科目和当前指标名称，就创建映射
        if (currentSubject && metric) {
          columnMapping[col] = { subject: currentSubject, metric };
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

      // ======================= 用於調試的控制台日誌 =======================
      const groupedForDebugging: { [key: string]: { studentName: string; scores: { subject: string; score: number }[] } } = {};
      
      records.forEach(record => {
        const key = `${record.studentName} (${record.studentNumber})`;
        if (!groupedForDebugging[key]) {
          groupedForDebugging[key] = {
            studentName: record.studentName,
            scores: []
          };
        }
        groupedForDebugging[key].scores.push({
          subject: record.subjectName,
          score: record.scoreValue
        });
      });

      console.clear(); 
      console.log("=============== Excel 文件解析結果校驗 ===============");
      console.log(`共解析出 ${records.length} 條單科成績記錄。`);
      console.log("👇👇👇 以下是按學生分組的詳細成績列表，請核對是否與Excel文件一致：");
      
      console.table(Object.values(groupedForDebugging));
      
      console.log("=============== 校驗結束 ===============");
      // ======================= 調試代碼結束 =======================


      // 保存到数据库
      await saveToDatabase(records, metadata);
      
      toast({
        title: "上传成功",
        description: `成功导入 ${records.length} 条成绩记录`,
      });

      return records;

    } catch (error) {
      console.error('Excel解析或保存錯誤:', error);
      toast({
        title: "上传失败",
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
      // 去重以減少數據庫操作
      const uniqueSchoolNames = [...new Set(records.map(r => r.schoolName))];
      const uniqueClassKeys = [...new Set(records.map(r => `${r.className}__${r.schoolName}`))];
      const uniqueSubjectNames = [...new Set(records.map(r => r.subjectName))];
      
      // 1) 批量 Upsert 學校並獲取 ID 映射
      const schoolUpserts = uniqueSchoolNames.map(name => ({ name }));
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .upsert(schoolUpserts, { onConflict: 'name' })
        .select('id, name');
      if (schoolsError) throw schoolsError;
      const schoolMap = new Map<string, number>(schools.map(s => [s.name, s.id]));

      // 2) 批量 Upsert 考試並獲取 ID 映射
      const assessmentUpserts = uniqueSchoolNames.map(schoolName => ({
        school_id: schoolMap.get(schoolName)!,
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
      const assessmentMap = new Map<string, number>();
      assessments.forEach(a => {
        const schoolName = [...schoolMap.entries()].find(([, id]) => id === a.school_id)?.[0];
        if(schoolName) assessmentMap.set(schoolName, a.id);
      });
      
      // 3) 批量 Upsert 班級與科目
      const classUpserts = uniqueClassKeys.map(key => {
        const [className, schoolName] = key.split('__');
        return {
          name: className,
          school_id: schoolMap.get(schoolName)!,
          academic_year: metadata.academicYear,
          grade_level: metadata.gradeLevel
        };
      });
      const { error: classesError } = await supabase.from('classes').upsert(classUpserts, { onConflict: 'school_id,academic_year,grade_level,name' });
      if (classesError) throw classesError;

      const subjectUpserts = uniqueSubjectNames.map(name => ({ name }));
      const { error: subjectsError } = await supabase.from('subjects').upsert(subjectUpserts, { onConflict: 'name' });
      if (subjectsError) throw subjectsError;

      // 4) 獲取所有需要的班級和科目 ID 映射
      const [classesQuery, subjectsQuery] = await Promise.all([
        supabase.from('classes').select('id, name, school_id').eq('academic_year', metadata.academicYear).in('school_id', [...schoolMap.values()]),
        supabase.from('subjects').select('id, name').in('name', uniqueSubjectNames)
      ]);
      if (classesQuery.error) throw classesQuery.error;
      if (subjectsQuery.error) throw subjectsQuery.error;
      const classMap = new Map<string, number>(classesQuery.data.map(c => [`${c.name}__${c.school_id}`, c.id]));
      const subjectMap = new Map<string, number>(subjectsQuery.data.map(s => [s.name, s.id]));

      // 5) 批量 Upsert 學生
      const studentUpserts = Array.from(new Set(records.map(r => {
        const schoolId = schoolMap.get(r.schoolName)!;
        const classId = classMap.get(`${r.className}__${schoolId}`);
        return classId ? JSON.stringify({ student_number: r.studentNumber, name: r.studentName, class_id: classId }) : null;
      }))).filter(Boolean).map(s => JSON.parse(s as string));
      const { error: studentsError } = await supabase.from('students').upsert(studentUpserts, { onConflict: 'student_number,class_id' });
      if (studentsError) throw studentsError;

      // 6) 獲取所有需要的學生 ID 映射
      const classIds = [...classMap.values()];
      const { data: fetchedStudents, error: studentsFetchError } = await supabase.from('students').select('id, student_number, class_id').in('class_id', classIds);
      if (studentsFetchError) throw studentsFetchError;
      const studentMap = new Map<string, number>(fetchedStudents.map(s => [`${s.student_number}_${s.class_id}`, s.id]));

      // 7) 準備並分片批量插入最終的成績數據
      const scoreInserts = records.map(record => {
        const schoolId = schoolMap.get(record.schoolName)!;
        const classId = classMap.get(`${record.className}__${schoolId}`);
        const studentId = classId ? studentMap.get(`${record.studentNumber}_${classId}`) : undefined;
        const assessmentId = assessmentMap.get(record.schoolName);
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

      if (scoreInserts.length > 0) {
        const CHUNK_SIZE = 1000; 
        for (let i = 0; i < scoreInserts.length; i += CHUNK_SIZE) {
          const chunk = scoreInserts.slice(i, i + CHUNK_SIZE);
          // 對成績使用 upsert，以防重複上傳同一個文件
          const { error: scoresError } = await supabase
            .from('individual_scores')
            .upsert(chunk, { onConflict: 'assessment_id,student_id,subject_id' });
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
