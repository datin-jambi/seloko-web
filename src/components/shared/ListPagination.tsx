import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PAGE_SIZES } from './page-sizes'

export interface ListPaginationProps {
  /** Halaman aktif, 1-based. */
  page: number
  pageSize: number
  /** Jumlah baris setelah difilter. */
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}

/**
 * Kontrol pagination untuk daftar yang sudah ada di memori (bukan per-request).
 *
 * Dipakai kartu detail aplikasi (Role/Pengguna) yang mengambil seluruh daftar
 * dalam satu request; `DataTable` punya versi sendiri karena ia memaginasi di
 * server. Tampilan sengaja dibuat identik agar kedua pola terasa satu sistem:
 * rentang baris di kiri, pemilih ukuran + navigasi di kanan.
 */
export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: ListPaginationProps) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1)
  // Dijaga di dalam batas: menghapus baris terakhir di halaman terakhir tidak
  // boleh menyisakan halaman kosong tanpa cara kembali.
  const current = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span>Baris</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v))
            // Ukuran berubah → mulai dari halaman 1 agar tidak melewati batas baru.
            onPageChange(1)
          }}
        >
          <SelectTrigger aria-label="Baris per halaman" className="h-7 w-auto min-w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {from}–{to} dari {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-2 tabular-nums">
          Halaman {current} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Halaman sebelumnya"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Halaman berikutnya"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
