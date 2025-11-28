import { useState, useMemo } from "react";
import { ScoreDistributionFilter } from "@/components/ScoreDistributionFilter";
import { ScoreDistributionChart } from "@/components/ScoreDistributionChart";
import { 
  getScoreDistribution, 
  groupSegments, 
  calculateSubjectStats,
  DistributionData 
} from "@/utils/scoreDistributionQuery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ScoreDistribution = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [distributionData, setDistributionData] = useState<Map<number, DistributionData>>(new Map());
  const [sortOption, setSortOption] = useState<string>('avgDesc');
  const [filterInfo, setFilterInfo] = useState<{
    schoolName?: string;
    assessmentName?: string;
    className?: string;
  }>({});

  const handleQuery = async (filters: {
    schoolId: number;
    assessmentId: number;
    subjectIds: number[];
    sortOption: string;
    classId?: number;
  }) => {
    setLoading(true);
    setSortOption(filters.sortOption);

    try {
      const newData = new Map<number, DistributionData>();

      // Get school and assessment info for display
      const { data: schoolData } = await supabase
        .from('schools')
        .select('name')
        .eq('id', filters.schoolId)
        .single();

      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('academic_year, month, type')
        .eq('id', filters.assessmentId)
        .single();

      let className = undefined;
      if (filters.classId) {
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', filters.classId)
          .single();
        className = classData?.name;
      }

      setFilterInfo({
        schoolName: schoolData?.name,
        assessmentName: assessmentData ? 
          `${assessmentData.academic_year}年${assessmentData.month}月${assessmentData.type}` : 
          undefined,
        className
      });

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', filters.subjectIds);

      const subjectMap = new Map(subjects?.map(s => [s.id, s.name]) || []);

      await Promise.all(
        filters.subjectIds.map(async (subjectId) => {
          try {
            const [segments, stats] = await Promise.all([
              getScoreDistribution(filters.assessmentId, subjectId, filters.classId),
              calculateSubjectStats(filters.assessmentId, subjectId, filters.classId)
            ]);

            const segmentGroups = groupSegments(segments);

            newData.set(subjectId, {
              subjectId,
              subjectName: subjectMap.get(subjectId) || '',
              averageScore: stats.averageScore,
              passRate: stats.passRate,
              excellenceRate: stats.excellenceRate,
              poorRate: stats.poorRate,
              configMissing: stats.configMissing,
              segmentGroups
            });
          } catch (error) {
            console.error(`获取科目${subjectId}数据失败:`, error);
          }
        })
      );

      setDistributionData(newData);

      if (newData.size === 0) {
        toast({
          title: "暂无数据",
          description: "选中的科目暂无成绩数据",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('查询失败:', error);
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    const dataArray = Array.from(distributionData.values());

    switch (sortOption) {
      case 'avgDesc':
        return dataArray.sort((a, b) => b.averageScore - a.averageScore);
      case 'excellenceDesc':
        return dataArray.sort((a, b) => b.excellenceRate - a.excellenceRate);
      case 'passDesc':
        return dataArray.sort((a, b) => b.passRate - a.passRate);
      default:
        return dataArray;
    }
  }, [distributionData, sortOption]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border border-primary/20 shadow-sm">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          一分一段分析
        </h2>
        <p className="text-muted-foreground mt-2">
          展示学生成绩的分布情况，帮助了解不同层次学生的比例
        </p>
        {filterInfo.schoolName && (
          <div className="flex gap-4 mt-4 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              学校: {filterInfo.schoolName}
            </Badge>
            {filterInfo.assessmentName && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                考试: {filterInfo.assessmentName}
              </Badge>
            )}
            {filterInfo.className && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                班级: {filterInfo.className}
              </Badge>
            )}
            {!filterInfo.className && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                全部班级
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Filter Section */}
      <ScoreDistributionFilter onQuery={handleQuery} />

      {/* Results Section */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12 bg-card rounded-lg border shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground font-medium">加载中...</span>
          </div>
        )}

        {!loading && distributionData.size === 0 && (
          <div className="text-center py-12 bg-card rounded-lg border shadow-sm">
            <p className="text-muted-foreground">请选择筛选条件并点击查询按钮</p>
          </div>
        )}

        {!loading && sortedData.length > 0 && (
          <div className="space-y-4">
            {sortedData.map((data, index) => (
              <div 
                key={data.subjectId}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ScoreDistributionChart
                  subjectName={data.subjectName}
                  segmentGroups={data.segmentGroups}
                  averageScore={data.averageScore}
                  passRate={data.passRate}
                  excellenceRate={data.excellenceRate}
                  poorRate={data.poorRate}
                  configMissing={data.configMissing}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreDistribution;