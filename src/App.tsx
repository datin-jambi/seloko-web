import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@/modules/auth/LoginPage'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/modules/core/DashboardPage'
import { ApplicationDetailPage, ApplicationsPage, MenusPage } from '@/modules/core/pages'
import { RolesPage } from '@/modules/core/access/RolesPage'
import { RoleDetailPage } from '@/modules/core/access/RoleDetailPage'
import { PermissionsPage } from '@/modules/core/access/PermissionsPage'
import { PermissionDetailPage } from '@/modules/core/access/PermissionDetailPage'
import { UsersPage } from '@/modules/core/users/UsersPage'
import { UserDetailPage } from '@/modules/core/users/UserDetailPage'
import { UserCreatePage } from '@/modules/core/users/UserCreatePage'
import { UserEditPage } from '@/modules/core/users/UserEditPage'
import {
  BannersPage,
  NewsCategoriesPage,
  NewsPage,
  NewsReviewPage,
  PagesPage,
} from '@/modules/bapenda/pages'
import { PendingApiPage } from '@/components/shared/PendingApiPage'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { TopLoader } from '@/components/shared/TopLoader'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { APP_CONFIGS } from '@/config/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 menit
      retry: 1,
    },
  },
})

// Path = path menu di ../seloko-api/prisma/seeds/core/menus.json. Lihat PRD 01 §E.
const pending = (title: string, note: string) => <PendingApiPage title={title} note={note} />

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TopLoader />
        <Toaster />
        <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to={APP_CONFIGS.seloko.home} replace />} />
                {Object.values(APP_CONFIGS).map((c) => (
                  <Route key={c.home} path={c.home} element={<DashboardPage />} />
                ))}

                {/* Seloko */}
                <Route path="/seloko/pengguna" element={<UsersPage />} />
                <Route path="/seloko/pengguna/tambah" element={<UserCreatePage />} />
                <Route path="/seloko/pengguna/penugasan" element={pending('Penugasan Role', 'belum ada GET daftar penugasan lintas pengguna')} />
                <Route path="/seloko/pengguna/:id" element={<UserDetailPage />} />
                <Route path="/seloko/pengguna/:id/ubah" element={<UserEditPage />} />
                <Route path="/seloko/akses/role" element={<RolesPage />} />
                <Route path="/seloko/akses/role/:id" element={<RoleDetailPage />} />
                <Route path="/seloko/akses/permission" element={<PermissionsPage />} />
                <Route path="/seloko/akses/permission/:id" element={<PermissionDetailPage />} />
                <Route path="/seloko/sistem/aplikasi" element={<ApplicationsPage />} />
                <Route path="/seloko/sistem/aplikasi/:id" element={<ApplicationDetailPage />} />
                <Route path="/seloko/sistem/menu" element={<MenusPage />} />
                <Route path="/seloko/sistem/audit" element={pending('Log Audit', 'belum ada GET log audit')} />

                {/* Portal Bapenda */}
                <Route path="/bapenda/berita" element={<NewsPage />} />
                <Route path="/bapenda/berita/review" element={<NewsReviewPage />} />
                <Route path="/bapenda/berita/kategori" element={<NewsCategoriesPage />} />
                <Route path="/bapenda/halaman" element={<PagesPage />} />
                <Route path="/bapenda/banner" element={<BannersPage />} />
                <Route path="/bapenda/galeri" element={pending('Galeri', 'modul galeri belum ada')} />

                {/* Lapak Jambi — modul lapak belum ada di API */}
                <Route path="/lapak/merchant" element={pending('Merchant', 'modul lapak belum ada')} />
                <Route path="/lapak/merchant/verifikasi" element={pending('Verifikasi Merchant', 'modul lapak belum ada')} />
                <Route path="/lapak/produk" element={pending('Produk', 'modul lapak belum ada')} />
                <Route path="/lapak/produk/verifikasi" element={pending('Verifikasi Produk', 'modul lapak belum ada')} />
                <Route path="/lapak/kategori" element={pending('Kategori', 'modul lapak belum ada')} />
                <Route path="/lapak/pesanan" element={pending('Pesanan', 'modul lapak belum ada')} />
                <Route path="/lapak/pesanan/ekspor" element={pending('Ekspor Laporan', 'modul lapak belum ada')} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
