import { lapakGet, lapakGetPage, lapakWrite } from './lapak-client'
import type { CreateRateBody, LapakRateDetail, RateAction, RateStatusBody, UpdateRateBody } from '@/types/lapak'

/**
 * Tarif Produk — `/api/lapak/rates` (8 endpoint).
 *
 * Aturan penting yang perlu diketahui UI:
 * - `PUT` hanya untuk tarif **belum disetujui**; `APPROVED`/`PUBLISHED` ditolak
 *   `409` dan harus lewat `revise` (membuat baris BARU berstatus
 *   `PENDING_REVIEW`; baris lama tetap aktif sampai revisi disetujui).
 * - `reject` **wajib** menyertakan `note`.
 * - `deactivate` menolak `409` bila itu satu-satunya tarif aktif — produk tidak
 *   boleh tanpa harga.
 */
export const lapakRateService = {
  /** Daftar tarif dalam lingkup OPD; filter `productId`/`status`. */
  list: (params: Record<string, string>) => lapakGetPage<LapakRateDetail>('/lapak/rates', params),

  get: (id: string) => lapakGet<LapakRateDetail>(`/lapak/rates/${id}`),

  /** Status awal mengikuti produk: `DRAFT` bila produk draf, `PENDING_REVIEW` bila sudah terbit. */
  create: (productId: string, body: CreateRateBody) =>
    lapakWrite<LapakRateDetail>('post', `/lapak/rates/product/${productId}`, body),

  update: (id: string, body: UpdateRateBody) =>
    lapakWrite<LapakRateDetail>('put', `/lapak/rates/${id}`, body),

  /** Revisi tarif yang sudah disetujui → baris baru `PENDING_REVIEW`. */
  revise: (id: string, body: UpdateRateBody) =>
    lapakWrite<LapakRateDetail>('post', `/lapak/rates/${id}/revise`, body),

  setStatus: (id: string, action: RateAction, body: RateStatusBody = {}) =>
    lapakWrite<LapakRateDetail>('patch', `/lapak/rates/${id}/status/${action}`, body),

  deactivate: (id: string) => lapakWrite<LapakRateDetail>('patch', `/lapak/rates/${id}/deactivate`),

  remove: (id: string) => lapakWrite<{ id: string; deleted: true }>('delete', `/lapak/rates/${id}`),
}
