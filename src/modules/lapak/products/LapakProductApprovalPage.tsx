import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Eye, Upload, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { IconAction } from '@/components/shared/IconAction'
import { RowActions } from '@/components/shared/RowActions'
import { lapakProductService } from '@/services/lapak/product.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, formatDateTime } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import { PRICING_UNIT_LABEL } from '../categories/category-labels'
import type { LapakProduct } from '@/types/lapak'
import { LAPAK_PRODUCT_DETAIL, ProductLink } from './ProductBadges'
import { formatRupiah, startingPrice } from './format-rupiah'

/** Hanya dua keputusan yang sah dari PENDING_REVIEW (lihat TRANSITIONS backend). */
type Decision = 'approve' | 'reject'

/**
 * Persetujuan Produk — `/lapak-jambi/produk/persetujuan`.
 *
 * Antrean produk berstatus `PENDING_REVIEW` milik lingkup OPD pemanggil
 * (server yang menyaring). Izin diputuskan per aksi:
 * `product:approve` untuk menyetujui, `product:reject` untuk menolak —
 * keduanya hanya sah dari status ini, jadi transisi lain tidak ditawarkan.
 */
export function LapakProductApprovalPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const access = useLapakAccess()
  // `status` dikunci; `hidden` mencegah DataTable mengira daftar sedang difilter
  // lalu menampilkan tombol Reset yang tidak mengubah apa pun.
  const list = useLapakList<LapakProduct>('/lapak/products', { status: 'PENDING_REVIEW' }, ['status'])
  const { params, setSearch, setFilter } = list
  const [pending, setPending] = useState<{ product: LapakProduct; action: Decision } | null>(null)

  // Pilihan filter OPD — hanya berguna bagi Bapenda/superadmin yang melihat semua OPD.
  const opds = useQuery({
    queryKey: [...lapakKeys.opd, 'pilihan'],
    queryFn: () => lapakProductService.organizationChoices(),
    staleTime: 5 * 60_000,
  })

  const decide = useMutation({
    mutationFn: (x: { product: LapakProduct; action: Decision }) =>
      lapakProductService.setStatus(x.product.id, x.action),
    onSuccess: (p, x) => {
      toast.success(x.action === 'approve' ? `${p.name} disetujui` : `${p.name} ditolak`, {
        description:
          x.action === 'approve'
            ? 'Produk siap diterbitkan oleh manajer OPD/Bapenda.'
            : 'Produk kembali ke penulis untuk diperbaiki.',
      })
      // Daftar & detail ikut tersegarkan (prefix ['lapak','products']).
      void qc.invalidateQueries({ queryKey: lapakKeys.products })
      setPending(null)
    },
    onError: (e) => {
      toast.error('Gagal memproses produk', { description: apiErrorMessage(e) })
      setPending(null)
    },
  })

  const canDecide = access.canApproveProduct || access.canRejectProduct
  const total = list.meta?.total

  const columns: Column<LapakProduct>[] = [
    {
      header: 'Produk',
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          {p.coverUrl ? (
            <img
              src={p.coverUrl}
              alt=""
              loading="lazy"
              className="size-9 shrink-0 rounded-md border border-border bg-muted object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-input bg-muted/50 text-muted-foreground"
            >
              <Upload className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <ProductLink id={p.id} name={p.name} />
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {p.category.name}
              {p.organization?.name ? ` · ${p.organization.name}` : ''} · {p.images.length} gambar
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Harga mulai',
      cell: (p) => {
        const price = startingPrice(p)
        return (
          <span className="tabular-nums">
            {formatRupiah(price)}
            {price != null && (
              <span className="ml-1 text-xs text-muted-foreground">
                /{PRICING_UNIT_LABEL[p.pricingUnit].toLowerCase()}
              </span>
            )}
          </span>
        )
      },
    },
    { header: 'Tarif', cell: (p) => <span className="tabular-nums">{p.rates.length}</span> },
    { header: 'Diajukan', cell: (p) => <span className="text-muted-foreground">{formatDateTime(p.updatedAt)}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Persetujuan Produk"
        description={
          total != null
            ? `${total} produk menunggu review dari OPD.`
            : 'Antrean produk yang menunggu review sebelum bisa diterbitkan.'
        }
      />

      {!access.isLoading && !canDecide && (
        <p className="mb-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Anda dapat melihat antrean ini, tetapi butuh izin{' '}
          <span className="font-mono">product:approve</span> / <span className="font-mono">product:reject</span>{' '}
          untuk memutuskan.
        </p>
      )}

      <DataTable
        list={list}
        columns={columns}
        rowKey={(p) => p.id}
        emptyTitle="Tidak ada produk menunggu review"
        emptyDescription="Produk yang diajukan OPD akan muncul di sini untuk diputuskan."
        onRowClick={(p) => navigate(LAPAK_PRODUCT_DETAIL(p.id))}
        actions={(p) => (
          <>
            <div className="hidden items-center gap-1 sm:flex">
              {access.canApproveProduct && (
                <IconAction
                  icon={Check}
                  tone="success"
                  label={`Setujui ${p.name}`}
                  disabled={decide.isPending}
                  onClick={() => setPending({ product: p, action: 'approve' })}
                />
              )}
              {access.canRejectProduct && (
                <IconAction
                  icon={X}
                  tone="destructive"
                  label={`Tolak ${p.name}`}
                  disabled={decide.isPending}
                  onClick={() => setPending({ product: p, action: 'reject' })}
                />
              )}
              <IconAction icon={Eye} label={`Lihat detail ${p.name}`} to={LAPAK_PRODUCT_DETAIL(p.id)} />
            </div>
            <div className="sm:hidden">
              <RowActions
                label={`Produk ${p.name}`}
                actions={[
                  {
                    label: 'Setujui',
                    icon: Check,
                    show: access.canApproveProduct,
                    onSelect: () => setPending({ product: p, action: 'approve' }),
                  },
                  {
                    label: 'Tolak',
                    icon: X,
                    destructive: true,
                    show: access.canRejectProduct,
                    onSelect: () => setPending({ product: p, action: 'reject' }),
                  },
                  { label: 'Lihat detail', icon: Eye, onSelect: () => navigate(LAPAK_PRODUCT_DETAIL(p.id)) },
                ]}
              />
            </div>
          </>
        )}
        toolbar={
          <>
            <SearchBar
              value={params.search}
              onSearch={setSearch}
              placeholder="Cari nama produk"
            />
            <FilterSelect
              label="OPD"
              value={params.organizationId}
              options={(opds.data ?? []).map((o) => [o.id, o.name] as [string, string])}
              onChange={(v) => setFilter('organizationId', v)}
            />
          </>
        }
      />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={decide.isPending}
        {...(pending?.action === 'approve'
          ? {
              title: `Setujui ${pending.product.name}?`,
              description:
                'Produk disetujui dan siap diterbitkan oleh manajer OPD/Bapenda. Setelah disetujui, penulis tidak bisa mengubahnya lagi.',
              confirmLabel: 'Setujui',
              onConfirm: () => decide.mutate(pending),
            }
          : {
              title: `Tolak ${pending?.product.name ?? ''}?`,
              description:
                'Produk ditolak dan kembali ke penulis untuk diperbaiki. Alasan penolakan belum bisa dicatat — API belum menerima catatan pada transisi ini.',
              confirmLabel: 'Tolak',
              destructive: true,
              onConfirm: () => pending && decide.mutate(pending),
            })}
      />
    </>
  )
}
