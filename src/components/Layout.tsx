import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full bg-art-gradient-bg">
        {/* Fixed Sidebar */}
        <AppSidebar />
        
        {/* Main Content Area */}
        <div className="transition-all duration-300 ease-in-out pl-0 sm:pl-80">
          {/* Colorful Header with Glass Effect */}
          <header className="sticky top-0 z-40 h-16 flex items-center gradient-glass px-6 shrink-0 relative border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-px art-line opacity-80"></div>
            <SidebarTrigger className="hover-glow mr-6 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" />
            <div className="flex items-center space-x-4">
              <div className="w-px h-8 art-line-vertical opacity-60"></div>
              <div>
                <h1 className="text-xl font-medium tracking-wider text-primary">学生成绩管理系统</h1>
                <div className="h-px w-20 art-line mt-1 opacity-70"></div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background/60 backdrop-blur-sm min-h-screen">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}