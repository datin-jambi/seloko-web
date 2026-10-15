import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { RowActions } from '@/components/shared/RowActions'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useList } from '@/hooks/use-list'
import { formatDate } from '@/lib/utils'
import type { UserListItem } from '@/types/core'
import { useUserActions } from './use-user-actions'
import { USER_CREATE, USER_DETAIL, USER_EDIT } from './user-form'
import { AppCount } from './AppCount'
import { AccountTypeBadge, SuperAdminBadge } from './AccountTypeBadge'

const mono = 'font-mono text-xs tabular-nums'

const columns: Column<UserListItem>[] = [
  {
    header: 'Nama',
    cell: (u) => (
      <div>
        {/* Baris bisa diklik: nama tebal + garis bawah saat baris di-hover. Link = akses keyboard. */}
        <Link
          to={USER_DETAIL(u.id)}
          className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none group-hover/row:font-bold group-hover/row:underline"
        >
          {u.fullName}
        </Link>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </div>
    ),
  },
  { header: 'NIP / Username', cell: (u) => <span className={mono}>{u.nip ?? u.username ?? '—'}</span> },
  {
    header: 'Jenis',
    cell: (u) => (
      <div className="flex items-center gap-1.5">
        <AccountTypeBadge type={u.accountType} />
        {u.isSuperAdmin && <SuperAdminBadge />}
      </div>
    ),
  },
  { header: 'Aplikasi', cell: (u) => <AppCount apps={u.applications} /> },
  { header: 'Login terakhir', cell: (u) => formatDate(u.lastLoginAt) },
  { header: 'Status', cell: (u) => <ActiveBadge active={u.isActive} /> },
]

export function UsersPage() {
  const navigate = useNavigate()
  const list = useList<UserListItem>('/users')
  const { params, setSearch, setFilter } = list
  const act = useUserActions()
  const canCreate = useAuthStore((s) => s.hasPermission('user:create'))
  const canEdit = useAuthStore((s) => s.hasPermission('user:update'))

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Akun pegawai internal dan warga yang terdaftar."
        actions={
          canCreate && (
            <Button variant="create" asChild>
              <Link to={USER_CREATE}>
                <Plus />
                Tambah pengguna
              </Link>
            </Button>
          )
        }
      />
      <DataTable
        list={list}
        columns={columns}
        rowKey={(u) => u.id}
        emptyTitle="Belum ada pengguna"
        onRowClick={(u) => navigate(USER_DETAIL(u.id))}
        actions={(u) => (
          <RowActions
            label={u.fullName}
            actions={[
              { label: 'Lihat detail', icon: Eye, onSelect: () => navigate(USER_DETAIL(u.id)) },
              { label: 'Ubah', icon: Pencil, onSelect: () => navigate(USER_EDIT(u.id)), show: canEdit },
              {
                label: u.isActive ? 'Nonaktifkan' : 'Aktifkan',
                icon: u.isActive ? UserX : UserCheck,
                onSelect: () => act.askToggle(u),
                show: act.canToggle(u),
              },
              { label: 'Hapus', icon: Trash2, destructive: true, onSelect: () => act.askDelete(u), show: act.canDelete(u) },
            ]}
          />
        )}
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari nama, email, atau username" />
            <FilterSelect
              label="Jenis"
              value={params.accountType}
              options={[
                ['INTERNAL', 'Internal'],
                ['PUBLIC', 'Eksternal'],
              ]}
              onChange={(v) => setFilter('accountType', v)}
            />
            <FilterSelect
              label="Status"
              value={params.isActive}
              options={[
                ['true', 'Aktif'],
                ['false', 'Nonaktif'],
              ]}
              onChange={(v) => setFilter('isActive', v)}
            />
          </>
        }
      />
      {act.dialog}
    </>
  )
}
