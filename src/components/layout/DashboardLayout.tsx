import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { appCodeFromPath } from '@/config/constants'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function DashboardLayout() {
  const { pathname } = useLocation()
  const { activeAppCode, setActiveAppCode } = useAppStore()

  // URL adalah sumber kebenaran konteks app: buka /bapenda/... → sidebar Bapenda.
  useEffect(() => {
    const code = appCodeFromPath(pathname)
    if (code && code !== activeAppCode) setActiveAppCode(code)
  }, [pathname, activeAppCode, setActiveAppCode])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
