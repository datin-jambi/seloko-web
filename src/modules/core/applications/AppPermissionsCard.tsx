import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Key, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconAction } from '@/components/shared/IconAction'
import { ListPagination } from '@/components/shared/ListPagination'
import { permissionService } from '@/services/permission.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage } from '@/lib/utils'
import { applicationKeys, permissionKeys } from '@/lib/query-keys'
import type { ApplicationDetail, PermissionListItem } from '@/types/core'
import { PermissionFormDialog } from '../access/PermissionFormDialog'

/** Permission lebih padat dari role (kartu 2 kolom), jadi 25 baris lebih pas. */
const DEFAULT_PAGE_SIZE = 25

/**
 * Kartu "Permission": daftar permission aplikasi dikelompokkan per modul,
 * dengan tambah/ubah/hapus. Kode tidak bisa diubah (dipakai literal di route API).
 * Permission: permission:create, permission:update, permission:delete.
 *
 * Pagination memotong daftar DASAR (bukan per modul) lalu mengelompokkan ulang
 * baris di halaman aktif: hitungan "1–25 dari 28" jadi konsisten dengan tab
 * Role, dan header modul menampilkan "n dari total" bila modul terbelah halaman.
 */
export function AppPermissionsCard({ app }: { app: ApplicationDetail }) {
  const qc = useQueryClient()
  const can = useAuthStore((s) => s.hasPermission)
  const canCreate = can('permission:create')
  const canUpdate = can('permission:update')
  const canDelete = can('permission:delete')
  const [form, setForm] = useState<{ open: boolean; permission: PermissionListItem | null }>({ open: false, permission: null })
  const [deleting, setDeleting] = useState<PermissionListItem | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Satu permintaan memuat seluruh permission aplikasi (limit 200 = maksimum API).
  const permissions = useQuery({
    queryKey: permissionKeys.byApp(app.id),
    queryFn: () => permissionService.listByApp(app.id),
  })

  const done = () => {
    void qc.invalidateQueries({ queryKey: permissionKeys.all })
    void qc.invalidateQueries({ queryKey: applicationKeys.detail(app.id) })
    setDeleting(null)
  }

  const remove = useMutation({
    mutationFn: (p: PermissionListItem) => permissionService.remove(p.id),
    onSuccess: (_, p) => {
      toast.success(`Permission ${p.code} dihapus`)
      done()
    },
    onError: (e) => toast.error('Gagal menghapus permission', { description: apiErrorMessage(e) }),
  })

  const all = useMemo(() => permissions.data ?? [], [permissions.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
  }, [all, search])

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1)
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  )

  /** Modul dari baris di halaman aktif + jumlah TOTAL-nya (untuk penanda terbelah). */
  const groups = useMemo(() => {
    const totals = new Map<string, number>()
    for (const p of filtered) totals.set(p.module, (totals.get(p.module) ?? 0) + 1)

    const map = new Map<string, PermissionListItem[]>()
    for (const p of pageRows) map.set(p.module, [...(map.get(p.module) ?? []), p])
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([module, items]) => ({ module, items, total: totals.get(module) ?? items.length }))
  }, [filtered, pageRows])

  // Jumlah modul dihitung dari SELURUH hasil filter, bukan dari `groups` (yang
  // hanya berisi modul di halaman aktif) — kalau tidak, halaman 2 akan menulis
  // "1 modul" padahal aplikasi punya 3 modul.
  const moduleCount = useMemo(() => new Set(filtered.map((p) => p.module)).size, [filtered])

  // Pencarian diubah → mulai dari halaman 1. Di handler, bukan effect, agar
  // tidak memicu render berantai.
  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Permission</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {permissions.isPending
              ? '…'
              : filtered.length === all.length
                ? `${all.length} permission · ${moduleCount} modul`
                : `${filtered.length} dari ${all.length} permission`}
          </p>
        </div>
        {/* flex-wrap: pencarian + tombol tidak muat sebaris di 375px. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Cari kode atau nama"
              aria-label="Cari permission"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
          {canCreate && app.isActive && (
            <Button size="sm" variant="create" onClick={() => setForm({ open: true, permission: null })}>
              <Plus />
              Tambah permission
            </Button>
          )}
        </div>
      </div>

      {permissions.error ? (
        <div className="p-4">
          <ErrorState message={apiErrorMessage(permissions.error)} onRetry={() => void permissions.refetch()} />
        </div>
      ) : permissions.isPending ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Key className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">{search ? 'Tidak ada hasil' : 'Belum ada permission'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? `Tidak ada permission yang cocok dengan “${search}”.`
              : 'Permission dicek oleh route API lewat requirePermission.'}
          </p>
          {search && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => changeSearch('')}>
              Reset pencarian
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {groups.map(({ module, items, total }) => (
              <div key={module} className="px-4 py-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold">{module}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {/* Modul bisa terbelah antar halaman — beri tahu sisanya. */}
                    {items.length < total ? `${items.length} dari ${total}` : total}
                  </span>
                </div>
                <ul className="grid gap-1.5 xl:grid-cols-2">
                  {items.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-2 rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        {/* Nama dibiarkan turun baris: label ini yang dibaca operator. */}
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="truncate font-mono text-xs text-muted-foreground" title={p.code}>
                          {p.code}
                        </div>
                      </div>
                      <span
                        className="mt-0.5 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
                        title={`${p.roleCount} role memakai · ${p.menuCount} menu bergantung`}
                      >
                        {p.roleCount} role
                      </span>
                      {(canUpdate || canDelete) && (
                        <div className="flex shrink-0 items-center gap-1">
                          {canUpdate && (
                            <IconAction
                              icon={Pencil}
                              tone="warning"
                              label={`Ubah permission ${p.code}`}
                              onClick={() => setForm({ open: true, permission: p })}
                            />
                          )}
                          {canDelete && (
                            <IconAction
                              icon={Trash2}
                              tone="destructive"
                              label={`Hapus permission ${p.code}`}
                              onClick={() => setDeleting(p)}
                            />
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

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
        <PermissionFormDialog
          applicationId={app.id}
          permission={form.permission}
          onClose={() => setForm({ open: false, permission: null })}
          onSaved={done}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        pending={remove.isPending}
        title={`Hapus permission ${deleting?.code}?`}
        description={
          deleting && (
            <span className="space-y-1.5">
              <span className="block">Permission dihapus permanen. Dampaknya:</span>
              <span className="block text-xs">
                · Dicabut dari {deleting.roleCount} role{deleting.roleCount > 0 && ' — role itu kehilangan izin ini'}
              </span>
              <span className="block text-xs">
                · {deleting.menuCount} menu yang memakainya jadi terbuka tanpa pembatas
              </span>
            </span>
          )
        }
        confirmLabel="Hapus"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </section>
  )
}
