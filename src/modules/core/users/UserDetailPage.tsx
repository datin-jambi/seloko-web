import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trash2, UserCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { userService } from '@/services/user.service'
import { apiErrorMessage, formatDate, formatDateTime } from '@/lib/utils'
import { useUserActions } from './use-user-actions'

const LIST = '/seloko/pengguna'

// GET /users/:id — profil + penugasan role per aplikasi.
export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: u, isPending, error, refetch } = useQuery({
    queryKey: ['/users', id],
    queryFn: () => userService.get(id),
  })
  const act = useUserActions(() => navigate(LIST))

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
        description={u.email}
        actions={
          <>
            {act.canToggle(u) && (
              <Button variant="outline" onClick={() => act.askToggle(u)}>
                {u.isActive ? <UserX /> : <UserCheck />}
                {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
            {act.canDelete(u) && (
              <Button variant="outline" onClick={() => act.askDelete(u)} className="text-destructive hover:text-destructive">
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
                {u.isSuperAdmin && <Badge variant="info">Superadmin</Badge>}
              </div>
            </Row>
            <Row label="Jenis akun">{u.accountType === 'INTERNAL' ? 'Pegawai (internal)' : 'Warga (publik)'}</Row>
            <Row label="NIP" mono>{u.nip}</Row>
            <Row label="Username" mono>{u.username}</Row>
            <Row label="Telepon" mono>{u.phoneNumber}</Row>
            <Row label="Email terverifikasi">{u.emailVerifiedAt ? formatDate(u.emailVerifiedAt) : 'Belum'}</Row>
            <Row label="Login terakhir">{formatDateTime(u.lastLoginAt)}</Row>
            <Row label="Terdaftar">{formatDate(u.createdAt)}</Row>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <h2 className="flex items-baseline justify-between border-b border-border px-4 py-3 text-sm font-semibold">
            Akses aplikasi
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {u.totalApplications} aplikasi · {u.totalRoles} role
            </span>
          </h2>
          {u.applications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {u.isSuperAdmin ? 'Superadmin mengakses semua aplikasi tanpa penugasan role.' : 'Belum punya role di aplikasi mana pun.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-table-head">
                <tr className="border-b-2 border-input text-left text-xs font-semibold text-foreground">
                  <th scope="col" className="h-9 px-4">Aplikasi</th>
                  <th scope="col" className="h-9 px-4">Role</th>
                  <th scope="col" className="h-9 px-4">Berlaku sampai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {u.applications.flatMap((app) =>
                  app.roles.map((r, i) => (
                    <tr key={r.id}>
                      <td className="h-10 px-4 align-middle">{i === 0 && <span className="font-medium">{app.name}</span>}</td>
                      <td className="h-10 px-4 align-middle">{r.roleName}</td>
                      <td className="h-10 px-4 align-middle text-muted-foreground">
                        {r.expiresAt ? formatDate(r.expiresAt) : 'Permanen'}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
      {act.dialog}
    </>
  )
}

function Row({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate tabular-nums' : 'min-w-0'}>{children ?? '—'}</dd>
    </div>
  )
}
