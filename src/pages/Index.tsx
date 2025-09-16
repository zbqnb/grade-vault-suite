import { 
  BarChart3, 
  Upload, 
  Download, 
  Users, 
  TrendingUp, 
  Award, 
  UserCog, 
  Sparkles, 
  Star, 
  BookOpen,
  FileText,
  Calendar,
  Clock
} from "lucide-react";
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
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-500/10",
      textColor: "text-blue-600"
    },
    {
      title: "数据导出", 
      description: "导出各类统计报表",
      icon: Download,
      href: "/export",
      color: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-500/10", 
      textColor: "text-emerald-600"
    },
    {
      title: "学届分析",
      description: "按学届统计分析",
      icon: BarChart3,
      href: "/analytics", 
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-500/10",
      textColor: "text-purple-600"
    },
    {
      title: "用户维护",
      description: "管理教师和班级信息",
      icon: UserCog,
      href: "/user-maintenance",
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-500/10",
      textColor: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-soft/30 to-accent-soft/20">
      <div className="container mx-auto px-8 py-16 max-w-7xl">
        {/* Hero Section with Rich Colors */}
        <div className="text-center mb-20 relative">
          <div className="mb-12 animate-fade-in">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-px art-line opacity-80"></div>
            <div className="flex justify-center items-center mb-8 relative">
              <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 w-16 h-px art-line opacity-50"></div>
              <div className="relative">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl shadow-primary/20 icon-glow">
                  <BarChart3 className="h-16 w-16 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-warning animate-pulse" />
                <Star className="absolute -bottom-1 -left-1 h-4 w-4 text-info animate-bounce" />
              </div>
              <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 w-16 h-px art-line opacity-50"></div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6 tracking-wide">
              学生成绩管理系统
            </h1>
            <div className="h-1 w-64 bg-gradient-to-r from-primary via-secondary to-accent mx-auto mb-8 rounded-full opacity-80"></div>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              🎓 专业的教务管理平台，帮助教师高效管理学生成绩数据，提供全面的统计分析功能
            </p>
          </div>
        </div>

        {/* Colorful Quick Actions */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Sparkles className="h-6 w-6 text-warning" />
              <h2 className="text-4xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wide">快速操作</h2>
              <Sparkles className="h-6 w-6 text-info" />
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto opacity-80 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {quickActions.map((action, index) => (
              <Card 
                key={action.title} 
                className={`hover-float cursor-pointer border-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-lg relative overflow-hidden group shadow-xl`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${action.color} opacity-80`}></div>
                <CardHeader className="text-center pt-8 pb-6">
                  <div className={`p-6 rounded-2xl ${action.iconBg} w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg relative`}>
                    <action.icon className={`h-8 w-8 ${action.textColor} group-hover:rotate-12 transition-transform duration-500`} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-ping opacity-75"></div>
                  </div>
                  <CardTitle className={`text-xl font-semibold tracking-wide ${action.textColor}`}>{action.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <Link to={action.href}>
                    <Button variant="default" className={`w-full bg-gradient-to-r ${action.color} hover:shadow-xl transition-all duration-300`} size="lg">
                      开始使用 ✨
                    </Button>
                  </Link>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-px art-line opacity-40"></div>
              </Card>
            ))}
          </div>
        </div>

        {/* Rich System Overview */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-4xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-wide">系统概览</h2>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-accent mx-auto opacity-80 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <Card className="text-center hover-glow card-primary relative group border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 w-fit mx-auto mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-blue-600 tracking-wide mb-3">1,245</div>
                <div className="text-sm text-muted-foreground font-medium">学生总数 👥</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow card-success relative group border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 w-fit mx-auto mb-6 shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-emerald-600 tracking-wide mb-3">36</div>
                <div className="text-sm text-muted-foreground font-medium">班级数量 📚</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow card-warning relative group border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 w-fit mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-orange-600 tracking-wide mb-3">85.2</div>
                <div className="text-sm text-muted-foreground font-medium">平均成绩 📈</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-glow card-info relative group border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 w-fit mx-auto mb-6 shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-green-600 tracking-wide mb-3">92.5%</div>
                <div className="text-sm text-muted-foreground font-medium">及格率 🏆</div>
              </CardContent>
            </Card>
          </div>

          {/* Vibrant Recent Activity */}
          <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            <CardHeader className="pb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wide">最近活动</CardTitle>
                <Sparkles className="h-5 w-5 text-warning animate-pulse" />
              </div>
              <CardDescription className="text-muted-foreground text-lg">系统最新的操作记录 📊</CardDescription>
              <div className="h-1 w-40 bg-gradient-to-r from-primary to-secondary opacity-60 mt-3 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { action: "上传成绩", detail: "高一年级期中考试成绩", time: "2分钟前", icon: Upload, color: "from-blue-500 to-blue-600" },
                  { action: "导出报表", detail: "班级统计分析报表", time: "15分钟前", icon: FileText, color: "from-emerald-500 to-emerald-600" },
                  { action: "学届分析", detail: "2024届学业表现分析", time: "1小时前", icon: BarChart3, color: "from-purple-500 to-purple-600" },
                  { action: "数据备份", detail: "系统自动备份完成", time: "3小时前", icon: Calendar, color: "from-orange-500 to-orange-600" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-6 hover:bg-white/50 transition-magical rounded-xl border border-white/20 group relative overflow-hidden shadow-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} shadow-lg`}>
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-lg">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground font-medium">{item.time}</span>
                      <div className="flex space-x-1 mt-1 justify-end">
                        <div className="w-1 h-1 bg-success rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-warning rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-info rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-accent/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
