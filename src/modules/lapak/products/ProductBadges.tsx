import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { STATUS_LABEL, STATUS_TONE } from './product-status'
import type { ContentStatus } from '@/types/lapak'

/** Badge status konten (produk/tarif). Warna dari token, bukan kelas mentah. */
export function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_TONE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Path modul produk di workspace Lapak. */
export const LAPAK_PRODUCTS = '/lapak-jambi/produk'
export const LAPAK_PRODUCT_DETAIL = (id: string) => `${LAPAK_PRODUCTS}/${id}`

/** Tautan ke detail produk — dipakai di kolom tabel. */
export function ProductLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      to={LAPAK_PRODUCT_DETAIL(id)}
      className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none group-hover/row:font-bold group-hover/row:underline"
    >
      {name}
    </Link>
  )
}
