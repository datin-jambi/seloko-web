import { Link, useNavigate } from 'react-router-dom'
import { Eye, LayoutGrid, Trash2, UserCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { RowActions } from '@/components/shared/RowActions'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import { formatDate } from '@/lib/utils'
import type { UserListItem } from '@/types/core'
import { useUserActions } from './use-user-actions'

const mono = 'font-mono text-xs tabular-nums'

// Jumlah aplikasi; nama aplikasi muncul di tooltip (hover / fokus keyboard).
function AppCount({ apps }: { apps: UserListItem['applications'] }) {
  if (apps.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-sm tabular-nums underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <LayoutGrid className="size-3.5 text-muted-foreground" />
          {apps.length} aplikasi
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        <p className="mb-1.5 font-medium text-muted-foreground">Akses aplikasi</p>
        <ul className="space-y-1">
          {apps.map((a) => (
            <li key={a.id}>{a.name}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

export const USER_DETAIL = (id: string) => `/seloko/pengguna/${id}`

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
    cell: (u) =>
      u.isSuperAdmin ? (
        <Badge variant="info">Superadmin</Badge>
      ) : u.accountType === 'INTERNAL' ? (
        'Internal'
      ) : (
        'Publik'
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
