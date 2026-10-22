import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarClock, Loader2, Plus, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormField } from '@/components/shared/FormField'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage, formatDate } from '@/lib/utils'
import type { UserDetail } from '@/types/core'
import { AppMark } from './AppMark'

type Assignment = { id: string; roleName: string; appName: string }

/**
 * Kartu "Akses aplikasi" di detail pengguna: role per aplikasi + tugaskan/cabut.
 * Permission: user-app-role:create / user-app-role:delete (users.routes.ts).
 */
export function UserRolesCard({ user }: { user: UserDetail }) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const canAssign = can('user-app-role:create')
  const canRevoke = can('user-app-role:delete')
  const [assignOpen, setAssignOpen] = useState(false)
  const [revoking, setRevoking] = useState<Assignment | null>(null)

  const refresh = () => qc.invalidateQueries({ queryKey: ['/users'] })

  const revoke = useMutation({
    mutationFn: (a: Assignment) => userService.revokeRole(user.id, a.id),
    onSuccess: (_, a) => {
      toast.success(`Role ${a.roleName} dicabut dari ${a.appName}`)
      setRevoking(null)
      void refresh()
    },
    onError: (e) => toast.error('Gagal mencabut role', { description: apiErrorMessage(e) }),
  })

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Akses aplikasi</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {user.totalApplications} aplikasi · {user.totalRoles} role
          </p>
        </div>
        {canAssign && user.isActive && (
          <Button size="sm" variant="create" onClick={() => setAssignOpen(true)}>
            <Plus />
            Tugaskan role
          </Button>
        )}
      </div>

      {user.applications.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">
            {user.isSuperAdmin ? 'Akses penuh sebagai superadmin' : 'Belum punya akses aplikasi'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.isSuperAdmin
              ? 'Superadmin tidak memerlukan penugasan role.'
              : 'Tugaskan role agar pengguna bisa masuk ke aplikasi.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {user.applications.map((app) => (
            <li key={app.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start">
              <div className="flex min-w-0 items-center gap-2.5 sm:w-56 sm:shrink-0">
                <AppMark code={app.code} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{app.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{app.code}</div>
                </div>
              </div>
              <ul className="flex flex-1 flex-wrap gap-2">
                {app.roles.map((r) => (
                  <li
                    key={r.id}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/50 pl-2.5 pr-1 text-sm"
                  >
                    <span className="font-medium">{r.roleName}</span>
                    {r.expiresAt && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        title={`Berlaku sampai ${formatDate(r.expiresAt)}`}
                      >
                        <CalendarClock className="size-3.5" />
                        {formatDate(r.expiresAt)}
                      </span>
                    )}
                    {canRevoke ? (
                      <button
                        type="button"
                        aria-label={`Cabut role ${r.roleName} di ${app.name}`}
                        onClick={() => setRevoking({ id: r.id, roleName: r.roleName, appName: app.name })}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : (
                      <span className="w-1" />
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {assignOpen && <AssignRoleDialog user={user} onClose={() => setAssignOpen(false)} onDone={refresh} />}
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        pending={revoke.isPending}
        title="Cabut role?"
        description={
          revoking &&
          `${user.fullName} kehilangan akses role ${revoking.roleName} di ${revoking.appName}. Perubahan langsung berlaku.`
        }
        confirmLabel="Cabut"
        destructive
        onConfirm={() => revoking && revoke.mutate(revoking)}
      />
    </section>
  )
}

function AssignRoleDialog({ user, onClose, onDone }: { user: UserDetail; onClose: () => void; onDone: () => void }) {
  const [appId, setAppId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [expires, setExpires] = useState('')
  // Batas bawah input tanggal, dihitung sekali saat dialog dibuka (tanggal lokal, bukan UTC).
  const [today] = useState(() => new Date().toLocaleDateString('sv-SE'))

  const apps = useQuery({ queryKey: ['/applications', 'active'], queryFn: userService.activeApps, staleTime: 5 * 60_000 })
  // Hanya role dengan audiens sama dengan jenis akun (API menolak yang lain).
  const roles = useQuery({
    queryKey: ['/roles', 'active', appId, user.accountType],
    queryFn: () => userService.activeRoles(appId, user.accountType),
    enabled: !!appId,
  })
  const held = new Set(user.applications.find((a) => a.id === appId)?.roles.map((r) => r.roleId))
  const choices = roles.data?.filter((r) => !held.has(r.id)) ?? []

  const assign = useMutation({
    mutationFn: () =>
      userService.assignRole(user.id, {
        applicationId: appId,
        roleId,
        // Tanggal = akhir hari (waktu lokal) agar berlaku penuh sampai tanggal itu.
        expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : undefined,
      }),
    onSuccess: () => {
      const role = roles.data?.find((r) => r.id === roleId)
      const app = apps.data?.find((a) => a.id === appId)
      toast.success(`Role ${role?.name} ditugaskan di ${app?.name}`)
      onDone()
      onClose()
    },
    onError: (e) => toast.error('Gagal menugaskan role', { description: apiErrorMessage(e) }),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && !assign.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tugaskan role</DialogTitle>
          <DialogDescription>
            Berikan akses {user.fullName} ke satu aplikasi. Hanya role untuk akun{' '}
            {user.accountType === 'INTERNAL' ? 'internal' : 'eksternal'} yang ditampilkan.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
        <form
          id="assign-role"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (appId && roleId) assign.mutate()
          }}
        >
          <FormField id="assign-app" label="Aplikasi" required>
            <Select
              value={appId}
              onValueChange={(v) => {
                setAppId(v)
                setRoleId('')
              }}
              disabled={assign.isPending}
            >
              <SelectTrigger id="assign-app" className="w-full">
                <SelectValue placeholder={apps.isPending ? 'Memuat…' : 'Pilih aplikasi'} />
              </SelectTrigger>
              <SelectContent>
                {apps.data?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            id="assign-role-id"
            label="Role"
            required
            hint={
              appId && roles.data && choices.length === 0
                ? 'Tidak ada role tersisa untuk akun ini di aplikasi tersebut.'
                : undefined
            }
          >
            <Select value={roleId} onValueChange={setRoleId} disabled={!appId || roles.isPending || assign.isPending}>
              <SelectTrigger id="assign-role-id" className="w-full">
                <SelectValue
                  placeholder={!appId ? 'Pilih aplikasi dulu' : roles.isPending ? 'Memuat…' : 'Pilih role'}
                />
              </SelectTrigger>
              <SelectContent>
                {choices.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="assign-expires" label="Berlaku sampai" hint="Kosongkan untuk akses permanen">
            <Input
              id="assign-expires"
              type="date"
              min={today}
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              disabled={assign.isPending}
            />
          </FormField>
        </form>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" disabled={assign.isPending} onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="assign-role" variant="create" disabled={!appId || !roleId || assign.isPending}>
            {assign.isPending && <Loader2 className="animate-spin" />}
            Tugaskan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
