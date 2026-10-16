import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { RowActions } from '@/components/shared/RowActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useList } from '@/hooks/use-list'
import { useAuthStore } from '@/stores/auth-store'
import { applicationService } from '@/services/application.service'
import type { RoleListItem } from '@/types/core'
import { RoleFormDialog } from './RoleFormDialog'
import { useAccessActions } from './use-access-actions'
import { ROLE_DETAIL } from './paths'

// Filter mengikuti ListRolesQuerySchema (../seloko-api/src/modules/core/roles/roles.schema.ts):
// search, applicationId, isActive, isSystemRole, audience, page, limit. Tidak ada sortBy.
const AUDIENCE: [string, string][] = [
  ['INTERNAL', 'Internal'],
  ['PUBLIC', 'Publik'],
]
const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]
const KIND: [string, string][] = [
  ['true', 'Sistem'],
  ['false', 'Kustom'],
]

/** Audiens role: pegawai (internal) vs warga (publik). */
const AudienceBadge = ({ audience }: { audience: RoleListItem['audience'] }) =>
  audience === 'INTERNAL' ? <Badge variant="neutral">Internal</Badge> : <Badge variant="outline">Publik</Badge>

const columns: Column<RoleListItem>[] = [
  {
    header: 'Role',
    cell: (r) => (
      <div>
        <div className="font-mono text-sm font-medium">{r.name}</div>
        {r.description && <Truncate text={r.description} className="text-xs text-muted-foreground" />}
      </div>
    ),
  },
  { header: 'Aplikasi', cell: (r) => r.applicationName },
  { header: 'Jenis', cell: (r) => (r.isSystemRole ? <Badge variant="outline">Sistem</Badge> : 'Kustom') },
  { header: 'Audiens', cell: (r) => <AudienceBadge audience={r.audience} /> },
  { header: 'Permission', cell: (r) => r.permissionCount, className: 'text-right tabular-nums' },
  { header: 'Pengguna', cell: (r) => r.userCount, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (r) => <ActiveBadge active={r.isActive} /> },
]

/**
 * Daftar seluruh role lintas aplikasi — melihat, menyaring, dan mengelola.
 * Tambah/ubah lewat dialog, aktif-nonaktif & hapus lewat menu aksi baris; klik baris
 * membuka detail (daftar permission + pengguna yang memegangnya).
 */
export function RolesPage() {
  const navigate = useNavigate()
  const list = useList<RoleListItem>('/roles')
  const { params, setSearch, setFilter } = list
  const act = useAccessActions()

  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const can = useAuthStore((s) => s.hasPermission)
  const canCreate = isSuperAdmin || can('role:create')
  const canUpdate = isSuperAdmin || can('role:update')
  const canDelete = isSuperAdmin || can('role:delete')

  const [form, setForm] = useState<{ open: boolean; role: RoleListItem | null }>({ open: false, role: null })

  // Daftar aplikasi untuk filter. Semua aplikasi (bukan hanya aktif) agar role aplikasi
  // nonaktif tetap bisa disaring.
  const apps = useQuery({
    queryKey: ['/applications', 'all'],
    queryFn: () => applicationService.listAll(),
    staleTime: 5 * 60_000,
  })

  return (
    <>
      <PageHeader
        title="Role"
        description="Kumpulan permission yang diberikan ke pengguna per aplikasi."
        actions={
          canCreate && (
            <Button variant="create" onClick={() => setForm({ open: true, role: null })}>
              <Plus />
              Tambah role
            </Button>
          )
        }
      />
      <DataTable
        list={list}
        columns={columns}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada role"
        onRowClick={(r) => navigate(ROLE_DETAIL(r.id))}
        actions={(r) => (
          <RowActions
            label={`role ${r.name}`}
            actions={[
              { label: 'Ubah', icon: Pencil, onSelect: () => setForm({ open: true, role: r }), show: canUpdate },
              {
                label: r.isActive ? 'Nonaktifkan' : 'Aktifkan',
                icon: Power,
                onSelect: () => act.askRoleToggle(r),
                show: canUpdate,
              },
              { label: 'Hapus', icon: Trash2, destructive: true, onSelect: () => act.askRoleDelete(r), show: canDelete },
            ]}
          />
        )}
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari nama role" />
            <FilterSelect
              label="Aplikasi"
              value={params.applicationId}
              options={(apps.data ?? []).map((a) => [a.id, a.name])}
              onChange={(v) => setFilter('applicationId', v)}
            />
            <FilterSelect label="Audiens" value={params.audience} options={AUDIENCE} onChange={(v) => setFilter('audience', v)} />
            <FilterSelect label="Jenis" value={params.isSystemRole} options={KIND} onChange={(v) => setFilter('isSystemRole', v)} />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
      />

      {form.open && (
        <RoleFormDialog
          role={form.role}
          onClose={() => setForm({ open: false, role: null })}
          onSaved={() => void list.refetch()}
        />
      )}
      {act.dialog}
    </>
  )
}
