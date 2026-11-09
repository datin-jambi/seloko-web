import { useLapakList } from '../use-lapak-list'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect } from '@/components/shared/SearchBar'
import { Badge } from '@/components/ui/badge'
import { formatRupiah } from '../products/format-rupiah'
import { ORDER_STATUS_LABEL, ORDER_STATUS_OPTIONS, ORDER_STATUS_TONE } from './order-status'
import type { LapakOrder } from '@/types/lapak'

/**
 * Pesanan — `/lapak-jambi/pesanan`. Daftar CMS, tersaring lingkup OPD oleh server.
 * Pemohon sudah dimasking di server; halaman ini tidak pernah menerima NIK/telepon utuh.
 */
export function LapakOrdersPage() {
  const list = useLapakList<LapakOrder>('/lapak/orders')
  const { params, setFilter } = list

  const columns: Column<LapakOrder>[] = [
    {
      header: 'Kode',
      cell: (o) => (
        <div className="min-w-0">
          <span className="font-mono text-sm font-medium">{o.code}</span>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {o.applicant.name}
            {o.organization.name ? ` · ${o.organization.name}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Item',
      cell: (o) => (
        <span className="text-sm text-muted-foreground">
          {o.items.length} item
          {o.items[0] ? ` · ${o.items[0].productName}` : ''}
        </span>
      ),
    },
    {
      header: 'Total',
      cell: (o) => <span className="tabular-nums">{formatRupiah(o.total)}</span>,
    },
    {
      header: 'SKRD',
      cell: (o) => (o.skrd ? <span className="font-mono text-xs">{o.skrd.number}</span> : <span className="text-muted-foreground">—</span>),
    },
    {
      header: 'Status',
      cell: (o) => (
        <Badge variant="outline" className={ORDER_STATUS_TONE[o.status]}>
          {ORDER_STATUS_LABEL[o.status]}
        </Badge>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Pesanan" description="Pesanan warga atas aset daerah. Data pemohon ditampilkan termasking." />

      <DataTable
        list={list}
        columns={columns}
        rowKey={(o) => o.id}
        emptyTitle={params.status ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan'}
        toolbar={
          <FilterSelect
            label="Status"
            value={params.status}
            options={ORDER_STATUS_OPTIONS}
            onChange={(v) => setFilter('status', v)}
          />
        }
      />
    </>
  )
}
