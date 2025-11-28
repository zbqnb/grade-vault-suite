import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, X } from "lucide-react";
import { getClassSubjectAverages } from "@/utils/supabaseQuery";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  subjectRank: number;
  classOverallRank: number;
  rankDifference: number;
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
  
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('avgDesc');
  
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
        const data = await getClassSubjectAverages([selectedAssessment]);
        
        const schoolName = schools.find(s => s.id === selectedSchool)?.name || '';
        
        const filteredData = data.filter((item: any) => item.school_name === schoolName);
        
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
        
        const homeroomTeacherIds = classesData?.map(c => c.homeroom_teacher_id).filter(Boolean) || [];
        const { data: homeroomTeachers } = await supabase
          .from('teachers')
          .select('id, name')
          .in('id', homeroomTeacherIds);
        
        const homeroomTeacherMap = new Map(homeroomTeachers?.map(t => [t.id, t.name]) || []);
        
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name');
        
        const subjectIdMap = new Map(subjectsData?.map(s => [s.name, s.id]) || []);
        
        const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);
        const { data: courseAssignments } = await supabase
          .from('course_assignments')
          .select('class_id, subject_id, teacher_id, teachers(name)')
          .eq('academic_year', selectedAssessmentData?.academic_year || '');
        
        const subjectTeacherMap = new Map<string, string>();
        courseAssignments?.forEach((ca: any) => {
          const key = `${ca.class_id}_${ca.subject_id}`;
          subjectTeacherMap.set(key, ca.teachers?.name || '未分配');
        });
        
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
          
          const subjectId = subjectIdMap.get(item.subject_name);
          const teacherKey = `${classData.classId}_${subjectId}`;
          const teacherName = subjectTeacherMap.get(teacherKey);
          
          if (!classData.subjects.has(item.subject_name)) {
            classData.subjects.set(item.subject_name, {
              score: item.average_score,
              teacherName: teacherName,
            });
          }
        });
        
        const rankings: ClassRankingData[] = [];
        classMap.forEach((classData) => {
          const subjectScores = Array.from(classData.subjects.values());
          const classAvg = subjectScores.reduce((sum, s) => sum + s.score, 0) / subjectScores.length;
          
          rankings.push({
            schoolName: classData.schoolName,
            className: classData.className,
            classId: classData.classId,
            classAverageScore: Math.round(classAvg * 100) / 100,
            classRank: 0,
            totalClasses: classMap.size,
            subjectRankings: [],
            problemSubjectCount: 0,
            homeroomTeacherName: classData.homeroomTeacherName,
          });
        });
        
        rankings.sort((a, b) => b.classAverageScore - a.classAverageScore);
        rankings.forEach((r, idx) => {
          r.classRank = idx + 1;
        });
        
        const subjectRankings = new Map<string, Array<{
          classKey: string;
          score: number;
          classOverallRank: number;
          teacherName?: string;
        }>>();
        
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
        
        const subjectRankMap = new Map<string, Map<string, number>>();
        subjectRankings.forEach((classes, subjectName) => {
          classes.sort((a, b) => b.score - a.score);
          const rankMap = new Map<string, number>();
          classes.forEach((cls, idx) => {
            rankMap.set(cls.classKey, idx + 1);
          });
          subjectRankMap.set(subjectName, rankMap);
        });
        
        rankings.forEach(classRanking => {
          const classKey = `${classRanking.schoolName}_${classRanking.className}`;
          const classData = classMap.get(classKey)!;
          const subjectRankingsList: SubjectRanking[] = [];
          
          classData.subjects.forEach((subjectData, subjectName) => {
            const subjectRank = subjectRankMap.get(subjectName)?.get(classKey) || 0;
            const rankDiff = subjectRank - classRanking.classRank;
            
            let status: 'excellent' | 'medium' | 'poor' = 'excellent';
            if (rankDiff >= 3) {
              status = 'poor';
            } else if (rankDiff >= 1) {
              status = 'medium';
            } else if (rankDiff <= -3) {
              status = 'excellent';
            } else {
              status = 'medium';
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

  const getFilteredAndSortedData = () => {
    let filtered = classRankings.map(cr => ({
      ...cr,
      subjectRankings: cr.subjectRankings.filter(sr => selectedSubjects.has(sr.subjectName)),
    }));
    
    switch (sortOption) {
      case 'avgAsc':
        filtered.sort((a, b) => a.classAverageScore - b.classAverageScore);
        break;
      case 'problemDesc':
        filtered.sort((a, b) => b.problemSubjectCount - a.problemSubjectCount);
        break;
      default:
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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'poor':
        return 'bg-red-50 text-red-700 border-red-200';
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
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border border-primary/20 shadow-sm">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          各科平均分排名
        </h2>
        <p className="text-muted-foreground mt-2">
          分析各班级在不同科目的排名表现，识别需要改进的教学环节
        </p>
        {selectedAssessmentData && (
          <div className="flex gap-4 mt-4 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              学校: {schools.find(s => s.id === selectedSchool)?.name}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              考试: {selectedAssessmentData.academic_year}年{selectedAssessmentData.month}月{selectedAssessmentData.type}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              年级: {selectedAssessmentData.grade_level}
            </Badge>
          </div>
        )}
      </div>

      {/* Filters Section - Horizontal Layout */}
      <Card className="shadow-lg border-muted/40">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* School Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">学校</label>
              <Select
                value={selectedSchool?.toString()}
                onValueChange={(value) => setSelectedSchool(Number(value))}
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

            {/* Assessment Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">考试</label>
              <Select
                value={selectedAssessment?.toString()}
                onValueChange={(value) => {
                  const assessment = assessments.find(a => a.id === Number(value));
                  setSelectedAssessment(Number(value));
                  if (assessment) setGradeLevel(assessment.grade_level);
                }}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
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

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">排序方式</label>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avgDesc">平均分降序</SelectItem>
                  <SelectItem value="avgAsc">平均分升序</SelectItem>
                  <SelectItem value="problemDesc">问题科目数降序</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection - Combobox */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">科目</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between hover:border-primary/50 transition-colors",
                      selectedSubjects.size === 0 && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {selectedSubjects.size === 0
                        ? "选择科目..."
                        : `已选择 ${selectedSubjects.size} 个科目`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                  <Command className="bg-background">
                    <CommandInput placeholder="搜索科目..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>未找到科目</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={toggleAllSubjects}
                          className="cursor-pointer"
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedSubjects.size === subjects.length
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}>
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="font-medium">全选/取消全选</span>
                        </CommandItem>
                        {subjects.map((subject) => (
                          <CommandItem
                            key={subject.id}
                            onSelect={() => toggleSubject(subject.name)}
                            className="cursor-pointer"
                          >
                            <div className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedSubjects.has(subject.name)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}>
                              <Check className="h-4 w-4" />
                            </div>
                            {subject.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedSubjects.size > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(selectedSubjects).map((subjectName) => (
                    <Badge
                      key={subjectName}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => toggleSubject(subjectName)}
                    >
                      {subjectName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {loading ? (
        <Card className="shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="shadow-lg border-destructive/50">
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
        <Card className="shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayData.map((classData, index) => (
            <Card 
              key={`${classData.schoolName}_${classData.className}`} 
              className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-muted/40 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    {classData.schoolName} - {classData.className}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shadow-sm">
                      排名 {classData.classRank}/{classData.totalClasses}
                    </Badge>
                    {classData.problemSubjectCount > 0 && (
                      <Badge variant="destructive" className="shadow-sm animate-pulse">
                        {classData.problemSubjectCount}个问题科目
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <span>班级平均分:</span>
                    <span className="font-semibold text-primary text-base">{classData.classAverageScore}</span>
                  </div>
                  {classData.homeroomTeacherName && (
                    <div className="flex items-center gap-2">
                      <span>班主任:</span>
                      <span className="font-semibold">{classData.homeroomTeacherName}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b bg-muted/30 p-2 rounded-t">
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
                      className="grid grid-cols-6 gap-2 text-sm py-3 border-b last:border-0 items-center hover:bg-muted/50 transition-colors rounded px-2"
                    >
                      <div className="font-medium">{subject.subjectName}</div>
                      <div className="text-center text-xs">{subject.teacherName || '-'}</div>
                      <div className="text-center font-semibold">{subject.subjectRank}</div>
                      <div className="text-center text-muted-foreground">{subject.classOverallRank}</div>
                      <div className={`text-center font-bold ${
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
                        <Badge className={`${getStatusColor(subject.status)} gap-1 border shadow-sm`}>
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
  );
};

export default SubjectRankingAnalysis;
