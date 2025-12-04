import { useState } from "react";
import { BarChart3, TrendingUp, Users, FileText, Award, Target, Home, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SubjectRankingAnalysis from "@/components/SubjectRankingAnalysis";
import ScoreDistribution from "./ScoreDistribution";
import ClassRatesAnalysis from "@/components/ClassRatesAnalysis";
import { useNavigate } from "react-router-dom";

const Analytics = () => {
  const [selectedPage, setSelectedPage] = useState("subject-ranking");
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: "subject-ranking",
      title: "各科平均分排名",
      icon: BarChart3,
    },
    {
      id: "score-distribution",
      title: "一分一段分析",
      icon: TrendingUp,
    },
    {
      id: "class-rates",
      title: "各班一分三率分析",
      icon: Percent,
    },
    {
      id: "student-performance",
      title: "学生表现分析",
      icon: Target,
    },
    {
      id: "ranking-stats",
      title: "排名统计分析",
      icon: Award,
    },
    {
      id: "comprehensive-report",
      title: "综合报告",
      icon: FileText,
    },
  ];

  const renderContent = () => {
    switch (selectedPage) {
      case "subject-ranking":
        return <SubjectRankingAnalysis />;
      case "score-distribution":
        return <ScoreDistribution />;
      case "class-rates":
        return <ClassRatesAnalysis />;
      case "student-performance":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold">学生表现分析</h2>
              <p className="text-muted-foreground mt-2">
                深入分析学生个体的学习表现
              </p>
            </div>
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  功能开发中...
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "ranking-stats":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold">排名统计分析</h2>
              <p className="text-muted-foreground mt-2">
                年级排名、班级排名等统计数据
              </p>
            </div>
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  功能开发中...
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "comprehensive-report":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold">综合报告</h2>
              <p className="text-muted-foreground mt-2">
                生成全面的教学质量分析报告
              </p>
            </div>
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  功能开发中...
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                教学质量分析
              </h1>
              <p className="text-muted-foreground mt-2">全面分析教学质量和学生表现</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="hover:bg-primary/10"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Navigation */}
          <aside className="w-72 flex-shrink-0 animate-fade-in">
            <Card className="border-muted/40 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-1 w-8 bg-primary rounded-full" />
                  分析目录
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedPage(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300",
                          "hover:scale-[1.02] hover:shadow-md",
                          selectedPage === item.id
                            ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                            : "hover:bg-muted/80 text-foreground"
                        )}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className={cn(
                          "p-2 rounded-md transition-colors",
                          selectedPage === item.id 
                            ? "bg-primary-foreground/20" 
                            : "bg-muted/50"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">{item.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Right Content */}
          <div className="flex-1 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;