import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <main
          className="dashboard-main flex-1 flex flex-col h-screen overflow-hidden min-w-0"
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
