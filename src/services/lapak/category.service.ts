import { lapakGet, lapakGetPage, lapakWrite } from './lapak-client'
import type {
  CreateLapakCategoryBody,
  LapakCategory,
  PublicLapakCategory,
  UpdateLapakCategoryBody,
} from '@/types/lapak'

/**
 * Kategori Layanan Lapak — `/api/lapak/categories` (9 endpoint).
 * Dikelola Bapenda; admin OPD hanya memilih. Izin `category:*` milik aplikasi
 * `lapak-jambi-web`, tetapi request tetap lewat gateway `seloko` (lihat
 * `lapak-client.ts` — header TIDAK ditimpa).
 */
export const lapakCategoryService = {
  /** Publik, tanpa paginasi (8 kategori), hanya `isActive`. */
  publicList: (search?: string) =>
    lapakGet<PublicLapakCategory[]>('/lapak/categories/public', search ? { search } : undefined),

  publicBySlug: (slug: string) =>
    lapakGet<PublicLapakCategory>(`/lapak/categories/public/${slug}`),

  /** CMS berpaginasi. Filter/sort diteruskan apa adanya dari query string. */
  list: (params: Record<string, string>) => lapakGetPage<LapakCategory>('/lapak/categories', params),

  get: (id: string) => lapakGet<LapakCategory>(`/lapak/categories/${id}`),

  create: (body: CreateLapakCategoryBody) => lapakWrite<LapakCategory>('post', '/lapak/categories', body),

  update: (id: string, body: UpdateLapakCategoryBody) =>
    lapakWrite<LapakCategory>('put', `/lapak/categories/${id}`, body),

  /** Urutkan ulang massal; `items` minimal 1 dan semua milik aplikasi ini. */
  reorder: (items: { id: string; sortOrder: number }[]) =>
    lapakWrite<{ updated: number }>('patch', '/lapak/categories/reorder', { items }),

  setActive: (id: string, isActive: boolean) =>
    lapakWrite<LapakCategory>('patch', `/lapak/categories/${id}/active`, { isActive }),

  /** Soft-delete + `isActive: false`. */
  remove: (id: string) => lapakWrite<{ id: string; deleted: true }>('delete', `/lapak/categories/${id}`),
}
