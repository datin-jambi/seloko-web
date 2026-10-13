import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-muted-foreground mb-4">
        <FileQuestion className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">404</h1>
      <h2 className="mt-2 text-base font-semibold text-foreground">
        Halaman Tidak Ditemukan
      </h2>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
        Tautan yang Anda tuju mungkin telah dipindahkan, dinonaktifkan, atau tidak terdaftar di sistem Seloko.
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
