import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Global Header with Trigger */}
          <header className="h-14 flex items-center border-b bg-background px-4 shrink-0">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-primary">学生成绩管理系统</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}