import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, UserCog, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconAction } from '@/components/shared/IconAction'
import { ListPagination } from '@/components/shared/ListPagination'
import { apiErrorMessage } from '@/lib/utils'
import { AccountTypeBadge, SuperAdminBadge } from '@/modules/core/users/AccountTypeBadge'
import { USER_DETAIL } from '@/modules/core/users/user-form'
import { ROLE_ASSIGN } from './application-paths'
import { appUsersKey, fetchAppUsers, type AppUsersData } from './app-users'
import type { ApplicationDetail } from '@/types/core'

const DEFAULT_PAGE_SIZE = 10

/**
 * Kartu "Pengguna": siapa saja yang punya akses ke aplikasi ini, beserta role-nya.
 * "Atur role" menautkan ke detail pengguna (penugasan dikelola di sana).
 *
 * Pencarian, filter jenis akun, dan pagination dikerjakan di klien: `fetchAppUsers`
 * sudah memuat seluruh pengguna lalu menyaringnya per aplikasi.
 */
export function AppUsersCard({ app, data }: { app: ApplicationDetail; data?: AppUsersData }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // `data` diisi halaman (yang juga menampilkan jumlah di tab) → tanpa permintaan kedua.
  const users = useQuery({
    queryKey: appUsersKey(app.id),
    queryFn: () => fetchAppUsers(app.id),
    ...(data ? { initialData: data } : {}),
  })

  const all = useMemo(() => users.data?.rows ?? [], [users.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter(
      (u) =>
        (!type || u.accountType === type) &&
        (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username ?? '').includes(q)),
    )
  }, [all, search, type])

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1)
  const safePage = Math.min(page, totalPages)
  const rows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  )

  // Filter berubah → kembali ke halaman 1. Di handler, bukan effect, agar tidak
  // memicu render berantai.
  const changeSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }
  const changeType = (v: string) => {
    setType(v === 'ALL' ? undefined : v)
    setPage(1)
  }

  const filtering = Boolean(search || type)

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Pengguna</h2>
          <p className="text-xs text-muted-foreground">
            {users.isPending ? '…' : `${filtered.length} dari ${all.length} pengguna`} punya akses
            {/* Superadmin tidak punya penugasan role, jadi jumlahnya bisa berbeda dari angka di tab. */}
            {all.some((u) => u.isSuperAdmin) && ' · termasuk superadmin tanpa penugasan'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Cari nama atau email"
              aria-label="Cari pengguna"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
          <Select value={type ?? 'ALL'} onValueChange={changeType}>
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
      ) : filtered.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">{filtering ? 'Tidak ada hasil' : 'Belum ada pengguna'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtering
              ? 'Ubah kata kunci atau filter jenis akun.'
              : 'Tugaskan role ke pengguna agar aksesnya muncul di sini.'}
          </p>
          {filtering && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setType(undefined)
                setPage(1)
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
                <li key={u.id} className="group/row flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={USER_DETAIL(u.id)}
                        className="truncate text-sm font-medium hover:text-primary group-hover/row:underline"
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
                    {/* Superadmin tidak punya penugasan role — tautannya tetap ke detail pengguna. */}
                    <IconAction
                      icon={UserCog}
                      tone="primary"
                      to={ROLE_ASSIGN(u.id)}
                      label={u.isSuperAdmin ? `Lihat pengguna ${u.fullName}` : `Atur role ${u.fullName}`}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          <ListPagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

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
