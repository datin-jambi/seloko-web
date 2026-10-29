import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { lapakGetPage } from '@/services/lapak/lapak-client'
import { DEFAULT_LIMIT } from '@/hooks/use-list'
import type { PaginationMeta } from '@/types'
import type { LapakMeta } from '@/services/lapak/lapak-client'

type ListApi<T> = ReturnType<typeof useLapakList<T>>

/**
 * `useList` untuk endpoint **Lapak**.
 *
 * Kenapa tidak memakai `useList` Core: envelope-nya beda. Lapak membalas
 * `{ statusCode, code, message, data, meta }` dengan `meta.totalItems`,
 * sedangkan `useList` membaca `res.data.data` + `meta.total`. Akibatnya
 * `meta` selalu kosong dan paginasi hilang.
 *
 * Perilaku lain SAMA dengan `useList` dan sengaja tidak diduplikasi logikanya:
 * state list (page/search/filter/sort) hidup di query string URL supaya
 * refresh/back/bagikan tautan tetap di posisi yang sama, dan perubahan apa pun
 * selain `page` kembali ke halaman 1. `DataTable` hanya butuh bentuk
 * `ListState`, jadi keduanya bisa dipertukarkan.
 */
export function useLapakList<T>(path: string, fixed: Record<string, string> = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params: Record<string, string> = { limit: DEFAULT_LIMIT, ...Object.fromEntries(searchParams), ...fixed }

  const query = useQuery({
    queryKey: ['lapak-list', path, params],
    queryFn: async () => {
      const { rows, meta: m } = await lapakGetPage<T>(path, params)
      const meta: PaginationMeta | undefined = m && {
        page: m.page,
        limit: m.limit,
        total: m.totalItems,
        totalPages: m.totalPages,
        hasNextPage: m.hasNextPage,
        hasPreviousPage: m.hasPreviousPage,
      }
      // `meta` boleh tidak ada pada endpoint tak berpaginasi — `rows` tetap
      // dikembalikan, jadi tabel tidak kosong.
      return { rows, meta }
    },
    placeholderData: keepPreviousData,
  })

  const update = (patch: Record<string, string | undefined>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        if (!('page' in patch) || patch.page === '1') next.delete('page')
        if (next.get('limit') === DEFAULT_LIMIT) next.delete('limit')
        return next
      },
      { replace: true },
    )

  const sortBy = params.sortBy
  const sortOrder = params.sortOrder as 'asc' | 'desc' | undefined

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
    setParams: update,
    reset: () => setSearchParams({}, { replace: true }),
    sort: { by: sortBy, order: sortOrder },
    toggleSort: (key: string) =>
      update({ sortBy: key, sortOrder: sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc' }),
  }
}

export type LapakListState<T> = ListApi<T>
export type { LapakMeta }
