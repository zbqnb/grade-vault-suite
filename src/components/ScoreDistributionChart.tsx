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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{subjectName}</span>
          <div className="flex gap-2">
            <Badge variant="outline">平均分: {averageScore}</Badge>
            <Badge variant="outline">优秀率: {excellenceRate}%</Badge>
            <Badge variant="outline">及格率: {passRate}%</Badge>
            <Badge variant="outline">差生率: {poorRate}%</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {segmentGroups.map((group) => (
          <div key={group.groupName} className={`rounded-lg p-4 ${groupBgColors[group.groupType]}`}>
            <div className="font-semibold mb-3 flex items-center justify-between">
              <span>【{group.groupName}】</span>
              <span className="text-sm text-muted-foreground">
                小计: {group.subtotal}人 ({group.subtotalPercentage}%)
              </span>
            </div>
            <div className="space-y-2">
              {group.segments.map((segment, idx) => {
                const widthPercent = (segment.studentCount / maxCount) * 100;
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-right flex-shrink-0">
                      {segment.label}
                    </div>
                    <div className="flex-1 bg-muted rounded h-6 overflow-hidden">
                      <div 
                        className={`h-full ${groupColors[group.groupType]} transition-all duration-300`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <div className="w-32 text-sm flex-shrink-0 text-right">
                      {segment.studentCount}人 ({segment.percentage}%)
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
