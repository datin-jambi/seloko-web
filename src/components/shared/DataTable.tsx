import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PAGE_SIZES, type ListState } from '@/hooks/use-list'
import { apiErrorMessage, cn } from '@/lib/utils'

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
  /** Nilai `sortBy` API. Isi hanya bila endpoint mendukung sortBy (modul bapenda). */
  sortKey?: string
}

interface DataTableProps<T> {
  list: ListState<T>
  columns: Column<T>[]
  rowKey: (row: T) => string
  emptyTitle?: string
  /** SearchBar / FilterSelect. Tombol Reset ditambahkan otomatis saat ada search/filter aktif. */
  toolbar?: ReactNode
  /** Kolom aksi di kanan (mis. RowActions). Tidak dirender bila tidak diisi. */
  actions?: (row: T) => ReactNode
  /** Klik baris (mis. buka detail). Elemen interaktif di dalam sel tidak memicu ini. */
  onRowClick?: (row: T) => void
}

// Param yang bukan filter — tidak menyalakan tombol Reset / "Tidak ada hasil".
const NOT_FILTER = ['page', 'limit', 'sortBy', 'sortOrder']

// Tabel daftar standar: toolbar + reset, skeleton, kosong, gagal, urut, aksi, pagination. PRD 03 §4a.
export function DataTable<T>({
  list,
  columns,
  rowKey,
  emptyTitle = 'Belum ada data',
  toolbar,
  actions,
  onRowClick,
}: DataTableProps<T>) {
  const { rows, meta, isLoading, error, sort } = list
  const filtered = Object.keys(list.params).some((k) => !NOT_FILTER.includes(k))
  const colCount = columns.length + (actions ? 1 : 0)

  return (
    <div className="space-y-3">
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {filtered && (
            <Button variant="outline" onClick={list.reset}>
              <RotateCcw />
              Reset
            </Button>
          )}
        </div>
      )}

      {error ? (
        <ErrorState message={apiErrorMessage(error)} onRetry={list.refetch} />
      ) : (
        // relative: wadah posisi untuk elemen absolute di dalam tabel (label sr-only). Tanpanya
        // label itu diposisikan terhadap halaman dan membuat seluruh halaman melebar di mobile.
        <div className="relative overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-table-head">
              <tr className="border-b-2 border-input">
                {columns.map((c) => {
                  const active = c.sortKey && sort.by === c.sortKey
                  const SortIcon = !active ? ArrowUpDown : sort.order === 'desc' ? ArrowDown : ArrowUp
                  return (
                    <th
                      key={c.header}
                      scope="col"
                      aria-sort={active ? (sort.order === 'desc' ? 'descending' : 'ascending') : undefined}
                      className={cn(
                        'h-10 whitespace-nowrap px-3 text-left text-xs font-semibold text-foreground',
                        c.className,
                      )}
                    >
                      {c.sortKey ? (
                        <button
                          type="button"
                          onClick={() => list.toggleSort(c.sortKey!)}
                          className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {c.header}
                          <SortIcon className={cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  )
                })}
                {actions && (
                  <th scope="col" className="h-10 w-12 px-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      {Array.from({ length: colCount }, (_, j) => (
                        <td key={j} className="h-11 px-3">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows?.map((row) => (
                    <tr
                      key={rowKey(row)}
                      onClick={
                        onRowClick &&
                        ((e) => {
                          // Klik pada tombol/tautan/menu di dalam baris bukan klik baris.
                          if (!(e.target as HTMLElement).closest('button, a, [role=menuitem]')) onRowClick(row)
                        })
                      }
                      // group/row: sel bisa bereaksi saat baris di-hover (mis. nama digarisbawahi).
                      className={cn('group/row transition-colors hover:bg-muted/50', onRowClick && 'cursor-pointer')}
                    >
                      {columns.map((c) => (
                        <td key={c.header} className={cn('h-11 whitespace-nowrap px-3 align-middle', c.className)}>
                          {c.cell(row)}
                        </td>
                      ))}
                      {actions && <td className="h-11 px-2 text-right align-middle">{actions(row)}</td>}
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && rows?.length === 0 && (
            <div className="border-t border-border">
              <EmptyState
                bare
                actionLabel={filtered ? 'Reset filter' : undefined}
                onAction={list.reset}
                title={filtered ? 'Tidak ada hasil' : emptyTitle}
                description={
                  filtered ? 'Ubah kata kunci atau filter.' : 'Data akan muncul di sini setelah ditambahkan.'
                }
              />
            </div>
          )}
        </div>
      )}

      {meta && meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <Select value={String(meta.limit)} onValueChange={(v) => list.setLimit(Number(v))}>
              <SelectTrigger aria-label="Jumlah data per halaman" className="h-8 w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Sertakan limit default endpoint (mis. 50) meski tidak ada di daftar. */}
                {[...new Set([...PAGE_SIZES, meta.limit])].sort((a, b) => a - b).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="tabular-nums">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 tabular-nums">
              Halaman {meta.page} / {Math.max(meta.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman sebelumnya"
              disabled={!meta.hasPreviousPage}
              onClick={() => list.setPage(meta.page - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman berikutnya"
              disabled={!meta.hasNextPage}
              onClick={() => list.setPage(meta.page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
