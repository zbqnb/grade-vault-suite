import { NavLink } from "react-router-dom"
import { Upload, Download, BarChart3, Users, Sparkles, TrendingUp, ArrowRight, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "成绩上传",
    description: "快速上传和导入学生成绩数据，支持Excel批量处理",
    icon: Upload,
    href: "/upload",
    color: "from-accent to-accent-glow",
    stats: "支持多种格式",
    badge: "智能处理"
  },
  {
    title: "数据导出", 
    description: "生成各类统计报表，支持多种格式导出",
    icon: Download,
    href: "/export",
    color: "from-primary to-primary-glow",
    stats: "一键导出",
    badge: "实时生成"
  },
  {
    title: "学届分析",
    description: "深度分析学生成绩趋势，提供数据洞察",
    icon: TrendingUp,
    href: "/analytics", 
    color: "from-secondary to-secondary-glow",
    stats: "AI分析",
    badge: "智能洞察"
  },
  {
    title: "用户维护",
    description: "管理教师信息和班级配置，维护系统数据",
    icon: Users,
    href: "/user-maintenance",
    color: "from-warning to-warning-glow",
    stats: "便捷管理",
    badge: "实时同步"
  }
]

export default function Index() {
  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-background-secondary">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="relative px-8 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="glass-card p-4 rounded-2xl animate-pulse-glow">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="gradient-text">现代化</span>
              <br />
              学生成绩管理系统
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              基于先进技术构建的教务管理平台，为学校提供高效、智能的成绩管理解决方案
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="group">
                <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                开始使用
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glass" size="lg" className="group">
                <Star className="w-5 h-5 group-hover:scale-110 transition-transform" />
                了解更多
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold gradient-text">核心功能</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              集成化的功能模块，满足教务管理的各种需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <NavLink
                key={feature.title}
                to={feature.href}
                className="group block animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-interactive h-full p-6 space-y-4 relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-all duration-500`} />
                  
                  {/* Badge */}
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:gradient-text transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-accent">
                        {feature.stats}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="px-8 py-16 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 lg:p-12 text-center space-y-8">
            <h3 className="text-2xl lg:text-3xl font-bold gradient-text">
              现代化教务管理的选择
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">系统稳定性</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-secondary">500+</div>
                <div className="text-sm text-muted-foreground">学校信赖</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">技术支持</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
