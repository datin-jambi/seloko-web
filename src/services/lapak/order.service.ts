import { lapakGetPage } from './lapak-client'
import type { LapakOrder } from '@/types/lapak'

/**
 * Pesanan — `/api/lapak/orders` (LJ-2.4).
 *
 * CMS hanya punya daftar (`GET /`, izin `order:read`, tersaring lingkup OPD).
 * Quote, checkout, detail, dan `mine` untuk warga di aplikasi publik, bukan di sini.
 */
export const lapakOrderService = {
  list: (params: Record<string, string>) => lapakGetPage<LapakOrder>('/lapak/orders', params),
}
