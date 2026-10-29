import { PageHeader } from '@/components/shared/PageHeader'
import { AppLogo } from '@/components/shared/AppLogo'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Skeleton } from '@/components/shared/LoadingSkeleton'
import { useAuthStore } from '@/stores/auth-store'
import { useMyApplications } from '@/hooks/use-apps'
import { formatDate } from '@/lib/utils'
import type { ReactNode } from 'react'

/**
 * Profil akun yang sedang login — `/seloko/profile`.
 *
 * Sengaja tanpa endpoint baru: seluruh data identitas sudah ada di
 * `useAuthStore` (hasil `GET /auth/me`), dan daftar aplikasi datang dari
 * `GET /applications/me` (cache yang sama dengan App Switcher, jadi tidak ada
 * request tambahan).
 */
export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const roles = useAuthStore((s) => s.roles)
  const permissions = useAuthStore((s) => s.permissions)
  const { apps, isLoading } = useMyApplications()

  if (!user) return null

  return (
    <>
      <PageHeader
        title="Profil Saya"
        description="Identitas akun dan akses aplikasi yang Anda pegang."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Identitas</h2>
          <dl className="divide-y divide-border text-sm">
            <Row label="Status">
              <ActiveBadge active />
            </Row>
            <Row label="Nama lengkap">{user.fullName}</Row>
            <Row label="NIP" mono>
              {user.nip}
            </Row>
            <Row label="Username" mono>
              {user.username}
            </Row>
            <Row label="Email">{user.email}</Row>
            <Row label="Telepon" mono>
              {user.phoneNumber}
            </Row>
            <Row label="Jenis akun">{user.accountType === 'INTERNAL' ? 'Internal (pegawai)' : 'Publik'}</Row>
            <Row label="Super admin">{user.isSuperAdmin ? 'Ya — akses penuh' : 'Tidak'}</Row>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Akses aplikasi</h2>
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : apps.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Belum ada akses ke aplikasi mana pun.</p>
            ) : (
              <ul className="divide-y divide-border">
                {apps.map((app) => (
                  <li key={app.id} className="flex items-center gap-3 px-4 py-3">
                    <AppLogo app={app} size="lg" className="text-primary dark:text-white" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{app.name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {app.code} · {app.audience === 'INTERNAL' ? 'internal' : 'publik'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {app.roles.length > 0 ? app.roles.join(', ') : 'Super admin'}
                      {app.expiresAt && <div>s/d {formatDate(app.expiresAt)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Role &amp; permission aktif</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Daftar ini mengikuti konteks gateway (aplikasi <span className="font-mono">seloko</span>) dan menentukan
              menu sidebar yang tampil.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <span key={r} className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Super admin (bypass semua permission).</span>
              )}
            </div>
            {permissions.length > 0 && (
              <>
                <h3 className="mb-2 mt-4 text-xs font-semibold text-muted-foreground">Permission</h3>
                <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
                  {[...permissions].sort().map((p) => (
                    <span key={p} className="rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {p}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function Row({ label, mono, children }: { label: string; mono?: boolean; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'break-all tabular-nums' : 'min-w-0'}>{children ?? '—'}</dd>
    </div>
  )
}
