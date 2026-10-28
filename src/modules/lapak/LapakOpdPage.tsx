import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Pencil, Plus, Power, PowerOff, ShieldCheck, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { IconAction } from '@/components/shared/IconAction'
import { RowActions } from '@/components/shared/RowActions'
import { lapakOpdService } from '@/services/lapak-opd.service'
import { organizationKeys } from '@/lib/query-keys'
import { apiErrorMessage } from '@/lib/utils'
import { ORGANIZATION_TYPE_LABEL } from '@/modules/core/organizations/organization-form'
import { useMyPermissions } from './lapak-access'
import { LAPAK_OPD_DETAIL } from './lapak-paths'
import { LapakOpdFormDialog } from './LapakOpdFormDialog'
import type { OrganizationListItem } from '@/types/core'

/**
 * Direktori + pengelolaan OPD — Lapak Jambi.
 *
 * Sumber data master Organisasi yang sama dengan `/seloko/organisasi`, tetapi
 * hanya **OPD tingkat atas** (UPTD/Biro adalah unit di bawah OPD, bukan mitra
 * retribusi). CRUD memakai `/lapak/opd` yang gerbang izinnya milik aplikasi
 * Lapak, sehingga role `admin`/`superadmin` Lapak berwenang — lihat
 * `lapak-access.ts` untuk alasannya.
 */
export function LapakOpdPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const { canManage } = useMyPermissions()
  const [form, setForm] = useState<{ open: boolean; opd: OrganizationListItem | null }>({ open: false, opd: null })
  const [pending, setPending] = useState<{ kind: 'toggle' | 'delete'; opd: OrganizationListItem } | null>(null)

  const opds = useQuery({
    queryKey: ['lapak', 'opd'] as const,
    queryFn: lapakOpdService.list,
    staleTime: 60_000,
  })

  const all = useMemo(() => opds.data ?? [], [opds.data])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.shortName ?? '').toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q),
    )
  }, [all, search])

  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1)
  const safePage = Math.min(page, totalPages)
  const rows = useMemo(() => filtered.slice((safePage - 1) * limit, safePage * limit), [filtered, safePage, limit])

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lapak', 'opd'] })
    // Direktori publik & detail memakai kunci `organizations/public`.
    void qc.invalidateQueries({ queryKey: organizationKeys.public })
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (o: OrganizationListItem) => lapakOpdService.setActive(o.id, !o.isActive),
    onSuccess: (o) => {
      toast.success(o.isActive ? `${o.name} diaktifkan` : `${o.name} dinonaktifkan`)
      refresh()
    },
    onError: (e) => toast.error('Gagal mengubah status OPD', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (o: OrganizationListItem) => lapakOpdService.remove(o.id),
    onSuccess: () => {
      toast.success('OPD dihapus')
      refresh()
    },
    onError: (e) => {
      // 409 = masih punya sub-unit / dipakai penugasan role.
      toast.error('Gagal menghapus OPD', { description: apiErrorMessage(e) })
      setPending(null)
    },
  })

  const busy = toggle.isPending || remove.isPending

  const columns: Column<OrganizationListItem>[] = [
    {
      header: 'OPD',
      cell: (o) => (
        <div className="flex min-w-0 items-center gap-3">
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
              to={LAPAK_OPD_DETAIL(o.code)}
              className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none group-hover/row:font-bold group-hover/row:underline"
            >
              {o.name}
            </Link>
            <div className="mt-0.5 font-mono text-xs text-muted-foreground">{o.code}</div>
          </div>
        </div>
      ),
    },
    { header: 'Nama pendek', cell: (o) => <Truncate text={o.shortName} /> },
    { header: 'Jenis', cell: (o) => <Badge variant="neutral">{ORGANIZATION_TYPE_LABEL[o.type]}</Badge> },
    {
      header: 'Kontak',
      cell: (o) => (
        <div className="text-xs text-muted-foreground">
          <div>{o.email ?? '—'}</div>
          <div className="tabular-nums">{o.phone ?? '—'}</div>
        </div>
      ),
    },
    { header: 'Alamat', cell: (o) => <Truncate text={o.address} /> },
    { header: 'Status', cell: (o) => <ActiveBadge active={o.isActive} /> },
  ]

  return (
    <>
      <PageHeader
        title="OPD Pengelola"
        description="Organisasi Perangkat Daerah mitra Lapak Jambi."
        actions={
          <>
            {canManage && (
              <Badge variant="neutral">
                <ShieldCheck aria-hidden />
                Mode kelola
              </Badge>
            )}
            {canManage && (
              <Button
                variant="create"
                onClick={() => setForm({ open: true, opd: null })}
              >
                <Plus />
                Tambah OPD
              </Button>
            )}
          </>
        }
      />

      <DataTable
        list={{
          rows,
          meta: {
            page: safePage,
            limit,
            total: filtered.length,
            totalPages,
            hasPreviousPage: safePage > 1,
            hasNextPage: safePage < totalPages,
          },
          isLoading: opds.isPending,
          error: opds.error,
          refetch: () => void opds.refetch(),
          params: search ? { search } : {},
          setPage,
          setLimit: (n: number) => {
            setLimit(n)
            setPage(1)
          },
          setSearch: (v: string) => {
            setSearch(v)
            setPage(1)
          },
          setFilter: () => {},
          setParams: () => {},
          reset: () => {
            setSearch('')
            setPage(1)
          },
          sort: { by: '', order: undefined },
          toggleSort: () => {},
        }}
        columns={columns}
        rowKey={(o) => o.id}
        emptyTitle={search ? 'Tidak ada OPD yang cocok' : 'Belum ada OPD'}
        actions={
          canManage
            ? (o) => (
                <>
                  {/* Desktop: tombol ikon berwarna. Mobile: dilipat ke ⋯. */}
                  <div className="hidden items-center gap-1 sm:flex">
                    <IconAction
                      icon={Pencil}
                      tone="warning"
                      label={`Ubah OPD ${o.name}`}
                      onClick={() => setForm({ open: true, opd: o })}
                    />
                    <IconAction
                      icon={o.isActive ? PowerOff : Power}
                      tone={o.isActive ? 'neutral' : 'success'}
                      label={o.isActive ? `Nonaktifkan ${o.name}` : `Aktifkan ${o.name}`}
                      disabled={busy}
                      onClick={() => setPending({ kind: 'toggle', opd: o })}
                    />
                    <IconAction
                      icon={Trash2}
                      tone="destructive"
                      label={`Hapus OPD ${o.name}`}
                      disabled={busy}
                      onClick={() => setPending({ kind: 'delete', opd: o })}
                    />
                  </div>
                  <div className="sm:hidden">
                    <RowActions
                      label={`OPD ${o.code}`}
                      actions={[
                        { label: 'Ubah', icon: Pencil, onSelect: () => setForm({ open: true, opd: o }) },
                        {
                          label: o.isActive ? 'Nonaktifkan' : 'Aktifkan',
                          icon: Power,
                          onSelect: () => setPending({ kind: 'toggle', opd: o }),
                        },
                        {
                          label: 'Hapus',
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setPending({ kind: 'delete', opd: o }),
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
              key={search}
              value={search}
              onSearch={(v) => {
                setSearch(v)
                setPage(1)
              }}
              placeholder="Cari nama, nama pendek, atau kode"
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              {opds.isPending ? '…' : `${filtered.length} OPD`}
            </p>
          </>
        }
      />

      {form.open && (
        <LapakOpdFormDialog
          // `key` membuat form di-mount ulang tiap pembukaan → nilai awal selalu
          // dari `opd` yang dipilih, tanpa perlu reset di dalam effect.
          key={form.opd?.id ?? 'baru'}
          open={form.open}
          onOpenChange={(o) => setForm({ open: o, opd: null })}
          opd={form.opd}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={busy}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus OPD ${pending.opd.name}?`,
              description:
                'OPD dihapus (soft-delete) dan hilang dari direktori Lapak. Server menolak bila OPD masih punya sub-unit atau dipakai penugasan role.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => remove.mutate(pending.opd),
            }
          : pending
            ? {
                title: pending.opd.isActive ? `Nonaktifkan ${pending.opd.name}?` : `Aktifkan ${pending.opd.name}?`,
                description: pending.opd.isActive
                  ? 'OPD nonaktif tidak muncul di direktori Lapak dan tidak bisa dipakai untuk penugasan baru.'
                  : 'OPD tampil kembali di direktori Lapak.',
                confirmLabel: pending.opd.isActive ? 'Nonaktifkan' : 'Aktifkan',
                destructive: pending.opd.isActive,
                onConfirm: () => toggle.mutate(pending.opd),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </>
  )
}
