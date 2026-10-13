import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Shield,
  LayoutGrid,
  CheckCircle2,
  Building2,
  Layers,
  Newspaper,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_CODES } from '@/config/constants'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { activeAppCode, setActiveAppCode } = useAppStore()

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-40 top-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-indigo-400/40 bg-indigo-500/20 text-indigo-200 text-xs py-0.5">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Seloko Super App Gateway
              </Badge>
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 text-emerald-200 text-xs py-0.5">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Sesi ASN Aktif
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Selamat Datang, {user?.fullName || 'Administrator'}!
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-indigo-100/80 leading-relaxed">
              Anda terautentikasi sebagai{' '}
              <span className="font-semibold text-white">
                {user?.isSuperAdmin ? 'Super Administrator' : 'Internal Pegawai'}
              </span>
              . Gunakan App Switcher di header navigasi atas untuk berpindah konteks kerja lintas aplikasi Pemprov Jambi secara dinamis.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button
              onClick={() => setActiveAppCode(APP_CODES.BAPENDA_PROFILE)}
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20 border-white/10 backdrop-blur-sm"
              asChild
            >
              <Link to="/bapenda">
                Beralih ke CMS Bapenda
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Pengguna Internal
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">50+ Pegawai</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Terverifikasi via NIP ASN BPKPD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Ekosistem Terhubung
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <LayoutGrid className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">4 Aplikasi</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Seloko, Bapenda, Lapak Jambi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Hak Akses RBAC
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Shield className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Granular Redis</div>
            <p className="mt-1 text-xs text-muted-foreground">
              TTL 5 Menit & Instant Revocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Status Gateway API
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Normal / Siap</div>
            <p className="mt-1 text-xs text-muted-foreground">
              PostgreSQL, Redis, RabbitMQ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Akses Cepat Modul Bapenda & Layanan
          </h2>
          <Badge variant="outline" className="text-xs">
            Konteks Aktif: {activeAppCode}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-2 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">11 UPTD Samsat Jambi</CardTitle>
              <CardDescription className="text-xs">
                Kelola alamat, kontak, penanggung jawab, serta koordinat peta geolokasi Samsat se-Provinsi Jambi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <Link to="/bapenda/uptds">
                  Buka Direktori UPTD
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-2 group-hover:scale-105 transition-transform">
                <Layers className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Banner Portal Publik</CardTitle>
              <CardDescription className="text-xs">
                Atur hero carousel portal Bapenda, tombol call-to-action, dan urutan tampilan banner drag-and-drop.
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

          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-2 group-hover:scale-105 transition-transform">
                <Newspaper className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Berita & Antrian Review</CardTitle>
              <CardDescription className="text-xs">
                Publikasikan artikel pajak daerah dengan alur moderasi status: Draf, Review, Disetujui, dan Terbit.
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
    </div>
  )
}
