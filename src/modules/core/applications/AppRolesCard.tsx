import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound, Pencil, Plus, Power, PowerOff, Search, Shield, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconAction } from '@/components/shared/IconAction'
import { ListPagination } from '@/components/shared/ListPagination'
import { roleService } from '@/services/role.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'
import { applicationKeys, roleKeys } from '@/lib/query-keys'
import type { ApplicationDetail, RoleListItem } from '@/types/core'
import { RoleFormDialog } from '../access/RoleFormDialog'

type Pending = { kind: 'toggle' | 'delete'; role: RoleListItem } | null

const DEFAULT_PAGE_SIZE = 10

/**
 * Kartu "Role": daftar role aplikasi + tambah/ubah/aktif-nonaktif/hapus.
 * Permission: role:create, role:update, role:delete (roles.routes.ts).
 *
 * Pencarian & pagination dikerjakan di klien karena `listByApp` mengembalikan
 * seluruh role satu aplikasi dalam satu respons (jumlahnya puluhan, bukan ribuan).
 */
export function AppRolesCard({ app }: { app: ApplicationDetail }) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const canCreate = can('role:create')
  const canUpdate = can('role:update')
  const canDelete = can('role:delete')
  const [form, setForm] = useState<{ open: boolean; role: RoleListItem | null }>({ open: false, role: null })
  const [pending, setPending] = useState<Pending>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // `counts.roles` diabaikan: daftarnya diambil agar bisa langsung diedit.
  const roles = useQuery({
    queryKey: roleKeys.byApp(app.id),
    queryFn: () => roleService.listByApp(app.id),
  })

  const done = () => {
    void qc.invalidateQueries({ queryKey: roleKeys.all })
    // `counts.roles` berasal dari detail aplikasi, jadi detail ikut disegarkan.
    void qc.invalidateQueries({ queryKey: applicationKeys.detail(app.id) })
    setPending(null)
  }

  const toggle = useMutation({
    mutationFn: (r: RoleListItem) => roleService.setActive(r.id, !r.isActive),
    onSuccess: (_, r) => {
      toast.success(r.isActive ? `Role ${r.name} dinonaktifkan` : `Role ${r.name} diaktifkan`)
      done()
    },
    onError: (e) => toast.error('Gagal mengubah status role', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (r: RoleListItem) => roleService.remove(r.id),
    onSuccess: (_, r) => {
      toast.success(`Role ${r.name} dihapus`)
      done()
    },
    onError: (e) => toast.error('Gagal menghapus role', { description: apiErrorMessage(e) }),
  })

  // `?? []` membuat array baru tiap render; dibungkus useMemo agar dependensi
  // `useMemo` di bawahnya stabil (kalau tidak, filter dihitung ulang terus dan
  // linter menandai `all` sebagai dependensi yang berubah setiap render).
  const all = useMemo(() => roles.data ?? [], [roles.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    // Nama role berupa kode (`operator-pengguna`); cocokkan juga tanpa tanda
    // hubung supaya "operator pengguna" tetap menemukan hasil.
    const squashed = q.replace(/[\s_-]+/g, '')
    return all.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.name.toLowerCase().replace(/[\s_-]+/g, '').includes(squashed),
    )
  }, [all, search])

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1)
  const safePage = Math.min(page, totalPages)
  const rows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  )

  // Pencarian diubah → mulai dari halaman 1 (kalau tidak, hasil bisa kosong
  // padahal ada di halaman sebelumnya). Dilakukan di handler, bukan effect,
  // agar tidak memicu render berantai.
  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const busy = toggle.isPending || remove.isPending

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Role</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {roles.isPending
              ? '…'
              : filtered.length === all.length
                ? `${all.length} role di aplikasi ini`
                : `${filtered.length} dari ${all.length} role`}
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
              placeholder="Cari nama role"
              aria-label="Cari role"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
          {canCreate && app.isActive && (
            <Button size="sm" variant="create" onClick={() => setForm({ open: true, role: null })}>
              <Plus />
              Tambah role
            </Button>
          )}
        </div>
      </div>

      {roles.error ? (
        <div className="p-4">
          <ErrorState message={apiErrorMessage(roles.error)} onRetry={() => void roles.refetch()} />
        </div>
      ) : roles.isPending ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">{search ? 'Tidak ada hasil' : 'Belum ada role'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? `Tidak ada role yang cocok dengan “${search}”.`
              : 'Role mengelompokkan permission yang nanti diberikan ke pengguna.'}
          </p>
          {search && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => changeSearch('')}>
              Reset pencarian
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="group/row flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-sm font-medium">{r.name}</span>
                    {r.isSystemRole && <Badge variant="neutral">Sistem</Badge>}
                    <ActiveBadge active={r.isActive} />
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <KeyRound className="size-3" />
                      {r.permissionCount} permission
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="size-3" />
                      {r.userCount} pengguna
                    </span>
                  </p>
                </div>

                {(canUpdate || canDelete) && (
                  <div className="flex shrink-0 items-center gap-1">
                    {canUpdate && (
                      <IconAction
                        icon={Pencil}
                        tone="warning"
                        label={`Ubah role ${r.name}`}
                        onClick={() => setForm({ open: true, role: r })}
                      />
                    )}
                    {canUpdate && (
                      <IconAction
                        icon={r.isActive ? PowerOff : Power}
                        tone={r.isActive ? 'neutral' : 'success'}
                        label={r.isActive ? `Nonaktifkan role ${r.name}` : `Aktifkan role ${r.name}`}
                        onClick={() => setPending({ kind: 'toggle', role: r })}
                      />
                    )}
                    {canDelete && (
                      <IconAction
                        icon={Trash2}
                        tone="destructive"
                        // Role sistem tidak boleh dihapus (server menolak) — beri
                        // alasan lewat tooltip, bukan tombol mati tanpa keterangan.
                        label={r.isSystemRole ? `Role sistem tidak dapat dihapus` : `Hapus role ${r.name}`}
                        disabled={r.isSystemRole}
                        onClick={() => setPending({ kind: 'delete', role: r })}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <ListPagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {form.open && (
        <RoleFormDialog
          applicationId={app.id}
          appAudience={app.audience}
          role={form.role}
          permissionGroups={app.permissionsByModule}
          onClose={() => setForm({ open: false, role: null })}
          onSaved={done}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={busy}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus role ${pending.role.name}?`,
              description:
                pending.role.userCount > 0
                  ? `Role ini masih dipegang ${pending.role.userCount} pengguna. API akan menolak sampai seluruh penugasan dicabut.`
                  : 'Role beserta daftar permission-nya dihapus permanen. Pengguna tidak terpengaruh karena belum ada yang memakainya.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => remove.mutate(pending.role),
            }
          : pending
            ? {
                title: pending.role.isActive ? `Nonaktifkan role ${pending.role.name}?` : `Aktifkan role ${pending.role.name}?`,
                description: pending.role.isActive
                  ? 'Role nonaktif tidak lagi memberi izin, meski penugasannya masih tersimpan.'
                  : 'Role aktif kembali memberi izin kepada seluruh pengguna yang memegangnya.',
                confirmLabel: pending.role.isActive ? 'Nonaktifkan' : 'Aktifkan',
                destructive: pending.role.isActive,
                onConfirm: () => toggle.mutate(pending.role),
              }
            : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </section>
  )
}
