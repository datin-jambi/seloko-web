import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { lapakReportService } from '@/services/lapak/report.service'
import { apiErrorMessage, formatDateTime } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import { ORDER_STATUS_LABEL, ORDER_STATUS_OPTIONS, ORDER_STATUS_TONE } from '../orders/order-status'
import { formatRupiah } from '../products/format-rupiah'
import type { LapakTransactionRow, LapakTransactionSummary } from '@/types/lapak'

const SORT_OPTIONS: [string, string][] = [
  ['NEWEST', 'Terbaru'],
  ['OLDEST', 'Terlama'],
  ['HIGHEST', 'Nominal tertinggi'],
  ['LOWEST', 'Nominal terendah'],
]

/**
 * Laporan transaksi — `/lapak-jambi/laporan`. Audit & pelaporan, bukan operasional.
 * Ringkasan dihitung dari seluruh hasil filter, bukan halaman yang tampil.
 * Unduh CSV memakai izin `report:export`, terpisah dari `report:read`.
 */
export function LapakReportsPage() {
  const access = useLapakAccess()
  const list = useLapakList<LapakTransactionRow, LapakTransactionSummary>('/lapak/reports/transactions')
  const [exporting, setExporting] = useState(false)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const blob = await lapakReportService.exportCsv(list.params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transaksi-lapak-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Gagal mengunduh CSV', { description: apiErrorMessage(e) })
    } finally {
      setExporting(false)
    }
  }

  const summary = list.summary

  return (
    <>
      <PageHeader
        title="Laporan & Analitik"
        description="Transaksi lintas OPD untuk audit. Pemohon ditampilkan termasking."
        actions={
          access.canExportReport ? (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              <Download />
              Unduh CSV
            </Button>
          ) : null
        }
      />

      {summary && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total nilai</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatRupiah(summary.totalAmount)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Jumlah pesanan</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{summary.totalOrders}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Komposisi status</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {summary.byStatus.map((s) => (
                <Badge key={s.status} variant="outline" className={ORDER_STATUS_TONE[s.status]}>
                  {ORDER_STATUS_LABEL[s.status]} · {s.count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <DataTable
        list={list}
        columns={[
          {
            header: 'Pesanan',
            cell: (r) => (
              <div className="min-w-0">
                <span className="font-mono text-sm font-medium">{r.code}</span>
                <div className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</div>
              </div>
            ),
          },
          { header: 'OPD', cell: (r) => <span className="text-sm">{r.organizationName}</span> },
          { header: 'Nominal', cell: (r) => <span className="tabular-nums">{formatRupiah(r.amount)}</span> },
          {
            header: 'SKRD',
            cell: (r) =>
              r.skrdNumber ? <span className="font-mono text-xs">{r.skrdNumber}</span> : <span>—</span>,
          },
          {
            header: 'Status',
            cell: (r) => (
              <Badge variant="outline" className={ORDER_STATUS_TONE[r.status]}>
                {ORDER_STATUS_LABEL[r.status]}
              </Badge>
            ),
          },
        ]}
        rowKey={(r) => r.orderId}
        emptyTitle="Tidak ada transaksi"
        toolbar={
          <>
            <SearchBar
              value={list.params.q}
              onSearch={(v) => list.setFilter('q', v)}
              placeholder="Cari kode pesanan"
            />
            <FilterSelect
              label="Status"
              value={list.params.status}
              options={ORDER_STATUS_OPTIONS}
              onChange={(v) => list.setFilter('status', v)}
            />
            <FilterSelect
              label="Urutkan"
              value={list.params.sort}
              options={SORT_OPTIONS}
              onChange={(v) => list.setFilter('sort', v)}
            />
            <Input
              type="date"
              aria-label="Dari tanggal"
              className="h-9 w-auto"
              value={list.params.from ?? ''}
              onChange={(e) => list.setFilter('from', e.target.value || undefined)}
            />
            <Input
              type="date"
              aria-label="Sampai tanggal"
              className="h-9 w-auto"
              value={list.params.to ?? ''}
              onChange={(e) => list.setFilter('to', e.target.value || undefined)}
            />
          </>
        }
      />
    </>
  )
}
