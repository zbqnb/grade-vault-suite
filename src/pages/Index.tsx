import { BarChart3, Upload, Download, Users, TrendingUp, Award, UserCog, Sparkles, Star, ArrowRight, GraduationCap } from "lucide-react";
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
      gradient: "bg-gradient-primary",
      delay: "0ms"
    },
    {
      title: "数据导出", 
      description: "导出各类统计报表",
      icon: Download,
      href: "/export",
      gradient: "bg-gradient-accent",
      delay: "100ms"
    },
    {
      title: "学届分析",
      description: "按学届统计分析",
      icon: BarChart3,
      href: "/analytics", 
      gradient: "bg-gradient-secondary",
      delay: "200ms"
    },
    {
      title: "用户维护",
      description: "管理教师和班级信息",
      icon: UserCog,
      href: "/user-maintenance",
      gradient: "bg-gradient-warm",
      delay: "300ms"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='6' cy='6' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative container mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <Sparkles className="h-4 w-4 text-white animate-pulse-soft" />
              <span className="text-white/90 text-sm font-medium">现代化教务管理平台</span>
            </div>
            
            <div className="mb-8 animate-fade-up">
              <GraduationCap className="h-20 w-20 text-white mx-auto mb-6 animate-float" />
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                学生成绩
                <span className="block bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  管理系统
                </span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                专业的教务管理平台，集成现代化设计与强大功能，
                <br />
                助力教师高效管理学生数据，提供智能统计分析
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-medium px-8 py-4 text-lg font-semibold">
                开始体验
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
                了解更多
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-40 right-16 w-8 h-8 bg-white/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/15 rounded-full animate-float" style={{animationDelay: '4s'}}></div>
      </section>

      <div className="container mx-auto px-6 py-16">
        {/* Quick Actions */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">功能导航</h2>
            <p className="text-muted-foreground text-lg">选择您需要的功能模块，开始高效的教务管理</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {quickActions.map((action, index) => (
              <div 
                key={action.title} 
                className="animate-fade-up"
                style={{animationDelay: action.delay}}
              >
                <Link to={action.href} className="block group">
                  <Card className="card-hover border-0 shadow-soft overflow-hidden relative">
                    <div className={`absolute inset-0 ${action.gradient} opacity-90`}></div>
                    <div className="relative z-10">
                      <CardHeader className="text-center text-white pb-8 pt-8">
                        <div className="mb-6">
                          <action.icon className="h-12 w-12 mx-auto mb-4 opacity-90" />
                        </div>
                        <CardTitle className="text-2xl mb-2 font-bold">{action.title}</CardTitle>
                        <CardDescription className="text-white/80 text-base leading-relaxed">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-8">
                        <Button 
                          variant="secondary" 
                          className="w-full bg-white/90 text-gray-800 hover:bg-white font-semibold py-3"
                          size="lg"
                        >
                          立即访问
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* System Statistics */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">数据概览</h2>
            <p className="text-muted-foreground text-lg">实时统计数据，让管理更加透明高效</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Users, value: "1,245", label: "学生总数", color: "text-primary", bgColor: "bg-primary/10" },
              { icon: BarChart3, value: "36", label: "班级数量", color: "text-accent", bgColor: "bg-accent/10" },
              { icon: TrendingUp, value: "85.2", label: "平均成绩", color: "text-warning", bgColor: "bg-warning/10" },
              { icon: Award, value: "92.5%", label: "及格率", color: "text-success", bgColor: "bg-success/10" }
            ].map((stat, index) => (
              <Card key={stat.label} className="text-center shadow-soft border-0 animate-fade-up" style={{animationDelay: `${index * 100}ms`}}>
                <CardContent className="p-8">
                  <div className={`inline-flex p-4 rounded-full ${stat.bgColor} mb-4`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="max-w-4xl mx-auto">
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">最近活动</CardTitle>
                  <CardDescription className="text-lg">系统最新的操作记录</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "上传成绩", detail: "高一年级期中考试成绩", time: "2分钟前", color: "bg-primary/10 text-primary" },
                  { action: "导出报表", detail: "班级统计分析报表", time: "15分钟前", color: "bg-accent/10 text-accent" },
                  { action: "学届分析", detail: "2024届学业表现分析", time: "1小时前", color: "bg-secondary/10 text-secondary" },
                  { action: "数据备份", detail: "系统自动备份完成", time: "3小时前", color: "bg-warning/10 text-warning" }
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors animate-slide-in"
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${item.color.split(' ')[0]}`}></div>
                      <div>
                        <p className="font-semibold text-foreground">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Index;