import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from "lucide-react";
import { getSchoolSubjectAverages } from "@/utils/supabaseQuery";
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
  averageScore: number;
  rankInSubject: number;
  totalSchools: number;
  gradeAverage: number;
  difference: number;
  status: 'excellent' | 'medium' | 'poor';
}

interface SchoolRankingData {
  schoolName: string;
  subjectRankings: SubjectRanking[];
  overallAverage: number;
  overallRank: number;
  problemSubjectCount: number;
}

type SortOption = 'avgDesc' | 'avgAsc' | 'problemDesc';

const SchoolRankingAnalysis = () => {
  const { toast } = useToast();
  
  // 筛选状态
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('avgDesc');
  
  // 数据状态
  const [schoolRanking, setSchoolRanking] = useState<SchoolRankingData | null>(null);
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
        // 获取所有符合条件的考试ID（同年级、同月、同类型）
        const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);
        if (!selectedAssessmentData) return;

        const { data: matchingAssessments } = await supabase
          .from('assessments')
          .select('id')
          .eq('grade_level', selectedAssessmentData.grade_level)
          .eq('month', selectedAssessmentData.month)
          .eq('type', selectedAssessmentData.type)
          .eq('academic_year', selectedAssessmentData.academic_year);

        const assessmentIds = matchingAssessments?.map(a => a.id) || [selectedAssessment];
        
        // 调用新的学校级别函数
        const data = await getSchoolSubjectAverages(assessmentIds);
        
        // 获取选中学校名称
        const schoolName = schools.find(s => s.id === selectedSchool)?.name || '';
        
        // 只保留选中学校的数据
        const filteredData = data.filter((item: any) => item.school_name === schoolName);
        
        if (filteredData.length === 0) {
          setError('暂无该学校的数据');
          setSchoolRanking(null);
          return;
        }

        // 处理学校数据
        const subjectRankings: SubjectRanking[] = filteredData.map((item: any) => {
          const diff = item.average_score - item.grade_average;
          let status: 'excellent' | 'medium' | 'poor' = 'excellent';
          
          // 根据与平均分的差值判断状态
          if (diff < -5) status = 'poor';
          else if (diff < 0) status = 'medium';
          
          return {
            subjectName: item.subject_name,
            averageScore: item.average_score,
            rankInSubject: item.rank_in_subject,
            totalSchools: item.total_schools,
            gradeAverage: item.grade_average,
            difference: Math.round(diff * 100) / 100,
            status,
          };
        });

        // 计算学校总体平均分
        const overallAvg = subjectRankings.reduce((sum, s) => sum + s.averageScore, 0) / subjectRankings.length;
        
        // 计算问题科目数量
        const problemCount = subjectRankings.filter(s => s.status === 'poor').length;

        setSchoolRanking({
          schoolName,
          subjectRankings,
          overallAverage: Math.round(overallAvg * 100) / 100,
          overallRank: 0, // 可以基于所有学校的平均分计算
          problemSubjectCount: problemCount,
        });
        
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
    if (!schoolRanking) return null;

    const filtered = {
      ...schoolRanking,
      subjectRankings: schoolRanking.subjectRankings.filter(sr => selectedSubjects.has(sr.subjectName)),
    };
    
    // 排序
    switch (sortOption) {
      case 'avgAsc':
        filtered.subjectRankings.sort((a, b) => a.averageScore - b.averageScore);
        break;
      case 'problemDesc':
        filtered.subjectRankings.sort((a, b) => {
          const statusOrder = { poor: 0, medium: 1, excellent: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
      default: // avgDesc
        filtered.subjectRankings.sort((a, b) => b.averageScore - a.averageScore);
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
        <h2 className="text-2xl font-bold">学校各科平均分排名</h2>
        <p className="text-muted-foreground mt-2">
          分析学校在不同科目的排名表现，识别需要改进的教学环节
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
                onValueChange={(value) => setSelectedAssessment(Number(value))}
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
                  <SelectItem value="problemDesc">问题科目优先</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 右侧内容区域 */}
        <div className="flex-1 space-y-6">
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
              </CardContent>
            </Card>
          ) : !displayData ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">暂无数据</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 学校总体信息卡片 */}
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-2xl">{displayData.schoolName}</span>
                    {displayData.problemSubjectCount > 0 && (
                      <Badge variant="destructive" className="text-base px-4 py-1">
                        {displayData.problemSubjectCount}个问题科目
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">总体平均分</p>
                      <p className="text-3xl font-bold text-primary">{displayData.overallAverage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">参与科目</p>
                      <p className="text-3xl font-bold">{displayData.subjectRankings.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 各科排名表格 */}
              <Card>
                <CardHeader>
                  <CardTitle>各科目详细排名</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-3 text-xs font-medium text-muted-foreground pb-2 border-b">
                      <div>科目</div>
                      <div className="text-center">平均分</div>
                      <div className="text-center">全校排名</div>
                      <div className="text-center">全校平均</div>
                      <div className="text-center">差值</div>
                      <div className="text-center">状态</div>
                    </div>
                    {displayData.subjectRankings.map((subject) => (
                      <div
                        key={subject.subjectName}
                        className="grid grid-cols-6 gap-3 text-sm py-3 border-b last:border-0 items-center hover:bg-muted/30 transition-colors"
                      >
                        <div className="font-medium text-base">{subject.subjectName}</div>
                        <div className="text-center font-semibold text-lg">{subject.averageScore}</div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-sm">
                            {subject.rankInSubject}/{subject.totalSchools}
                          </Badge>
                        </div>
                        <div className="text-center text-muted-foreground">{subject.gradeAverage}</div>
                        <div className={`text-center font-medium ${
                          subject.difference >= 0 ? 'text-green-600' :
                          subject.difference >= -5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {subject.difference > 0 ? '+' : ''}{subject.difference}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolRankingAnalysis;
