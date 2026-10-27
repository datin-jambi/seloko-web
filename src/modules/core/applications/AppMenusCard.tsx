import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderTree,
  ListTree,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RowActions } from '@/components/shared/RowActions'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconAction } from '@/components/shared/IconAction'
import { roleService } from '@/services/role.service'
import { menuAdminService } from '@/services/menu-admin.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage, cn } from '@/lib/utils'
import { MenuIcon } from '@/components/shared/MenuIcon'
import type { ApplicationDetail, MenuCmsNode } from '@/types/core'
import { MenuFormDialog } from './MenuFormDialog'
import { buildTree, flattenForReorder, moveWithinSiblings, type Tree } from './menu-tree'

type Pending = { kind: 'toggle' | 'delete'; node: MenuCmsNode } | null
type Form = { open: boolean; node: MenuCmsNode | null; parentId: string | null }

/** Aksi yang dibutuhkan baris menu — diteruskan utuh, bukan satu per satu. */
interface MenuActions {
  canUpdate: boolean
  busy: boolean
  collapsed: Set<string>
  onToggleCollapse: (id: string) => void
  onMove: (node: MenuCmsNode, direction: -1 | 1) => void
  onAddChild: (node: MenuCmsNode) => void
  onEdit: (node: MenuCmsNode) => void
  onToggleActive: (node: MenuCmsNode) => void
  onDelete: (node: MenuCmsNode) => void
}

/**
 * Kartu "Menu": pohon navigasi sidebar satu aplikasi, lengkap dengan tambah/ubah/
 * urutkan/hapus. Permission mengikuti menus.routes.ts: application:read (lihat) &
 * application:update (ubah) — bukan menu:*.
 *
 * Tampilan pohon: tiap menu tingkat atas adalah kartu tersendiri (latar `muted`,
 * judul tebal, ikon dalam kotak); anak-anaknya menggantung di bawah dengan garis
 * penghubung. Batas grup jadi terbaca sekilas tanpa menghitung indentasi.
 */
export function AppMenusCard({ app }: { app: ApplicationDetail }) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const canUpdate = can('application:update')
  const [form, setForm] = useState<Form>({ open: false, node: null, parentId: null })
  const [pending, setPending] = useState<Pending>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const menus = useQuery({
    queryKey: ['/menus', 'by-app', app.id],
    queryFn: () => menuAdminService.tree(app.id),
  })

  // Role aplikasi ini untuk pilihan "role pembatas" di form.
  const roles = useQuery({
    queryKey: ['/roles', 'by-app', app.id],
    queryFn: () => roleService.listByApp(app.id),
    staleTime: 5 * 60_000,
  })

  const tree = useMemo(() => buildTree((menus.data ?? []) as MenuCmsNode[]), [menus.data])

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['/menus'] })
    setPending(null)
  }

  /** Simpan urutan/induk baru dari perubahan lokal (satu request untuk semua item). */
  const reorder = useMutation({
    mutationFn: (next: Tree<MenuCmsNode>[]) =>
      menuAdminService.reorder({ applicationId: app.id, items: flattenForReorder(next) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['/menus'] }),
    onError: (e) => toast.error('Gagal menyimpan urutan', { description: apiErrorMessage(e) }),
  })

  const toggle = useMutation({
    mutationFn: (node: MenuCmsNode) => menuAdminService.setActive(node.id, !node.isActive),
    onSuccess: (_, node) => {
      toast.success(node.isActive ? `Menu ${node.label} dinonaktifkan` : `Menu ${node.label} diaktifkan`)
      refresh()
    },
    onError: (e) => toast.error('Gagal mengubah status menu', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (node: MenuCmsNode) => menuAdminService.remove(node.id),
    onSuccess: (_, node) => {
      toast.success(`Menu ${node.label} dihapus`)
      refresh()
    },
    onError: (e) => toast.error('Gagal menghapus menu', { description: apiErrorMessage(e) }),
  })

  const busy = toggle.isPending || remove.isPending || reorder.isPending
  const count = menus.data?.length ?? 0

  const actions: MenuActions = {
    canUpdate,
    busy,
    collapsed,
    onToggleCollapse: (id) =>
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
    onMove: (node, direction) => {
      if (reorder.isPending) return
      reorder.mutate(moveWithinSiblings(tree, node.id, direction))
    },
    onAddChild: (node) => setForm({ open: true, node: null, parentId: node.id }),
    onEdit: (node) => setForm({ open: true, node, parentId: null }),
    onToggleActive: (node) => setPending({ kind: 'toggle', node }),
    onDelete: (node) => setPending({ kind: 'delete', node }),
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Menu</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {menus.isPending ? '…' : `${count} item`} · {tree.length} tingkat atas
          </p>
        </div>
        {canUpdate && app.isActive && (
          <Button size="sm" variant="create" onClick={() => setForm({ open: true, node: null, parentId: null })}>
            <Plus />
            Tambah menu
          </Button>
        )}
      </div>

      {menus.error ? (
        <div className="p-4">
          <ErrorState message={apiErrorMessage(menus.error)} onRetry={() => void menus.refetch()} />
        </div>
      ) : menus.isPending ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="px-4 py-10 text-center">
          <ListTree className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">Belum ada menu</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Menu menentukan isi sidebar aplikasi ini. Judul tanpa path berfungsi sebagai wadah sub-menu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 p-3">
          {tree.map((node, index) => (
            <MenuGroup
              key={node.id}
              node={node}
              actions={actions}
              isFirst={index === 0}
              isLast={index === tree.length - 1}
            />
          ))}
        </ul>
      )}

      {form.open && (
        <MenuFormDialog
          app={app}
          tree={tree}
          roles={(roles.data ?? []).map((r) => ({ id: r.id, name: r.name }))}
          menu={form.node}
          defaultParentId={form.parentId}
          onClose={() => setForm({ open: false, node: null, parentId: null })}
          onSaved={() => void qc.invalidateQueries({ queryKey: ['/menus'] })}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={busy}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus menu ${pending.node.label}?`,
              description:
                pending.node.items.length > 0
                  ? `Menu beserta ${pending.node.items.length} sub-menu di bawahnya dihapus permanen.`
                  : 'Menu dihapus permanen dari sidebar aplikasi ini.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => remove.mutate(pending.node),
            }
          : pending
            ? {
                title: pending.node.isActive
                  ? `Nonaktifkan menu ${pending.node.label}?`
                  : `Aktifkan menu ${pending.node.label}?`,
                description: pending.node.isActive
                  ? 'Menu beserta sub-menunya disembunyikan dari sidebar, tetapi datanya tetap tersimpan.'
                  : 'Menu tampil kembali di sidebar bagi pengguna yang berhak.',
                confirmLabel: pending.node.isActive ? 'Nonaktifkan' : 'Aktifkan',
                destructive: pending.node.isActive,
                onConfirm: () => toggle.mutate(pending.node),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </section>
  )
}

/**
 * Satu grup menu tingkat atas: kepala kartu + blok anak.
 *
 * Induk dan anak sengaja BEDA BENTUK, bukan hanya beda indentasi:
 * - Induk: latar `muted`, judul tebal, ikon dalam kotak, diakhiri garis pemisah.
 * - Anak: latar kartu, ikon polos, garis penghubung siku di kiri.
 */
function MenuGroup({ node, actions, isFirst, isLast }: { node: Tree<MenuCmsNode>; actions: MenuActions; isFirst: boolean; isLast: boolean }) {
  const { collapsed } = actions
  const hasChildren = node.items.length > 0
  const isCollapsed = collapsed.has(node.id)

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="bg-muted/50">
        <MenuRow node={node} depth={0} actions={actions} isFirst={isFirst} isLast={isLast} />
      </div>

      {hasChildren && !isCollapsed && (
        // Garis vertikal ditarik dari TENGAH kotak ikon induk. Posisinya:
        // px-3 (12) + chevron size-6 (24) + gap-x-2 (8) + size-8/2 (16) = 60px
        // = 3.75rem. Angka ini harus ikut berubah bila padding/ukuran ikon induk
        // diubah, kalau tidak garisnya melayang di sebelah kiri ikon.
        <ul className="ml-[3.75rem] border-l-2 border-border">
          {node.items.map((child, index) => (
            <MenuRow
              key={child.id}
              node={child}
              depth={1}
              actions={actions}
              isFirst={index === 0}
              isLast={index === node.items.length - 1}
            />
          ))}
        </ul>
      )}

      {/* Kaki grup: kontrol buka/tutup saja. "Tambah sub-menu" sengaja TIDAK
          diduplikasi di sini — ia sudah ada di deretan aksi baris (ikon +) yang
          posisinya konsisten di semua tingkat, sehingga kolom aksi tetap lurus. */}
      {hasChildren && (
        <div className="border-t border-border bg-muted/30 text-xs">
          <button
            type="button"
            onClick={() => actions.onToggleCollapse(node.id)}
            aria-expanded={!isCollapsed}
            className="flex w-full items-center justify-center gap-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', isCollapsed && '-rotate-90')} />
            {isCollapsed ? `Tampilkan ${node.items.length} sub-menu` : 'Sembunyikan sub-menu'}
            <span className="sr-only"> untuk {node.label}</span>
          </button>
        </div>
      )}
    </li>
  )
}

/** Titik pemisah metadata. `aria-hidden` — makna kalimat tidak bergantung padanya. */
function MetaDot() {
  return <span aria-hidden className="size-1 shrink-0 rounded-full bg-muted-foreground/40" />
}

/** Baris menu. `depth` 0 = induk, ≥1 = anak/cucu. */
function MenuRow({
  node,
  depth,
  actions,
  isFirst,
  isLast,
}: {
  node: Tree<MenuCmsNode>
  depth: number
  actions: MenuActions
  isFirst: boolean
  isLast: boolean
}) {
  const { canUpdate, busy, collapsed, onToggleCollapse } = actions
  const hasChildren = node.items.length > 0
  const isCollapsed = collapsed.has(node.id)
  const top = depth === 0

  return (
    <li>
      <div
        className={cn(
          'group/row relative flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 transition-colors',
          top ? 'py-2.5' : 'py-2 pl-3 hover:bg-muted/40',
        )}
      >
        {/* Siku horizontal dari garis vertikal (border-l pada <ul>) menuju label.
            `-left-0.5` mengimbangi `border-l-2` agar pangkal siku menempel garis. */}
        {!top && <span aria-hidden className="absolute -left-0.5 top-1/2 h-px w-3 bg-border" />}

        {/* Chevron buka/tutup — hanya pada induk yang punya anak. */}
        {top ? (
          hasChildren ? (
            <button
              type="button"
              aria-label={isCollapsed ? `Buka sub-menu ${node.label}` : `Tutup sub-menu ${node.label}`}
              aria-expanded={!isCollapsed}
              onClick={() => onToggleCollapse(node.id)}
              className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          ) : (
            <span className="size-6 shrink-0" />
          )
        ) : null}

        {/* Ikon: induk dalam kotak, anak polos. */}
        {top ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
            <MenuIcon name={node.icon} className="size-4" />
          </span>
        ) : (
          <MenuIcon name={node.icon} className="size-4 shrink-0 text-muted-foreground" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('truncate', top ? 'text-sm font-semibold' : 'text-sm')}>{node.label}</span>
            <ActiveBadge active={node.isActive} />
            {hasChildren && (
              <Badge variant="neutral" className="hidden sm:inline-flex">
                <FolderTree aria-hidden />
                {node.items.length} sub-menu
              </Badge>
            )}
            {node.isExternal && (
              <Badge variant="neutral">
                <ExternalLink aria-hidden />
                Eksternal
              </Badge>
            )}
          </div>
          {/* Metadata dipisah titik kecil yang sama bentuknya, bukan karakter "·"
              di dalam teks: konsisten jaraknya dan tidak ikut terpilih saat copy. */}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">{node.code}</span>
            {node.path ? (
              <span className="max-w-[22rem] truncate font-mono" title={node.path}>
                {node.path}
              </span>
            ) : (
              <span className="italic text-muted-foreground/70">wadah — tanpa path</span>
            )}
            {(node.permission || node.roles.length > 0) && <MetaDot />}
            {node.permission && <span className="font-mono">{node.permission.code}</span>}
            {node.permission && node.roles.length > 0 && <MetaDot />}
            {node.roles.length > 0 && <span className="tabular-nums">{node.roles.length} role</span>}
          </p>
        </div>

        {canUpdate && (
          <>
            {/* Desktop: tombol ikon berwarna + tooltip. Mobile: dilipat ke ⋯ agar
                enam tombol ikon tidak berdesakan untuk jari. */}
            <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
              <IconAction
                icon={ArrowUp}
                label={`Naikkan ${node.label}`}
                disabled={busy || isFirst}
                onClick={() => actions.onMove(node, -1)}
              />
              <IconAction
                icon={ArrowDown}
                label={`Turunkan ${node.label}`}
                disabled={busy || isLast}
                onClick={() => actions.onMove(node, 1)}
              />
              {top && <IconAction icon={Plus} label={`Tambah sub-menu di ${node.label}`} tone="primary" onClick={() => actions.onAddChild(node)} />}
              <IconAction icon={Pencil} label={`Ubah ${node.label}`} tone="warning" onClick={() => actions.onEdit(node)} />
              <IconAction
                icon={node.isActive ? PowerOff : Power}
                label={node.isActive ? `Nonaktifkan ${node.label}` : `Aktifkan ${node.label}`}
                tone={node.isActive ? 'neutral' : 'success'}
                onClick={() => actions.onToggleActive(node)}
              />
              <IconAction icon={Trash2} label={`Hapus ${node.label}`} tone="destructive" onClick={() => actions.onDelete(node)} />
            </div>

            <div className="shrink-0 sm:hidden">
              <RowActions
                label={`menu ${node.label}`}
                actions={[
                  { label: 'Naikkan', icon: ArrowUp, onSelect: () => actions.onMove(node, -1), show: !isFirst && !busy },
                  { label: 'Turunkan', icon: ArrowDown, onSelect: () => actions.onMove(node, 1), show: !isLast && !busy },
                  { label: 'Tambah sub-menu', icon: Plus, onSelect: () => actions.onAddChild(node) },
                  { label: 'Ubah', icon: Pencil, onSelect: () => actions.onEdit(node) },
                  {
                    label: node.isActive ? 'Nonaktifkan' : 'Aktifkan',
                    icon: node.isActive ? PowerOff : Power,
                    onSelect: () => actions.onToggleActive(node),
                  },
                  { label: 'Hapus', icon: Trash2, destructive: true, onSelect: () => actions.onDelete(node) },
                ]}
              />
            </div>
          </>
        )}
      </div>

      {/* Cucu: ditarik ke kanan dengan rel tambahan. */}
      {hasChildren && !isCollapsed && !top && (
        <ul className="ml-6 border-l border-border">
          {node.items.map((child, index) => (
            <MenuRow
              key={child.id}
              node={child}
              depth={depth + 1}
              actions={actions}
              isFirst={index === 0}
              isLast={index === node.items.length - 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
