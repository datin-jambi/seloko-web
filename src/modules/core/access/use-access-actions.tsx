import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { roleService } from '@/services/role.service'
import { permissionService } from '@/services/permission.service'
import { apiErrorMessage } from '@/lib/utils'

type RoleTarget = { id: string; name: string; isActive: boolean; userCount: number }
type PermissionTarget = { id: string; code: string; roleCount: number; menuCount: number }

type Pending =
  | { kind: 'role-toggle'; role: RoleTarget }
  | { kind: 'role-delete'; role: RoleTarget }
  | { kind: 'permission-delete'; permission: PermissionTarget }
  | null

/** Invalidate daftar (lintas aplikasi) + detail aplikasi agar angka di tab ikut segar. */
function useRefresh() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['/roles'] })
    void qc.invalidateQueries({ queryKey: ['/permissions'] })
    void qc.invalidateQueries({ queryKey: ['/applications'] })
  }
}

/**
 * Aksi role (aktif/nonaktif, hapus) + permission (hapus) beserta dialog konfirmasinya.
 * Dipakai halaman daftar (all) dan halaman detail. Permission mengikuti roles.routes.ts
 * (`role:update`, `role:delete`) dan permissions.routes.ts (`permission:delete`).
 */
export function useAccessActions(onRoleDeleted?: () => void, onPermissionDeleted?: () => void) {
  const refresh = useRefresh()
  const [pending, setPending] = useState<Pending>(null)
  const done = () => {
    refresh()
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (r: RoleTarget) => roleService.setActive(r.id, !r.isActive),
    onSuccess: (_, r) => {
      toast.success(r.isActive ? `Role ${r.name} dinonaktifkan` : `Role ${r.name} diaktifkan`)
      done()
    },
    onError: (e) => toast.error('Gagal mengubah status role', { description: apiErrorMessage(e) }),
  })

  const removeRole = useMutation({
    mutationFn: (r: RoleTarget) => roleService.remove(r.id),
    onSuccess: (_, r) => {
      toast.success(`Role ${r.name} dihapus`)
      done()
      onRoleDeleted?.()
    },
    onError: (e) => toast.error('Gagal menghapus role', { description: apiErrorMessage(e) }),
  })

  const removePermission = useMutation({
    mutationFn: (p: PermissionTarget) => permissionService.remove(p.id),
    onSuccess: (_, p) => {
      toast.success(`Permission ${p.code} dihapus`)
      done()
      onPermissionDeleted?.()
    },
    onError: (e) => toast.error('Gagal menghapus permission', { description: apiErrorMessage(e) }),
  })

  const busy = toggle.isPending || removeRole.isPending || removePermission.isPending

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(o) => !o && setPending(null)}
      pending={busy}
      {...(pending?.kind === 'role-delete'
        ? {
            title: `Hapus role ${pending.role.name}?`,
            description:
              pending.role.userCount > 0
                ? `Role ini masih dipegang ${pending.role.userCount} pengguna. API akan menolak sampai seluruh penugasan dicabut.`
                : 'Role beserta daftar permission-nya dihapus permanen. Pengguna tidak terpengaruh karena belum ada yang memakainya.',
            confirmLabel: 'Hapus',
            destructive: true,
            onConfirm: () => removeRole.mutate(pending.role),
          }
        : pending?.kind === 'role-toggle'
          ? {
              title: pending.role.isActive ? `Nonaktifkan role ${pending.role.name}?` : `Aktifkan role ${pending.role.name}?`,
              description: pending.role.isActive
                ? 'Role nonaktif tidak lagi memberi izin, meski penugasannya masih tersimpan.'
                : 'Role aktif kembali memberi izin kepada seluruh pengguna yang memegangnya.',
              confirmLabel: pending.role.isActive ? 'Nonaktifkan' : 'Aktifkan',
              destructive: pending.role.isActive,
              onConfirm: () => toggle.mutate(pending.role),
            }
          : pending?.kind === 'permission-delete'
            ? {
                title: `Hapus permission ${pending.permission.code}?`,
                description: `Permission dihapus permanen: dicabut dari ${pending.permission.roleCount} role, dan ${pending.permission.menuCount} menu yang memakainya menjadi terbuka tanpa pembatas.`,
                confirmLabel: 'Hapus',
                destructive: true,
                onConfirm: () => removePermission.mutate(pending.permission),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
    />
  )

  return {
    dialog,
    askRoleToggle: (role: RoleTarget) => setPending({ kind: 'role-toggle', role }),
    askRoleDelete: (role: RoleTarget) => setPending({ kind: 'role-delete', role }),
    askPermissionDelete: (permission: PermissionTarget) => setPending({ kind: 'permission-delete', permission }),
  }
}
