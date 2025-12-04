import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Loader2, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: number;
  name: string;
}

interface Assessment {
  id: number;
  academic_year: string;
  month: number;
  type: string;
  grade_level: string;
}

interface Subject {
  id: number;
  name: string;
}

interface AssessmentSubject {
  subject_id: number;
  full_score: number;
  excellent_threshold: number;
  pass_threshold: number;
  poor_threshold: number;
}

interface StudentScore {
  studentId: number;
  studentName: string;
  className: string;
  classId: number;
  scores: Map<number, number>; // subjectId -> score
  totalScore: number;
}

interface ExcellentStudent {
  studentId: number;
  studentName: string;
  scores: { subjectName: string; score: number; isCurrentSubject: boolean }[];
}

interface ClassRateData {
  classId: number;
  className: string;
  homeroomTeacher: string;
  studentCount: number;
  averageScore: number;
  excellentRate: number;
  excellentCount: number;
  excellentStudents: ExcellentStudent[];
  passRate: number;
  poorRate: number;
}

const ClassRatesAnalysis = () => {
  const { toast } = useToast();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('total'); // 'total' or subject id
  
  const [loading, setLoading] = useState(false);
  const [classRates, setClassRates] = useState<ClassRateData[]>([]);
  const [assessmentSubjects, setAssessmentSubjects] = useState<AssessmentSubject[]>([]);

  // Load schools
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.from('schools').select('id, name').order('id');
      if (error) {
        toast({ title: "加载学校失败", description: error.message, variant: "destructive" });
      } else if (data && data.length > 0) {
        setSchools(data);
        setSelectedSchool(data[0].id);
      }
    };
    fetchSchools();
  }, []);

  // Load assessments when school changes
  useEffect(() => {
    if (!selectedSchool) return;
    
    const fetchAssessments = async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('school_id', selectedSchool)
        .order('academic_year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) {
        toast({ title: "加载考试失败", description: error.message, variant: "destructive" });
      } else if (data) {
        setAssessments(data);
        if (data.length > 0) {
          setSelectedAssessment(data[0].id);
        }
      }
    };
    
    fetchAssessments();
  }, [selectedSchool]);

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('id');
      if (error) {
        toast({ title: "加载科目失败", description: error.message, variant: "destructive" });
      } else if (data) {
        setSubjects(data);
      }
    };
    fetchSubjects();
  }, []);

  // Load assessment subjects config
  useEffect(() => {
    if (!selectedAssessment) return;
    
    const fetchAssessmentSubjects = async () => {
      const { data, error } = await supabase
        .from('assessment_subjects')
        .select('subject_id, full_score, excellent_threshold, pass_threshold, poor_threshold')
        .eq('assessment_id', selectedAssessment);
      
      if (error) {
        toast({ title: "加载考试科目配置失败", description: error.message, variant: "destructive" });
      } else if (data) {
        setAssessmentSubjects(data.map(d => ({
          subject_id: d.subject_id,
          full_score: d.full_score || 100,
          excellent_threshold: d.excellent_threshold || 85,
          pass_threshold: d.pass_threshold || 60,
          poor_threshold: d.poor_threshold || 30,
        })));
      }
    };
    
    fetchAssessmentSubjects();
  }, [selectedAssessment]);

  const handleQuery = async () => {
    if (!selectedSchool || !selectedAssessment) {
      toast({ title: "请选择学校和考试", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      // Get classes for this school
      const { data: classesData, error: classError } = await supabase
        .from('classes')
        .select('id, name, homeroom_teacher_id')
        .eq('school_id', selectedSchool);
      
      if (classError) throw classError;
      
      // Get homeroom teachers
      const teacherIds = classesData?.map(c => c.homeroom_teacher_id).filter(Boolean) || [];
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, name')
        .in('id', teacherIds);
      
      const teacherMap = new Map(teachersData?.map(t => [t.id, t.name]) || []);
      
      // Get students for these classes
      const classIds = classesData?.map(c => c.id) || [];
      const { data: studentsData, error: studentError } = await supabase
        .from('students')
        .select('id, name, class_id')
        .in('class_id', classIds);
      
      if (studentError) throw studentError;
      
      const studentMap = new Map(studentsData?.map(s => [s.id, { name: s.name, classId: s.class_id }]) || []);
      
      // Get all scores for this assessment
      const { data: scoresData, error: scoresError } = await supabase
        .from('individual_scores')
        .select('student_id, subject_id, score_value')
        .eq('assessment_id', selectedAssessment);
      
      if (scoresError) throw scoresError;
      
      // Build student scores map
      const studentScores = new Map<number, StudentScore>();
      
      scoresData?.forEach(score => {
        const studentInfo = studentMap.get(score.student_id);
        if (!studentInfo) return;
        
        const classInfo = classesData?.find(c => c.id === studentInfo.classId);
        if (!classInfo) return;
        
        if (!studentScores.has(score.student_id)) {
          studentScores.set(score.student_id, {
            studentId: score.student_id,
            studentName: studentInfo.name,
            className: classInfo.name,
            classId: studentInfo.classId,
            scores: new Map(),
            totalScore: 0,
          });
        }
        
        const student = studentScores.get(score.student_id)!;
        student.scores.set(score.subject_id, score.score_value);
      });
      
      // Calculate total scores
      studentScores.forEach(student => {
        let total = 0;
        student.scores.forEach(score => {
          total += score;
        });
        student.totalScore = total;
      });
      
      // Calculate thresholds
      const subjectThresholds = new Map<number, { excellent: number; pass: number; poor: number }>();
      assessmentSubjects.forEach(as => {
        subjectThresholds.set(as.subject_id, {
          excellent: as.full_score * (as.excellent_threshold / 100),
          pass: as.full_score * (as.pass_threshold / 100),
          poor: as.full_score * (as.poor_threshold / 100),
        });
      });
      
      // Calculate total score thresholds
      let totalExcellentThreshold = 0;
      let totalPassThreshold = 0;
      let totalPoorThreshold = 0;
      assessmentSubjects.forEach(as => {
        totalExcellentThreshold += as.full_score * (as.excellent_threshold / 100);
        totalPassThreshold += as.full_score * (as.pass_threshold / 100);
        totalPoorThreshold += as.full_score * (as.poor_threshold / 100);
      });
      
      // Group by class and calculate rates
      const classDataMap = new Map<number, {
        students: StudentScore[];
        className: string;
        homeroomTeacher: string;
      }>();
      
      studentScores.forEach(student => {
        if (!classDataMap.has(student.classId)) {
          const classInfo = classesData?.find(c => c.id === student.classId);
          classDataMap.set(student.classId, {
            students: [],
            className: classInfo?.name || '',
            homeroomTeacher: classInfo?.homeroom_teacher_id 
              ? teacherMap.get(classInfo.homeroom_teacher_id) || '未分配'
              : '未分配',
          });
        }
        classDataMap.get(student.classId)!.students.push(student);
      });
      
      // Calculate rates for each class
      const results: ClassRateData[] = [];
      const isTotal = selectedSubject === 'total';
      const subjectId = isTotal ? null : parseInt(selectedSubject);
      
      classDataMap.forEach((classData, classId) => {
        const students = classData.students;
        const count = students.length;
        if (count === 0) return;
        
        let totalSum = 0;
        let excellentCount = 0;
        let passCount = 0;
        let poorCount = 0;
        const excellentStudents: ExcellentStudent[] = [];
        
        students.forEach(student => {
          let score: number;
          let isExcellent: boolean;
          let isPass: boolean;
          let isPoor: boolean;
          
          if (isTotal) {
            score = student.totalScore;
            isExcellent = score >= totalExcellentThreshold;
            isPass = score >= totalPassThreshold;
            isPoor = score < totalPoorThreshold;
          } else {
            score = student.scores.get(subjectId!) || 0;
            const thresholds = subjectThresholds.get(subjectId!);
            isExcellent = thresholds ? score >= thresholds.excellent : false;
            isPass = thresholds ? score >= thresholds.pass : false;
            isPoor = thresholds ? score < thresholds.poor : false;
          }
          
          totalSum += score;
          if (isExcellent) {
            excellentCount++;
            // Build excellent student info
            const studentScoresList: ExcellentStudent['scores'] = [];
            subjects.forEach(sub => {
              const subScore = student.scores.get(sub.id) || 0;
              studentScoresList.push({
                subjectName: sub.name,
                score: subScore,
                isCurrentSubject: !isTotal && sub.id === subjectId,
              });
            });
            excellentStudents.push({
              studentId: student.studentId,
              studentName: student.studentName,
              scores: studentScoresList,
            });
          }
          if (isPass) passCount++;
          if (isPoor) poorCount++;
        });
        
        results.push({
          classId,
          className: classData.className,
          homeroomTeacher: classData.homeroomTeacher,
          studentCount: count,
          averageScore: Math.round((totalSum / count) * 100) / 100,
          excellentRate: Math.round((excellentCount / count) * 10000) / 100,
          excellentCount,
          excellentStudents,
          passRate: Math.round((passCount / count) * 10000) / 100,
          poorRate: Math.round((poorCount / count) * 10000) / 100,
        });
      });
      
      // Sort by class name
      results.sort((a, b) => {
        const numA = parseInt(a.className.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.className.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
      
      setClassRates(results);
    } catch (error: any) {
      toast({ title: "查询失败", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);
  const selectedSubjectName = selectedSubject === 'total' 
    ? '总分' 
    : subjects.find(s => s.id.toString() === selectedSubject)?.name || '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border border-primary/20 shadow-sm">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          各班一分三率分析
        </h2>
        <p className="text-muted-foreground mt-2">
          分析各班级的优秀率、及格率和差生率
        </p>
        {selectedAssessmentData && classRates.length > 0 && (
          <div className="flex gap-4 mt-4 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              学校: {schools.find(s => s.id === selectedSchool)?.name}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              考试: {selectedAssessmentData.academic_year}年{selectedAssessmentData.month}月{selectedAssessmentData.type}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              科目: {selectedSubjectName}
            </Badge>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-muted/40">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* School */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">学校</label>
              <Select
                value={selectedSchool?.toString()}
                onValueChange={(v) => setSelectedSchool(Number(v))}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="选择学校" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assessment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">考试</label>
              <Select
                value={selectedAssessment?.toString()}
                onValueChange={(v) => setSelectedAssessment(Number(v))}
                disabled={!selectedSchool}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="选择考试" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id.toString()}>
                      {assessment.academic_year} - {assessment.month}月 - {assessment.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">科目</label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">总分</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Query Button */}
            <div className="space-y-2 flex items-end">
              <Button 
                onClick={handleQuery} 
                disabled={loading || !selectedSchool || !selectedAssessment}
                className="w-full shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {classRates.length > 0 && (
        <Card className="shadow-lg border-muted/40">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              班级三率统计
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TooltipProvider>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">班级</TableHead>
                      <TableHead className="font-semibold">班主任</TableHead>
                      <TableHead className="font-semibold text-center">参考人数</TableHead>
                      <TableHead className="font-semibold text-center">平均分</TableHead>
                      <TableHead className="font-semibold text-center">优秀率</TableHead>
                      <TableHead className="font-semibold text-center">优秀人数</TableHead>
                      <TableHead className="font-semibold text-center">及格率</TableHead>
                      <TableHead className="font-semibold text-center">差生率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classRates.map((classRate) => (
                      <TableRow key={classRate.classId} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">{classRate.className}</TableCell>
                        <TableCell>{classRate.homeroomTeacher}</TableCell>
                        <TableCell className="text-center">{classRate.studentCount}</TableCell>
                        <TableCell className="text-center font-medium">{classRate.averageScore}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={classRate.excellentRate >= 30 ? "default" : "secondary"}>
                            {classRate.excellentRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {classRate.excellentCount > 0 ? (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-primary hover:text-primary/80 font-medium cursor-pointer"
                                >
                                  {classRate.excellentCount}人
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-96 p-0" align="start">
                                <div className="p-4">
                                  <h4 className="font-semibold mb-3 text-sm">
                                    优秀学生名单 ({classRate.excellentCount}人)
                                  </h4>
                                  <div className="max-h-64 overflow-y-auto space-y-3">
                                    {classRate.excellentStudents.map((student) => (
                                      <div 
                                        key={student.studentId} 
                                        className="border rounded-lg p-3 bg-muted/30"
                                      >
                                        <div className="font-medium text-sm mb-2">
                                          {student.studentName}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {student.scores.map((score) => (
                                            <Badge 
                                              key={score.subjectName}
                                              variant={score.isCurrentSubject ? "default" : "outline"}
                                              className={score.isCurrentSubject ? "ring-2 ring-primary ring-offset-1" : ""}
                                            >
                                              {score.subjectName}: {score.score}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <span className="text-muted-foreground">0人</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={classRate.passRate >= 80 ? "default" : "secondary"}>
                            {classRate.passRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={classRate.poorRate <= 10 ? "default" : "destructive"}>
                            {classRate.poorRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && classRates.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>请选择筛选条件后点击查询</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassRatesAnalysis;
