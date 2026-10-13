import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { APP_CODES } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import type { AxiosError } from 'axios'

// Akun seeder — hanya muncul di `npm run dev`, tidak ikut ke build produksi.
const DEV_ACCOUNTS = import.meta.env.DEV
  ? [
      { label: 'Superadmin', identity: 'superadmin', password: 'SelokoBapenda@2025!' },
      { label: 'Admin Seloko', identity: 'admin.seloko', password: 'Seloko@2025!' },
      { label: 'Editor Bapenda', identity: 'editor.profil', password: 'Seloko@2025!' },
    ]
  : []

const YEAR = new Date().getFullYear()

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const setActiveAppCode = useAppStore((s) => s.setActiveAppCode)

  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
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
      const axiosErr = err as AxiosError<{ message?: string }>
      setErrorMessage(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Gagal terhubung ke server. Coba lagi.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <img
              src="/Assets/images/LOGO%20SELOKO%20S.png"
              alt=""
              className="size-7 object-contain"
            />
            SELOKO
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Masuk ke akun Anda</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Gunakan NIP, username, atau email kedinasan
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid gap-2">
                <label htmlFor="identity" className="text-sm font-medium">
                  NIP / Username / Email
                </label>
                <Input
                  id="identity"
                  autoComplete="username"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Kata sandi
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memverifikasi…' : 'Masuk'}
              </Button>

              {DEV_ACCOUNTS.length > 0 && (
                <div className="grid gap-2">
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                      Akun uji (dev)
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {DEV_ACCOUNTS.map((a) => (
                      <Button
                        key={a.identity}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIdentity(a.identity)
                          setPassword(a.password)
                          setErrorMessage(null)
                        }}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground md:text-left">
          © {YEAR} BPKPD Provinsi Jambi
        </p>
      </div>

      {/* Panel kanan: logo Bapenda berwarna putih, butuh latar gelap. */}
      <div className="relative hidden flex-col items-center justify-end border-l border-sidebar-border bg-sidebar p-10 lg:flex">
        <img
          src="/Assets/images/LOGO%20BAPENDA.png"
          alt="Bapenda Provinsi Jambi"
          className="absolute inset-0 m-auto w-3/5 max-w-md object-contain"
        />
        <p className="relative text-center text-xs text-sidebar-foreground">
          Badan Pengelola Keuangan dan Pendapatan Daerah Provinsi Jambi
        </p>
      </div>
    </div>
  )
}
