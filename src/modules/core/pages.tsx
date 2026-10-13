import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import { formatDate } from '@/lib/utils'
import type { ApplicationListItem, MenuListItem, PermissionListItem, RoleListItem, UserListItem } from '@/types/core'

const mono = 'font-mono text-xs tabular-nums'

const userColumns: Column<UserListItem>[] = [
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
  { header: 'Aplikasi', cell: (u) => u.applications.map((a) => a.name).join(', ') || '—' },
  { header: 'Login terakhir', cell: (u) => formatDate(u.lastLoginAt) },
  { header: 'Status', cell: (u) => <ActiveBadge active={u.isActive} /> },
]

export function UsersPage() {
  const list = useList<UserListItem>('/users')
  return (
    <>
      <PageHeader title="Pengguna" description="Akun pegawai internal dan warga yang terdaftar." />
      <DataTable
        {...list}
        columns={userColumns}
        rowKey={(u) => u.id}
        onRetry={list.refetch}
        onPageChange={list.setPage}
        emptyTitle="Belum ada pengguna"
        toolbar={<SearchBar onSearch={list.setSearch} placeholder="Cari nama, email, atau username" />}
      />
    </>
  )
}

const roleColumns: Column<RoleListItem>[] = [
  {
    header: 'Role',
    cell: (r) => (
      <div>
        <div className="font-medium">{r.name}</div>
        {r.description && <Truncate text={r.description} className="text-xs text-muted-foreground" />}
      </div>
    ),
  },
  { header: 'Aplikasi', cell: (r) => r.applicationName },
  { header: 'Jenis', cell: (r) => (r.isSystemRole ? <Badge variant="outline">Sistem</Badge> : 'Kustom') },
  { header: 'Permission', cell: (r) => r.permissionCount, className: 'text-right tabular-nums' },
  { header: 'Pengguna', cell: (r) => r.userCount, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (r) => <ActiveBadge active={r.isActive} /> },
]

export function RolesPage() {
  const list = useList<RoleListItem>('/roles')
  return (
    <>
      <PageHeader title="Role" description="Kumpulan permission yang diberikan ke pengguna per aplikasi." />
      <DataTable
        {...list}
        columns={roleColumns}
        rowKey={(r) => r.id}
        onRetry={list.refetch}
        onPageChange={list.setPage}
        emptyTitle="Belum ada role"
        toolbar={<SearchBar onSearch={list.setSearch} placeholder="Cari role" />}
      />
    </>
  )
}

const permissionColumns: Column<PermissionListItem>[] = [
  { header: 'Kode', cell: (p) => <span className={mono}>{p.code}</span> },
  { header: 'Nama', cell: (p) => p.name },
  { header: 'Modul', cell: (p) => p.module },
  { header: 'Aplikasi', cell: (p) => <span className={mono}>{p.applicationCode}</span> },
  { header: 'Role', cell: (p) => p.roleCount, className: 'text-right tabular-nums' },
  { header: 'Menu', cell: (p) => p.menuCount, className: 'text-right tabular-nums' },
]

export function PermissionsPage() {
  const list = useList<PermissionListItem>('/permissions')
  return (
    <>
      <PageHeader title="Permission" description="Hak akses terkecil yang dicek oleh API." />
      <DataTable
        {...list}
        columns={permissionColumns}
        rowKey={(p) => p.id}
        onRetry={list.refetch}
        onPageChange={list.setPage}
        emptyTitle="Belum ada permission"
        toolbar={<SearchBar onSearch={list.setSearch} placeholder="Cari kode atau nama" />}
      />
    </>
  )
}

const appColumns: Column<ApplicationListItem>[] = [
  {
    header: 'Aplikasi',
    cell: (a) => (
      <div>
        <div className="font-medium">{a.name}</div>
        {a.tagline && <Truncate text={a.tagline} className="text-xs text-muted-foreground" />}
      </div>
    ),
  },
  { header: 'Kode', cell: (a) => <span className={mono}>{a.code}</span> },
  { header: 'Audiens', cell: (a) => (a.audience === 'INTERNAL' ? 'Internal' : 'Publik') },
  { header: 'Role', cell: (a) => a.counts.roles, className: 'text-right tabular-nums' },
  { header: 'Menu', cell: (a) => a.counts.menuItems, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (a) => <ActiveBadge active={a.isActive} /> },
]

export function ApplicationsPage() {
  const list = useList<ApplicationListItem>('/applications')
  return (
    <>
      <PageHeader title="Aplikasi" description="Aplikasi yang terhubung ke gateway Seloko." />
      <DataTable
        {...list}
        columns={appColumns}
        rowKey={(a) => a.id}
        onRetry={list.refetch}
        onPageChange={list.setPage}
        emptyTitle="Belum ada aplikasi"
        toolbar={<SearchBar onSearch={list.setSearch} placeholder="Cari kode atau nama" />}
      />
    </>
  )
}

const menuColumns: Column<MenuListItem>[] = [
  {
    header: 'Label',
    cell: (m) => (
      <div>
        <div className="font-medium">{m.parent ? `${m.parent.label} › ${m.label}` : m.label}</div>
        <div className={`${mono} text-muted-foreground`}>{m.code}</div>
      </div>
    ),
  },
  { header: 'Aplikasi', cell: (m) => m.application.name },
  { header: 'Path', cell: (m) => <span className={mono}>{m.path ?? '—'}</span> },
  { header: 'Permission', cell: (m) => <span className={mono}>{m.permission?.code ?? '—'}</span> },
  { header: 'Urutan', cell: (m) => m.sortOrder, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (m) => <ActiveBadge active={m.isActive} /> },
]

export function MenusPage() {
  const list = useList<MenuListItem>('/menus')
  return (
    <>
      <PageHeader title="Menu Sidebar" description="Item navigasi per aplikasi beserta permission pembatasnya." />
      <DataTable
        {...list}
        columns={menuColumns}
        rowKey={(m) => m.id}
        onRetry={list.refetch}
        onPageChange={list.setPage}
        emptyTitle="Belum ada menu"
        toolbar={<SearchBar onSearch={list.setSearch} placeholder="Cari label atau kode" />}
      />
    </>
  )
}
