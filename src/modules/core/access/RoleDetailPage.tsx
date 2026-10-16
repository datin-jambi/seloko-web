import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Pencil, Power, PowerOff, Trash2, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { roleService } from '@/services/role.service'
import { apiErrorMessage, formatDate, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { RoleFormDialog } from './RoleFormDialog'
import { useAccessActions } from './use-access-actions'
import { ROLES_LIST } from './paths'

// GET /roles/:id — RoleDetailShape: metadata role + SELURUH permission aplikasi
// bertanda `granted`. Penugasan pengguna per role tidak punya endpoint; angkanya
// dilaporkan lewat `userCount`.
export function RoleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const act = useAccessActions(() => navigate(ROLES_LIST))

  const { data: r, isPending, error, refetch } = useQuery({
    queryKey: ['/roles', id],
    queryFn: () => roleService.get(id),
  })

  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const can = useAuthStore((s) => s.hasPermission)
  const canUpdate = isSuperAdmin || can('role:update')
  const canDelete = isSuperAdmin || can('role:delete')

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
      <Link to={ROLES_LIST}>
        <ArrowLeft />
        Role
      </Link>
    </Button>
  )

  if (error)
    return (
      <>
        {back}
        <ErrorState message={apiErrorMessage(error)} onRetry={() => void refetch()} />
      </>
    )

  if (isPending)
    return (
      <>
        {back}
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    )

  // Hanya modul yang punya minimal satu permission dipegang yang ditampilkan.
  const grantedGroups = r.permissionsByModule
    .map((g) => ({ module: g.module, permissions: g.permissions.filter((p) => p.granted) }))
    .filter((g) => g.permissions.length > 0)

  return (
    <>
      {back}
      <PageHeader
        title={r.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{r.applicationName}</span>
            {r.isSystemRole && <Badge variant="outline">Sistem</Badge>}
            <Badge variant={r.audience === 'INTERNAL' ? 'neutral' : 'outline'}>
              {r.audience === 'INTERNAL' ? 'Internal' : 'Publik'}
            </Badge>
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <Button variant="edit" onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
            )}
            {canUpdate && (
              <Button variant={r.isActive ? 'outline' : 'success'} onClick={() => act.askRoleToggle(r)}>
                {r.isActive ? <PowerOff /> : <Power />}
                {r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => act.askRoleDelete(r)}>
                <Trash2 />
                Hapus
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Permission</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{r.permissionCount}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Pengguna</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{r.userCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Informasi Role</h2>
          <dl className="divide-y divide-border text-sm">
            <Row label="Status">
              <ActiveBadge active={r.isActive} />
            </Row>
            <Row label="Aplikasi">{r.applicationName}</Row>
            <Row label="Jenis">{r.isSystemRole ? 'Sistem' : 'Kustom'}</Row>
            <Row label="Audiens">{r.audience === 'INTERNAL' ? 'Internal (pegawai)' : 'Publik (warga)'}</Row>
            <Row label="Dibuat">{formatDate(r.createdAt)}</Row>
            <Row label="Diperbarui">{formatDateTime(r.updatedAt)}</Row>
          </dl>
          {r.description && (
            <div className="border-t border-border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground">Deskripsi</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{r.description}</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Permission yang dipegang</h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {r.permissionCount} permission · {grantedGroups.length} modul
            </p>
          </div>
          {grantedGroups.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <KeyRound className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium">Belum ada permission</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Role tanpa permission hanya menandai akses ke aplikasi — ubah role untuk menambah izin.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {grantedGroups.map((g) => (
                <div key={g.module} className="px-4 py-3.5">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-xs font-semibold">{g.module}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{g.permissions.length}</span>
                  </div>
                  <ul className="grid gap-1.5 xl:grid-cols-2">
                    {g.permissions.map((p) => (
                      <li key={p.id} className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="truncate font-mono text-xs text-muted-foreground" title={p.code}>
                          {p.code}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editOpen && <RoleFormDialog role={r} onClose={() => setEditOpen(false)} onSaved={() => void refetch()} />}
      {act.dialog}
    </>
  )
}

function Row({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}
