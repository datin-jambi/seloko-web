import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Eye, Pencil, Plus, Send, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { IconAction } from '@/components/shared/IconAction'
import { RowActions } from '@/components/shared/RowActions'
import { lapakProductService } from '@/services/lapak/product.service'
import { lapakCategoryService } from '@/services/lapak/category.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import { PRICING_UNIT_LABEL } from '../categories/category-labels'
import type { LapakProduct, ProductStatusAction } from '@/types/lapak'
import { ProductFormDialog } from './ProductFormDialog'
import { ProductLink, StatusBadge } from './ProductBadges'
import { formatRupiah } from './format-rupiah'
import {
  ACTION_DESCRIPTION,
  ACTION_LABEL,
  STATUS_OPTIONS,
  allowedActions,
  isPositiveAction,
} from './product-status'

/** Harga awal = tarif aktif termurah, sama dengan perhitungan katalog publik. */
const startingPrice = (p: LapakProduct) => {
  const active = p.rates.filter((r) => r.isActive).map((r) => r.price)
  return active.length ? Math.min(...active) : null
}

/**
 * Produk & Layanan — `/lapak-jambi/produk`.
 *
 * Daftar sudah tersaring lingkup OPD oleh server. Aksi status hanya ditawarkan
 * bila transisinya sah dari status sekarang (`allowedActions`) — menawarkan yang
 * lain hanya menghasilkan `400 transisi tidak sah`.
 */
export function LapakProductsPage() {
  const qc = useQueryClient()
  const list = useLapakList<LapakProduct>('/lapak/products')
  const { params, setSearch, setFilter } = list
  const access = useLapakAccess()
  // Opsi filter kategori — kunci sama dengan form produk agar cache dipakai bersama.
  const categories = useQuery({
    queryKey: [...lapakKeys.categories, 'pilihan'],
    queryFn: () => lapakCategoryService.publicList(),
    staleTime: 5 * 60_000,
  })

  const [form, setForm] = useState<{ open: boolean; product: LapakProduct | null }>({
    open: false,
    product: null,
  })
  const [pending, setPending] = useState<
    | { kind: 'delete'; product: LapakProduct }
    | { kind: 'status'; product: LapakProduct; action: ProductStatusAction }
    | null
  >(null)

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: lapakKeys.products })
    setPending(null)
  }

  const setStatus = useMutation({
    mutationFn: (x: { product: LapakProduct; action: ProductStatusAction }) =>
      lapakProductService.setStatus(x.product.id, x.action),
    onSuccess: (p, vars) => {
      toast.success(`${p.name} — ${ACTION_LABEL[vars.action]}`)
      refresh()
    },
    onError: (e) => {
      toast.error('Gagal mengubah status produk', { description: apiErrorMessage(e) })
      setPending(null)
    },
  })

  const remove = useMutation({
    mutationFn: (p: LapakProduct) => lapakProductService.remove(p.id),
    onSuccess: () => {
      toast.success('Produk dihapus')
      refresh()
    },
    onError: (e) => {
      toast.error('Gagal menghapus produk', { description: apiErrorMessage(e) })
      setPending(null)
    },
  })

  const busy = setStatus.isPending || remove.isPending

  // Hanya draf/ditolak yang boleh diedit (aturan backend).
  const editable = (p: LapakProduct) => p.status === 'DRAFT' || p.status === 'REJECTED'

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
              {p.organization?.name ? ` · ${p.organization.name}` : ''} · {p.rates.length} tarif
              {p.images.length > 0 ? ` · ${p.images.length} gambar` : ''}
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
    { header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
  ]

  return (
    <>
      <PageHeader
        title="Produk & Layanan"
        description="Aset daerah yang bisa disewa/dipesan lewat Lapak Jambi."
        actions={
          access.canCreateProduct && (
            <Button variant="create" onClick={() => setForm({ open: true, product: null })}>
              <Plus />
              Tambah produk
            </Button>
          )
        }
      />

      <DataTable
        list={list}
        columns={columns}
        rowKey={(p) => p.id}
        emptyTitle={params.search ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
        actions={(p) => {
          const acts = allowedActions(p.status).map((action) => ({
            label: ACTION_LABEL[action],
            icon: action === 'publish' ? Upload : action === 'approve' ? Check : action === 'submit' ? Send : Eye,
            onSelect: () => setPending({ kind: 'status', product: p, action }),
            show:
              (action === 'approve' && access.canApproveProduct) ||
              (action === 'publish' && access.canPublishProduct) ||
              (action === 'unpublish' && access.canPublishProduct) ||
              action === 'submit' ||
              action === 'reject',
          }))
          return (
            <>
              <div className="hidden items-center gap-1 sm:flex">
                {access.canUpdateProduct && editable(p) && (
                  <IconAction
                    icon={Pencil}
                    tone="warning"
                    label={`Ubah produk ${p.name}`}
                    onClick={() => setForm({ open: true, product: p })}
                  />
                )}
                {access.canDeleteProduct && (
                  <IconAction
                    icon={Trash2}
                    tone="destructive"
                    label={`Hapus produk ${p.name}`}
                    disabled={busy}
                    onClick={() => setPending({ kind: 'delete', product: p })}
                  />
                )}
              </div>
              <div className="sm:hidden">
                <RowActions
                  label={`Produk ${p.name}`}
                  actions={[
                    ...acts,
                    ...(access.canUpdateProduct && editable(p)
                      ? [{ label: 'Ubah', icon: Pencil, onSelect: () => setForm({ open: true, product: p }) }]
                      : []),
                    ...(access.canDeleteProduct
                      ? [
                          {
                            label: 'Hapus',
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setPending({ kind: 'delete', product: p }),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </>
          )
        }}
        toolbar={
          <>
            <SearchBar
              key={params.search}
              value={params.search}
              onSearch={setSearch}
              placeholder="Cari nama produk"
            />
            <FilterSelect
              label="Status"
              value={params.status}
              options={STATUS_OPTIONS}
              onChange={(v) => setFilter('status', v)}
            />
            <FilterSelect
              label="Kategori"
              value={params.categoryId}
              options={(categories.data ?? []).map((c) => [c.id, c.name] as [string, string])}
              onChange={(v) => setFilter('categoryId', v)}
            />
          </>
        }
      />

      {form.open && (
        <ProductFormDialog
          key={form.product?.id ?? 'baru'}
          open={form.open}
          onOpenChange={(o) => setForm({ open: o, product: null })}
          product={form.product}
          readOnly={!!form.product && !editable(form.product)}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={busy}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus produk ${pending.product.name}?`,
              description:
                'Produk dihapus (soft-delete). Produk yang sudah terbit ditolak server — tarik dari portal terlebih dahulu.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => remove.mutate(pending.product),
            }
          : pending?.kind === 'status'
            ? {
                title: `${ACTION_LABEL[pending.action]} — ${pending.product.name}?`,
                description: ACTION_DESCRIPTION[pending.action],
                confirmLabel: ACTION_LABEL[pending.action],
                destructive: !isPositiveAction(pending.action),
                onConfirm: () => setStatus.mutate({ product: pending.product, action: pending.action }),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </>
  )
}
