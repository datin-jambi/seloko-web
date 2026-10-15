import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import { AppMark } from './AppMark'
import { AccountTypeBadge, SuperAdminBadge } from './AccountTypeBadge'

const mono = 'font-mono text-xs tabular-nums'

// Jumlah aplikasi + tumpukan penanda aplikasi; daftar lengkap di tooltip (hover / fokus keyboard).
function AppCount({ apps }: { apps: UserListItem['applications'] }) {
  if (apps.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${apps.length} aplikasi: ${apps.map((a) => a.name).join(', ')}`}
          className="group/apps -mx-1 inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {/* Tumpukan: tiap tanda diberi cincin warna latar agar tepi tumpang-tindih terbaca. */}
          <span className="flex -space-x-1">
            {apps.slice(0, 3).map((a) => (
              <span key={a.id} className="rounded-md bg-card ring-2 ring-card group-hover/apps:bg-muted group-hover/apps:ring-muted">
                <AppMark code={a.code} size="sm" />
              </span>
            ))}
          </span>
          <span className="text-sm tabular-nums">
            {apps.length}
            <span className="text-muted-foreground"> aplikasi</span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-64 max-w-none p-0">
        <p className="border-b border-border px-3 py-2 text-xs font-semibold">Akses aplikasi</p>
        <ul className="p-1.5">
          {apps.map((a) => (
            <li key={a.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
              <AppMark code={a.code} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{a.name}</span>
                <span className="block font-mono text-xs text-muted-foreground">{a.code}</span>
              </span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

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
            <Button asChild>
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
