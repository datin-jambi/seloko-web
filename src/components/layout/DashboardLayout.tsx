import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { appCodeFromPath } from '@/config/constants'
import { useActiveApp } from '@/hooks/use-apps'
import { ForbiddenPage } from '@/components/shared/ForbiddenPage'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function DashboardLayout() {
  const { pathname } = useLocation()
  const { activeAppCode, setActiveAppCode } = useAppStore()
  const { allowed, isLoading } = useActiveApp()

  // URL adalah sumber kebenaran konteks workspace: membuka /lapak/… langsung
  // (bookmark, back/forward) harus menyalakan sidebar Lapak. Aman disinkronkan
  // di setiap perubahan path SEKARANG karena App Switcher memang memindahkan
  // halaman ke beranda workspace tujuan — dulu tidak, sehingga sinkronisasi ini
  // membatalkan pilihan pengguna dan membuat sidebar kosong.
  useEffect(() => {
    const code = appCodeFromPath(pathname)
    if (code && code !== activeAppCode) setActiveAppCode(code)
  }, [pathname, activeAppCode, setActiveAppCode])

  // Prefix URL menunjuk aplikasi yang tidak boleh dipakai akun ini (role
  // dicabut / tautan lama). Tampilkan penjelasan, bukan sidebar kosong.
  const urlApp = appCodeFromPath(pathname)
  const urlDenied = !isLoading && !!urlApp && !allowed.some((a) => a.code === urlApp)

  if (urlDenied) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <ForbiddenPage />
            </div>
          </main>
        </div>
      </div>
    )
  }

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
