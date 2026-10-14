import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, UserCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { RowActions } from '@/components/shared/RowActions'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import { formatDate } from '@/lib/utils'
import type { UserListItem } from '@/types/core'
import { useUserActions } from './use-user-actions'

const mono = 'font-mono text-xs tabular-nums'

const columns: Column<UserListItem>[] = [
  {
    header: 'Nama',
    cell: (u) => (
      <div>
        <div className="font-medium">{u.fullName}</div>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </div>
    ),
  },
  { header: 'NIP / Username', cell: (u) => <span className={mono}>{u.nip ?? u.username ?? '—'}</span> },
  {
    header: 'Jenis',
    cell: (u) => (u.isSuperAdmin ? <Badge variant="info">Superadmin</Badge> : u.accountType === 'INTERNAL' ? 'Internal' : 'Publik'),
  },
  { header: 'Aplikasi', cell: (u) => <Truncate text={u.applications.map((a) => a.name).join(', ')} /> },
  { header: 'Login terakhir', cell: (u) => formatDate(u.lastLoginAt) },
  { header: 'Status', cell: (u) => <ActiveBadge active={u.isActive} /> },
]

export const USER_DETAIL = (id: string) => `/seloko/pengguna/${id}`

export function UsersPage() {
  const navigate = useNavigate()
  const list = useList<UserListItem>('/users')
  const { params, setSearch, setFilter } = list
  const act = useUserActions()

  return (
    <>
      <PageHeader title="Pengguna" description="Akun pegawai internal dan warga yang terdaftar." />
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
                ['PUBLIC', 'Publik'],
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
