import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/services/auth.service'

// Pulihkan sesi setelah reload: access token hanya di memori, jadi tukar cookie
// refresh dulu, baru ambil profil. Promise dibagi agar StrictMode (effect 2x)
// tidak memicu dua kali refresh — refresh token dirotasi, panggilan kedua gagal.
let restoring: Promise<void> | null = null
function restoreSession() {
  restoring ??= (async () => {
    const token = await authService.refresh()
    useAuthStore.setState({ accessToken: token })
    useAuthStore.getState().setAuth(token, await authService.getMe())
  })().finally(() => {
    restoring = null
  })
  return restoring
}

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [checked, setChecked] = useState(isAuthenticated)

  useEffect(() => {
    if (isAuthenticated || checked) return
    restoreSession()
      .catch(() => useAuthStore.getState().clearAuth())
      .finally(() => setChecked(true))
  }, [isAuthenticated, checked])

  if (!isAuthenticated && !checked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">Memverifikasi sesi…</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}
