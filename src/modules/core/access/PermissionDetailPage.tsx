import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Shield, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { permissionService } from '@/services/permission.service'
import { apiErrorMessage, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { PermissionFormDialog } from './PermissionFormDialog'
import { useAccessActions } from './use-access-actions'
import { PERMISSIONS_LIST, ROLE_DETAIL } from './paths'

// GET /permissions/:id — PermissionDetailShape: metadata + role yang memegangnya
// + menu yang memakai permission ini sebagai pembatas visibilitas.
export function PermissionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const act = useAccessActions(undefined, () => navigate(PERMISSIONS_LIST))

  const { data: p, isPending, error, refetch } = useQuery({
    queryKey: ['/permissions', id],
    queryFn: () => permissionService.get(id),
  })

  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const can = useAuthStore((s) => s.hasPermission)
  const canUpdate = isSuperAdmin || can('permission:update')
  const canDelete = isSuperAdmin || can('permission:delete')

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
      <Link to={PERMISSIONS_LIST}>
        <ArrowLeft />
        Permission
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
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    )

  return (
    <>
      {back}
      <PageHeader
        title={p.name}
        description={<span className="font-mono text-xs text-muted-foreground">{p.code}</span>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <Button variant="edit" onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => act.askPermissionDelete(p)}>
                <Trash2 />
                Hapus
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Informasi Permission</h2>
          <dl className="divide-y divide-border text-sm">
            <Row label="Kode">
              <span className="font-mono text-xs tabular-nums">{p.code}</span>
            </Row>
            <Row label="Modul">{p.module}</Row>
            <Row label="Aplikasi">{p.applicationCode}</Row>
            <Row label="Dipakai role">{p.roleCount}</Row>
            <Row label="Dipakai menu">{p.menuCount}</Row>
            <Row label="Dibuat">{formatDate(p.createdAt)}</Row>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Role yang memakai</h2>
              <p className="text-xs text-muted-foreground tabular-nums">{p.roles.length} role</p>
            </div>
            {p.roles.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Shield className="mx-auto size-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-medium">Belum dipakai role mana pun</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Permission yang tidak dipegang role tidak memberi izin kepada siapa pun.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {p.roles.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={ROLE_DETAIL(r.id)}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <span className="font-mono text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-primary underline-offset-2 hover:underline">Lihat role</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Menu yang dibatasi</h2>
              <p className="text-xs text-muted-foreground tabular-nums">{p.menus.length} menu</p>
            </div>
            {p.menus.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium">Tidak ada menu yang memakainya</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Permission ini hanya dicek route API, bukan pembatas visibilitas menu.
                </p>
              </div>
            ) : (
              <ul className="grid gap-1.5 p-4 sm:grid-cols-2">
                {p.menus.map((m) => (
                  <li key={m.id} className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 text-sm">
                    {m.label}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {editOpen && <PermissionFormDialog permission={p} onClose={() => setEditOpen(false)} onSaved={() => void refetch()} />}
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
