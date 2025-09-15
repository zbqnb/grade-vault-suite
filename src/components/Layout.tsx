import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Sparkles, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Modern Glass Header */}
          <header className="glass-subtle border-b backdrop-blur-xl sticky top-0 z-50">
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover-glow" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl gradient-primary animate-pulse-glow">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold gradient-text">学生成绩管理系统</h1>
                    <p className="text-xs text-muted-foreground">现代化教务管理平台</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="glass-subtle hover-glow">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="glass-subtle hover-glow">
                  <Settings className="h-4 w-4" />
                </Button>
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-float">
                  管
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto scrollbar-custom bg-gradient-to-br from-background via-background to-background-secondary">
            <div className="min-h-full animate-slide-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}