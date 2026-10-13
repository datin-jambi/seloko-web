import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { APP_CODES } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import type { AxiosError } from 'axios'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const setActiveAppCode = useAppStore((s) => s.setActiveAppCode)

  const [identity, setIdentity] = useState('superadmin')
  const [password, setPassword] = useState('SelokoBapenda@2025!')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Paksa konteks gateway SEBELUM request login — interceptor membaca
      // store, jadi konteks lama di localStorage harus diganti dulu.
      setActiveAppCode(APP_CODES.SELOKO)
      const data = await authService.login({ identity, password })
      const profile = await authService.getMe()
      setAuth(data.accessToken, profile)
      navigate('/dashboard')
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string; details?: Record<string, string> }>
      if (axiosErr.response?.data?.message) {
        setErrorMessage(axiosErr.response.data.message)
      } else if (axiosErr.message) {
        setErrorMessage(axiosErr.message)
      } else {
        setErrorMessage('Gagal terhubung ke Seloko API. Pastikan backend aktif.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredential = (userText: string, passText: string) => {
    setIdentity(userText)
    setPassword(passText)
    setErrorMessage(null)
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Subtle Institutional Grid Texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.12)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_80%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Logos: Bapenda + Seloko */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/Assets/images/LOGO%20BAPENDA.png"
              alt="Logo Bapenda Jambi"
              className="h-12 w-auto object-contain"
            />
            <div className="h-8 w-px bg-border" />
            <img
              src="/Assets/images/LOGO%20SELOKO%20S.png"
              alt="Logo Seloko"
              className="h-11 w-auto object-contain"
            />
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            SELOKO DASHBOARD
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Badan Pengelola Keuangan dan Pendapatan Daerah Provinsi Jambi
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold tracking-wide py-0.5 border-border bg-secondary/40 text-foreground">
              Portal Layanan Internal ASN
            </Badge>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Masuk Portal Internal</CardTitle>
            <CardDescription className="text-xs">
              Gunakan NIP, username, atau email kedinasan ASN Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Identitas Pengguna
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Username, email, atau NIP"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Memverifikasi...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Masuk ke Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Testing Credentials Pills */}
            <div className="mt-6 border-t border-border/60 pt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-2">
                Akun Uji Coba Cepat (Seeder):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillCredential('superadmin', 'SelokoBapenda@2025!')}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Superadmin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredential('admin.seloko', 'Seloko@2025!')}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Admin Seloko
                </button>
                <button
                  type="button"
                  onClick={() => fillCredential('editor.profil', 'Seloko@2025!')}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Editor Bapenda
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; 2026 Pemerintah Provinsi Jambi. Seluruh hak cipta dilindungi undang-undang.
        </p>
      </div>
    </div>
  )
}
