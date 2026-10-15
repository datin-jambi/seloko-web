import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import type { PermissionListItem, RoleListItem } from '@/types/core'

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

export { ApplicationsPage } from './applications/ApplicationsPage'
export { ApplicationDetailPage } from './applications/ApplicationDetailPage'

export { MenusPage } from './menus/MenusPage'
