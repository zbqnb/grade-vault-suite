import { BarChart3, GraduationCap, Users, TrendingUp, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Analytics = () => {
  const gradeYears = [
    {
      year: "2024届",
      students: 420,
      classes: 12,
      avgScore: 85.2,
      status: "current",
      subjects: 9
    },
    {
      year: "2023届", 
      students: 415,
      classes: 12,
      avgScore: 83.8,
      status: "graduated",
      subjects: 9
    },
    {
      year: "2022届",
      students: 398,
      classes: 11, 
      avgScore: 84.5,
      status: "graduated",
      subjects: 9
    },
    {
      year: "2021届",
      students: 405,
      classes: 12,
      avgScore: 82.9,
      status: "graduated", 
      subjects: 9
    }
  ];

  const analysisTypes = [
    {
      id: "performance",
      title: "学业表现分析",
      description: "各科目成绩分布、优秀率、及格率等关键指标分析",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "trends",
      title: "成绩趋势分析", 
      description: "学届间成绩变化趋势，教学质量提升情况",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "comparison",
      title: "学届对比分析",
      description: "不同学届间的全面对比，找出教学改进点",
      icon: Users,
      color: "text-purple-600", 
      bgColor: "bg-purple-50"
    },
    {
      id: "ranking",
      title: "排名统计分析",
      description: "年级排名、班级排名、单科排名等排名数据分析",
      icon: Award,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">学届分析</h1>
              <p className="text-muted-foreground mt-1">按学届统计分析学生成绩数据</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>分析时间：2024年3月</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Grade Years Overview */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">学届概览</h2>
              <p className="text-muted-foreground">查看各学届的基本统计信息</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {gradeYears.map((grade) => (
                <Card key={grade.year} className="card-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {grade.year}
                      </CardTitle>
                      <Badge 
                        variant={grade.status === "current" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {grade.status === "current" ? "在读" : "已毕业"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">学生人数</span>
                          <span className="font-medium">{grade.students}人</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">班级数量</span>
                          <span className="font-medium">{grade.classes}个</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">平均分</span>
                          <span className="font-medium text-primary">{grade.avgScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">科目数</span>
                          <span className="font-medium">{grade.subjects}门</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      查看详细分析
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Analysis Options */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">分析类型</h2>
              <p className="text-muted-foreground">选择不同的分析维度深入了解学届表现</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisTypes.map((analysis) => (
                <Card key={analysis.id} className="card-hover cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${analysis.bgColor}`}>
                        <analysis.icon className={`h-6 w-6 ${analysis.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{analysis.title}</CardTitle>
                        <CardDescription className="text-base mt-2">
                          {analysis.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="lg">
                      开始分析
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Analysis Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">分析设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">对比学届</label>
                  <div className="space-y-2">
                    {gradeYears.map((grade) => (
                      <label key={grade.year} className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{grade.year}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">分析科目</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>全部科目</option>
                    <option>语文</option>
                    <option>数学</option>
                    <option>英语</option>
                    <option>理科综合</option>
                    <option>文科综合</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">分析维度</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>综合分析</option>
                    <option>按班级</option>
                    <option>按性别</option>
                    <option>按入学成绩</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    生成报告
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-primary-soft rounded-lg">
                  <div className="text-3xl font-bold text-primary">4</div>
                  <div className="text-sm text-muted-foreground">学届总数</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-accent-soft rounded-lg">
                    <div className="text-xl font-bold text-accent">1,638</div>
                    <div className="text-xs text-muted-foreground">学生总数</div>
                  </div>
                  <div className="p-3 bg-warning-soft rounded-lg">
                    <div className="text-xl font-bold text-warning">84.1</div>
                    <div className="text-xs text-muted-foreground">平均成绩</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">最近报告</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "2024届学业表现分析报告",
                    "学届间成绩对比分析",
                    "近四年成绩趋势报告"
                  ].map((report, index) => (
                    <div key={index} className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <p className="text-sm font-medium">{report}</p>
                      <p className="text-xs text-muted-foreground">3月{15-index}日</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;