import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Sparkles, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import type { AxiosError } from 'axios'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

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
      const data = await authService.login({ identity, password })
      // Ambil profile lengkap
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
      {/* Dynamic Background Gradients */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/10">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            SELOKO DASHBOARD
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Badan Pengelola Keuangan dan Pendapatan Daerah (BPKPD) Provinsi Jambi
          </p>
          <div className="mt-2.5">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] py-0.5">
              <Sparkles className="mr-1 h-3 w-3" />
              Centralized Core & Identity Gateway
            </Badge>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 bg-card/80 shadow-2xl backdrop-blur-xl">
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
                variant="gradient"
                className="w-full font-semibold mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Akun Uji Coba Cepat (Seeder):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillCredential('superadmin', 'SelokoBapenda@2025!')}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Superadmin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredential('admin.seloko', 'Seloko@2025!')}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Admin Seloko
                </button>
                <button
                  type="button"
                  onClick={() => fillCredential('editor.profil', 'Seloko@2025!')}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Editor Bapenda
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          &copy; 2026 Pemerintah Provinsi Jambi. Seluruh hak cipta dilindungi undang-undang.
        </p>
      </div>
    </div>
  )
}
