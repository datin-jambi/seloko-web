import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Layers,
  Newspaper,
  ExternalLink,
  Plus,
  ArrowRight,
  MapPin,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function BapendaDashboardPage() {
  const { activeAppCode } = useAppStore()

  return (
    <div className="space-y-6">
      {/* CMS Header */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Konteks: {activeAppCode}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Portal Publik Bapenda
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            CMS Portal Bapenda Provinsi Jambi
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelola konten publik, kantor UPTD Samsat, banner promo, dan
            publikasi berita daerah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="http://localhost:3002" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Buka Portal Publik
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link to="/bapenda/news/create">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Tulis Berita
            </Link>
          </Button>
        </div>
      </div>

      {/* Modul CMS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group transition-colors hover:border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700/10 text-green-800 dark:text-green-400">
                <MapPin className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">UPTD Samsat</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Status operasional kantor, penanggung jawab, dan titik koordinat
              Google Maps.
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

        <Card className="group transition-colors hover:border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">Banner Carousel</CardTitle>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600/10 text-amber-800 dark:text-amber-400">
                <Newspaper className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">Berita & Artikel</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Publikasi artikel pajak daerah dengan alur moderasi status
              sebelum terbit.
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

      {/* Alur Review Berita */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Alur Review Publikasi Berita</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tahapan moderasi artikel sebelum dipublikasikan ke portal publik
            warga.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-bold text-xs">
                1
              </span>
              <span className="font-medium text-foreground">Draf</span>
            </li>
            <li aria-hidden className="text-muted-foreground">
              &rarr;
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600/10 text-amber-800 dark:text-amber-400 font-bold text-xs">
                2
              </span>
              <span className="font-medium text-foreground">Review</span>
            </li>
            <li aria-hidden className="text-muted-foreground">
              &rarr;
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-700/10 text-green-800 dark:text-green-400 font-bold text-xs">
                3
              </span>
              <span className="font-medium text-foreground">Terbit</span>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Editor mengajukan artikel; Superadmin atau Verifikator menyetujui,
            menolak, atau langsung menerbitkan berita.
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs sm:w-auto" asChild>
            <Link to="/bapenda/news">
              Masuk ke Antrian Berita
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Kantor Contoh */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Kantor UPTD Terbaru</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Cuplikan data direktori — daftar lengkap tersedia di modul UPTD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">
                Samsat Kota Jambi
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Jl. Gajah Mada No. 1, Jelutung, Kota Jambi
              </p>
            </div>
            <Badge variant="success" className="text-xs shrink-0">
              Aktif
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">
                Samsat Muaro Jambi
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Jl. Lintas Timur KM 35, Sengeti
              </p>
            </div>
            <Badge variant="success" className="text-xs shrink-0">
              Aktif
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            <Link to="/bapenda/uptds">
              Buka Seluruh Direktori UPTD
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
