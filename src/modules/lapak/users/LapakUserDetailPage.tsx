import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Info, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ForbiddenPage } from '@/components/shared/ForbiddenPage'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/modules/core/users/UserAvatar'
import { AccountTypeBadge, SuperAdminBadge } from '@/modules/core/users/AccountTypeBadge'
import { lapakUserService } from '@/services/lapak/user.service'
import { lapakProductService } from '@/services/lapak/product.service'
import { lapakKeys } from '@/lib/query-keys'
import { formatDateTime } from '@/lib/utils'
import { useLapakAccess } from '../lapak-access'
import { LapakUserFormDialog } from './LapakUserFormDialog'
import type { LapakUserRole } from '@/types/lapak'

/**
 * Lingkup OPD satu penugasan role. `organizations` kosong = berlaku untuk
 * SELURUH OPD (penugasan level Bapenda), bukan "tanpa akses".
 */
function roleScope(role: LapakUserRole): string {
  if (role.organizations.length === 0) return 'Semua OPD'
  return role.organizations.map((o) => o.name).join(', ')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  )
}

/**
 * Detail satu pengguna Lapak — `/lapak-jambi/users/:id`.
 *
 * Datanya satu baris `GET /lapak/users/:id` (server menolak 404 bila pengguna
 * bukan anggota Lapak). Semua yang tampil di sini baca-saja; perubahan lewat
 * dialog Ubah, dan username/email/jenis akun memang tidak bisa diubah di sini.
 */
export function LapakUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const access = useLapakAccess()
  const { pathname } = useLocation()
  const basePath = pathname.replace(/\/[^/]+$/, '')
  const [editing, setEditing] = useState(false)

  const user = useQuery({
    queryKey: ['lapak', 'users', 'detail', id],
    queryFn: () => lapakUserService.get(id as string),
    enabled: access.canManage && !!id,
  })
  const opds = useQuery({
    queryKey: [...lapakKeys.opd, 'pilihan'],
    queryFn: () => lapakProductService.organizationChoices(),
    staleTime: 5 * 60_000,
    enabled: access.canManage && editing,
  })

  if (!access.isLoading && !access.canManage) return <ForbiddenPage />

  const backLink = (
    <Button variant="outline" asChild>
      <Link to={basePath}>
        <ArrowLeft />
        Kembali
      </Link>
    </Button>
  )

  if (user.isPending) {
    return (
      <>
        <PageHeader title="Detail pengguna Lapak" actions={backLink} />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" aria-busy="true" />
      </>
    )
  }

  if (user.isError || !user.data) {
    return (
      <>
        <PageHeader title="Detail pengguna Lapak" actions={backLink} />
        {user.error && (user.error as { response?: { status?: number } }).response?.status === 404 ? (
          <EmptyState
            title="Pengguna tidak ditemukan"
            description="Akun ini tidak punya penugasan role aktif di aplikasi Lapak Jambi."
          />
        ) : (
          <ErrorState message="Detail pengguna gagal dimuat." onRetry={() => void user.refetch()} />
        )}
      </>
    )
  }

  const u = user.data

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <UserAvatar name={u.fullName} src={u.avatarUrl} size="md" />
            {u.fullName}
            <AccountTypeBadge type={u.accountType} />
            {u.isSuperAdmin && <SuperAdminBadge />}
            <ActiveBadge active={u.isActive} />
          </span>
        }
        description={
          <span className="break-all">
            {u.email}
            {u.username ? ` · ${u.username}` : ''}
          </span>
        }
        actions={
          <>
            {backLink}
            <Button variant="edit" onClick={() => setEditing(true)}>
              <Pencil />
              Ubah
            </Button>
          </>
        }
      />

      <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Username, email, dan jenis akun terkunci di Lapak Jambi.</span>{' '}
          Ketiganya bagian dari identitas akun pusat — hubungi admin <strong>Seloko</strong> (menu Pengguna) untuk
          mengubahnya. Di sini hanya nama, NIP, telepon, role Lapak, dan kata sandi yang bisa diubah.
        </p>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Identitas</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Jenis akun">
              <AccountTypeBadge type={u.accountType} />
            </Field>
            <Field label="Username">
              {u.username ? <span className="font-mono">{u.username}</span> : <span className="text-muted-foreground">— (akun eksternal)</span>}
            </Field>
            <Field label="Email">
              <span className="break-all">{u.email}</span>
            </Field>
            <Field label="NIP">
              {u.nip ? <span className="font-mono tabular-nums">{u.nip}</span> : <span className="text-muted-foreground">—</span>}
            </Field>
            <Field label="Telepon">
              {u.phoneNumber ?? <span className="text-muted-foreground">—</span>}
            </Field>
            <Field label="Email terverifikasi">
              {u.emailVerifiedAt ? formatDateTime(u.emailVerifiedAt) : <span className="text-muted-foreground">Belum</span>}
            </Field>
            <Field label="Terdaftar">{formatDateTime(u.createdAt)}</Field>
            <Field label="Login terakhir">
              {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : <span className="text-muted-foreground">Belum pernah</span>}
            </Field>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Akses Lapak</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {u.roles.length} penugasan
            </span>
          </div>
          {u.roles.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Tidak ada penugasan role aktif di aplikasi Lapak.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {u.roles.map((role) => (
                <li key={role.assignmentId} className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Badge variant="outline">{role.roleName}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{roleScope(role)}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {role.expiresAt ? (
                      <span>Berakhir {formatDateTime(role.expiresAt)}</span>
                    ) : (
                      <span>Tanpa batas waktu</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Role aplikasi lain tidak ditampilkan di sini. Perubahan role Lapak lewat tombol <strong>Ubah</strong>.
          </p>
        </section>
      </div>

      {editing && (
        <LapakUserFormDialog
          key={u.id}
          open={editing}
          onOpenChange={setEditing}
          user={u}
          opds={(opds.data ?? []).map((o) => ({ id: o.id, name: o.name }))}
          onSaved={() => void user.refetch()}
        />
      )}
    </>
  )
}
