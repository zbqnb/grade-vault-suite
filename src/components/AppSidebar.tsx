import { useState } from "react"
import { Upload, Download, BarChart3, FileText, PieChart, TrendingUp, Users } from "lucide-react"
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
    description: "上传学生成绩数据"
  },
  { 
    title: "数据导出", 
    url: "/export", 
    icon: Download,
    description: "导出各类统计报表"
  },
  { 
    title: "学届分析", 
    url: "/analytics", 
    icon: BarChart3,
    description: "按学届统计分析"
  },
  { 
    title: "用户维护", 
    url: "/user-maintenance", 
    icon: Users,
    description: "管理教师和班级信息"
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
      ? "bg-primary/5 text-primary border-l-2 border-primary font-normal shadow-none" 
      : "hover:bg-muted/30 text-muted-foreground hover:text-foreground border-l-2 border-transparent"

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-80"} transition-all duration-500 border-r border-border/20 bg-sidebar/80 backdrop-blur-sm`}
      collapsible="icon"
    >
      <SidebarContent className="p-6">
        {/* Minimalist Header */}
        <div className="mb-8 px-2 relative">
          {!isCollapsed && (
            <div className="space-y-4 animate-slide-in">
              <div className="relative">
                <h2 className="text-2xl font-light text-primary tracking-wider">学生成绩管理</h2>
                <div className="h-px w-24 art-line mt-2 opacity-60"></div>
              </div>
              <p className="text-sm text-muted-foreground font-light">教务管理系统</p>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center relative">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-px art-line opacity-40"></div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-light tracking-wider uppercase ${isCollapsed ? "sr-only" : ""} text-muted-foreground mb-4`}>
            主要功能
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `${getNavCls({ isActive })} flex items-center py-4 px-4 rounded-none transition-gentle min-h-[3.5rem] group relative overflow-hidden`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-300" />
                      {!isCollapsed && (
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="font-light text-base tracking-wide">{item.title}</div>
                          <div className="text-xs opacity-60 truncate font-light mt-0.5">{item.description}</div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-px art-line opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Minimalist Footer */}
        {!isCollapsed && (
          <div className="mt-auto pt-6 relative">
            <div className="h-px art-line opacity-30 mb-4"></div>
            <div className="px-2 py-3 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-light">
                <Users className="h-3 w-3 opacity-60" />
                <span>2024春季</span>
              </div>
              <div className="font-light opacity-50">v1.0.0</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}