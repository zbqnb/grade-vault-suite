import { Download, FileText, PieChart, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Export = () => {
  const exportOptions = [
    {
      id: "grades",
      title: "成绩报表",
      description: "学生成绩详细报表，包含各科目分数",
      icon: FileText,
      format: ["Excel", "PDF"],
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "statistics", 
      title: "统计分析",
      description: "成绩分布、平均分、排名等统计数据",
      icon: PieChart,
      format: ["Excel", "CSV"],
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "trends",
      title: "趋势分析", 
      description: "学生成绩变化趋势和学习进步情况",
      icon: TrendingUp,
      format: ["PDF", "图片"],
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      id: "comparison",
      title: "对比分析",
      description: "班级对比、年级对比、历史对比分析",
      icon: BarChart3,
      format: ["Excel", "PDF"],
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
              <h1 className="text-2xl font-bold text-primary">数据导出</h1>
              <p className="text-muted-foreground mt-1">导出各类成绩统计报表</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>最后更新：2024-03-15</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Options */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">选择导出类型</h2>
              <p className="text-muted-foreground">根据需要选择不同的报表类型进行导出</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exportOptions.map((option) => (
                <Card key={option.id} className="card-hover cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${option.bgColor}`}>
                        <option.icon className={`h-6 w-6 ${option.color}`} />
                      </div>
                      <div className="flex gap-1">
                        {option.format.map((format) => (
                          <Badge key={format} variant="secondary" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription className="text-base">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      导出 {option.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Exports */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">最近导出</CardTitle>
                <CardDescription>查看最近的导出记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "高一年级期中成绩报表.xlsx", time: "2024-03-15 16:30", type: "成绩报表", status: "已完成" },
                    { name: "班级统计分析.pdf", time: "2024-03-14 14:20", type: "统计分析", status: "已完成" },
                    { name: "学期趋势分析.pdf", time: "2024-03-13 10:15", type: "趋势分析", status: "已完成" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Download className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{item.type}</Badge>
                        <p className="text-sm text-accent font-medium">{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Export Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">导出设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间范围</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>本学期</option>
                    <option>上学期</option>
                    <option>本学年</option>
                    <option>自定义</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">年级范围</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>全部年级</option>
                    <option>高一年级</option>
                    <option>高二年级</option>
                    <option>高三年级</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">科目选择</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>全部科目</option>
                    <option>语文</option>
                    <option>数学</option>
                    <option>英语</option>
                    <option>物理</option>
                    <option>化学</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    应用设置
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">导出统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-primary-soft rounded-lg">
                    <div className="text-2xl font-bold text-primary">156</div>
                    <div className="text-sm text-muted-foreground">本月导出</div>
                  </div>
                  <div className="p-3 bg-accent-soft rounded-lg">
                    <div className="text-2xl font-bold text-accent">2.1GB</div>
                    <div className="text-sm text-muted-foreground">文件总量</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-warning-soft rounded-lg">
                  <div className="text-lg font-bold text-warning">98.5%</div>
                  <div className="text-sm text-muted-foreground">导出成功率</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Export;