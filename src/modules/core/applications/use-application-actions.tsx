import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { applicationService } from '@/services/application.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'
import type { ApplicationListItem } from '@/types/core'

type Target = Pick<ApplicationListItem, 'id' | 'name' | 'code' | 'isActive'> & {
  counts?: { permissions: number; roles: number; menuItems: number; userAppRoles: number }
}

type Pending = { kind: 'toggle' | 'delete'; app: Target } | null

/**
 * Aksi aplikasi (aktif/nonaktif, hapus permanen) + dialog konfirmasinya.
 * Dipakai oleh ApplicationsPage dan ApplicationDetailPage.
 * Permission mengikuti applications.routes.ts: application:update, application:delete.
 */
export function useApplicationActions(onDeleted?: () => void) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const [pending, setPending] = useState<Pending>(null)

  const done = () => {
    void qc.invalidateQueries({ queryKey: ['/applications'] })
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (app: Target) => applicationService.setActive(app.id, !app.isActive),
    onSuccess: (_, app) => {
      toast.success(
        app.isActive
          ? `Aplikasi ${app.name} dinonaktifkan`
          : `Aplikasi ${app.name} diaktifkan`,
      )
      done()
    },
    onError: (e) =>
      toast.error('Gagal mengubah status aplikasi', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (app: Target) => applicationService.remove(app.id),
    onSuccess: (_, app) => {
      toast.success(`Aplikasi ${app.name} berhasil dihapus`)
      done()
      onDeleted?.()
    },
    onError: (e) =>
      toast.error('Gagal menghapus aplikasi', { description: apiErrorMessage(e) }),
  })

  const targetApp = pending?.app
  const counts = targetApp?.counts
  const hasRelations = counts && (counts.roles > 0 || counts.permissions > 0 || counts.menuItems > 0 || counts.userAppRoles > 0)

  const deleteWarning = hasRelations ? (
    <div className="space-y-2">
      <p>
        Aplikasi <strong className="text-foreground">{targetApp?.name}</strong> memiliki data terhubung:
      </p>
      <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
        {counts.roles > 0 && <li>{counts.roles} role</li>}
        {counts.permissions > 0 && <li>{counts.permissions} permission</li>}
        {counts.menuItems > 0 && <li>{counts.menuItems} menu navigasi</li>}
        {counts.userAppRoles > 0 && <li>{counts.userAppRoles} penugasan pengguna</li>}
      </ul>
      <p className="text-destructive font-medium text-xs">
        Menghapus aplikasi ini akan menghapus seluruh permission, role, dan menu terkait secara permanen!
      </p>
    </div>
  ) : (
    <span>
      Aplikasi <strong className="text-foreground">{targetApp?.name}</strong> ({targetApp?.code}) akan dihapus secara permanen beserta konfigurasinya.
    </span>
  )

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(open) => !open && setPending(null)}
      pending={toggle.isPending || remove.isPending}
      {...(pending?.kind === 'delete'
        ? {
            title: 'Hapus aplikasi?',
            description: deleteWarning,
            confirmLabel: 'Hapus Aplikasi',
            destructive: true,
            onConfirm: () => targetApp && remove.mutate(targetApp),
          }
        : {
            title: targetApp?.isActive ? 'Nonaktifkan aplikasi?' : 'Aktifkan aplikasi?',
            description: targetApp?.isActive
              ? `Aplikasi ${targetApp?.name} akan dinonaktifkan. Seluruh sesi pengguna pada aplikasi ini akan dicabut dan launcher tidak akan menampilkannya.`
              : `Aplikasi ${targetApp?.name} akan diaktifkan kembali dan dapat diakses sesuai hak akses masing-masing pengguna.`,
            confirmLabel: targetApp?.isActive ? 'Nonaktifkan' : 'Aktifkan',
            destructive: targetApp?.isActive,
            onConfirm: () => targetApp && toggle.mutate(targetApp),
          })}
    />
  )

  const hasUpdatePermission = isSuperAdmin || can('application:update')
  const hasDeletePermission = isSuperAdmin || can('application:delete')

  return {
    dialog,
    canToggle: (t: Target) => hasUpdatePermission && t.code !== 'seloko', // Lindungi gateway seloko agar tidak dikunci sendiri
    canDelete: (t: Target) => hasDeletePermission && t.code !== 'seloko',
    askToggle: (app: Target) => setPending({ kind: 'toggle', app }),
    askDelete: (app: Target) => setPending({ kind: 'delete', app }),
  }
}
