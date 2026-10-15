import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { userService } from '@/services/user.service'
import { apiErrorMessage, formatDate, formatDateTime } from '@/lib/utils'
import { useUserActions } from './use-user-actions'
import { USER_EDIT, USERS_LIST as LIST } from './user-form'
import { UserRolesCard } from './UserRolesCard'
import { useAuthStore } from '@/stores/auth-store'
import { AccountTypeBadge, SuperAdminBadge } from './AccountTypeBadge'


// GET /users/:id — profil + penugasan role per aplikasi.
export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: u, isPending, error, refetch } = useQuery({
    queryKey: ['/users', id],
    queryFn: () => userService.get(id),
  })
  const act = useUserActions(() => navigate(LIST))
  const canEdit = useAuthStore((s) => s.hasPermission('user:update'))

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
      <Link to={LIST}>
        <ArrowLeft />
        Pengguna
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
        <div className="mt-6 h-64 animate-pulse rounded-lg bg-muted" />
      </>
    )

  return (
    <>
      {back}
      <PageHeader
        title={u.fullName}
        description={<span className="break-all">{u.email}</span>}
        actions={
          <>
            {canEdit && (
              <Button variant="edit" asChild>
                <Link to={USER_EDIT(u.id)}>
                  <Pencil />
                  Ubah
                </Link>
              </Button>
            )}
            {act.canToggle(u) && (
              <Button variant={u.isActive ? 'outline' : 'success'} onClick={() => act.askToggle(u)}>
                {u.isActive ? <UserX /> : <UserCheck />}
                {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
            {act.canDelete(u) && (
              <Button variant="destructive" onClick={() => act.askDelete(u)}>
                <Trash2 />
                Hapus
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Profil</h2>
          <dl className="divide-y divide-border text-sm">
            <Row label="Status">
              <div className="flex flex-wrap gap-1.5">
                <ActiveBadge active={u.isActive} />
                {u.isSuperAdmin && <SuperAdminBadge />}
              </div>
            </Row>
            <Row label="Jenis akun">
              <AccountTypeBadge type={u.accountType} />
            </Row>
            <Row label="NIP" mono>{u.nip}</Row>
            <Row label="Username" mono>{u.username}</Row>
            <Row label="Telepon" mono>{u.phoneNumber}</Row>
            <Row label="Email terverifikasi">{u.emailVerifiedAt ? formatDate(u.emailVerifiedAt) : 'Belum'}</Row>
            <Row label="Login terakhir">{formatDateTime(u.lastLoginAt)}</Row>
            <Row label="Terdaftar">{formatDate(u.createdAt)}</Row>
          </dl>
        </section>

        <UserRolesCard user={u} />
      </div>
      {act.dialog}
    </>
  )
}

function Row({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      {/* NIP/ID dibiarkan turun baris, bukan dipotong — harus terbaca utuh. */}
      <dd className={mono ? 'break-all tabular-nums' : 'min-w-0'}>{children ?? '—'}</dd>
    </div>
  )
}
