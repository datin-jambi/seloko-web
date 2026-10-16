import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Key, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { permissionService } from '@/services/permission.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'
import type { ApplicationDetail, PermissionListItem } from '@/types/core'
import { PermissionFormDialog } from '../access/PermissionFormDialog'

/**
 * Kartu "Permission": daftar permission aplikasi dikelompokkan per modul,
 * dengan tambah/ubah/hapus. Kode tidak bisa diubah (dipakai literal di route API).
 * Permission: permission:create, permission:update, permission:delete.
 */
export function AppPermissionsCard({ app }: { app: ApplicationDetail }) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const canCreate = can('permission:create')
  const canUpdate = can('permission:update')
  const canDelete = can('permission:delete')
  const [form, setForm] = useState<{ open: boolean; permission: PermissionListItem | null }>({ open: false, permission: null })
  const [deleting, setDeleting] = useState<PermissionListItem | null>(null)
  const [search, setSearch] = useState('')

  // Satu permintaan memuat seluruh permission aplikasi (limit 200 = maksimum API).
  const permissions = useQuery({
    queryKey: ['/permissions', 'by-app', app.id],
    queryFn: () => permissionService.listByApp(app.id),
  })

  const remove = useMutation({
    mutationFn: (p: PermissionListItem) => permissionService.remove(p.id),
    onSuccess: (_, p) => {
      toast.success(`Permission ${p.code} dihapus`)
      void qc.invalidateQueries({ queryKey: ['/permissions'] })
      void qc.invalidateQueries({ queryKey: ['/applications', app.id] })
      setDeleting(null)
    },
    onError: (e) => toast.error('Gagal menghapus permission', { description: apiErrorMessage(e) }),
  })

  const rows = useMemo(() => permissions.data ?? [], [permissions.data])
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? rows.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) : rows
    const map = new Map<string, PermissionListItem[]>()
    for (const p of filtered) map.set(p.module, [...(map.get(p.module) ?? []), p])
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows, search])

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Permission</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {permissions.isPending
              ? '…'
              : search
                ? `${groups.reduce((n, [, items]) => n + items.length, 0)} dari ${rows.length} permission`
                : `${rows.length} permission · ${groups.length} modul`}
          </p>
        </div>
        {/* flex-wrap: pencarian + tombol tidak muat sebaris di 375px. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama"
              aria-label="Cari permission"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
          {canCreate && app.isActive && (
            <Button size="sm" variant="create" onClick={() => setForm({ open: true, permission: null })}>
              <Plus />
              Tambah permission
            </Button>
          )}
        </div>
      </div>

      {permissions.error ? (
        <div className="p-4">
          <ErrorState message={apiErrorMessage(permissions.error)} onRetry={() => void permissions.refetch()} />
        </div>
      ) : permissions.isPending ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Key className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">{search ? 'Tidak ada hasil' : 'Belum ada permission'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? 'Ubah kata kunci pencarian.' : 'Permission dicek oleh route API lewat requirePermission.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {groups.map(([module, items]) => (
            <div key={module} className="px-4 py-3.5">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-semibold">{module}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </div>
              <ul className="grid gap-1.5 xl:grid-cols-2">
                {items.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-2 rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Nama dibiarkan turun baris: label ini yang dibaca operator. */}
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground" title={p.code}>
                        {p.code}
                      </div>
                    </div>
                    <span
                      className="mt-0.5 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
                      title={`${p.roleCount} role memakai · ${p.menuCount} menu bergantung`}
                    >
                      {p.roleCount} role
                    </span>
                    {(canUpdate || canDelete) && (
                      <div className="flex shrink-0 items-center">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Ubah permission ${p.code}`}
                            onClick={() => setForm({ open: true, permission: p })}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus permission ${p.code}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {form.open && (
        <PermissionFormDialog
          applicationId={app.id}
          permission={form.permission}
          onClose={() => setForm({ open: false, permission: null })}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ['/permissions'] })
            void qc.invalidateQueries({ queryKey: ['/applications', app.id] })
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        pending={remove.isPending}
        title={`Hapus permission ${deleting?.code}?`}
        description={
          deleting && (
            <span className="space-y-1.5">
              <span className="block">Permission dihapus permanen. Dampaknya:</span>
              <span className="block text-xs">
                · Dicabut dari {deleting.roleCount} role{deleting.roleCount > 0 && ' — role itu kehilangan izin ini'}
              </span>
              <span className="block text-xs">
                · {deleting.menuCount} menu yang memakainya jadi terbuka tanpa pembatas
              </span>
            </span>
          )
        }
        confirmLabel="Hapus"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </section>
  )
}
