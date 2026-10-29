import { lapakGet, lapakGetPage, lapakWrite } from './lapak-client'
import { lapakOpdService } from '@/services/lapak-opd.service'
import type {
  CreateLapakProductBody,
  LapakProduct,
  ProductStatusAction,
  PublicLapakProduct,
  UpdateLapakProductBody,
} from '@/types/lapak'

/**
 * Produk / Aset Katalog — `/api/lapak/products` (8 endpoint).
 *
 * Hasil daftar **otomatis tersaring lingkup OPD** oleh server
 * (`user_app_role_organizations`): Bapenda/superadmin melihat semua OPD,
 * admin-opd hanya OPD-nya, dan menyentuh produk OPD lain → `403`.
 */
export const lapakProductService = {
  /** Publik — hanya `PUBLISHED`, `startingPrice` = tarif aktif termurah. */
  publicList: (params: Record<string, string>) =>
    lapakGetPage<PublicLapakProduct>('/lapak/products/public', params),

  publicBySlug: (slug: string) => lapakGet<LapakProduct>(`/lapak/products/public/${slug}`),

  list: (params: Record<string, string>) => lapakGetPage<LapakProduct>('/lapak/products', params),

  get: (id: string) => lapakGet<LapakProduct>(`/lapak/products/${id}`),

  create: (body: CreateLapakProductBody) => lapakWrite<LapakProduct>('post', '/lapak/products', body),

  update: (id: string, body: UpdateLapakProductBody) =>
    lapakWrite<LapakProduct>('put', `/lapak/products/${id}`, body),

  /**
   * Alur persetujuan. Izin diperiksa di service sesuai aksi:
   * `submit` cukup `product:read` (penulis), `approve`/`reject` butuh
   * `product:approve|reject`, `publish`/`unpublish` butuh `product:publish`.
   */
  setStatus: (id: string, action: ProductStatusAction) =>
    lapakWrite<LapakProduct>('patch', `/lapak/products/${id}/status/${action}`),

  /** Soft-delete. Produk `PUBLISHED` ditolak `409` — unpublish dahulu. */
  remove: (id: string) => lapakWrite<{ id: string; deleted: true }>('delete', `/lapak/products/${id}`),

  /**
   * Pilihan OPD untuk form. Memakai daftar OPD Lapak (bukan `/organizations`)
   * karena gerbang izinnya sama-sama aplikasi Lapak.
   */
  organizationChoices: () => lapakOpdService.list(),
}
