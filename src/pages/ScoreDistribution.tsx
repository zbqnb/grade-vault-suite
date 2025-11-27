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

const ScoreDistribution = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [distributionData, setDistributionData] = useState<Map<number, DistributionData>>(new Map());
  const [sortOption, setSortOption] = useState<string>('avgDesc');

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

      // 获取科目名称
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', filters.subjectIds);

      const subjectMap = new Map(subjects?.map(s => [s.id, s.name]) || []);

      // 并行获取所有科目的数据
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

  // 排序数据
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
    <div className="flex gap-6 h-full">
      <ScoreDistributionFilter onQuery={handleQuery} />
      
      <div className="flex-1 overflow-y-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold">各科目一分一段分析</h1>
          <p className="text-muted-foreground mt-2">
            展示学生成绩的分布情况，帮助了解不同层次学生的比例
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        )}

        {!loading && distributionData.size === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            请选择筛选条件并点击查询按钮
          </div>
        )}

        {!loading && sortedData.length > 0 && (
          <div className="space-y-4">
            {sortedData.map((data) => (
              <ScoreDistributionChart
                key={data.subjectId}
                subjectName={data.subjectName}
                segmentGroups={data.segmentGroups}
                averageScore={data.averageScore}
                passRate={data.passRate}
                excellenceRate={data.excellenceRate}
                poorRate={data.poorRate}
                configMissing={data.configMissing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreDistribution;
