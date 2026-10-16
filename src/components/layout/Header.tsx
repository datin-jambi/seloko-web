import { AppSwitcher } from './AppSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/services/auth.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Shield, ChevronDown, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

function getInitials(name?: string) {
  if (!name) return 'ASN'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const { mobileNavOpen, setMobileNavOpen } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Abaikan jika token sudah expired
    } finally {
      clearAuth()
      toast.success('Anda telah keluar')
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 md:hidden"
          aria-label="Buka menu"
          aria-controls="sidebar"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu />
        </Button>
        <AppSwitcher />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || ''} />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.fullName || 'Pegawai BPKPD'}
                </div>
                <div className="font-mono text-xs text-muted-foreground tabular-nums">
                  {user?.nip || user?.email || ''}
                </div>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium text-foreground">{user?.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {user?.isSuperAdmin ? 'Super Administrator' : 'Pegawai internal'}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="text-muted-foreground" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seloko/akses/role')}>
              <Shield className="text-muted-foreground" />
              Hak akses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
