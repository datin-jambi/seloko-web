import type { ContentStatus, ProductStatusAction } from '@/types/lapak'

/**
 * Label & nada status konten. Satu sumber untuk badge, filter, dan menu aksi —
 * `ContentStatus` dipakai bersama produk, tarif, dan artikel.
 */
export const STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: 'Draf',
  PENDING_REVIEW: 'Menunggu review',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  PUBLISHED: 'Terbit',
  ARCHIVED: 'Diarsipkan',
}

/** Urutan alur: DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED. */
export const STATUS_ORDER: ContentStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'ARCHIVED',
]

export const STATUS_OPTIONS: [string, string][] = STATUS_ORDER.map((s) => [s, STATUS_LABEL[s]])

/** Nada badge per status (token warna, bukan warna mentah). */
export const STATUS_TONE: Record<ContentStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_REVIEW: 'bg-warning/15 text-warning-foreground ring-1 ring-warning/40',
  APPROVED: 'bg-primary/10 text-primary ring-1 ring-primary/30',
  REJECTED: 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
  PUBLISHED: 'bg-success/10 text-success ring-1 ring-success/30',
  ARCHIVED: 'bg-muted text-muted-foreground',
}

/**
 * Aksi yang SAH dari status sekarang — cermin tabel transisi backend.
 * Menawarkan aksi di luar daftar ini hanya menghasilkan `400 transisi tidak sah`.
 *
 * | Aksi | Dari |
 * |---|---|
 * | submit | DRAFT, REJECTED |
 * | approve / reject | PENDING_REVIEW |
 * | publish | DRAFT, APPROVED |
 * | unpublish | PUBLISHED |
 */
export const allowedActions = (status: ContentStatus): ProductStatusAction[] => {
  switch (status) {
    case 'DRAFT':
      return ['submit', 'publish']
    case 'REJECTED':
      return ['submit']
    case 'PENDING_REVIEW':
      return ['approve', 'reject']
    case 'APPROVED':
      return ['publish']
    case 'PUBLISHED':
      return ['unpublish']
    default:
      return []
  }
}

export const ACTION_LABEL: Record<ProductStatusAction, string> = {
  submit: 'Ajukan review',
  approve: 'Setujui',
  reject: 'Tolak',
  publish: 'Terbitkan',
  unpublish: 'Tarik dari portal',
}

/** Konfirmasi singkat per aksi — dipakai dialog sebelum mengubah status. */
export const ACTION_DESCRIPTION: Record<ProductStatusAction, string> = {
  submit: 'Produk diajukan untuk ditinjau. Selama review produk tidak bisa diubah.',
  approve: 'Produk disetujui dan siap diterbitkan oleh manajer OPD/Bapenda.',
  reject: 'Produk ditolak dan kembali ke penulis untuk diperbaiki.',
  publish: 'Produk tampil di portal publik Lapak Jambi.',
  unpublish: 'Produk disembunyikan dari portal publik dan bisa diubah kembali.',
}

/** Aksi yang menguntungkan (hijau) vs mengurangi (merah) — untuk tone tombol. */
export const isPositiveAction = (a: ProductStatusAction) => a !== 'reject' && a !== 'unpublish'
