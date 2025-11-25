import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from "lucide-react";
import { getClassSubjectAverages } from "@/utils/supabaseQuery";
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

interface SubjectRanking {
  subjectName: string;
  subjectRank: number;              // 该班级该科目在全部班级中的排名
  classOverallRank: number;         // 班级总分排名（用于对比）
  rankDifference: number;           // 科目排名 - 总分排名（正数表示拖累，负数表示优势）
  status: 'excellent' | 'medium' | 'poor';
  averageScore: number;
  teacherName?: string;
}

interface ClassRankingData {
  schoolName: string;
  className: string;
  classId: number;
  classAverageScore: number;
  classRank: number;
  totalClasses: number;
  subjectRankings: SubjectRanking[];
  problemSubjectCount: number;
  homeroomTeacherName?: string;
}

type SortOption = 'avgDesc' | 'avgAsc' | 'problemDesc';

const SubjectRankingAnalysis = () => {
  const { toast } = useToast();
  
  // 筛选状态
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('avgDesc');
  
  // 数据状态
  const [classRankings, setClassRankings] = useState<ClassRankingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载学校列表
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

  // 加载考试列表
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
      } else if (data && data.length > 0) {
        setAssessments(data);
        setSelectedAssessment(data[0].id);
        setGradeLevel(data[0].grade_level);
      }
    };
    
    fetchAssessments();
  }, [selectedSchool]);

  // 加载科目列表
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('id');
      if (error) {
        toast({ title: "加载科目失败", description: error.message, variant: "destructive" });
      } else if (data) {
        setSubjects(data);
        setSelectedSubjects(new Set(data.map(s => s.name)));
      }
    };
    fetchSubjects();
  }, []);

  // 加载排名数据
  useEffect(() => {
    if (!selectedAssessment || !selectedSchool) return;
    
    const fetchRankingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 只获取选中学校的考试数据
        const data = await getClassSubjectAverages([selectedAssessment]);
        
        // 获取选中学校名称
        const schoolName = schools.find(s => s.id === selectedSchool)?.name || '';
        
        // 只保留选中学校的数据
        const filteredData = data.filter((item: any) => item.school_name === schoolName);
        
        // 获取班级列表及其ID
        const classNamesSet = new Set<string>();
        filteredData.forEach((item: any) => classNamesSet.add(item.class_name));
        const classNames = Array.from(classNamesSet);
        
        const { data: classesData, error: classError } = await supabase
          .from('classes')
          .select('id, name, homeroom_teacher_id')
          .eq('school_id', selectedSchool)
          .in('name', classNames);
        
        if (classError) {
          throw new Error(`查询班级失败: ${classError.message}`);
        }
        
        // 获取所有班主任信息
        const homeroomTeacherIds = classesData?.map(c => c.homeroom_teacher_id).filter(Boolean) || [];
        const { data: homeroomTeachers } = await supabase
          .from('teachers')
          .select('id, name')
          .in('id', homeroomTeacherIds);
        
        const homeroomTeacherMap = new Map(homeroomTeachers?.map(t => [t.id, t.name]) || []);
        
        // 获取所有科目ID
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name');
        
        const subjectIdMap = new Map(subjectsData?.map(s => [s.name, s.id]) || []);
        
        // 获取当前学年的课程分配
        const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);
        const { data: courseAssignments } = await supabase
          .from('course_assignments')
          .select('class_id, subject_id, teacher_id, teachers(name)')
          .eq('academic_year', selectedAssessmentData?.academic_year || '');
        
        // 创建科任教师映射 class_id_subject_id -> teacher_name
        const subjectTeacherMap = new Map<string, string>();
        courseAssignments?.forEach((ca: any) => {
          const key = `${ca.class_id}_${ca.subject_id}`;
          subjectTeacherMap.set(key, ca.teachers?.name || '未分配');
        });
        
        // 处理数据 - 使用学校+班级作为唯一标识
        const classMap = new Map<string, { 
          schoolName: string; 
          className: string; 
          classId: number;
          homeroomTeacherName?: string;
          subjects: Map<string, { score: number; teacherName?: string }>;
        }>();
        
        filteredData.forEach((item: any) => {
          const classKey = `${item.school_name}_${item.class_name}`;
          const classInfo = classesData?.find(c => c.name === item.class_name);
          
          if (!classMap.has(classKey)) {
            classMap.set(classKey, {
              schoolName: item.school_name,
              className: item.class_name,
              classId: classInfo?.id || 0,
              homeroomTeacherName: classInfo?.homeroom_teacher_id 
                ? homeroomTeacherMap.get(classInfo.homeroom_teacher_id) 
                : undefined,
              subjects: new Map()
            });
          }
          
          const classData = classMap.get(classKey)!;
          
          // 获取科任教师
          const subjectId = subjectIdMap.get(item.subject_name);
          const teacherKey = `${classData.classId}_${subjectId}`;
          const teacherName = subjectTeacherMap.get(teacherKey);
          
          // 添加科目成绩（避免重复）
          if (!classData.subjects.has(item.subject_name)) {
            classData.subjects.set(item.subject_name, {
              score: item.average_score,
              teacherName: teacherName,
            });
          }
        });
        
        // 第一步：计算每个班级的总分平均分，并按总分排名
        const rankings: ClassRankingData[] = [];
        classMap.forEach((classData) => {
          const subjectScores = Array.from(classData.subjects.values());
          const classAvg = subjectScores.reduce((sum, s) => sum + s.score, 0) / subjectScores.length;
          
          rankings.push({
            schoolName: classData.schoolName,
            className: classData.className,
            classId: classData.classId,
            classAverageScore: Math.round(classAvg * 100) / 100,
            classRank: 0, // 将在下一步计算
            totalClasses: classMap.size,
            subjectRankings: [],
            problemSubjectCount: 0,
            homeroomTeacherName: classData.homeroomTeacherName,
          });
        });
        
        // 按总分平均分排序，分配班级总分排名
        rankings.sort((a, b) => b.classAverageScore - a.classAverageScore);
        rankings.forEach((r, idx) => {
          r.classRank = idx + 1;
        });
        
        // 第二步：为每个科目单独计算排名
        const subjectRankings = new Map<string, Array<{
          classKey: string;
          score: number;
          classOverallRank: number;
          teacherName?: string;
        }>>();
        
        // 收集每个科目的所有班级成绩
        rankings.forEach(classRanking => {
          const classData = classMap.get(`${classRanking.schoolName}_${classRanking.className}`)!;
          classData.subjects.forEach((subjectData, subjectName) => {
            if (!subjectRankings.has(subjectName)) {
              subjectRankings.set(subjectName, []);
            }
            subjectRankings.get(subjectName)!.push({
              classKey: `${classRanking.schoolName}_${classRanking.className}`,
              score: subjectData.score,
              classOverallRank: classRanking.classRank,
              teacherName: subjectData.teacherName,
            });
          });
        });
        
        // 为每个科目按成绩排序并分配排名
        const subjectRankMap = new Map<string, Map<string, number>>();
        subjectRankings.forEach((classes, subjectName) => {
          classes.sort((a, b) => b.score - a.score);
          const rankMap = new Map<string, number>();
          classes.forEach((cls, idx) => {
            rankMap.set(cls.classKey, idx + 1);
          });
          subjectRankMap.set(subjectName, rankMap);
        });
        
        // 第三步：为每个班级填充科目排名数据
        rankings.forEach(classRanking => {
          const classKey = `${classRanking.schoolName}_${classRanking.className}`;
          const classData = classMap.get(classKey)!;
          const subjectRankingsList: SubjectRanking[] = [];
          
          classData.subjects.forEach((subjectData, subjectName) => {
            const subjectRank = subjectRankMap.get(subjectName)?.get(classKey) || 0;
            const rankDiff = subjectRank - classRanking.classRank;
            
            // 根据排名差值判断状态
            let status: 'excellent' | 'medium' | 'poor' = 'excellent';
            if (rankDiff >= 3) {
              status = 'poor';      // 科目排名比总分排名差3名及以上，属于拖累
            } else if (rankDiff >= 1) {
              status = 'medium';    // 科目排名比总分排名差1-2名
            } else if (rankDiff <= -3) {
              status = 'excellent'; // 科目排名比总分排名好3名及以上，属于优势
            } else {
              status = 'medium';    // 差距在±2名以内
            }
            
            subjectRankingsList.push({
              subjectName,
              subjectRank,
              classOverallRank: classRanking.classRank,
              rankDifference: rankDiff,
              status,
              averageScore: subjectData.score,
              teacherName: subjectData.teacherName,
            });
          });
          
          // 计算问题科目数量（拖累科目）
          const problemCount = subjectRankingsList.filter(s => s.status === 'poor').length;
          
          classRanking.subjectRankings = subjectRankingsList;
          classRanking.problemSubjectCount = problemCount;
        });
        
        setClassRankings(rankings);
      } catch (err: any) {
        setError(err.message || '加载数据失败');
        toast({ title: "加载失败", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankingData();
  }, [selectedAssessment, selectedSchool, schools, assessments]);

  // 筛选和排序数据
  const getFilteredAndSortedData = () => {
    let filtered = classRankings.map(cr => ({
      ...cr,
      subjectRankings: cr.subjectRankings.filter(sr => selectedSubjects.has(sr.subjectName)),
    }));
    
    // 排序
    switch (sortOption) {
      case 'avgAsc':
        filtered.sort((a, b) => a.classAverageScore - b.classAverageScore);
        break;
      case 'problemDesc':
        filtered.sort((a, b) => b.problemSubjectCount - a.problemSubjectCount);
        break;
      default: // avgDesc
        filtered.sort((a, b) => b.classAverageScore - a.classAverageScore);
    }
    
    return filtered;
  };

  const toggleSubject = (subjectName: string) => {
    const newSet = new Set(selectedSubjects);
    if (newSet.has(subjectName)) {
      newSet.delete(subjectName);
    } else {
      newSet.add(subjectName);
    }
    setSelectedSubjects(newSet);
  };

  const toggleAllSubjects = () => {
    if (selectedSubjects.size === subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects.map(s => s.name)));
    }
  };

  const getStatusColor = (status: 'excellent' | 'medium' | 'poor') => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
    }
  };

  const getStatusIcon = (status: 'excellent' | 'medium' | 'poor') => {
    switch (status) {
      case 'excellent':
        return <TrendingUp className="h-4 w-4" />;
      case 'medium':
        return <Minus className="h-4 w-4" />;
      case 'poor':
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: 'excellent' | 'medium' | 'poor') => {
    switch (status) {
      case 'excellent':
        return '优';
      case 'medium':
        return '中';
      case 'poor':
        return '差';
    }
  };

  const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);

  const displayData = getFilteredAndSortedData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">各科平均分排名</h2>
        <p className="text-muted-foreground mt-2">
          分析各班级在不同科目的排名表现，识别需要改进的教学环节
        </p>
        {selectedAssessmentData && (
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span>学校: {schools.find(s => s.id === selectedSchool)?.name}</span>
            <span>考试: {selectedAssessmentData.academic_year}年{selectedAssessmentData.month}月{selectedAssessmentData.type}</span>
            <span>年级: {selectedAssessmentData.grade_level}</span>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* 左侧筛选面板 */}
        <Card className="w-64 flex-shrink-0 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">筛选条件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 学校选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">学校</label>
              <Select
                value={selectedSchool?.toString()}
                onValueChange={(value) => setSelectedSchool(Number(value))}
              >
                <SelectTrigger>
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

            {/* 考试选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">考试</label>
              <Select
                value={selectedAssessment?.toString()}
                onValueChange={(value) => {
                  const assessment = assessments.find(a => a.id === Number(value));
                  setSelectedAssessment(Number(value));
                  if (assessment) setGradeLevel(assessment.grade_level);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择考试" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id.toString()}>
                      {assessment.academic_year}年{assessment.month}月{assessment.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 科目筛选 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">科目</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllSubjects}
                  className="h-auto p-0 text-xs text-primary"
                >
                  {selectedSubjects.size === subjects.length ? '取消全选' : '全选'}
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedSubjects.has(subject.name)}
                      onCheckedChange={() => toggleSubject(subject.name)}
                    />
                    <span className="text-sm">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 排序选项 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">排序方式</label>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avgDesc">平均分降序</SelectItem>
                  <SelectItem value="avgAsc">平均分升序</SelectItem>
                  <SelectItem value="problemDesc">问题科目数降序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 右侧内容区域 */}
        <div className="flex-1">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive font-medium">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedAssessment(selectedAssessment)}
                >
                  重试
                </Button>
              </CardContent>
            </Card>
          ) : displayData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">暂无数据</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {displayData.map((classData) => (
                <Card key={`${classData.schoolName}_${classData.className}`} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {classData.schoolName} - {classData.className}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          排名 {classData.classRank}/{classData.totalClasses}
                        </Badge>
                        {classData.problemSubjectCount > 0 && (
                          <Badge variant="destructive">
                            {classData.problemSubjectCount}个问题科目
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        班级平均分: <span className="font-semibold text-primary">{classData.classAverageScore}</span>
                      </div>
                      {classData.homeroomTeacherName && (
                        <div>
                          班主任: <span className="font-semibold">{classData.homeroomTeacherName}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                        <div>科目</div>
                        <div className="text-center">任课教师</div>
                        <div className="text-center">科目排名</div>
                        <div className="text-center">总分排名</div>
                        <div className="text-center">差值</div>
                        <div className="text-center">状态</div>
                      </div>
                      {classData.subjectRankings.map((subject) => (
                        <div
                          key={`${classData.schoolName}_${classData.className}_${subject.subjectName}`}
                          className="grid grid-cols-6 gap-2 text-sm py-2 border-b last:border-0 items-center"
                        >
                          <div className="font-medium">{subject.subjectName}</div>
                          <div className="text-center text-xs">{subject.teacherName || '-'}</div>
                          <div className="text-center">{subject.subjectRank}</div>
                          <div className="text-center text-muted-foreground">{subject.classOverallRank}</div>
                          <div className={`text-center font-medium ${
                            subject.rankDifference <= -3 ? 'text-green-600' :
                            subject.rankDifference < 0 ? 'text-green-500' :
                            subject.rankDifference === 0 ? 'text-gray-600' :
                            subject.rankDifference <= 2 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {subject.rankDifference > 0 ? '+' : ''}{subject.rankDifference}
                            {subject.rankDifference > 0 ? ' ↓' : subject.rankDifference < 0 ? ' ↑' : ' '}
                          </div>
                          <div className="flex justify-center">
                            <Badge className={`${getStatusColor(subject.status)} gap-1`}>
                              {getStatusIcon(subject.status)}
                              {getStatusText(subject.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectRankingAnalysis;
