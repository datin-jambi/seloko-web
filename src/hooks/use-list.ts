import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import type { PaginationMeta } from '@/types'

// Core memakai meta.total, modul bapenda meta.totalItems.
type RawMeta = Omit<PaginationMeta, 'total'> & { total?: number; totalItems?: number }
export type SortOrder = 'asc' | 'desc'

// Aman untuk semua endpoint (maks API 100; permissions & menus 200). PRD 03 §4a.
export const PAGE_SIZES = [10, 20, 50, 100]
// Limit awal semua daftar. Selalu dikirim, karena default API beda-beda (10/20/50). PRD 03 §4a.
export const DEFAULT_LIMIT = '10'

const NONE: Record<string, string> = {}

/**
 * Data halaman daftar. Aturan: PRD 03 §4a.
 * State list (page, search, filter, sortBy/sortOrder) = query string URL → refresh,
 * back, dan bagikan tautan tetap di posisi yang sama. Semua param URL diteruskan ke API.
 * `fixed` = param yang selalu dikirim dan tidak bisa diubah user (mis. status antrian review).
 */
export function useList<T>(path: string, fixed: Record<string, string> = NONE) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params: Record<string, string> = { limit: DEFAULT_LIMIT, ...Object.fromEntries(searchParams), ...fixed }

  const query = useQuery({
    queryKey: [path, params],
    queryFn: async () => {
      const res = await apiClient.get<{ data: T[]; meta?: RawMeta }>(path, { params })
      const m = res.data.meta
      const meta: PaginationMeta | undefined = m && { ...m, total: m.total ?? m.totalItems ?? 0 }
      return { rows: res.data.data, meta }
    },
    placeholderData: keepPreviousData,
  })

  // Nilai kosong menghapus param. Perubahan apa pun selain page kembali ke halaman 1.
  const update = (patch: Record<string, string | undefined>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        if (!('page' in patch) || patch.page === '1') next.delete('page')
        // Limit default tidak ditulis ke URL, sama seperti page 1.
        if (next.get('limit') === DEFAULT_LIMIT) next.delete('limit')
        return next
      },
      { replace: true },
    )

  const sortBy = params.sortBy
  const sortOrder = params.sortOrder as SortOrder | undefined

  return {
    rows: query.data?.rows,
    meta: query.data?.meta,
    isLoading: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    params,
    setPage: (page: number) => update({ page: String(page) }),
    setLimit: (limit: number) => update({ limit: String(limit) }),
    setSearch: (search: string) => update({ search }),
    setFilter: (key: string, value?: string) => update({ [key]: value }),
    /** Beberapa param sekaligus — mis. ganti filter aplikasi sambil mengosongkan induk. */
    setParams: update,
    reset: () => setSearchParams({}, { replace: true }),
    sort: { by: sortBy, order: sortOrder },
    toggleSort: (key: string) =>
      update({ sortBy: key, sortOrder: sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc' }),
  }
}

export type ListState<T> = ReturnType<typeof useList<T>>
