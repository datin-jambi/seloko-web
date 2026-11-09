import { lapakGet, lapakWrite } from './lapak-client'
import type { CreateBlackoutBody, LapakBlackout, LapakOperatingHour, ReplaceHoursBody } from '@/types/lapak'

/**
 * Jadwal produk — `/api/lapak/availability` (6 endpoint, LJ-2.1).
 *
 * - `PUT hours` adalah replace-set: seluruh jadwal mingguan dikirim sekaligus.
 *   Hari tanpa baris = tutup (tidak ada kolom isOpen).
 * - `closeTime` < `openTime` = lintas tengah malam (server tidak menolaknya).
 * - Blackout berupa rentang tanggal inklusif; hapus bersifat hard delete.
 */
export const lapakAvailabilityService = {
  hours: (productId: string) =>
    lapakGet<LapakOperatingHour[]>(`/lapak/availability/product/${productId}/hours`),

  replaceHours: (productId: string, body: ReplaceHoursBody) =>
    lapakWrite<LapakOperatingHour[]>('put', `/lapak/availability/product/${productId}/hours`, body),

  blackouts: (productId: string) =>
    lapakGet<LapakBlackout[]>(`/lapak/availability/product/${productId}/blackouts`),

  addBlackout: (productId: string, body: CreateBlackoutBody) =>
    lapakWrite<LapakBlackout>('post', `/lapak/availability/product/${productId}/blackouts`, body),

  removeBlackout: (productId: string, id: string) =>
    lapakWrite<{ id: string; deleted: true }>('delete', `/lapak/availability/product/${productId}/blackouts/${id}`),
}
