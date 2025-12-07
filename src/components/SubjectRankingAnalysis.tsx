import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, X, Award, Star } from "lucide-react";
import { getClassSubjectAverages, getClassTotalScoreAverages } from "@/utils/supabaseQuery";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Assessment {
  id: number;
  academic_year: string;
  month: number;
  type: string;
  grade_level: string;
  school_id: number;
}

interface ExamGroup {
  key: string;
  academic_year: string;
  month: number;
  type: string;
  grade_level: string;
  assessmentIds: number[];
  schoolNames: string[];
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
  totalClassCount: number;
}

interface ClassRankingData {
  schoolName: string;
  className: string;
  classId: number;
  classAverageScore: number;
  classRank: number;
  totalClasses: number;
  subjectRankings: SubjectRanking[];
  excellentSubjectCount: number;
  homeroomTeacherName?: string;
}

type SortOption = 'avgDesc' | 'avgAsc' | 'excellentDesc';

const SubjectRankingAnalysis = () => {
  const { toast } = useToast();
  
  const [exams, setExams] = useState<ExamGroup[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('excellentDesc');
  
  const [classRankings, setClassRankings] = useState<ClassRankingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载考试列表（按学年、月份、类型、年级分组）
  useEffect(() => {
    const fetchExams = async () => {
      const { data: assessmentsData, error: assessmentError } = await supabase
        .from('assessments')
        .select('id, academic_year, month, type, grade_level, school_id, schools(name)')
        .order('academic_year', { ascending: false })
        .order('month', { ascending: false });
      
      if (assessmentError) {
        toast({ title: "加载考试失败", description: assessmentError.message, variant: "destructive" });
        return;
      }
      
      // 按考试分组
      const examMap = new Map<string, ExamGroup>();
      assessmentsData?.forEach((a: any) => {
        const key = `${a.academic_year}_${a.month}_${a.type}_${a.grade_level}`;
        if (!examMap.has(key)) {
          examMap.set(key, {
            key,
            academic_year: a.academic_year,
            month: a.month,
            type: a.type,
            grade_level: a.grade_level,
            assessmentIds: [],
            schoolNames: [],
          });
        }
        const exam = examMap.get(key)!;
        exam.assessmentIds.push(a.id);
        if (a.schools?.name && !exam.schoolNames.includes(a.schools.name)) {
          exam.schoolNames.push(a.schools.name);
        }
      });
      
      const examList = Array.from(examMap.values());
      setExams(examList);
      if (examList.length > 0) {
        setSelectedExam(examList[0].key);
      }
    };
    
    fetchExams();
  }, []);

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
    if (!selectedExam) return;
    
    const selectedExamData = exams.find(e => e.key === selectedExam);
    if (!selectedExamData) return;
    
    const fetchRankingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 获取所有学校的各科平均分（跨学校排名）
        const data = await getClassSubjectAverages(selectedExamData.assessmentIds);
        
        // 收集所有班级信息
        const classNamesSet = new Set<string>();
        const schoolNamesSet = new Set<string>();
        data.forEach((item: any) => {
          classNamesSet.add(item.class_name);
          schoolNamesSet.add(item.school_name);
        });
        
        // 获取学校ID映射
        const { data: schoolsData } = await supabase
          .from('schools')
          .select('id, name')
          .in('name', Array.from(schoolNamesSet));
        
        const schoolIdMap = new Map(schoolsData?.map(s => [s.name, s.id]) || []);
        
        // 获取班级信息
        const { data: classesData, error: classError } = await supabase
          .from('classes')
          .select('id, name, homeroom_teacher_id, school_id');
        
        if (classError) {
          throw new Error(`查询班级失败: ${classError.message}`);
        }
        
        // 按学校和班级名称创建映射
        const classInfoMap = new Map<string, { id: number; homeroomTeacherId: number | null }>();
        classesData?.forEach(c => {
          const schoolName = schoolsData?.find(s => s.id === c.school_id)?.name;
          if (schoolName) {
            const key = `${schoolName}_${c.name}`;
            classInfoMap.set(key, { id: c.id, homeroomTeacherId: c.homeroom_teacher_id });
          }
        });
        
        // 获取班主任信息
        const homeroomTeacherIds = classesData?.map(c => c.homeroom_teacher_id).filter(Boolean) || [];
        const { data: homeroomTeachers } = await supabase
          .from('teachers')
          .select('id, name')
          .in('id', homeroomTeacherIds);
        
        const homeroomTeacherMap = new Map(homeroomTeachers?.map(t => [t.id, t.name]) || []);
        
        // 获取科目ID映射
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name');
        
        const subjectIdMap = new Map(subjectsData?.map(s => [s.name, s.id]) || []);
        
        // 获取课程分配（任课教师）
        const { data: courseAssignments } = await supabase
          .from('course_assignments')
          .select('class_id, subject_id, teacher_id, teachers(name)')
          .eq('academic_year', selectedExamData.academic_year);
        
        const subjectTeacherMap = new Map<string, string>();
        courseAssignments?.forEach((ca: any) => {
          const key = `${ca.class_id}_${ca.subject_id}`;
          subjectTeacherMap.set(key, ca.teachers?.name || '未分配');
        });
        
        // 构建班级数据
        const classMap = new Map<string, { 
          schoolName: string; 
          className: string; 
          classId: number;
          homeroomTeacherName?: string;
          subjects: Map<string, { score: number; rank: number; teacherName?: string }>;
        }>();
        
        data.forEach((item: any) => {
          const classKey = `${item.school_name}_${item.class_name}`;
          const classInfo = classInfoMap.get(classKey);
          
          if (!classMap.has(classKey)) {
            classMap.set(classKey, {
              schoolName: item.school_name,
              className: item.class_name,
              classId: classInfo?.id || 0,
              homeroomTeacherName: classInfo?.homeroomTeacherId 
                ? homeroomTeacherMap.get(classInfo.homeroomTeacherId) 
                : undefined,
              subjects: new Map()
            });
          }
          
          const classData = classMap.get(classKey)!;
          
          const subjectId = subjectIdMap.get(item.subject_name);
          const teacherKey = `${classData.classId}_${subjectId}`;
          const teacherName = subjectTeacherMap.get(teacherKey);
          
          // rank_in_subject 是跨所有学校的排名
          classData.subjects.set(item.subject_name, {
            score: item.average_score,
            rank: item.rank_in_subject,
            teacherName: teacherName,
          });
        });
        
        // 获取班级总分平均分数据（跨所有学校排名）
        const totalScoreData = await getClassTotalScoreAverages(selectedExamData.assessmentIds);
        
        // 创建班级总分平均分映射（rank_in_grade是跨所有学校的排名）
        const totalScoreMap = new Map<string, { avgScore: number; rank: number; studentCount: number }>();
        totalScoreData.forEach((item: any) => {
          const key = `${item.school_name}_${item.class_name}`;
          totalScoreMap.set(key, {
            avgScore: item.total_score_average,
            rank: item.rank_in_grade,
            studentCount: item.student_count
          });
        });
        
        const totalClasses = classMap.size;
        
        // 计算每个科目的总班级数
        const subjectClassCounts = new Map<string, number>();
        classMap.forEach(classData => {
          classData.subjects.forEach((_, subjectName) => {
            subjectClassCounts.set(subjectName, (subjectClassCounts.get(subjectName) || 0) + 1);
          });
        });
        
        const rankings: ClassRankingData[] = [];
        classMap.forEach((classData) => {
          const classKey = `${classData.schoolName}_${classData.className}`;
          const totalScoreInfo = totalScoreMap.get(classKey);
          
          const subjectRankingsList: SubjectRanking[] = [];
          
          classData.subjects.forEach((subjectData, subjectName) => {
            const classRank = totalScoreInfo?.rank || 0;
            const rankDiff = subjectData.rank - classRank;
            
            // 修改判断逻辑：负值表示科目排名好于总分排名（值得表扬）
            let status: 'excellent' | 'medium' | 'poor' = 'medium';
            if (rankDiff <= -3) {
              status = 'excellent'; // 科目排名比总分排名高3位及以上 = 优秀
            } else if (rankDiff <= -1) {
              status = 'medium'; // 科目排名比总分排名高1-2位 = 良好
            } else if (rankDiff === 0) {
              status = 'medium'; // 相等
            } else if (rankDiff >= 3) {
              status = 'poor'; // 科目排名比总分排名低3位及以上 = 需关注
            } else {
              status = 'medium'; // 科目排名比总分排名低1-2位
            }
            
            subjectRankingsList.push({
              subjectName,
              subjectRank: subjectData.rank,
              classOverallRank: classRank,
              rankDifference: rankDiff,
              status,
              averageScore: subjectData.score,
              teacherName: subjectData.teacherName,
              totalClassCount: subjectClassCounts.get(subjectName) || totalClasses,
            });
          });
          
          // 统计优秀科目数量（值得表扬的）
          const excellentCount = subjectRankingsList.filter(s => s.status === 'excellent').length;
          
          rankings.push({
            schoolName: classData.schoolName,
            className: classData.className,
            classId: classData.classId,
            classAverageScore: totalScoreInfo?.avgScore || 0,
            classRank: totalScoreInfo?.rank || 0,
            totalClasses,
            subjectRankings: subjectRankingsList,
            excellentSubjectCount: excellentCount,
            homeroomTeacherName: classData.homeroomTeacherName,
          });
        });
        
        // 默认按优秀科目数量排序
        rankings.sort((a, b) => b.excellentSubjectCount - a.excellentSubjectCount);
        
        setClassRankings(rankings);
      } catch (err: any) {
        setError(err.message || '加载数据失败');
        toast({ title: "加载失败", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankingData();
  }, [selectedExam, exams]);

  const getFilteredAndSortedData = () => {
    let filtered = classRankings
      .filter(cr => selectedSchool === 'all' || cr.schoolName === selectedSchool)
      .map(cr => ({
        ...cr,
        subjectRankings: cr.subjectRankings.filter(sr => selectedSubjects.has(sr.subjectName)),
        excellentSubjectCount: cr.subjectRankings.filter(sr => selectedSubjects.has(sr.subjectName) && sr.status === 'excellent').length,
      }));
    
    switch (sortOption) {
      case 'avgAsc':
        filtered.sort((a, b) => a.classAverageScore - b.classAverageScore);
        break;
      case 'avgDesc':
        filtered.sort((a, b) => b.classAverageScore - a.classAverageScore);
        break;
      case 'excellentDesc':
        filtered.sort((a, b) => b.excellentSubjectCount - a.excellentSubjectCount);
        break;
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
        return <Star className="h-4 w-4 fill-current" />;
      case 'medium':
        return <Minus className="h-4 w-4" />;
      case 'poor':
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: 'excellent' | 'medium' | 'poor') => {
    switch (status) {
      case 'excellent':
        return '表扬';
      case 'medium':
        return '正常';
      case 'poor':
        return '关注';
    }
  };

  const selectedExamData = exams.find(e => e.key === selectedExam);
  const availableSchools = selectedExamData?.schoolNames || [];
  const displayData = getFilteredAndSortedData();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border border-primary/20 shadow-sm">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          各科优秀教师表扬
        </h2>
        <p className="text-muted-foreground mt-2">
          分析各班级各科目表现，表扬科目排名优于班级总分排名的教师（跨所有学校排名）
        </p>
        {selectedExamData && (
          <div className="flex gap-4 mt-4 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              考试: {selectedExamData.academic_year}年{selectedExamData.month}月{selectedExamData.type}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              年级: {selectedExamData.grade_level}
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              学校: {selectedExamData.schoolNames.join(', ')}
            </Badge>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <Card className="shadow-lg border-muted/40">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Exam Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">考试</label>
              <Select
                value={selectedExam || ''}
                onValueChange={(value) => {
                  setSelectedExam(value);
                  setSelectedSchool('all');
                }}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="选择考试" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.key} value={exam.key}>
                      {exam.academic_year}年{exam.month}月{exam.type} - {exam.grade_level} ({exam.schoolNames.length}所学校)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* School Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">学校</label>
              <Select
                value={selectedSchool}
                onValueChange={(value) => setSelectedSchool(value)}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="选择学校" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部学校</SelectItem>
                  {availableSchools.map((schoolName) => (
                    <SelectItem key={schoolName} value={schoolName}>
                      {schoolName}
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
                  <SelectItem value="excellentDesc">表扬科目数降序</SelectItem>
                  <SelectItem value="avgDesc">平均分降序</SelectItem>
                  <SelectItem value="avgAsc">平均分升序</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
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
              onClick={() => setSelectedExam(selectedExam)}
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
                      总分排名 {classData.classRank}/{classData.totalClasses}
                    </Badge>
                    {classData.excellentSubjectCount > 0 && (
                      <Badge className="shadow-sm bg-green-500 hover:bg-green-600 animate-pulse">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {classData.excellentSubjectCount}个表扬科目
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <span>班级总分平均:</span>
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
                  <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b bg-muted/30 p-2 rounded-t">
                    <div>科目</div>
                    <div className="text-center">任课教师</div>
                    <div className="text-center">科目排名</div>
                    <div className="text-center">总分排名</div>
                    <div className="text-center">总班级数</div>
                    <div className="text-center">差值</div>
                    <div className="text-center">状态</div>
                  </div>
                  {classData.subjectRankings.map((subject) => (
                    <div
                      key={`${classData.schoolName}_${classData.className}_${subject.subjectName}`}
                      className={cn(
                        "grid grid-cols-7 gap-2 text-sm py-3 border-b last:border-0 items-center transition-colors rounded px-2",
                        subject.status === 'excellent' ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="font-medium flex items-center gap-1">
                        {subject.status === 'excellent' && <Star className="h-3 w-3 text-green-600 fill-current" />}
                        {subject.subjectName}
                      </div>
                      <div className="text-center text-xs">{subject.teacherName || '-'}</div>
                      <div className="text-center font-semibold">{subject.subjectRank}</div>
                      <div className="text-center text-muted-foreground">{subject.classOverallRank}</div>
                      <div className="text-center text-muted-foreground">{subject.totalClassCount}</div>
                      <div className={`text-center font-bold ${
                        subject.rankDifference <= -3 ? 'text-green-600' :
                        subject.rankDifference < 0 ? 'text-green-500' :
                        subject.rankDifference === 0 ? 'text-gray-600' :
                        subject.rankDifference <= 2 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {subject.rankDifference > 0 ? '+' : ''}{subject.rankDifference}
                        {subject.rankDifference > 0 ? ' ↓' : subject.rankDifference < 0 ? ' ↑' : ''}
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
