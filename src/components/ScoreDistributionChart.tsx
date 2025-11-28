import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { SegmentGroup } from "@/utils/scoreDistributionQuery";

interface ScoreDistributionChartProps {
  subjectName: string;
  segmentGroups: SegmentGroup[];
  averageScore: number | null;
  passRate: number | null;
  excellenceRate: number | null;
  poorRate: number | null;
  configMissing?: boolean;
}

const groupColors = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  pass: 'bg-yellow-500',
  poor: 'bg-red-500'
};

const groupBgColors = {
  excellent: 'bg-green-50 dark:bg-green-950',
  good: 'bg-blue-50 dark:bg-blue-950',
  pass: 'bg-yellow-50 dark:bg-yellow-950',
  poor: 'bg-red-50 dark:bg-red-950'
};

export const ScoreDistributionChart = ({
  subjectName,
  segmentGroups,
  averageScore,
  passRate,
  excellenceRate,
  poorRate,
  configMissing
}: ScoreDistributionChartProps) => {
  // 如果配置缺失，显示警告信息
  if (configMissing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{subjectName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              该科目数据录入时并未完善满分与三率（优秀线、及格线、差生线）配置，无法计算分段统计。请先配置该科目的评分标准。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 找到最大人数用于计算百分比宽度
  const maxCount = Math.max(
    ...segmentGroups.flatMap(group => 
      group.segments.map(seg => seg.studentCount)
    )
  );

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-muted/40">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
        <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span className="text-xl font-bold">{subjectName}</span>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="shadow-sm border-primary/30 bg-background/80">
              平均分: <span className="font-bold ml-1">{averageScore}</span>
            </Badge>
            <Badge variant="outline" className="shadow-sm border-green-300 bg-green-50/80 text-green-700">
              优秀率: <span className="font-bold ml-1">{excellenceRate}%</span>
            </Badge>
            <Badge variant="outline" className="shadow-sm border-blue-300 bg-blue-50/80 text-blue-700">
              及格率: <span className="font-bold ml-1">{passRate}%</span>
            </Badge>
            <Badge variant="outline" className="shadow-sm border-red-300 bg-red-50/80 text-red-700">
              差生率: <span className="font-bold ml-1">{poorRate}%</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {segmentGroups.map((group, groupIndex) => (
          <div 
            key={group.groupName} 
            className={`rounded-lg p-5 ${groupBgColors[group.groupType]} border border-${group.groupType === 'excellent' ? 'green' : group.groupType === 'good' ? 'blue' : group.groupType === 'pass' ? 'yellow' : 'red'}-200/50 shadow-sm hover:shadow-md transition-all duration-300`}
            style={{ animationDelay: `${groupIndex * 100}ms` }}
          >
            <div className="font-semibold mb-4 flex items-center justify-between">
              <span className="text-lg">【{group.groupName}】</span>
              <span className="text-sm text-muted-foreground bg-background/60 px-3 py-1 rounded-full">
                小计: <span className="font-bold">{group.subtotal}</span>人 ({group.subtotalPercentage}%)
              </span>
            </div>
            <div className="space-y-3">
              {group.segments.map((segment, idx) => {
                const widthPercent = (segment.studentCount / maxCount) * 100;
                
                return (
                  <div key={idx} className="flex items-center gap-3 hover:scale-[1.01] transition-transform">
                    <div className="w-24 text-sm text-right flex-shrink-0 font-medium">
                      {segment.label}
                    </div>
                    <div className="flex-1 bg-background/60 rounded-full h-7 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${groupColors[group.groupType]} transition-all duration-500 ease-out rounded-full flex items-center justify-end pr-2`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {widthPercent > 15 && (
                          <span className="text-xs font-bold text-white/90">
                            {segment.studentCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-32 text-sm flex-shrink-0 text-right font-medium">
                      <span className="font-bold">{segment.studentCount}</span>人 
                      <span className="text-muted-foreground ml-1">({segment.percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
