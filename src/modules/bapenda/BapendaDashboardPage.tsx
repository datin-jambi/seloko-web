import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Layers,
  Newspaper,
  FileText,
  MapPin,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function BapendaDashboardPage() {
  const { activeAppCode } = useAppStore()

  return (
    <div className="space-y-6">
      {/* CMS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs">
              Konteks: {activeAppCode}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Portal Publik Bapenda
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            CMS Portal Bapenda Provinsi Jambi
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola konten publik, 11 kantor UPTD Samsat, pengumuman banner promo, dan publikasi berita daerah.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild>
            <a href="http://localhost:3002" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Buka Portal Publik
            </a>
          </Button>
          <Button variant="gradient" size="sm" asChild>
            <Link to="/bapenda/news/create">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Tulis Berita Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Kantor Samsat UPTD
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">11 Kantor</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tersebar di seluruh Kab/Kota Jambi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Banner Carousel Aktif
            </CardTitle>
            <Layers className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3 Banner</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Urutan Drag-and-Drop aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Artikel & Berita
            </CardTitle>
            <Newspaper className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">7 Terbit</div>
            <p className="mt-1 text-xs text-muted-foreground">
              5 Kategori Berita Pajak
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Halaman Profil
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">5 Halaman</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Visi Misi, Struktur Organisasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Modules Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Samsat Directory Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Direktori UPTD Samsat Jambi</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                Domain Bapenda
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Kelola status operasional kantor, penanggung jawab, dan titik koordinat Google Maps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Samsat Kota Jambi</span>
                <Badge variant="success" className="text-[10px]">Tampil di Peta</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Jl. Gajah Mada No. 1, Jelutung, Kota Jambi
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Samsat Muaro Jambi</span>
                <Badge variant="success" className="text-[10px]">Tampil di Peta</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Jl. Lintas Timur KM 35, Sengeti
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
              <Link to="/bapenda/uptds">
                Buka Seluruh 11 UPTD
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Berita Review Flow */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">Alur Review Publikasi Berita</CardTitle>
              </div>
              <Badge variant="warning" className="text-xs">
                Workflow
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Tahapan moderasi artikel sebelum dipublikasikan ke portal publik warga.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-bold text-[10px]">1</div>
              <span className="font-medium text-foreground">Draf</span>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px]">2</div>
              <span className="font-medium text-foreground">Review</span>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-[10px]">3</div>
              <span className="font-medium text-foreground">Terbit</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Editor dapat mengajukan artikel, sedangkan Superadmin atau Verifikator dapat menyetujui, menolak, atau langsung menerbitkan berita.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
              <Link to="/bapenda/news">
                Masuk ke Antrian Berita
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
