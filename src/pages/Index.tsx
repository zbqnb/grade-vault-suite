import { BarChart3, Upload, Download, Users, TrendingUp, Award, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const quickActions = [
    {
      title: "成绩上传",
      description: "批量导入学生成绩数据",
      icon: Upload,
      href: "/upload",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "数据导出", 
      description: "导出各类统计报表",
      icon: Download,
      href: "/export",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "学届分析",
      description: "按学届统计分析",
      icon: BarChart3,
      href: "/analytics", 
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "用户维护",
      description: "管理教师和班级信息",
      icon: UserCog,
      href: "/user-maintenance",
      color: "text-orange-600", 
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-primary mb-4">学生成绩管理系统</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              专业的教务管理平台，帮助教师高效管理学生成绩数据，提供全面的统计分析功能
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {quickActions.map((action) => (
              <Card key={action.title} className="card-hover cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`p-4 rounded-full ${action.bgColor} w-fit mx-auto mb-4`}>
                    <action.icon className={`h-8 w-8 ${action.color}`} />
                  </div>
                  <CardTitle className="text-xl">{action.title}</CardTitle>
                  <CardDescription className="text-base">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={action.href}>
                    <Button className="w-full" size="lg">
                      开始使用
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Overview */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">系统概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-primary">1,245</div>
                <div className="text-sm text-muted-foreground">学生总数</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <BarChart3 className="h-8 w-8 text-accent mx-auto mb-3" />
                <div className="text-2xl font-bold text-accent">36</div>
                <div className="text-sm text-muted-foreground">班级数量</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-warning mx-auto mb-3" />
                <div className="text-2xl font-bold text-warning">85.2</div>
                <div className="text-sm text-muted-foreground">平均成绩</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-600">92.5%</div>
                <div className="text-sm text-muted-foreground">及格率</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">最近活动</CardTitle>
              <CardDescription>系统最新的操作记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "上传成绩", detail: "高一年级期中考试成绩", time: "2分钟前" },
                  { action: "导出报表", detail: "班级统计分析报表", time: "15分钟前" },
                  { action: "学届分析", detail: "2024届学业表现分析", time: "1小时前" },
                  { action: "数据备份", detail: "系统自动备份完成", time: "3小时前" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
