import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  Key,
  Layers,
  ListTree,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { applicationService } from '@/services/application.service'
import { apiErrorMessage, formatDate, formatDateTime } from '@/lib/utils'
import { MenuIcon } from '@/components/shared/MenuIcon'
import { applicationKeys } from '@/lib/query-keys'
import { AssetGrid } from './AssetCard'
import { useAuthStore } from '@/stores/auth-store'
import { useApplicationActions } from './use-application-actions'
import { ApplicationFormDialog } from './ApplicationFormDialog'
import { AppRolesCard } from './AppRolesCard'
import { AppPermissionsCard } from './AppPermissionsCard'
import { AppUsersCard } from './AppUsersCard'
import { AppMenusCard } from './AppMenusCard'
import { appUsersKey, fetchAppUsers } from './app-users'
import { APPLICATIONS_LIST } from './application-paths'

const LIST = APPLICATIONS_LIST

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
  // Tab disimpan di URL agar tautan/segarkan tetap membuka tab yang sama.
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'roles'
  const setTab = (value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', value)
        return next
      },
      { replace: true },
    )

  const can = useAuthStore((s) => s.hasPermission)
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const canUpdate = isSuperAdmin || can('application:update')

  const {
    data: app,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationService.get(id),
  })

  // Diambil di sini, bukan di dalam AppUsersCard: angkanya dipakai tab dan kartunya.
  // Satu queryKey → satu permintaan, dan angkanya ikut ter-refresh setelah penugasan berubah.
  const users = useQuery({
    queryKey: appUsersKey(id),
    queryFn: () => fetchAppUsers(id),
    enabled: !!id,
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

  const { counts, settings } = app
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
              <Button variant="edit" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {act.canToggle(app) && (
              <Button
                variant={app.isActive ? 'outline' : 'success'}
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
                variant="destructive"
                size="sm"
                onClick={() => act.askDelete(app)}
                className="gap-1.5"
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

      {/* grid-cols-1 wajib: tanpa itu kolom tunggal berukuran max-content dan melebarkan halaman di mobile. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
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
              <Row label="Ikon Launcher">
                <span className="inline-flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded border border-border bg-muted/40 text-primary">
                    <MenuIcon name={app.icon} className="size-3.5" />
                  </span>
                  <span className="font-mono text-xs tabular-nums">{app.icon || 'layout-grid'}</span>
                </span>
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

          {/* Aset Visual — ringkas di kolom kiri. Versi besar (4 kartu lebar)
              memakan ruang berlebih; di sini cukup strip pratinjau kecil, dan
              detail penuh (URL/fileId) ada di modal saat kartu diklik. */}
          <section className="rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Aset Visual</h2>
            <AssetGrid
              items={[
                { label: 'Logo Utama', url: app.logoUrl, fileId: app.logoFileId, hint: 'App Switcher & sidebar' },
                { label: 'Logo Gelap', url: app.logoDarkUrl, fileId: app.logoDarkFileId, hint: 'Mode gelap', tint: 'dark' },
                { label: 'Favicon', url: app.faviconUrl, fileId: app.faviconFileId, hint: 'Ikon tab browser' },
                { label: 'Open Graph', url: app.ogImageUrl, fileId: app.ogImageFileId, hint: 'Pratinjau tautan' },
              ]}
            />
          </section>
        </div>

        {/* Kolom Kanan: Role / Permission / Menu / Pengguna. */}
        <div className="min-w-0">
          <Tabs defaultValue="roles" value={tab} onValueChange={setTab}>
            {/* Tanpa override: pengaturan lebar/lipat ada di komponen TabsList. */}
            <TabsList>
              <TabsTrigger value="roles">
                <Shield className="size-4" />
                Role
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">{counts.roles}</span>
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <Key className="size-4" />
                Permission
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">{counts.permissions}</span>
              </TabsTrigger>
              {/* Angka = jumlah pengguna sungguhan (superadmin + yang punya penugasan), bukan
                  `counts.userAppRoles` yang hanya menghitung penugasan. */}
              <TabsTrigger value="menus">
                <ListTree className="size-4" />
                Menu
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">{counts.menuItems}</span>
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="size-4" />
                Pengguna
                {users.data && (
                  <span className="ml-1 text-xs tabular-nums text-muted-foreground">{users.data.rows.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="mt-4">
              <AppRolesCard app={app} />
            </TabsContent>
            <TabsContent value="permissions" className="mt-4">
              <AppPermissionsCard app={app} />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <AppUsersCard app={app} data={users.data} />
            </TabsContent>
            <TabsContent value="menus" className="mt-4">
              <AppMenusCard app={app} />
            </TabsContent>
          </Tabs>
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
