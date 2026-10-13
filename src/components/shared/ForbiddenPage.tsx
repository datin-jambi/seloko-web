import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export function ForbiddenPage({ permissionCode }: { permissionCode?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">403</h1>
      <h2 className="mt-2 text-base font-semibold text-foreground">
        Akses Terbatas (Hak Akses Ditolak)
      </h2>
      <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
        Akun Anda tidak memiliki kewenangan role atau izin permission{' '}
        {permissionCode && (
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground font-mono">
            {permissionCode}
          </code>
        )}{' '}
        untuk mengakses halaman ini. Hubungi Super Administrator jika Anda membutuhkan akses.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-6 text-xs">
        <Link to="/">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Kembali ke Dasbor Utama
        </Link>
      </Button>
    </div>
  )
}
