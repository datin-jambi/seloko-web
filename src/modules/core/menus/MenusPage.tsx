import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ListTree } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { useAuthStore } from '@/stores/auth-store'
import { useList } from '@/hooks/use-list'
import { menuAdminService } from '@/services/menu-admin.service'
import { userService } from '@/services/user.service'
import { APPLICATION_DETAIL } from '../applications/application-paths'
import { buildTree, parentOptions } from '../applications/menu-tree'
import type { MenuListItem } from '@/types/core'

const mono = 'font-mono text-xs tabular-nums'
const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]
// parentId menerima UUID induk atau nilai khusus `root` (menu tingkat atas).
const ROOT = 'root'

/**
 * Inventaris lintas aplikasi — melihat, menyaring, dan mencari.
 * Pengelolaan (tambah/ubah/urutkan/hapus) ada di tab Menu pada detail aplikasi,
 * agar permission/role pembatas yang jadi pilihannya ada di layar yang sama.
 *
 * Filter mengikuti ListMenusQuerySchema (seloko-api menus.schema.ts):
 * applicationId, parentId ('root' = tingkat atas), isActive, search, page, limit.
 * Endpoint ini tidak punya sortBy.
 */
export function MenusPage() {
  const list = useList<MenuListItem>('/menus')
  const { params, setSearch, setFilter, setParams } = list
  const navigate = useNavigate()
  const canUpdate = useAuthStore((s) => s.hasPermission('application:update'))
  const applicationId = params.applicationId

  // Pilihan aplikasi. Hanya aplikasi aktif: item menu aplikasi nonaktif tidak relevan di sini.
  const apps = useQuery({ queryKey: ['/applications', 'active'], queryFn: userService.activeApps, staleTime: 5 * 60_000 })

  // Pohon menu aplikasi terpilih — sumber pilihan "Induk menu".
  // Memakai `tree=true` karena daftar datar TIDAK menyertakan `parentId`, sehingga
  // hierarkinya tidak bisa direkonstruksi (semua item akan tampak tingkat atas).
  // Hanya diambil saat aplikasi dipilih; tanpa itu filter induk lintas aplikasi jadi kabur.
  const appMenus = useQuery({
    queryKey: ['/menus', 'tree', applicationId],
    queryFn: () => menuAdminService.tree(applicationId!),
    enabled: !!applicationId,
    staleTime: 5 * 60_000,
  })

  const tree = useMemo(() => (appMenus.data ? buildTree(appMenus.data) : []), [appMenus.data])

  const parentChoices = useMemo<[string, string][]>(() => {
    if (!appMenus.data) return []
    // `root` = menu tingkat atas. Sisanya seluruh menu aplikasi, berindentasi sesuai kedalaman.
    const options: [string, string][] = [[ROOT, `Tingkat atas (${tree.length})`]]
    for (const o of parentOptions(tree)) {
      options.push([o.id, `${'\u00A0\u00A0'.repeat(o.depth)}${o.label}`])
    }
    return options
  }, [appMenus.data, tree])

  const columns = useMemo<Column<MenuListItem>[]>(() => {
    const cols: Column<MenuListItem>[] = [
      {
        header: 'Label',
        cell: (m) => (
          <div>
            <div className="font-medium">{m.parent ? `${m.parent.label} › ${m.label}` : m.label}</div>
            <div className={`${mono} text-muted-foreground`}>{m.code}</div>
          </div>
        ),
      },
      // Saat satu aplikasi dipilih, kolom aplikasi jadi mubazir (isinya sama semua).
      ...(applicationId ? [] : [{ header: 'Aplikasi', cell: (m: MenuListItem) => m.application.name }]),
      { header: 'Path', cell: (m) => <Truncate text={m.path} className={mono} /> },
      { header: 'Permission', cell: (m) => <span className={mono}>{m.permission?.code ?? '—'}</span> },
      { header: 'Urutan', cell: (m) => m.sortOrder, className: 'text-right tabular-nums' },
      { header: 'Status', cell: (m) => <ActiveBadge active={m.isActive} /> },
    ]
    return cols
  }, [applicationId])

  const selectedApp = apps.data?.find((a) => a.id === applicationId)
  const parentLabel = parentChoices.find(([id]) => id === params.parentId)?.[1]?.trim()

  return (
    <>
      <PageHeader
        title="Menu Sidebar"
        description="Inventaris item navigasi seluruh aplikasi. Pengelolaan per aplikasi ada di tab Menu."
      />
      <DataTable
        list={list}
        columns={columns}
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
            <FilterSelect
              label="Aplikasi"
              title={selectedApp ? `Kode: ${selectedApp.code}` : undefined}
              value={applicationId}
              options={(apps.data ?? []).map((a) => [a.id, a.name])}
              // Ganti aplikasi = induk dari aplikasi lama tidak berlaku lagi.
              onChange={(v) => setParams({ applicationId: v, parentId: undefined })}
            />
            <FilterSelect
              label="Induk"
              disabled={!applicationId}
              title={
                applicationId
                  ? 'root = menu tingkat atas; sisanya sub-menu dari induk tersebut'
                  : 'Pilih aplikasi dulu agar daftar induk terisi'
              }
              value={params.parentId}
              options={parentChoices}
              onChange={(v) => setFilter('parentId', v)}
            />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
      />

      {parentLabel && params.parentId && params.parentId !== ROOT && (
        <p className="text-xs text-muted-foreground">
          Menampilkan sub-menu langsung di bawah <strong className="text-foreground">{parentLabel}</strong>.
        </p>
      )}
    </>
  )
}
