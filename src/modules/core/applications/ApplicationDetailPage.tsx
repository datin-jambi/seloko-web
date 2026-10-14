import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  Key,
  Layers,
  Power,
  PowerOff,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { applicationService } from '@/services/application.service'
import { apiErrorMessage, formatDate, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useApplicationActions } from './use-application-actions'
import { ApplicationFormDialog } from './ApplicationFormDialog'

const LIST = '/seloko/sistem/aplikasi'

function Row({
  label,
  children,
  mono,
}: {
  label: string
  children?: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-right text-foreground ${mono ? 'font-mono text-xs tabular-nums' : ''}`}>
        {children ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  )
}

export function ApplicationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)

  const can = useAuthStore((s) => s.hasPermission)
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const canUpdate = isSuperAdmin || can('application:update')

  const {
    data: app,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/applications', id],
    queryFn: () => applicationService.get(id),
  })

  const act = useApplicationActions(() => navigate(LIST))

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
      <Link to={LIST}>
        <ArrowLeft className="h-4 w-4" />
        Daftar Aplikasi
      </Link>
    </Button>
  )

  if (error) {
    return (
      <>
        {back}
        <ErrorState message={apiErrorMessage(error)} onRetry={() => void refetch()} />
      </>
    )
  }

  if (isPending) {
    return (
      <>
        {back}
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    )
  }

  const { counts, roles = [], permissionsByModule = [], settings } = app
  const isSeloko = app.code === 'seloko'

  return (
    <>
      {back}
      <PageHeader
        title={app.name}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">[{app.code}]</span>
            {app.tagline && <span>· {app.tagline}</span>}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {act.canToggle(app) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => act.askToggle(app)}
                className="gap-1.5"
              >
                {app.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                {app.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
            {act.canDelete(app) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => act.askDelete(app)}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </Button>
            )}
          </div>
        }
      />

      {/* Ringkasan Entitas Terhubung */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Role</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{counts.roles}</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Key className="h-4 w-4 text-primary" />
            <span>Permission</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{counts.permissions}</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />
            <span>Menu Sidebar</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{counts.menuItems}</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Penugasan Pengguna</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{counts.userAppRoles}</div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Kolom Kiri: Metadata & Info Aplikasi */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
              Informasi Aplikasi
            </h2>
            <dl className="divide-y divide-border text-sm">
              <Row label="Status">
                <ActiveBadge active={app.isActive} />
              </Row>
              <Row label="Audiens">
                <Badge variant={app.audience === 'INTERNAL' ? 'neutral' : 'outline'}>
                  {app.audience === 'INTERNAL' ? 'Pegawai (Internal)' : 'Warga (Publik)'}
                </Badge>
              </Row>
              <Row label="Kode Aplikasi" mono>
                {app.code}
              </Row>
              <Row label="Base URL">
                {app.baseUrl ? (
                  <a
                    href={app.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    {app.baseUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </Row>
              <Row label="Ikon Launcher" mono>
                {app.icon || 'layout-grid'}
              </Row>
              <Row label="Didaftarkan">{formatDate(app.createdAt)}</Row>
              <Row label="Terakhir Diperbarui">{formatDateTime(app.updatedAt)}</Row>
            </dl>
          </section>

          {/* Deskripsi & Pengaturan Tambahan */}
          <section className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground">Deskripsi</h3>
            <p className="text-sm leading-relaxed text-foreground">
              {app.description || 'Tidak ada deskripsi tambahan.'}
            </p>

            {settings?.contact && (
              <div className="pt-3 border-t border-border space-y-1.5 text-xs">
                <h4 className="font-semibold text-muted-foreground">Kontak & Helpdesk</h4>
                {settings.contact.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{settings.contact.email}</span>
                  </div>
                )}
                {settings.contact.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telepon:</span>
                    <span>{settings.contact.phone}</span>
                  </div>
                )}
              </div>
            )}

            {isSeloko && (
              <div className="rounded border border-primary/20 bg-primary/5 p-2.5 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Aplikasi Gateway Inti:</strong> Seloko adalah aplikasi induk pengelola autentikasi dan otorisasi ekosistem.
              </div>
            )}
          </section>
        </div>

        {/* Kolom Kanan: Role & Permission Terdaftar */}
        <div className="space-y-6">
          {/* Daftar Role */}
          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Daftar Role</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {roles.length} role terdaftar
              </span>
            </div>

            {roles.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Belum ada role yang didaftarkan untuk aplikasi ini.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{r.name}</span>
                        {r.isSystemRole && <Badge variant="outline">Sistem</Badge>}
                        <ActiveBadge active={r.isActive} />
                      </div>
                      {r.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground tabular-nums">
                      {r.permissionCount} permission
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Daftar Permission per Modul */}
          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Permission per Modul</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {permissionsByModule.length} modul
              </span>
            </div>

            {permissionsByModule.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Belum ada permission yang didaftarkan untuk aplikasi ini.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {permissionsByModule.map((group) => (
                  <div key={group.module} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Modul: <span className="font-mono">{group.module}</span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {group.permissions.length} hak akses
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.permissions.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-medium truncate">{p.name}</span>
                          <span className="font-mono text-xs text-muted-foreground shrink-0 ml-2">
                            {p.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ApplicationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={app}
        onSuccess={() => void refetch()}
      />
      {act.dialog}
    </>
  )
}
