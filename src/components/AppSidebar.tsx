import { Upload, Download, BarChart3, Users, GraduationCap, Sparkles, TrendingUp, Zap } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  { 
    title: "成绩上传", 
    url: "/upload", 
    icon: Upload,
    description: "上传学生成绩数据",
    color: "text-accent",
    gradient: "from-accent to-accent-glow"
  },
  { 
    title: "数据导出", 
    url: "/export", 
    icon: Download,
    description: "导出各类统计报表",
    color: "text-primary",
    gradient: "from-primary to-primary-glow"
  },
  { 
    title: "学届分析", 
    url: "/analytics", 
    icon: TrendingUp,
    description: "按学届统计分析",
    color: "text-secondary",
    gradient: "from-secondary to-secondary-glow"
  },
  { 
    title: "用户维护", 
    url: "/user-maintenance", 
    icon: Users,
    description: "管理教师和班级信息",
    color: "text-warning",
    gradient: "from-warning to-warning-glow"
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/")

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-80"} transition-all duration-500 ease-in-out glass border-r backdrop-blur-xl`}
      collapsible="icon"
    >
      <SidebarContent className="p-4 scrollbar-custom">
        {/* Elegant Header */}
        <div className="mb-8 p-4">
          {!isCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl gradient-primary animate-pulse-glow shadow-glow">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold gradient-text">教务管理</h2>
                  <p className="text-sm text-muted-foreground">现代化平台</p>
                </div>
              </div>
              <div className="glass-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  <span className="font-medium">当前学期</span>
                </div>
                <p className="text-sm text-muted-foreground">2024年春季学期</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center animate-float">
              <div className="p-3 rounded-2xl gradient-primary shadow-glow">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-sm font-semibold text-muted-foreground mb-4 ${isCollapsed ? "sr-only" : ""}`}>
            核心功能
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {mainItems.map((item, index) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`nav-item group flex items-center p-4 rounded-xl min-h-[4rem] transition-all duration-300 ${
                          active 
                            ? `active bg-gradient-to-r ${item.gradient} text-primary-foreground shadow-glow` 
                            : 'hover-glow text-foreground/80 hover:text-foreground'
                        }`}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div className={`flex-shrink-0 p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-muted/50 group-hover:bg-muted'} transition-all duration-300`}>
                          <item.icon className={`h-5 w-5 ${active ? 'text-primary-foreground' : item.color} transition-colors duration-300`} />
                        </div>
                        
                        {!isCollapsed && (
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base">{item.title}</span>
                              {active && <Zap className="h-3 w-3 animate-pulse" />}
                            </div>
                            <p className={`text-xs truncate mt-1 ${
                              active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        )}
                        
                        {active && !isCollapsed && (
                          <div className="w-1 h-8 bg-white/30 rounded-full animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modern Footer */}
        {!isCollapsed && (
          <div className="mt-auto">
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-xs font-medium text-foreground">系统状态正常</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>版本</span>
                  <span className="font-mono">v2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>构建</span>
                  <span className="font-mono">2024.03</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}