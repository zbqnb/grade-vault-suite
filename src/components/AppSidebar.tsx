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
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-72"} transition-all duration-300 border-r bg-card`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Header */}
        <div className="mb-6 px-2">
          {!isCollapsed && (
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-primary">学生成绩管理</h2>
              <p className="text-sm text-muted-foreground">教务管理系统</p>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-sm font-medium ${isCollapsed ? "sr-only" : ""}`}>
            主要功能
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `${getNavCls({ isActive })} flex items-center p-3 rounded-lg transition-smooth min-h-[3rem] group`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="font-medium text-base">{item.title}</div>
                          <div className="text-xs opacity-75 truncate">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!isCollapsed && (
          <div className="mt-auto pt-4 border-t">
            <div className="px-2 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3 w-3" />
                <span>当前学期：2024春季</span>
              </div>
              <div>版本 v1.0.0</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}