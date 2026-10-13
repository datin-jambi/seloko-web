import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { PaginationMeta } from '@/types'

// Core memakai meta.total, modul bapenda meta.totalItems.
type RawMeta = Omit<PaginationMeta, 'total'> & { total?: number; totalItems?: number }

// Data halaman daftar: GET <path>?page=&search=&...filters. Lihat PRD 03 §6.
export function useList<T>(path: string, filters: Record<string, string> = {}) {
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')

  const query = useQuery({
    queryKey: [path, filters, page, search],
    queryFn: async () => {
      const res = await apiClient.get<{ data: T[]; meta?: RawMeta }>(path, {
        params: { ...filters, page, search: search || undefined },
      })
      const m = res.data.meta
      const meta: PaginationMeta | undefined = m && { ...m, total: m.total ?? m.totalItems ?? 0 }
      return { rows: res.data.data, meta }
    },
    placeholderData: keepPreviousData,
  })

  return {
    rows: query.data?.rows,
    meta: query.data?.meta,
    isLoading: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    setPage,
    setSearch: (value: string) => {
      setSearchValue(value)
      setPage(1)
    },
  }
}
