import { useState } from "react";
import { BarChart3, TrendingUp, Users, FileText, Award, Target, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SchoolRankingAnalysis from "@/components/SchoolRankingAnalysis";
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
      id: "score-trends",
      title: "成绩趋势分析",
      icon: TrendingUp,
    },
    {
      id: "class-comparison",
      title: "班级对比分析",
      icon: Users,
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
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
            <SchoolRankingAnalysis />
          </div>
        );
      case "score-trends":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
            <div>
              <h2 className="text-2xl font-bold">成绩趋势分析</h2>
              <p className="text-muted-foreground mt-2">
                分析不同时间段的成绩变化趋势
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  功能开发中...
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "class-comparison":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
            <div>
              <h2 className="text-2xl font-bold">班级对比分析</h2>
              <p className="text-muted-foreground mt-2">
                对比不同班级之间的整体表现
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  功能开发中...
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "student-performance":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
            <div>
              <h2 className="text-2xl font-bold">学生表现分析</h2>
              <p className="text-muted-foreground mt-2">
                深入分析学生个体的学习表现
              </p>
            </div>
            <Card>
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
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
            <div>
              <h2 className="text-2xl font-bold">排名统计分析</h2>
              <p className="text-muted-foreground mt-2">
                年级排名、班级排名等统计数据
              </p>
            </div>
            <Card>
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
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              返回主页
            </Button>
            <div>
              <h2 className="text-2xl font-bold">综合报告</h2>
              <p className="text-muted-foreground mt-2">
                生成全面的教学质量分析报告
              </p>
            </div>
            <Card>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">教学质量分析</h1>
            <p className="text-muted-foreground mt-1">全面分析教学质量和学生表现</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Navigation */}
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">分析目录</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedPage(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          selectedPage === item.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Right Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;