import { apiClient } from '@/lib/api-client'

/**
 * Lapisan data modul Lapak Jambi.
 *
 * ── Header: TETAP `seloko` ────────────────────────────────────────────────────
 * Rute Lapak di backend memang dirancang untuk gateway. Buktinya di
 * `../seloko-api/src/modules/lapak/categories/categories.routes.ts`:
 * `// ── 2. Endpoint CMS (seloko, Bapenda saja) ──`, dan guard-nya
 * `requirePermission("category:list", { app: LAPAK })` — `app: LAPAK` di situ
 * adalah **sumber IZIN**, bukan nilai header.
 *
 * Konsekuensinya: JANGAN menimpa `X-App-Code` menjadi `lapak-jambi-web`.
 * `authenticate` membandingkan `payload.appCode` (token) dengan
 * `request.appCode` (header), jadi header yang berbeda membuat SEMUA request
 * gagal `403 Token was issued for app "seloko" but request targets
 * "lapak-jambi-web"`. Biarkan interceptor memasang `seloko`.
 *
 * Endpoint publik (segmen akhir `public`) hanya mewajibkan header itu ADA — nilainya
 * `seloko` atau `lapak-jambi-web` sama-sama `200`, tanpa header `400`.
 *
 * ── Envelope ─────────────────────────────────────────────────────────────────
 * `{ statusCode, code, message, data, meta? }` — BEDA dari Core
 * (`{ success, message, data, meta? }`). `apiClient` tidak melakukan unwrap,
 * jadi helper di bawah mengambil `res.data.data` sendiri.
 */

export interface LapakResponse<T> {
  statusCode: number
  code: string
  message: string
  data: T
  meta?: LapakMeta
}

/**
 * Meta paginasi Lapak. Totalnya bernama `totalItems`, sedangkan Core memakai
 * `total` (lihat `use-lapak-list` yang menormalkan keduanya).
 */
export interface LapakMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** GET yang `data`-nya langsung dikembalikan. */
export async function lapakGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<LapakResponse<T>>(url, { params })
  return res.data.data
}

/** GET berpaginasi — mengembalikan `rows` + `meta` apa adanya. */
export async function lapakGetPage<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<{ rows: T[]; meta?: LapakMeta }> {
  const res = await apiClient.get<LapakResponse<T[]>>(url, { params })
  return { rows: res.data.data, meta: res.data.meta }
}

/** POST/PUT/PATCH/DELETE. */
export async function lapakWrite<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await apiClient.request<LapakResponse<T>>({ method, url, data: body })
  return res.data.data
}
