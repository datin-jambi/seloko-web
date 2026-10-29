import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@/modules/auth/LoginPage'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/modules/core/DashboardPage'
import { ProfilePage } from '@/modules/core/profile/ProfilePage'
import { ApplicationDetailPage, ApplicationsPage, MenusPage } from '@/modules/core/pages'
import { RolesPage } from '@/modules/core/access/RolesPage'
import { RoleDetailPage } from '@/modules/core/access/RoleDetailPage'
import { PermissionsPage } from '@/modules/core/access/PermissionsPage'
import { PermissionDetailPage } from '@/modules/core/access/PermissionDetailPage'
import { UsersPage } from '@/modules/core/users/UsersPage'
import { OrganizationsPage } from '@/modules/core/organizations/OrganizationsPage'
import { OrganizationDetailPage } from '@/modules/core/organizations/OrganizationDetailPage'
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
import { LapakOpdPage } from '@/modules/lapak/LapakOpdPage'
import { LapakCategoriesPage } from '@/modules/lapak/categories/LapakCategoriesPage'
import { LapakProductsPage } from '@/modules/lapak/products/LapakProductsPage'
import { LapakProductDetailPage } from '@/modules/lapak/products/LapakProductDetailPage'
import { LapakOpdDetailPage } from '@/modules/lapak/LapakOpdDetailPage'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { TopLoader } from '@/components/shared/TopLoader'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_HOME, WORKSPACES } from '@/config/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 menit
      retry: 1,
    },
  },
})

/**
 * Path rute HARUS sama dengan `path` menu di DB
 * (`../seloko-api/prisma/seeds/core/menus.json`), karena sidebar merender
 * `item.path` apa adanya. Beda satu segmen = menu bisa diklik tapi 404.
 *
 * Perhatikan: aplikasi `lapak-jambi-web` menaruh menunya di `/lapak-jambi/…`,
 * sementara segmen workspace-nya `lapak` (lihat `APP_WORKSPACE`). Karena itu
 * kedua prefix didaftarkan: `/lapak-jambi/…` untuk menu DB dan `/lapak/…`
 * sebagai alias tautan lama.
 */
const pending = (title: string, note: string) => <PendingApiPage title={title} note={note} />

/** Halaman Lapak yang endpoint/UI-nya belum ada — didaftarkan di dua prefix. */
const LAPAK_PENDING: [string, string][] = [
  ['objek-retribusi', 'belum ada endpoint API'],
  ['pengaturan-skrd', 'modul skrd belum ada'],
  ['reservasi', 'modul reservasi belum ada'],
      ['pesanan', 'modul lapak belum ada'],
  ['pembayaran', 'modul lapak belum ada'],
  ['tiket', 'modul lapak belum ada'],
  ['artikel', 'modul artikel belum ada'],
  ['galeri', 'modul galeri belum ada'],
  ['banner', 'modul banner belum ada'],
]

const LAPAK_PREFIXES = ['/lapak-jambi', '/lapak']

// Daftar <Route> untuk Lapak. Harus berupa ARRAY yang di-spread di dalam
// <Routes>, bukan komponen: <Routes> hanya menerima <Route> atau Fragment.
// Kedua prefix butuh /dashboard masing-masing — menu DB menus.json menunjuk
// /lapak-jambi/dashboard, sedangkan App Switcher memakai /lapak/dashboard.
const lapakRoutes = LAPAK_PREFIXES.map((base) => (
  <Route key={`${base}/dashboard`} path={`${base}/dashboard`} element={<DashboardPage />} />
)).concat(
  LAPAK_PENDING.flatMap(([slug, note]) => {
    const title = slug.replaceAll('/', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return LAPAK_PREFIXES.map((base) => (
      <Route key={`${base}/${slug}`} path={`${base}/${slug}`} element={pending(title, note)} />
    ))
  }),
)

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
                  <Route path="/" element={<Navigate to={DEFAULT_HOME} replace />} />

                  {/*
                    Beranda tiap workspace. Daftarnya = WORKSPACES, sumber yang
                    sama dengan `appWorkspace()`/`appCodeFromPath()`. Semua rute
                    lain di bawah WAJIB berprefix salah satu segmen ini, karena
                    segmen itulah yang menentukan sidebar mana yang dinyalakan.
                  */}
                  {WORKSPACES.map((ws) => (
                    <Route key={ws} path={`/${ws}/dashboard`} element={<DashboardPage />} />
                  ))}

                  {/* ── Seloko (CORE) ─────────────────────────────────────── */}
                  <Route path="/seloko/profile" element={<ProfilePage />} />
                  <Route path="/seloko/pengguna" element={<UsersPage />} />
                  <Route path="/seloko/pengguna/tambah" element={<UserCreatePage />} />
                  <Route
                    path="/seloko/pengguna/penugasan"
                    element={pending('Penugasan Role', 'belum ada GET daftar penugasan lintas pengguna')}
                  />
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
                  <Route path="/seloko/organisasi" element={<OrganizationsPage />} />
                  <Route path="/seloko/organisasi/:id" element={<OrganizationDetailPage />} />

                  {/* ── Bapenda CMS (aplikasi `bapenda-profile`) ──────────── */}
                  {/* Path = menu DB: /bapenda/kontent/berita, bukan /bapenda/berita. */}
                  <Route path="/bapenda/kontent/berita" element={<NewsPage />} />
                  <Route path="/bapenda/kontent/berita/review" element={<NewsReviewPage />} />
                  <Route path="/bapenda/content/gallery" element={pending('Gallery', 'modul galeri belum ada')} />
                  <Route path="/bapenda/berita/kategori" element={<NewsCategoriesPage />} />
                  <Route path="/bapenda/halaman" element={<PagesPage />} />
                  <Route path="/bapenda/banner" element={<BannersPage />} />
                  {/* Alias lama — dipertahankan agar tautan yang sudah dibagikan tetap hidup. */}
                  <Route path="/bapenda/berita" element={<NewsPage />} />
                  <Route path="/bapenda/berita/review" element={<NewsReviewPage />} />

                  {/* ── Lapak Jambi CMS (aplikasi `lapak-jambi-web`) ──────── */}
                  {lapakRoutes}
                  {/* Direktori OPD: data dari master Organisasi Seloko, khusus jenis OPD. */}
                  {LAPAK_PREFIXES.map((base) => (
                    <Route key={`${base}/opd`} path={`${base}/opd`} element={<LapakOpdPage />} />
                  ))}
                  {/* Master kategori layanan — dikelola Bapenda (lihat lapak-access). */}
                  {LAPAK_PREFIXES.map((base) => (
                    <Route key={`${base}/kategori`} path={`${base}/kategori`} element={<LapakCategoriesPage />} />
                  ))}
                  {/* Produk & Layanan — daftar tersaring lingkup OPD oleh server. */}
                  {LAPAK_PREFIXES.map((base) => (
                    <Route key={`${base}/produk`} path={`${base}/produk`} element={<LapakProductsPage />} />
                  ))}
                  {LAPAK_PREFIXES.map((base) => (
                    <Route
                      key={`${base}/produk/:id`}
                      path={`${base}/produk/:id`}
                      element={<LapakProductDetailPage />}
                    />
                  ))}
                  {LAPAK_PREFIXES.map((base) => (
                    <Route key={`${base}/opd/:code`} path={`${base}/opd/:code`} element={<LapakOpdDetailPage />} />
                  ))}
                  <Route path="/lapak-jambi/berita" element={<NewsPage />} />
                  <Route path="/lapak/berita" element={<NewsPage />} />

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
