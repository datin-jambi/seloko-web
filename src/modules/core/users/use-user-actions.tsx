import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'

type Target = { id: string; fullName: string; isActive: boolean }
type Pending = { kind: 'toggle' | 'delete'; user: Target } | null

/**
 * Aksi akun (aktif/nonaktif, hapus) + dialog konfirmasinya. Dipakai daftar & detail.
 * Permission mengikuti users.routes.ts: user:update, user:delete. Akun sendiri tidak bisa diubah.
 */
export function useUserActions(onDeleted?: () => void) {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user?.id)
  const can = useAuthStore((s) => s.hasPermission)
  const [pending, setPending] = useState<Pending>(null)

  const done = () => {
    void qc.invalidateQueries({ queryKey: ['/users'] })
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (u: Target) => userService.setActive(u.id, !u.isActive),
    onSuccess: (_, u) => {
      toast.success(u.isActive ? `${u.fullName} dinonaktifkan` : `${u.fullName} diaktifkan`)
      done()
    },
    onError: (e) => toast.error('Gagal mengubah status', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (u: Target) => userService.remove(u.id),
    onSuccess: (_, u) => {
      toast.success(`${u.fullName} dihapus`)
      done()
      onDeleted?.()
    },
    onError: (e) => toast.error('Gagal menghapus pengguna', { description: apiErrorMessage(e) }),
  })

  const u = pending?.user
  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(o) => !o && setPending(null)}
      pending={toggle.isPending || remove.isPending}
      {...(pending?.kind === 'delete'
        ? {
            title: 'Hapus pengguna?',
            description: `${u?.fullName} tidak bisa masuk lagi dan hilang dari daftar. Riwayat aktivitasnya tetap tersimpan.`,
            confirmLabel: 'Hapus',
            destructive: true,
            onConfirm: () => u && remove.mutate(u),
          }
        : {
            title: u?.isActive ? 'Nonaktifkan pengguna?' : 'Aktifkan pengguna?',
            description: u?.isActive
              ? `${u?.fullName} tidak bisa masuk sampai diaktifkan kembali.`
              : `${u?.fullName} bisa masuk kembali sesuai role yang dimiliki.`,
            confirmLabel: u?.isActive ? 'Nonaktifkan' : 'Aktifkan',
            destructive: u?.isActive,
            onConfirm: () => u && toggle.mutate(u),
          })}
    />
  )

  return {
    dialog,
    canToggle: (t: Target) => can('user:update') && t.id !== me,
    canDelete: (t: Target) => can('user:delete') && t.id !== me,
    askToggle: (user: Target) => setPending({ kind: 'toggle', user }),
    askDelete: (user: Target) => setPending({ kind: 'delete', user }),
  }
}
