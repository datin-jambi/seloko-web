import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Building2, Pencil, Power, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { organizationService } from '@/services/organization.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage, formatDate } from '@/lib/utils'
import { ORGANIZATION_TYPE_LABEL } from './organization-form'
import { ORGANIZATIONS_LIST, ORGANIZATION_DETAIL } from './organization-paths'
import { OrganizationFormDialog } from './OrganizationFormDialog'
import { OrganizationChildrenCard } from './OrganizationChildrenCard'
import { OrganizationParentCard } from './OrganizationParentCard'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    // Grid 8.5rem tetap memaksa lebar; min-w-0 di dd + break-words menjaga
    // isi panjang (mis. URL) tidak melebarkan halaman di layar sempit.
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-1.5 text-sm sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

/** Detail organisasi: info, induk, sub-unit, plus aksi ubah/aktif/hapus. */
export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const canCreate = useAuthStore((s) => s.hasPermission('organization:create'))
  const canUpdate = useAuthStore((s) => s.hasPermission('organization:update'))
  const canDelete = useAuthStore((s) => s.hasPermission('organization:delete'))

  const [formOpen, setFormOpen] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: o, isPending, isError, error, refetch } = useQuery({
    queryKey: ['organizations', 'detail', id],
    queryFn: () => organizationService.get(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['organizations'] })
    void qc.invalidateQueries({ queryKey: ['/organizations'] })
  }

  const setActive = useMutation({
    mutationFn: () => organizationService.setActive(id!, !o!.isActive),
    onSuccess: () => {
      invalidate()
      toast.success(o?.isActive ? `${o.name} dinonaktifkan` : `${o?.name} diaktifkan`)
      setConfirmToggle(false)
    },
    onError: (e) => {
      toast.error('Gagal mengubah status', { description: apiErrorMessage(e) })
      setConfirmToggle(false)
    },
  })

  const remove = useMutation({
    mutationFn: () => organizationService.remove(id!),
    onSuccess: () => {
      invalidate()
      toast.success('Organisasi dihapus')
      navigate(ORGANIZATIONS_LIST)
    },
    onError: (e) => {
      toast.error('Gagal menghapus organisasi', { description: apiErrorMessage(e) })
      setConfirmDelete(false)
    },
  })

  if (isPending) return <div className="h-40 animate-pulse rounded-lg bg-muted" />
  if (isError || !o) return <ErrorState message={apiErrorMessage(error)} onRetry={() => void refetch()} />

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" onClick={() => navigate(ORGANIZATIONS_LIST)}>
        <ArrowLeft />
        Organisasi
      </Button>

      <PageHeader
        title={o.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{ORGANIZATION_TYPE_LABEL[o.type]}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{o.code}</span>
            <ActiveBadge active={o.isActive} />
          </span>
        }
        actions={
          <>
            {canUpdate && (
              <Button variant="outline" onClick={() => setConfirmToggle(true)}>
                <Power />
                {o.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
            {canUpdate && (
              <Button variant="edit" onClick={() => setFormOpen(true)}>
                <Pencil />
                Ubah organisasi
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
                Hapus
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="min-w-0 rounded-lg border border-border p-4 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">Informasi organisasi</h2>
          <dl className="divide-y divide-border">
            <Row label="Kode">
              <span className="font-mono text-xs">{o.code}</span>
            </Row>
            <Row label="Nama pendek">{o.shortName ?? '—'}</Row>
            <Row label="Induk">
              {o.parent ? (
                <Link to={ORGANIZATION_DETAIL(o.parent.id)} className="underline underline-offset-4">
                  {o.parent.code} — {o.parent.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">Tingkat atas</span>
              )}
            </Row>
            <Row label="Deskripsi">{o.description ?? '—'}</Row>
            <Row label="Alamat">{o.address ?? '—'}</Row>
            <Row label="Telepon">{o.phone ?? '—'}</Row>
            <Row label="Email">{o.email ?? '—'}</Row>
            <Row label="Website">
              {o.website ? (
                <a href={o.website} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {o.website}
                </a>
              ) : (
                '—'
              )}
            </Row>
            <Row label="Dibuat">{formatDate(o.createdAt)}</Row>
            <Row label="Diperbarui">{formatDate(o.updatedAt)}</Row>
          </dl>
        </section>

        <div className="min-w-0 space-y-4">
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-sm font-semibold">Pemakaian</h2>
            <dl className="divide-y divide-border">
              <Row label="Sub-unit aktif">{o.counts.children}</Row>
              <Row label="Penugasan role">{o.counts.userAppRoleScopes}</Row>
            </dl>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Building2 className="mt-0.5 size-3.5 shrink-0" />
              Penugasan role berlingkup OPD menentukan data mana yang boleh dikelola pegawai di aplikasi lain.
            </p>
          </section>

          {canUpdate && <OrganizationParentCard org={o} />}
        </div>

        <OrganizationChildrenCard parentId={o.id} canCreate={canCreate} canUpdate={canUpdate} />
      </div>

      <OrganizationFormDialog open={formOpen} onOpenChange={setFormOpen} organization={o} />

      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={o.isActive ? 'Nonaktifkan organisasi?' : 'Aktifkan organisasi?'}
        description={
          o.isActive ? (
            <>
              <strong>{o.name}</strong> beserta <strong>seluruh sub-unit di bawahnya</strong> akan nonaktif. Data tidak
              dihapus, tetapi OPD nonaktif tidak bisa dipakai untuk penugasan baru.
            </>
          ) : (
            <>
              Hanya <strong>{o.name}</strong> yang diaktifkan kembali. Sub-unit yang ikut nonaktif sebelumnya harus
              diaktifkan sendiri.
            </>
          )
        }
        confirmLabel={o.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        destructive={o.isActive}
        pending={setActive.isPending}
        onConfirm={() => setActive.mutate()}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus organisasi?"
        description={
          <>
            <strong>{o.name}</strong> akan dihapus (soft-delete). Server menolak bila masih punya sub-unit aktif atau
            masih dipakai pada penugasan role.
          </>
        }
        confirmLabel="Hapus organisasi"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  )
}
