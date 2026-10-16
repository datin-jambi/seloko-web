import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound, Pencil, Plus, Power, PowerOff, Shield, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { roleService } from '@/services/role.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'
import type { ApplicationDetail, RoleListItem } from '@/types/core'
import { RoleFormDialog } from '../access/RoleFormDialog'

type Pending = { kind: 'toggle' | 'delete'; role: RoleListItem } | null

/**
 * Kartu "Role": daftar role aplikasi + tambah/ubah/aktif-nonaktif/hapus.
 * Permission: role:create, role:update, role:delete (roles.routes.ts).
 */
export function AppRolesCard({ app }: { app: ApplicationDetail }) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const canCreate = can('role:create')
  const canUpdate = can('role:update')
  const canDelete = can('role:delete')
  const [form, setForm] = useState<{ open: boolean; role: RoleListItem | null }>({ open: false, role: null })
  const [pending, setPending] = useState<Pending>(null)

  // `counts.roles` diabaikan: daftarnya diambil agar bisa langsung diedit.
  const roles = useQuery({
    queryKey: ['/roles', 'by-app', app.id],
    queryFn: () => roleService.listByApp(app.id),
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['/roles'] })
    void qc.invalidateQueries({ queryKey: ['/applications', app.id] })
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (r: RoleListItem) => roleService.setActive(r.id, !r.isActive),
    onSuccess: (_, r) => {
      toast.success(r.isActive ? `Role ${r.name} dinonaktifkan` : `Role ${r.name} diaktifkan`)
      refresh()
    },
    onError: (e) => toast.error('Gagal mengubah status role', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (r: RoleListItem) => roleService.remove(r.id),
    onSuccess: (_, r) => {
      toast.success(`Role ${r.name} dihapus`)
      refresh()
    },
    onError: (e) => toast.error('Gagal menghapus role', { description: apiErrorMessage(e) }),
  })

  const list = roles.data ?? []
  const busy = toggle.isPending || remove.isPending

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Role</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {roles.isPending ? '…' : `${list.length} role`} di aplikasi ini
          </p>
        </div>
        {canCreate && app.isActive && (
          <Button size="sm" variant="create" onClick={() => setForm({ open: true, role: null })}>
            <Plus />
            Tambah role
          </Button>
        )}
      </div>

      {roles.error ? (
        <div className="p-4">
          <ErrorState message={apiErrorMessage(roles.error)} onRetry={() => void roles.refetch()} />
        </div>
      ) : roles.isPending ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">Belum ada role</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Role mengelompokkan permission yang nanti diberikan ke pengguna.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium">{r.name}</span>
                  {r.isSystemRole && <Badge variant="neutral">Sistem</Badge>}
                  <ActiveBadge active={r.isActive} />
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <KeyRound className="size-3" />
                    {r.permissionCount} permission
                  </span>
                  <span className="tabular-nums">{r.userCount} pengguna</span>
                </p>
              </div>

              {(canUpdate || canDelete) && (
                <div className="flex shrink-0 items-center gap-1">
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Ubah role ${r.name}`}
                      onClick={() => setForm({ open: true, role: r })}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={r.isActive ? `Nonaktifkan role ${r.name}` : `Aktifkan role ${r.name}`}
                      onClick={() => setPending({ kind: 'toggle', role: r })}
                    >
                      {r.isActive ? <PowerOff /> : <Power />}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Hapus role ${r.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPending({ kind: 'delete', role: r })}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {form.open && (
        <RoleFormDialog
          applicationId={app.id}
          appAudience={app.audience}
          role={form.role}
          permissionGroups={app.permissionsByModule}
          onClose={() => setForm({ open: false, role: null })}
          onSaved={refresh}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={busy}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus role ${pending.role.name}?`,
              description:
                pending.role.userCount > 0
                  ? `Role ini masih dipegang ${pending.role.userCount} pengguna. API akan menolak sampai seluruh penugasan dicabut.`
                  : 'Role beserta daftar permission-nya dihapus permanen. Pengguna tidak terpengaruh karena belum ada yang memakainya.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => remove.mutate(pending.role),
            }
          : pending
            ? {
                title: pending.role.isActive ? `Nonaktifkan role ${pending.role.name}?` : `Aktifkan role ${pending.role.name}?`,
                description: pending.role.isActive
                  ? 'Role nonaktif tidak lagi memberi izin, meski penugasannya masih tersimpan.'
                  : 'Role aktif kembali memberi izin kepada seluruh pengguna yang memegangnya.',
                confirmLabel: pending.role.isActive ? 'Nonaktifkan' : 'Aktifkan',
                destructive: pending.role.isActive,
                onConfirm: () => toggle.mutate(pending.role),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </section>
  )
}
