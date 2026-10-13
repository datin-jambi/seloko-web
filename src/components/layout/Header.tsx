import { useState, useEffect } from 'react'
import { AppSwitcher } from './AppSwitcher'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Moon, Sun, LogOut, User, Shield, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Abaikan jika token sudah expired
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ASN'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/70 bg-card/60 px-6 backdrop-blur-md">
      {/* Kiri: App Switcher */}
      <div className="flex items-center gap-4">
        <AppSwitcher />
      </div>

      {/* Kanan: Actions, Theme Toggle & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notifikasi Mock */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsDark(!isDark)}
          className="text-muted-foreground hover:text-foreground"
          title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <div className="h-6 w-px bg-border/80 mx-1" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg p-1.5 outline-none transition-colors hover:bg-accent/60">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left md:flex">
                <span className="text-xs font-semibold text-foreground">
                  {user?.fullName || 'Pegawai BPKPD'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {user?.nip ? `NIP. ${user.nip}` : user?.email || 'ASN Jambi'}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuLabel className="p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none text-foreground">
                  {user?.fullName}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="info" className="text-[10px] py-0 px-1.5">
                    {user?.isSuperAdmin ? 'Superadmin' : 'Internal ASN'}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/profile')}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profil Pengguna</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/akses')}
              className="cursor-pointer"
            >
              <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Hak Akses & Izin</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar (Logout)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
