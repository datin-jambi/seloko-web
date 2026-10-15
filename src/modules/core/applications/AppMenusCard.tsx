import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  ExternalLink,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

/**
 * Kartu "Menu": pohon navigasi sidebar satu aplikasi, lengkap dengan tambah/ubah/
 * urutkan/hapus. Permission mengikuti menus.routes.ts: application:read (lihat) &
 * application:update (ubah) — bukan menu:*.
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

  const move = (node: MenuCmsNode, direction: -1 | 1) => {
    if (reorder.isPending) return
    reorder.mutate(moveWithinSiblings(tree, node.id, direction))
  }

  const busy = toggle.isPending || remove.isPending || reorder.isPending
  const count = menus.data?.length ?? 0

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
        <ul className="divide-y divide-border">
          {tree.map((node, index) => (
            <MenuRow
              key={node.id}
              node={node}
              depth={0}
              isFirst={index === 0}
              isLast={index === tree.length - 1}
              canUpdate={canUpdate}
              busy={busy}
              collapsed={collapsed}
              onToggleCollapse={(id) =>
                setCollapsed((prev) => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }
              onMove={move}
              onAddChild={(parent) => setForm({ open: true, node: null, parentId: parent.id })}
              onEdit={(n) => setForm({ open: true, node: n, parentId: null })}
              onToggleActive={(n) => setPending({ kind: 'toggle', node: n })}
              onDelete={(n) => setPending({ kind: 'delete', node: n })}
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
                title: pending.node.isActive ? `Nonaktifkan menu ${pending.node.label}?` : `Aktifkan menu ${pending.node.label}?`,
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

function MenuRow({
  node,
  depth,
  isFirst,
  isLast,
  canUpdate,
  busy,
  collapsed,
  onToggleCollapse,
  onMove,
  onAddChild,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  node: Tree<MenuCmsNode>
  depth: number
  isFirst: boolean
  isLast: boolean
  canUpdate: boolean
  busy: boolean
  collapsed: Set<string>
  onToggleCollapse: (id: string) => void
  onMove: (node: MenuCmsNode, direction: -1 | 1) => void
  onAddChild: (node: MenuCmsNode) => void
  onEdit: (node: MenuCmsNode) => void
  onToggleActive: (node: MenuCmsNode) => void
  onDelete: (node: MenuCmsNode) => void
}) {
  const hasChildren = node.items.length > 0
  const isCollapsed = collapsed.has(node.id)

  return (
    <li>
      <div
        className={cn('group/row flex flex-wrap items-center gap-2 px-3 py-2.5', 'transition-colors hover:bg-muted/40')}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* Penanda hierarki: ruang kosong selebar tombol agar label sejajar. */}
        <span className="flex size-6 shrink-0 items-center justify-center">
          {depth > 0 && <CornerDownRight className="size-3.5 text-muted-foreground/60" />}
        </span>

        {hasChildren ? (
          <button
            type="button"
            aria-label={isCollapsed ? `Buka sub-menu ${node.label}` : `Tutup sub-menu ${node.label}`}
            aria-expanded={!isCollapsed}
            onClick={() => onToggleCollapse(node.id)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}

        <MenuIcon name={node.icon} className="size-4 shrink-0 text-muted-foreground" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{node.label}</span>
            <ActiveBadge active={node.isActive} />
            {node.isExternal && (
              <Badge variant="neutral">
                <ExternalLink aria-hidden />
                Eksternal
              </Badge>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{node.code}</span>
            {node.path ? <span className="truncate font-mono">{node.path}</span> : <span>tanpa path (wadah)</span>}
            {node.permission && <span>· {node.permission.code}</span>}
            {node.roles.length > 0 && <span>· {node.roles.length} role</span>}
          </p>
        </div>

        {canUpdate && (
          <>
            {/* Desktop: tombol tampil semua. Mobile: dilipat ke satu menu ⋯ supaya tidak berdesakan. */}
            <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Naikkan urutan ${node.label}`}
                disabled={busy || isFirst}
                onClick={() => onMove(node, -1)}
              >
                <ChevronRight className="size-4 -rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Turunkan urutan ${node.label}`}
                disabled={busy || isLast}
                onClick={() => onMove(node, 1)}
              >
                <ChevronRight className="size-4 rotate-90" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Tambah sub-menu di ${node.label}`}
                    onClick={() => onAddChild(node)}
                  >
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tambah sub-menu</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon-sm" aria-label={`Ubah menu ${node.label}`} onClick={() => onEdit(node)}>
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={node.isActive ? `Nonaktifkan menu ${node.label}` : `Aktifkan menu ${node.label}`}
                onClick={() => onToggleActive(node)}
              >
                {node.isActive ? <PowerOff /> : <Power />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Hapus menu ${node.label}`}
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(node)}
              >
                <Trash2 />
              </Button>
            </div>

            <div className="shrink-0 sm:hidden">
              <RowActions
                label={`menu ${node.label}`}
                actions={[
                  { label: 'Naikkan', icon: ArrowUp, onSelect: () => onMove(node, -1), show: !isFirst && !busy },
                  { label: 'Turunkan', icon: ArrowDown, onSelect: () => onMove(node, 1), show: !isLast && !busy },
                  { label: 'Tambah sub-menu', icon: Plus, onSelect: () => onAddChild(node) },
                  { label: 'Ubah', icon: Pencil, onSelect: () => onEdit(node) },
                  { label: node.isActive ? 'Nonaktifkan' : 'Aktifkan', icon: node.isActive ? PowerOff : Power, onSelect: () => onToggleActive(node) },
                  { label: 'Hapus', icon: Trash2, destructive: true, onSelect: () => onDelete(node) },
                ]}
              />
            </div>
          </>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <ul className="divide-y divide-border/60">
          {node.items.map((child, index) => (
            <MenuRow
              key={child.id}
              node={child}
              depth={depth + 1}
              isFirst={index === 0}
              isLast={index === node.items.length - 1}
              canUpdate={canUpdate}
              busy={busy}
              collapsed={collapsed}
              onToggleCollapse={onToggleCollapse}
              onMove={onMove}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
