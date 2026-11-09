import type { OrderStatus } from '@/types/lapak'

/** Label, nada, dan opsi filter status pesanan CMS. Urutan = alur pesanan. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: 'Draf',
  MENUNGGU_VERIFIKASI: 'Menunggu verifikasi',
  MENUNGGU_PEMBAYARAN: 'Menunggu pembayaran',
  MENUNGGU_KONFIRMASI: 'Menunggu konfirmasi',
  LUNAS: 'Lunas',
  AKTIF: 'Aktif',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
  DIBATALKAN: 'Dibatalkan',
  KEDALUWARSA: 'Kedaluwarsa',
  REFUND: 'Refund',
}

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  DRAFT: 'border-transparent bg-muted text-muted-foreground',
  MENUNGGU_VERIFIKASI: 'border-transparent bg-warning/15 text-warning-foreground',
  MENUNGGU_PEMBAYARAN: 'border-transparent bg-warning/15 text-warning-foreground',
  MENUNGGU_KONFIRMASI: 'border-transparent bg-warning/15 text-warning-foreground',
  LUNAS: 'border-transparent bg-success/10 text-success',
  AKTIF: 'border-transparent bg-primary/10 text-primary',
  SELESAI: 'border-transparent bg-success/10 text-success',
  DITOLAK: 'border-transparent bg-destructive/10 text-destructive',
  DIBATALKAN: 'border-transparent bg-muted text-muted-foreground',
  KEDALUWARSA: 'border-transparent bg-muted text-muted-foreground',
  REFUND: 'border-transparent bg-muted text-muted-foreground',
}

export const ORDER_STATUS_OPTIONS: [string, string][] = (
  Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]
).map((s) => [s, ORDER_STATUS_LABEL[s]])
