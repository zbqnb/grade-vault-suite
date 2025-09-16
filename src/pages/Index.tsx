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
    },
    {
      title: "数据导出", 
      description: "导出各类统计报表",
      icon: Download,
      href: "/export",
    },
    {
      title: "学届分析",
      description: "按学届统计分析",
      icon: BarChart3,
      href: "/analytics", 
    },
    {
      title: "用户维护",
      description: "管理教师和班级信息",
      icon: UserCog,
      href: "/user-maintenance",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        {/* Artistic Welcome Section */}
        <div className="text-center mb-16 relative">
          <div className="mb-8 animate-fade-in">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px art-line opacity-40"></div>
            <div className="flex justify-center items-center mb-6 relative">
              <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 w-12 h-px art-line opacity-30"></div>
              <BarChart3 className="h-12 w-12 text-primary/70 mx-auto" />
              <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 w-12 h-px art-line opacity-30"></div>
            </div>
            <h1 className="text-5xl font-light text-primary mb-6 tracking-wider">学生成绩管理系统</h1>
            <div className="h-px w-48 art-line mx-auto mb-6 opacity-50"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              专业的教务管理平台，帮助教师高效管理学生成绩数据，提供全面的统计分析功能
            </p>
          </div>
        </div>

        {/* Minimalist Quick Actions */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-primary mb-4 tracking-wide">快速操作</h2>
            <div className="h-px w-24 art-line mx-auto opacity-60"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {quickActions.map((action, index) => (
              <Card 
                key={action.title} 
                className="hover-lift cursor-pointer border-border/20 bg-gradient-card relative overflow-hidden group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 left-0 right-0 h-px art-line opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <CardHeader className="text-center pt-8 pb-6">
                  <div className="p-4 rounded-full bg-primary/5 w-fit mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                    <action.icon className="h-8 w-8 text-primary/70 group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-xl font-light tracking-wide text-foreground">{action.title}</CardTitle>
                  <CardDescription className="text-base font-light leading-relaxed text-muted-foreground">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <Link to={action.href}>
                    <Button variant="minimal" className="w-full" size="lg">
                      开始使用
                    </Button>
                  </Link>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-px art-line opacity-20"></div>
              </Card>
            ))}
          </div>
        </div>

        {/* Minimalist System Overview */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-primary mb-4 tracking-wide">系统概览</h2>
            <div className="h-px w-24 art-line mx-auto opacity-60"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <Card className="text-center hover-lift bg-gradient-card border-border/10 relative group">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px art-line opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <Users className="h-6 w-6 text-primary/60 mx-auto mb-4" />
                <div className="text-3xl font-light text-primary tracking-wide mb-2">1,245</div>
                <div className="text-sm text-muted-foreground font-light">学生总数</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-lift bg-gradient-card border-border/10 relative group">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px art-line opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <BarChart3 className="h-6 w-6 text-primary/60 mx-auto mb-4" />
                <div className="text-3xl font-light text-primary tracking-wide mb-2">36</div>
                <div className="text-sm text-muted-foreground font-light">班级数量</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-lift bg-gradient-card border-border/10 relative group">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px art-line opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <TrendingUp className="h-6 w-6 text-primary/60 mx-auto mb-4" />
                <div className="text-3xl font-light text-primary tracking-wide mb-2">85.2</div>
                <div className="text-sm text-muted-foreground font-light">平均成绩</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-lift bg-gradient-card border-border/10 relative group">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px art-line opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <Award className="h-6 w-6 text-primary/60 mx-auto mb-4" />
                <div className="text-3xl font-light text-primary tracking-wide mb-2">92.5%</div>
                <div className="text-sm text-muted-foreground font-light">及格率</div>
              </CardContent>
            </Card>
          </div>

          {/* Minimalist Recent Activity */}
          <Card className="bg-gradient-card border-border/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px art-line opacity-40"></div>
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-light tracking-wide text-primary">最近活动</CardTitle>
              <CardDescription className="font-light text-muted-foreground">系统最新的操作记录</CardDescription>
              <div className="h-px w-32 art-line opacity-40 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[
                  { action: "上传成绩", detail: "高一年级期中考试成绩", time: "2分钟前" },
                  { action: "导出报表", detail: "班级统计分析报表", time: "15分钟前" },
                  { action: "学届分析", detail: "2024届学业表现分析", time: "1小时前" },
                  { action: "数据备份", detail: "系统自动备份完成", time: "3小时前" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-gentle border-b border-border/10 last:border-b-0 relative group">
                    <div>
                      <p className="font-light text-foreground">{item.action}</p>
                      <p className="text-sm text-muted-foreground font-light">{item.detail}</p>
                    </div>
                    <span className="text-sm text-muted-foreground font-light">{item.time}</span>
                    <div className="absolute left-0 top-0 bottom-0 w-px art-line-vertical opacity-0 group-hover:opacity-30 transition-opacity"></div>
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
