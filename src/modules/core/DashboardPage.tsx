import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { useQuery } from '@tanstack/react-query'
import { menuService } from '@/services/menu.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Layers,
  Newspaper,
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_CODES } from '@/config/constants'

export function DashboardPage() {
  const { user, accessToken } = useAuthStore()
  const { activeAppCode, setActiveAppCode } = useAppStore()

  const { data: menus } = useQuery({
    queryKey: ['menus', activeAppCode],
    queryFn: menuService.getMyMenus,
    retry: 1,
  })

  const menuCount = menus?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome Header — solid, data-dense */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <LayoutGrid className="mr-1.5 h-3 w-3" />
              Konteks: {activeAppCode}
            </Badge>
            {accessToken && (
              <Badge variant="success" className="text-xs">
                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                Sesi Aktif
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Selamat datang, {user?.fullName || 'Administrator'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {user?.isSuperAdmin ? 'Super Administrator' : 'Internal ASN'}
            {user?.nip ? ` · NIP ${user.nip}` : ''}
            {' · '}
            {menuCount} menu akses pada konteks aktif
          </p>
        </div>

        <Button
          onClick={() => setActiveAppCode(APP_CODES.BAPENDA_PROFILE)}
          variant="outline"
          size="sm"
          asChild
        >
          <Link to="/bapenda">
            Buka CMS Bapenda
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Modul Layanan — functional shortcuts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Modul Layanan Bapenda
          </h2>
          <span className="text-xs text-muted-foreground">
            Kelola konten portal publik BPKPD Provinsi Jambi
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm">UPTD Samsat Jambi</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Alamat, kontak, penanggung jawab, dan koordinat peta 11 kantor
                Samsat se-Provinsi Jambi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <Link to="/bapenda/uptds">
                  Buka Direktori
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm">Banner Portal Publik</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Hero carousel portal Bapenda, tombol call-to-action, dan urutan
                tampilan drag-and-drop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <Link to="/bapenda/banners">
                  Kelola Banner
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Newspaper className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm">Berita & Artikel</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Publikasi artikel pajak daerah dengan alur moderasi: Draf,
                Review, Disetujui, dan Terbit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <Link to="/bapenda/news">
                  Kelola Berita
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Akun & Sesi — real identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Identitas Sesi</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Informasi akun terautentikasi pada gateway Seloko.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Nama Lengkap</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {user?.fullName || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">NIP</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {user?.nip || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email Kedinasan</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {user?.email || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Peran</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {user?.isSuperAdmin ? 'Super Administrator' : 'Internal ASN'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
