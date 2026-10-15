import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { apiErrorMessage } from '@/lib/utils'
import { AccountTypeBadge, SuperAdminBadge } from '@/modules/core/users/AccountTypeBadge'
import { USER_DETAIL } from '@/modules/core/users/user-form'
import { ROLE_ASSIGN } from './application-paths'
import { appUsersKey, fetchAppUsers, type AppUsersData } from './app-users'
import type { ApplicationDetail } from '@/types/core'

/**
 * Kartu "Pengguna": siapa saja yang punya akses ke aplikasi ini, beserta role-nya.
 * Menautkan ke detail pengguna untuk menambah/mencabut role.
 */
export function AppUsersCard({ app, data }: { app: ApplicationDetail; data?: AppUsersData }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>()

  // `data` diisi halaman (yang juga menampilkan jumlah di tab) → tanpa permintaan kedua.
  const users = useQuery({
    queryKey: appUsersKey(app.id),
    queryFn: () => fetchAppUsers(app.id),
    ...(data ? { initialData: data } : {}),
  })

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (users.data?.rows ?? []).filter(
      (u) =>
        (!type || u.accountType === type) &&
        (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username ?? '').includes(q)),
    )
  }, [users.data, search, type])

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Pengguna</h2>
          <p className="text-xs text-muted-foreground">
            {users.isPending ? '…' : `${rows.length} dari ${users.data?.rows.length ?? 0} pengguna`} punya akses
            {/* Superadmin tidak punya penugasan role, jadi jumlahnya bisa berbeda dari angka di tab. */}
            {users.data && users.data.rows.some((u) => u.isSuperAdmin) && ' · termasuk superadmin tanpa penugasan'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email"
              aria-label="Cari pengguna"
              className="h-8 w-48 pl-8 text-sm"
            />
          </div>
          <Select value={type ?? 'ALL'} onValueChange={(v) => setType(v === 'ALL' ? undefined : v)}>
            <SelectTrigger aria-label="Jenis akun" className="h-8 w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua jenis</SelectItem>
              <SelectItem value="INTERNAL">Internal</SelectItem>
              <SelectItem value="PUBLIC">Eksternal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {users.error ? (
        <div className="p-4">
          <ErrorState message={apiErrorMessage(users.error)} onRetry={() => void users.refetch()} />
        </div>
      ) : users.isPending ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">
            {search || type ? 'Tidak ada hasil' : 'Belum ada pengguna'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || type
              ? 'Ubah kata kunci atau filter jenis akun.'
              : 'Tugaskan role ke pengguna agar aksesnya muncul di sini.'}
          </p>
          {(search || type) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setType(undefined)
              }}
            >
              Reset filter
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {rows.map((u) => {
              const own = u.applications.find((a) => a.id === app.id)
              return (
                <li key={u.id} className="group/row flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={USER_DETAIL(u.id)}
                        className="truncate text-sm font-medium hover:text-primary group-hover/row:font-bold group-hover/row:underline"
                      >
                        {u.fullName}
                      </Link>
                      <AccountTypeBadge type={u.accountType} />
                      {u.isSuperAdmin && <SuperAdminBadge />}
                      <ActiveBadge active={u.isActive} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {/* shrink-0 hanya di sm ke atas: di mobile baris ini boleh turun agar tidak melebarkan kartu. */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {!u.isSuperAdmin && own && (
                      <span className="text-xs text-muted-foreground tabular-nums">{u.totalRoles} role</span>
                    )}
                    {/* Superadmin tidak perlu penugasan role — tautannya ke detail pengguna. */}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={ROLE_ASSIGN(u.id)}>
                        <UserPlus />
                        {u.isSuperAdmin ? 'Lihat pengguna' : 'Atur role'}
                      </Link>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
          {users.data?.capped && (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Menampilkan hasil dari {users.data.scanned} pengguna pertama. Filter per aplikasi belum tersedia di API.
            </p>
          )}
        </>
      )}
    </section>
  )
}
