import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@/modules/auth/LoginPage'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/modules/core/DashboardPage'
import { BapendaDashboardPage } from '@/modules/bapenda/BapendaDashboardPage'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { TopLoader } from '@/components/shared/TopLoader'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 menit
      retry: 1,
    },
  },
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TopLoader />
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/bapenda" element={<BapendaDashboardPage />} />

                {/* Placeholder rute modul domain */}
                <Route
                  path="/bapenda/uptds"
                  element={
                    <div className="space-y-4">
                      <h1 className="text-xl font-bold">Direktori UPTD Samsat Jambi</h1>
                      <p className="text-xs text-muted-foreground">
                        Modul pengelolaan 11 kantor Samsat, status aktif, dan peta sebaran publik.
                      </p>
                    </div>
                  }
                />
                <Route
                  path="/bapenda/banners"
                  element={
                    <div className="space-y-4">
                      <h1 className="text-xl font-bold">Manajemen Banner Portal</h1>
                      <p className="text-xs text-muted-foreground">
                        Modul banner promosi dan pengumuman dengan drag-and-drop ordering.
                      </p>
                    </div>
                  }
                />
                <Route
                  path="/bapenda/news"
                  element={
                    <div className="space-y-4">
                      <h1 className="text-xl font-bold">Manajemen Berita & Artikel</h1>
                      <p className="text-xs text-muted-foreground">
                        Daftar berita, kategori, dan antrian review alur publikasi.
                      </p>
                    </div>
                  }
                />
              </Route>
            </Route>

            {/* Fallback 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
