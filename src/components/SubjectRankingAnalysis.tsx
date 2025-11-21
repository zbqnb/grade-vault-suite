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
  classRank: number;
  gradeAverageRank: number;
  rankDifference: number;
  status: 'excellent' | 'medium' | 'poor';
  averageScore: number;
}

interface ClassRankingData {
  className: string;
  classAverageScore: number;
  classRank: number;
  totalClasses: number;
  subjectRankings: SubjectRanking[];
  problemSubjectCount: number;
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
    if (!selectedAssessment) return;
    
    const fetchRankingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getClassSubjectAverages([selectedAssessment]);
        
        // 处理数据
        const classMap = new Map<string, SubjectRanking[]>();
        const subjectRankSums = new Map<string, { sum: number; count: number }>();
        
        data.forEach((item: any) => {
          if (!classMap.has(item.class_name)) {
            classMap.set(item.class_name, []);
          }
          
          classMap.get(item.class_name)!.push({
            subjectName: item.subject_name,
            classRank: item.rank_in_subject,
            gradeAverageRank: 0, // 将在后面计算
            rankDifference: 0,
            status: 'excellent',
            averageScore: item.average_score,
          });
          
          // 累加每个科目的排名总和
          if (!subjectRankSums.has(item.subject_name)) {
            subjectRankSums.set(item.subject_name, { sum: 0, count: 0 });
          }
          const sums = subjectRankSums.get(item.subject_name)!;
          sums.sum += item.rank_in_subject;
          sums.count += 1;
        });
        
        // 计算每个科目的年级平均排名
        const gradeAverageRanks = new Map<string, number>();
        subjectRankSums.forEach((value, subject) => {
          gradeAverageRanks.set(subject, Math.round(value.sum / value.count));
        });
        
        // 更新每个班级的科目排名数据
        const rankings: ClassRankingData[] = [];
        classMap.forEach((subjectRankings, className) => {
          // 计算班级平均分
          const classAvg = subjectRankings.reduce((sum, s) => sum + s.averageScore, 0) / subjectRankings.length;
          
          // 更新科目数据
          const updatedSubjects = subjectRankings.map(sr => {
            const gradeAvgRank = gradeAverageRanks.get(sr.subjectName) || 0;
            const diff = sr.classRank - gradeAvgRank;
            let status: 'excellent' | 'medium' | 'poor' = 'excellent';
            if (diff >= 3) status = 'poor';
            else if (diff >= 1) status = 'medium';
            
            return {
              ...sr,
              gradeAverageRank: gradeAvgRank,
              rankDifference: diff,
              status,
            };
          });
          
          const problemCount = updatedSubjects.filter(s => s.status === 'poor').length;
          
          rankings.push({
            className,
            classAverageScore: Math.round(classAvg * 100) / 100,
            classRank: 0, // 将在排序后计算
            totalClasses: classMap.size,
            subjectRankings: updatedSubjects,
            problemSubjectCount: problemCount,
          });
        });
        
        // 按平均分排序并分配班级排名
        rankings.sort((a, b) => b.classAverageScore - a.classAverageScore);
        rankings.forEach((r, idx) => {
          r.classRank = idx + 1;
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
  }, [selectedAssessment]);

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
                <Card key={classData.className} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{classData.className}</CardTitle>
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
                    <div className="text-sm text-muted-foreground">
                      班级平均分: <span className="font-semibold text-primary">{classData.classAverageScore}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                        <div>科目</div>
                        <div className="text-center">班级排名</div>
                        <div className="text-center">年级均排</div>
                        <div className="text-center">差值</div>
                        <div className="text-center">状态</div>
                      </div>
                      {classData.subjectRankings.map((subject) => (
                        <div
                          key={subject.subjectName}
                          className="grid grid-cols-5 gap-2 text-sm py-2 border-b last:border-0 items-center"
                        >
                          <div className="font-medium">{subject.subjectName}</div>
                          <div className="text-center">{subject.classRank}</div>
                          <div className="text-center text-muted-foreground">{subject.gradeAverageRank}</div>
                          <div className={`text-center font-medium ${
                            subject.rankDifference <= 0 ? 'text-green-600' :
                            subject.rankDifference <= 2 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {subject.rankDifference > 0 ? '+' : ''}{subject.rankDifference}
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
