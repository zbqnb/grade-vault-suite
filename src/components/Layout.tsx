import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Minimalist Header with Artistic Line */}
          <header className="h-16 flex items-center border-b border-border/30 bg-background/80 backdrop-blur-sm px-6 shrink-0 relative">
            <div className="absolute top-0 left-0 right-0 h-px art-line opacity-60"></div>
            <SidebarTrigger className="hover-lift" />
            <div className="ml-6 flex items-center space-x-4">
              <div className="w-px h-8 art-line-vertical opacity-40"></div>
              <div>
                <h1 className="text-xl font-light tracking-wider text-primary">学生成绩管理系统</h1>
                <div className="h-px w-16 art-line mt-1 opacity-50"></div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto bg-background/50">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}