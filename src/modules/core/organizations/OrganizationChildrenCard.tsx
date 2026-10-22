import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Pencil, Plus, Users } from 'lucide-react'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Truncate } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { organizationService } from '@/services/organization.service'
import { apiErrorMessage } from '@/lib/utils'
import type { OrganizationListItem } from '@/types/core'
import { ORGANIZATION_TYPE_LABEL } from './organization-form'
import { ORGANIZATION_DETAIL } from './organization-paths'
import { OrganizationFormDialog } from './OrganizationFormDialog'

const PAGE_SIZES = [10, 20, 50]

/**
 * Tabel "bagian dalam organisasi" (sub-unit langsung).
 *
 * Memakai `GET /organizations?parentId=<id>` — bukan daftar global yang
 * disaring di browser — supaya paginasi dan total berasal dari server.
 * State halaman disimpan lokal (bukan query string) agar tidak bertabrakan
 * dengan parameter daftar induk saat pengguna menekan Back.
 */
export function OrganizationChildrenCard({
  parentId,
  canCreate,
  canUpdate,
}: {
  parentId: string
  canCreate?: boolean
  canUpdate?: boolean
}) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  // Satu dialog untuk tambah & ubah: `editing` null = mode tambah.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OrganizationListItem | null>(null)

  // Ganti organisasi → kembali ke halaman 1. Diturunkan saat render (pola resmi
  // React) alih-alih useEffect + setState yang memicu render berantai.
  const [loadedFor, setLoadedFor] = useState(parentId)
  if (loadedFor !== parentId) {
    setLoadedFor(parentId)
    setPage(1)
  }

  const q = useQuery({
    queryKey: ['organizations', 'children', parentId, page, limit],
    queryFn: () =>
      organizationService.list({
        parentId,
        page: String(page),
        limit: String(limit),
        sortBy: 'code',
        sortOrder: 'asc',
      }),
    placeholderData: keepPreviousData,
    enabled: !!parentId,
  })

  const rows = q.data?.data ?? []
  const meta = q.data?.meta

  return (
    <section className="min-w-0 rounded-lg border border-border p-4 lg:col-span-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Bagian dalam organisasi</h2>
          <p className="text-xs text-muted-foreground">
            Sub-unit langsung di bawah organisasi ini (UPTD, biro, atau unit pelaksana).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meta && meta.total > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
            </span>
          )}
          {canCreate && (
            <Button
              variant="create"
              size="sm"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus />
              Tambah sub-unit
            </Button>
          )}
        </div>
      </div>

      {q.isError ? (
        <ErrorState message={apiErrorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : q.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          bare
          icon={Users}
          title="Belum ada sub-unit"
          description="Organisasi ini belum memiliki bagian di bawahnya. Tambahkan lewat tombol Tambah sub-unit, atau pindahkan organisasi lain menjadi turunannya."
        />
      ) : (
        <div className="relative overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-table-head">
              <tr className="border-b-2 border-input">
                <th scope="col" className="h-10 px-3 text-left text-xs font-semibold text-foreground">
                  Sub-unit
                </th>
                <th scope="col" className="h-10 px-3 text-left text-xs font-semibold text-foreground">
                  Jenis
                </th>
                <th scope="col" className="h-10 px-3 text-left text-xs font-semibold text-foreground">
                  Nama pendek
                </th>
                <th scope="col" className="h-10 px-3 text-left text-xs font-semibold text-foreground">
                  Kontak
                </th>
                <th scope="col" className="h-10 px-3 text-left text-xs font-semibold text-foreground">
                  Status
                </th>
                {canUpdate && (
                  <th scope="col" className="h-10 w-12 px-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o: OrganizationListItem) => (
                <tr key={o.id} className="group/row transition-colors hover:bg-muted/50">
                  <td className="h-11 px-3 align-middle">
                    <Link
                      to={ORGANIZATION_DETAIL(o.id)}
                      className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none group-hover/row:font-bold group-hover/row:underline"
                    >
                      {o.name}
                    </Link>
                    <div className="font-mono text-xs text-muted-foreground">{o.code}</div>
                  </td>
                  <td className="h-11 px-3 align-middle">
                    <Badge variant="neutral">{ORGANIZATION_TYPE_LABEL[o.type]}</Badge>
                  </td>
                  <td className="h-11 px-3 align-middle">
                    <Truncate text={o.shortName} />
                  </td>
                  <td className="h-11 px-3 align-middle text-xs text-muted-foreground">
                    <div>{o.email ?? '—'}</div>
                    <div>{o.phone ?? '—'}</div>
                  </td>
                  <td className="h-11 px-3 align-middle">
                    <ActiveBadge active={o.isActive} />
                  </td>
                  {canUpdate && (
                    <td className="h-11 px-2 text-right align-middle">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ubah sub-unit ${o.code}`}
                        onClick={() => {
                          setEditing(o)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.total > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger aria-label="Jumlah sub-unit per halaman" className="h-8 w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 tabular-nums">
              Halaman {meta.page} / {Math.max(meta.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman sub-unit sebelumnya"
              disabled={!meta.hasPreviousPage || q.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Halaman sub-unit berikutnya"
              disabled={!meta.hasNextPage || q.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* `editing` null = tambah sub-unit (induk otomatis = organisasi ini). */}
      <OrganizationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        organization={editing}
        defaultParentId={parentId}
      />
    </section>
  )
}