import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/services/auth.service'

export function ProtectedRoute() {
  const { isAuthenticated, accessToken, setAuth, setUserProfile } =
    useAuthStore()
  const [isVerifying, setIsVerifying] = useState(!isAuthenticated)

  useEffect(() => {
    async function checkSession() {
      // Jika belum ada token di memory, coba refresh sesi via cookie HttpOnly
      if (!accessToken) {
        try {
          const profile = await authService.getMe()
          if (profile) {
            setUserProfile(profile)
            useAuthStore.setState({ isAuthenticated: true, user: profile })
          }
        } catch {
          useAuthStore.setState({ isAuthenticated: false, accessToken: null })
        } finally {
          setIsVerifying(false)
        }
      } else {
        setIsVerifying(false)
      }
    }

    if (!isAuthenticated) {
      checkSession()
    } else {
      setIsVerifying(false)
    }
  }, [accessToken, isAuthenticated, setAuth, setUserProfile])

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">
            Memverifikasi Sesi ASN...
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
