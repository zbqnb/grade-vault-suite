import { useState } from "react"
import { Upload, Download, BarChart3, Users, GraduationCap, BookOpen, FileSpreadsheet, Settings, Sparkles } from "lucide-react"
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  { 
    title: "成绩上传", 
    url: "/upload", 
    icon: Upload,
    description: "上传学生成绩数据",
    color: "text-blue-500",
    gradient: "from-blue-500/10 to-blue-600/5"
  },
  { 
    title: "数据导出", 
    url: "/export", 
    icon: Download,
    description: "导出各类统计报表",
    color: "text-emerald-500",
    gradient: "from-emerald-500/10 to-emerald-600/5"
  },
  { 
    title: "学届分析", 
    url: "/analytics", 
    icon: BarChart3,
    description: "按学届统计分析",
    color: "text-purple-500",
    gradient: "from-purple-500/10 to-purple-600/5"
  },
  { 
    title: "用户维护", 
    url: "/user-maintenance", 
    icon: Users,
    description: "管理教师和班级信息",
    color: "text-orange-500",
    gradient: "from-orange-500/10 to-orange-600/5"
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/")
  const isExpanded = mainItems.some((i) => isActive(i.url))

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-4 border-primary font-medium shadow-lg" 
      : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent text-muted-foreground hover:text-foreground border-l-4 border-transparent"

  return (
    <Sidebar
      className="fixed left-0 top-0 z-50 h-screen w-80 transition-all duration-500 border-r border-white/10 gradient-glass backdrop-blur-xl"
      collapsible="icon"
    >
      <SidebarContent className="p-6 h-full overflow-y-auto">
        {/* Colorful Header */}
        <div className="mb-8 px-2 relative">
          {!isCollapsed && (
            <div className="space-y-4 animate-slide-in">
              <div className="relative">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <Sparkles className="h-4 w-4 text-warning animate-pulse" />
                </div>
                <h2 className="text-2xl font-semibold text-primary tracking-wide">学生成绩管理</h2>
                <div className="h-1 w-24 art-line mt-2 opacity-80 rounded-full"></div>
              </div>
              <p className="text-sm text-muted-foreground">现代化教务管理平台</p>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-px art-line opacity-60"></div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-medium tracking-wider uppercase ${isCollapsed ? "sr-only" : ""} text-muted-foreground mb-6 flex items-center space-x-2`}>
            <BookOpen className="h-4 w-4" />
            <span>主要功能</span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `${getNavCls({ isActive })} flex items-center py-4 px-4 rounded-xl transition-magical min-h-[4rem] group relative overflow-hidden bg-gradient-to-r ${item.gradient}`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <div className={`p-2 rounded-lg ${item.color} bg-white/10 group-hover:bg-white/20 transition-colors`}>
                        <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      {!isCollapsed && (
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="font-medium text-base tracking-wide">{item.title}</div>
                          <div className="text-xs opacity-70 truncate mt-0.5">{item.description}</div>
                        </div>
                      )}
                      <div className="absolute top-0 left-0 right-0 h-px art-line opacity-0 group-hover:opacity-60 transition-opacity"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-px art-line opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Colorful Footer */}
        {!isCollapsed && (
          <div className="mt-auto pt-8 relative">
            <div className="h-px art-line opacity-60 mb-6"></div>
            <div className="px-2 py-4 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-info to-success">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">2024春季学期</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-60">版本 v1.0.0</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-info animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}