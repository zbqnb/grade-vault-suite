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
      const schoolNames = new Set<string>();
      
      for (let row = 3; row < jsonData.length; row++) { // 从第4行开始（索引3）
        const rowData = jsonData[row];
        
        if (!rowData || rowData.length < 4) continue;
        
        const schoolName = rowData[0];    // A列
        const studentName = rowData[1];   // B列
        const className = rowData[2];     // C列  
        const studentNumber = rowData[3]; // D列
        
        if (!schoolName || !studentName || !className || !studentNumber) continue;
        
        schoolNames.add(schoolName);

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
                scoreValue
              });
            }
          }
        }
      }

      if (records.length === 0) {
        throw new Error('未找到有效的成绩数据');
      }

      // 验证学校名称一致性
      if (schoolNames.size > 1) {
        throw new Error(`文件中包含多个学校数据：${Array.from(schoolNames).join(', ')}`);
      }
      
      const schoolName = Array.from(schoolNames)[0];

      // 保存到数据库
      await saveToDatabase(records, { ...metadata, schoolName });
      
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

  const saveToDatabase = async (records: ParsedRecord[], metadata: UploadMetadata & { schoolName: string }) => {
    try {
      // 1. 确保学校存在
      let { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('name', metadata.schoolName)
        .single();

      if (!school) {
        const { data: newSchool, error } = await supabase
          .from('schools')
          .insert({ name: metadata.schoolName })
          .select('id')
          .single();
        
        if (error) throw error;
        school = newSchool;
      }

      // 2. 创建评估记录
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          school_id: school.id,
          academic_year: metadata.academicYear,
          grade_level: metadata.gradeLevel,
          month: metadata.month,
          type: metadata.assessmentType
        })
        .select('id')
        .single();

      if (assessmentError) throw assessmentError;

      // 3. 批量处理学生、班级、科目数据
      const uniqueClasses = [...new Set(records.map(r => r.className))];
      const uniqueSubjects = [...new Set(records.map(r => r.subjectName))];
      const uniqueStudents = [...new Set(records.map(r => ({ number: r.studentNumber, name: r.studentName, className: r.className })))];

      // 创建班级
      for (const className of uniqueClasses) {
        await supabase
          .from('classes')
          .upsert({
            name: className,
            school_id: school.id,
            academic_year: metadata.academicYear,
            grade_level: metadata.gradeLevel
          }, {
            onConflict: 'name,school_id,academic_year'
          });
      }

      // 创建科目
      for (const subjectName of uniqueSubjects) {
        await supabase
          .from('subjects')
          .upsert({ name: subjectName }, { onConflict: 'name' });
      }

      // 获取班级和科目ID映射
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', school.id)
        .eq('academic_year', metadata.academicYear);

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name');

      const classMap = new Map(classes?.map(c => [c.name, c.id]) || []);
      const subjectMap = new Map(subjects?.map(s => [s.name, s.id]) || []);

      // 创建学生
      for (const student of uniqueStudents) {
        const classId = classMap.get(student.className);
        if (classId) {
          await supabase
            .from('students')
            .upsert({
              student_number: student.number,
              name: student.name,
              class_id: classId
            }, {
              onConflict: 'student_number,class_id'
            });
        }
      }

      // 获取学生ID映射
      const { data: students } = await supabase
        .from('students')
        .select('id, student_number, class_id');

      const studentMap = new Map(students?.map(s => [`${s.student_number}_${s.class_id}`, s.id]) || []);

      // 4. 插入成绩数据
      const scoreInserts = records.map(record => {
        const classId = classMap.get(record.className);
        const subjectId = subjectMap.get(record.subjectName);
        const studentId = studentMap.get(`${record.studentNumber}_${classId}`);

        return {
          student_id: studentId,
          subject_id: subjectId,
          assessment_id: assessment.id,
          score_value: record.scoreValue
        };
      }).filter(insert => insert.student_id && insert.subject_id);

      if (scoreInserts.length > 0) {
        const { error: scoresError } = await supabase
          .from('individual_scores')
          .insert(scoreInserts);

        if (scoresError) throw scoresError;
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