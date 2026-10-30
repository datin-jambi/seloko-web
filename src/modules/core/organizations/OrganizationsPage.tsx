import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { RowActions } from '@/components/shared/RowActions'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import { organizationService } from '@/services/organization.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'
import type { OrganizationListItem } from '@/types/core'
import { ORGANIZATION_TYPE_LABEL, ORGANIZATION_TYPES } from './organization-form'
import { OrganizationFormDialog } from './OrganizationFormDialog'
import { ORGANIZATION_DETAIL } from './organization-paths'

const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]

/**
 * Master Organisasi (OPD / Unit Kerja).
 *
 * Filter mengikuti ListOrganizationsQuerySchema: page, limit, search, type,
 * isActive, parentId, rootsOnly, sortBy (code|name|createdAt), sortOrder.
 *
 * Catatan domain: `code` unik GLOBAL karena satu OPD adalah entitas pemerintah
 * yang sama di seluruh aplikasi. Toggle nonaktif MENURUN ke seluruh sub-unit.
 */
export function OrganizationsPage() {
  const list = useList<OrganizationListItem>('/organizations')
  const { params, setSearch, setFilter } = list
  const navigate = useNavigate()
  const qc = useQueryClient()

  const canCreate = useAuthStore((s) => s.hasPermission('organization:create'))
  const canUpdate = useAuthStore((s) => s.hasPermission('organization:update'))
  const canDelete = useAuthStore((s) => s.hasPermission('organization:delete'))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OrganizationListItem | null>(null)
  const [toggling, setToggling] = useState<OrganizationListItem | null>(null)
  const [deleting, setDeleting] = useState<OrganizationListItem | null>(null)

  // Peta induk untuk menampilkan hierarki & pilihan filter.
  const all = useQuery({
    queryKey: ['organizations', 'all-for-parent'],
    queryFn: () => organizationService.list({ limit: '100', sortBy: 'code', sortOrder: 'asc' }),
    staleTime: 60_000,
  })

  const byId = useMemo(() => {
    const m = new Map<string, OrganizationListItem>()
    for (const o of all.data?.data ?? []) m.set(o.id, o)
    return m
  }, [all.data])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['/organizations'] })
    void qc.invalidateQueries({ queryKey: ['organizations'] })
  }

  const setActive = useMutation({
    mutationFn: (row: OrganizationListItem) => organizationService.setActive(row.id, !row.isActive),
    onSuccess: (row) => {
      invalidate()
      toast.success(row.isActive ? `${row.name} diaktifkan` : `${row.name} dinonaktifkan`, {
        description: row.isActive
          ? 'Hanya organisasi ini yang aktif kembali; sub-unit tetap nonaktif.'
          : 'Seluruh sub-unit di bawahnya ikut nonaktif.',
      })
      setToggling(null)
    },
    onError: (e) => {
      toast.error('Gagal mengubah status', { description: apiErrorMessage(e) })
      setToggling(null)
    },
  })

  const remove = useMutation({
    mutationFn: (row: OrganizationListItem) => organizationService.remove(row.id),
    onSuccess: () => {
      invalidate()
      toast.success('Organisasi dihapus')
      setDeleting(null)
    },
    onError: (e) => {
      // 409 = masih punya sub-unit aktif / dipakai penugasan role.
      toast.error('Gagal menghapus organisasi', { description: apiErrorMessage(e) })
      setDeleting(null)
    },
  })

  const columns: Column<OrganizationListItem>[] = [
    {
      header: 'Organisasi',
      cell: (o) => {
        const parent = o.parentId ? byId.get(o.parentId) : null
        return (
          <div className="flex min-w-0 items-center gap-3">
            {/* Logo dari ImageKit; fallback ikon bila belum diunggah. */}
            {o.logoUrl ? (
              <img
                src={o.logoUrl}
                alt={`Logo ${o.name}`}
                loading="lazy"
                className="size-9 shrink-0 rounded-md border border-border bg-muted object-contain p-0.5"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-input bg-muted/50 text-muted-foreground"
              >
                <Building2 className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <Link
                to={ORGANIZATION_DETAIL(o.id)}
                className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none group-hover/row:font-bold group-hover/row:underline"
              >
                {o.name}
              </Link>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{o.code}</span>
                {parent && <> · di bawah {parent.code}</>}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Jenis',
      cell: (o) => <Badge variant="neutral">{ORGANIZATION_TYPE_LABEL[o.type]}</Badge>,
    },
    { header: 'Nama pendek', cell: (o) => <Truncate text={o.shortName} /> },
    {
      header: 'Bagian',
      // `counts` hanya ada di respons daftar. Bila endpoint tidak mengirimnya
      // (mis. data lama/cache), tampilkan "—" alih-alih menebak nol.
      cell: (o) => (
        <span className="tabular-nums">
          {typeof o.counts?.children === 'number' ? o.counts.children : '—'}
        </span>
      ),
    },
    {
      header: 'Kontak',
      cell: (o) => (
        <div className="text-xs text-muted-foreground">
          <div>{o.email ?? '—'}</div>
          <div>{o.phone ?? '—'}</div>
        </div>
      ),
    },
    { header: 'Status', cell: (o) => <ActiveBadge active={o.isActive} /> },
  ]

  return (
    <>
      <PageHeader
        title="Organisasi"
        description="Master unit kerja (OPD/UPTD) lintas aplikasi. Kode unik global; hierarki lewat induk."
        actions={
          canCreate ? (
            <Button
              variant="create"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus />
              Tambah organisasi
            </Button>
          ) : null
        }
      />

      <DataTable
        list={list}
        columns={columns}
        rowKey={(o) => o.id}
        emptyTitle="Belum ada organisasi"
        onRowClick={canUpdate ? (o) => navigate(ORGANIZATION_DETAIL(o.id)) : undefined}
        actions={(o) => (
          <RowActions
            label={`organisasi ${o.code}`}
            actions={[
              {
                label: 'Ubah organisasi',
                icon: Pencil,
                show: canUpdate,
                onSelect: () => {
                  setEditing(o)
                  setFormOpen(true)
                },
              },
              {
                label: o.isActive ? 'Nonaktifkan' : 'Aktifkan',
                icon: Power,
                show: canUpdate,
                onSelect: () => setToggling(o),
              },
              {
                label: 'Hapus organisasi',
                icon: Trash2,
                destructive: true,
                show: canDelete,
                onSelect: () => setDeleting(o),
              },
            ]}
          />
        )}
        toolbar={
          <>
            <SearchBar
              value={params.search}
              onSearch={setSearch}
              placeholder="Cari kode, nama, atau nama pendek"
            />
            <FilterSelect
              label="Jenis"
              value={params.type}
              options={ORGANIZATION_TYPES.map((t) => [t, ORGANIZATION_TYPE_LABEL[t]])}
              onChange={(v) => setFilter('type', v)}
            />
            <FilterSelect
              label="Status"
              value={params.isActive}
              options={ACTIVE}
              onChange={(v) => setFilter('isActive', v)}
            />
            <FilterSelect
              label="Tingkat"
              title="Akar = organisasi tanpa induk"
              value={params.rootsOnly}
              options={[['true', 'Hanya tingkat atas']]}
              onChange={(v) => setFilter('rootsOnly', v)}
            />
          </>
        }
      />

      <OrganizationFormDialog open={formOpen} onOpenChange={setFormOpen} organization={editing} />

      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.isActive ? 'Nonaktifkan organisasi?' : 'Aktifkan organisasi?'}
        description={
          toggling?.isActive ? (
            <>
              <strong>{toggling?.name}</strong> beserta <strong>seluruh sub-unit di bawahnya</strong> akan nonaktif.
              Data tidak dihapus, tetapi OPD nonaktif tidak bisa dipakai untuk penugasan baru.
            </>
          ) : (
            <>
              Hanya <strong>{toggling?.name}</strong> yang diaktifkan kembali. Sub-unit yang ikut nonaktif sebelumnya
              harus diaktifkan sendiri.
            </>
          )
        }
        confirmLabel={toggling?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        destructive={toggling?.isActive}
        pending={setActive.isPending}
        onConfirm={() => toggling && setActive.mutate(toggling)}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus organisasi?"
        description={
          <>
            <strong>{deleting?.name}</strong> akan dihapus (soft-delete). Server menolak bila masih punya sub-unit aktif
            atau masih dipakai pada penugasan role.
          </>
        }
        confirmLabel="Hapus organisasi"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
