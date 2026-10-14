import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import type { ApplicationListItem, MenuListItem, PermissionListItem, RoleListItem } from '@/types/core'

// Query tiap endpoint: ../seloko-api/src/modules/core/*/*.schema.ts (List*QuerySchema).
// Endpoint core tidak mendukung sortBy — kolom tidak diberi sortKey.

const mono = 'font-mono text-xs tabular-nums'
const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]
const AUDIENCE: [string, string][] = [
  ['INTERNAL', 'Internal'],
  ['PUBLIC', 'Publik'],
]

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
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title="Role" description="Kumpulan permission yang diberikan ke pengguna per aplikasi." />
      <DataTable
        list={list}
        columns={roleColumns}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada role"
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari role" />
            <FilterSelect label="Audiens" value={params.audience} options={AUDIENCE} onChange={(v) => setFilter('audience', v)} />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
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
        list={list}
        columns={permissionColumns}
        rowKey={(p) => p.id}
        emptyTitle="Belum ada permission"
        toolbar={<SearchBar key={list.params.search} value={list.params.search} onSearch={list.setSearch} placeholder="Cari kode atau nama" />}
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
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title="Aplikasi" description="Aplikasi yang terhubung ke gateway Seloko." />
      <DataTable
        list={list}
        columns={appColumns}
        rowKey={(a) => a.id}
        emptyTitle="Belum ada aplikasi"
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari kode atau nama" />
            <FilterSelect label="Audiens" value={params.audience} options={AUDIENCE} onChange={(v) => setFilter('audience', v)} />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
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
  { header: 'Path', cell: (m) => <Truncate text={m.path} className={mono} /> },
  { header: 'Permission', cell: (m) => <span className={mono}>{m.permission?.code ?? '—'}</span> },
  { header: 'Urutan', cell: (m) => m.sortOrder, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (m) => <ActiveBadge active={m.isActive} /> },
]

export function MenusPage() {
  const list = useList<MenuListItem>('/menus')
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title="Menu Sidebar" description="Item navigasi per aplikasi beserta permission pembatasnya." />
      <DataTable
        list={list}
        columns={menuColumns}
        rowKey={(m) => m.id}
        emptyTitle="Belum ada menu"
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari label atau kode" />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
      />
    </>
  )
}
