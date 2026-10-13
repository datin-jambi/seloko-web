import type { ReactNode } from 'react'
import type { AxiosError } from 'axios'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import type { PaginationMeta } from '@/types'
import { cn } from '@/lib/utils'

// Teks panjang di sel: dipotong, isi lengkap di tooltip. Sel tabel tidak turun baris.
export function Truncate({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return <>—</>
  return (
    <span title={text} className={cn('block max-w-xs truncate', className)}>
      {text}
    </span>
  )
}

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  isLoading: boolean
  error: unknown
  onRetry: () => void
  meta?: PaginationMeta
  onPageChange?: (page: number) => void
  emptyTitle?: string
  toolbar?: ReactNode
}

// Tabel daftar standar: skeleton, kosong, gagal, pagination. PRD 02 §7.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  onRetry,
  meta,
  onPageChange,
  emptyTitle = 'Belum ada data',
  toolbar,
}: DataTableProps<T>) {
  if (error) {
    const e = error as AxiosError<{ message?: string }>
    return (
      <ErrorState
        message={e.response?.data?.message ?? e.message}
        onRetry={onRetry}
      />
    )
  }

  return (
    <div className="space-y-3">
      {toolbar}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.header}
                  className={cn('h-10 px-3 text-left text-xs font-medium text-muted-foreground', c.className)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.header} className="h-11 px-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr key={rowKey(row)} className="transition-colors hover:bg-muted/50">
                    {columns.map((c) => (
                      <td key={c.header} className={cn('h-11 whitespace-nowrap px-3 align-middle', c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && rows?.length === 0 && (
          <div className="border-t border-border">
            <EmptyState title={emptyTitle} description="Data akan muncul di sini setelah ditambahkan." />
          </div>
        )}
      </div>

      {meta && onPageChange && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="tabular-nums">
            {meta.total} data · halaman {meta.page} dari {meta.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman sebelumnya"
              disabled={!meta.hasPreviousPage}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman berikutnya"
              disabled={!meta.hasNextPage}
              onClick={() => onPageChange(meta.page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
