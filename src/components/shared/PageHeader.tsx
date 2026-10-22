import type { ReactNode } from 'react'

// Judul halaman kiri + aksi utama kanan. PRD 02 §6.
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {/* flex-wrap + min-w-0: dengan 3+ aksi (mis. detail organisasi) deretan
          tombol bisa melebihi lebar layar 360px dan membuat halaman melebar. */}
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
