import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { IconAction } from '@/components/shared/IconAction'
import { RowActions } from '@/components/shared/RowActions'
import { lapakCategoryService } from '@/services/lapak/category.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import type { LapakCategory } from '@/types/lapak'
import { CategoryFormDialog } from './CategoryFormDialog'
import { MenuIcon } from '@/components/shared/MenuIcon'
import { AVAILABILITY_LABEL, FULFILLMENT_LABEL, PRICING_UNIT_LABEL } from './category-labels'

const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]

/**
 * Master Kategori Layanan — `/lapak-jambi/kategori`.
 *
 * Dikelola Bapenda saja: admin OPD hanya MEMILIH kategori saat membuat produk.
 * Guard `category:*` milik aplikasi `lapak-jambi-web`, jadi halaman ini memakai
 * `lapakCategoryService` (header `X-App-Code` ditimpa) dan gerbang UI dari
 * `useLapakAccess`.
 */
export function LapakCategoriesPage() {
  const qc = useQueryClient()
  const list = useLapakList<LapakCategory>('/lapak/categories')
  const { params, setSearch, setFilter } = list
  const { canManageCategories } = useLapakAccess()

  const [form, setForm] = useState<{ open: boolean; category: LapakCategory | null }>({
    open: false,
    category: null,
  })
  const [pending, setPending] = useState<{ kind: 'toggle' | 'delete'; category: LapakCategory } | null>(null)

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: lapakKeys.categories })
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (c: LapakCategory) => lapakCategoryService.setActive(c.id, !c.isActive),
    onSuccess: (c) => {
      toast.success(c.isActive ? `${c.name} diaktifkan` : `${c.name} dinonaktifkan`)
      refresh()
    },
    onError: (e) => toast.error('Gagal mengubah status kategori', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (c: LapakCategory) => lapakCategoryService.remove(c.id),
    onSuccess: () => {
      toast.success('Kategori dihapus')
      refresh()
    },
    onError: (e) => {
      // 409 = masih dipakai produk aktif.
      toast.error('Gagal menghapus kategori', { description: apiErrorMessage(e) })
      setPending(null)
    },
  })

  const busy = toggle.isPending || remove.isPending

  const columns: Column<LapakCategory>[] = [
    {
      header: 'Kategori',
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-primary">
            <MenuIcon name={c.icon ?? 'tags'} className="size-4" />
          </span>
          <div className="min-w-0">
            {/* Deskripsi tidak dijadikan kolom (membuat tabel melewati kontainer);
                tersedia lewat tooltip & form ubah. */}
            <div className="font-medium" title={c.description ?? undefined}>
              {c.name}
            </div>
            <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {c.slug} · urutan {c.sortOrder}
            </div>
          </div>
        </div>
      ),
    },
    {
      // Tiga kolom `default*` digabung: memisahkannya membuat tabel 1383px di
      // kontainer 941px sehingga kolom kanan terpotong. Badge-nya diringkas
      // (mis. "Sesi · Slot · Tiket QR") supaya tetap terbaca tanpa wrap.
      header: 'Bawaan',
      cell: (c) => {
        const parts = [
          c.defaultPricingUnit && PRICING_UNIT_LABEL[c.defaultPricingUnit],
          c.defaultAvailabilityType && AVAILABILITY_LABEL[c.defaultAvailabilityType],
          c.defaultFulfillmentType && FULFILLMENT_LABEL[c.defaultFulfillmentType],
        ].filter(Boolean) as string[]
        return parts.length > 0 ? (
          <Badge variant="neutral" className="max-w-[13rem] font-normal leading-snug">
            {parts.join(' · ')}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Wajib dipilih OPD</span>
        )
      },
    },
    { header: 'Status', cell: (c) => <ActiveBadge active={c.isActive} /> },
  ]

  return (
    <>
      <PageHeader
        title="Kategori Layanan"
        description="Master kategori aset daerah. Nilai bawaan kategori diwarisi produk baru."
        actions={
          canManageCategories && (
            <Button variant="create" onClick={() => setForm({ open: true, category: null })}>
              <Plus />
              Tambah kategori
            </Button>
          )
        }
      />

      <DataTable
        list={list}
        columns={columns}
        rowKey={(c) => c.id}
        emptyTitle="Belum ada kategori"
        actions={
          canManageCategories
            ? (c) => (
                <>
                  <div className="hidden items-center gap-1 sm:flex">
                    <IconAction
                      icon={Pencil}
                      tone="warning"
                      label={`Ubah kategori ${c.name}`}
                      onClick={() => setForm({ open: true, category: c })}
                    />
                    <IconAction
                      icon={c.isActive ? PowerOff : Power}
                      tone={c.isActive ? 'neutral' : 'success'}
                      label={c.isActive ? `Nonaktifkan ${c.name}` : `Aktifkan ${c.name}`}
                      disabled={busy}
                      onClick={() => setPending({ kind: 'toggle', category: c })}
                    />
                    <IconAction
                      icon={Trash2}
                      tone="destructive"
                      label={`Hapus kategori ${c.name}`}
                      disabled={busy}
                      onClick={() => setPending({ kind: 'delete', category: c })}
                    />
                  </div>
                  <div className="sm:hidden">
                    <RowActions
                      label={`Kategori ${c.name}`}
                      actions={[
                        { label: 'Ubah', icon: Pencil, onSelect: () => setForm({ open: true, category: c }) },
                        {
                          label: c.isActive ? 'Nonaktifkan' : 'Aktifkan',
                          icon: Power,
                          onSelect: () => setPending({ kind: 'toggle', category: c }),
                        },
                        {
                          label: 'Hapus',
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setPending({ kind: 'delete', category: c }),
                        },
                      ]}
                    />
                  </div>
                </>
              )
            : undefined
        }
        toolbar={
          <>
            <SearchBar
              value={params.search}
              onSearch={setSearch}
              placeholder="Cari nama, slug, atau deskripsi"
            />
            <FilterSelect
              label="Status"
              value={params.isActive}
              options={ACTIVE}
              onChange={(v) => setFilter('isActive', v)}
            />
          </>
        }
      />

      {form.open && (
        <CategoryFormDialog
          // Remount tiap pembukaan → nilai awal selalu dari kategori terpilih.
          key={form.category?.id ?? 'baru'}
          open={form.open}
          onOpenChange={(o) => setForm({ open: o, category: null })}
          category={form.category}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={busy}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus kategori ${pending.category.name}?`,
              description:
                'Kategori dihapus (soft-delete) dan hilang dari portal. Server menolak bila masih ada produk aktif yang memakainya.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => remove.mutate(pending.category),
            }
          : pending
            ? {
                title: pending.category.isActive
                  ? `Nonaktifkan ${pending.category.name}?`
                  : `Aktifkan ${pending.category.name}?`,
                description: pending.category.isActive
                  ? 'Kategori nonaktif tidak muncul di portal. Produk yang mengacu tetap ada.'
                  : 'Kategori tampil kembali di portal publik.',
                confirmLabel: pending.category.isActive ? 'Nonaktifkan' : 'Aktifkan',
                destructive: pending.category.isActive,
                onConfirm: () => toggle.mutate(pending.category),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </>
  )
}
