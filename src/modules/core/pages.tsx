import { useNavigate } from 'react-router-dom'
import { ListTree } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { useAuthStore } from '@/stores/auth-store'
import { APPLICATION_DETAIL } from './applications/application-paths'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Badge } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import type { MenuListItem, PermissionListItem, RoleListItem } from '@/types/core'

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

/**
 * Inventaris lintas aplikasi — hanya untuk melihat dan mencari.
 * Pengelolaan (tambah/ubah/urutkan/hapus) ada di tab Menu pada detail aplikasi,
 * agar permission/role pembatas yang jadi pilihannya ada di layar yang sama.
 */
export function MenusPage() {
  const list = useList<MenuListItem>('/menus')
  const { params, setSearch, setFilter } = list
  const navigate = useNavigate()
  const canUpdate = useAuthStore((s) => s.hasPermission('application:update'))

  return (
    <>
      <PageHeader
        title="Menu Sidebar"
        description="Inventaris item navigasi seluruh aplikasi. Pengelolaan per aplikasi ada di tab Menu."
      />
      <DataTable
        list={list}
        columns={menuColumns}
        rowKey={(m) => m.id}
        emptyTitle="Belum ada menu"
        onRowClick={canUpdate ? (m) => navigate(`${APPLICATION_DETAIL(m.application.id)}?tab=menus`) : undefined}
        actions={(m) =>
          canUpdate ? (
            <RowActions
              label={`menu ${m.label}`}
              actions={[
                {
                  label: 'Kelola menu aplikasi',
                  icon: ListTree,
                  onSelect: () => navigate(`${APPLICATION_DETAIL(m.application.id)}?tab=menus`),
                },
              ]}
            />
          ) : null
        }
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
