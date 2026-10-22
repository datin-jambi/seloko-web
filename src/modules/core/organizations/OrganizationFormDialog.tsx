import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload, type UploadedImage } from '@/components/shared/ImageUpload'
import { LOGO_RULE } from '@/config/image-rules'
import { organizationService } from '@/services/organization.service'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type { CreateOrganizationBody, OrganizationListItem } from '@/types/core'
import {
  buildCreateOrganizationBody,
  buildOrganizationBody,
  EMPTY_ORGANIZATION,
  ORGANIZATION_TYPE_LABEL,
  ORGANIZATION_TYPES,
  parentChoices,
  validateOrganization,
  type OrganizationErrors,
  type OrganizationFormValues,
} from './organization-form'

/**
 * Dialog tambah/ubah Organisasi (OPD/UPTD).
 *
 * `code` terkunci saat edit: kode dipakai seeder dan segmen URL publik
 * (`/lapak/opd/<code>`), jadi mengubahnya memutus referensi.
 */
export function OrganizationFormDialog({
  open,
  onOpenChange,
  organization,
  defaultParentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: OrganizationListItem | null
  /** Untuk "Tambah sub-unit" dari halaman detail: induk sudah terisi. */
  defaultParentId?: string
}) {
  const qc = useQueryClient()
  const isEdit = !!organization
  const [v, setV] = useState<OrganizationFormValues>(EMPTY_ORGANIZATION)
  const [errors, setErrors] = useState<OrganizationErrors>({})
  // Logo disimpan terpisah: `logoUrl` + `logoFileId` berpasangan dan nilainya
  // berasal dari respons /storage/upload, bukan diketik pengguna.
  const [logo, setLogo] = useState<UploadedImage | null>(null)

  // Reset saat dibuka — diturunkan pada render, bukan useEffect + setState.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setErrors({})
      setLogo(
        organization?.logoUrl && organization.logoFileId
          ? // size/dimensi tidak ada di payload organisasi — ditampilkan hanya
          // bila pengguna mengunggah ulang, atau diambil dari /storage/:id.
          { fileId: organization.logoFileId, url: organization.logoUrl, size: 0 }
          : null,
      )
      setV(
        organization
          ? {
            code: organization.code,
            name: organization.name,
            shortName: organization.shortName ?? '',
            type: organization.type,
            parentId: organization.parentId ?? '',
            description: organization.description ?? '',
            address: organization.address ?? '',
            phone: organization.phone ?? '',
            email: organization.email ?? '',
            website: organization.website ?? '',
            isActive: organization.isActive,
          }
          : { ...EMPTY_ORGANIZATION, parentId: defaultParentId ?? '' },
      )
    }
  }

  // Pilihan induk: SEMUA organisasi (bukan hanya akar) karena UPTD boleh berada
  // di bawah UPTD lain. Diri sendiri dibuang untuk mencegah siklus langsung.
  const all = useQuery({
    queryKey: ['organizations', 'all-for-parent'],
    queryFn: () => organizationService.list({ limit: '100', sortBy: 'code', sortOrder: 'asc' }),
    enabled: open,
    staleTime: 60_000,
  })

  const set = (key: keyof OrganizationFormValues) => (value: string | boolean) => {
    setV((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const save = useMutation({
    mutationFn: () => {
      // Logo berpasangan: `logoUrl` tanpa `logoFileId` tidak bisa dihapus saat
      // diganti, jadi keduanya selalu ikut (null = dikosongkan).
      const logoFields = {
        logoUrl: logo?.url ?? null,
        logoFileId: logo?.fileId ?? null,
      }
      if (isEdit) {
        return organizationService.update(organization!.id, { ...buildOrganizationBody(v, true), ...logoFields })
      }
      // Create wajib membawa `code` + `name`; keduanya sudah divalidasi di submit().
      const created: CreateOrganizationBody = {
        ...buildCreateOrganizationBody(v),
        ...logoFields,
      }
      return organizationService.create(created)
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ['/organizations'] })
      void qc.invalidateQueries({ queryKey: ['organizations'] })
      toast.success(isEdit ? `Organisasi ${row.name} diperbarui` : `Organisasi ${row.name} dibuat`)
      onOpenChange(false)
    },
    onError: (e) => {
      // 409 = kode sudah dipakai (unik global).
      if (isAxiosError(e) && e.response?.status === 409) {
        return setErrors({ code: apiErrorMessage(e) })
      }
      const fields = apiFieldErrors(e)
      if (Object.keys(fields).length > 0) return setErrors(fields as OrganizationErrors)
      toast.error(isEdit ? 'Gagal memperbarui organisasi' : 'Gagal membuat organisasi', {
        description: apiErrorMessage(e),
      })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateOrganization(v, isEdit)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    save.mutate()
  }

  const choices = parentChoices(all.data?.data ?? [], organization?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Ubah organisasi ${organization?.name}` : 'Tambah organisasi'}</DialogTitle>
          <DialogDescription>
            Application membatasi menu dan permission; organisasi membatasi DATA. Hierarki OPD → UPTD diatur lewat
            induk.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form id="organization-form" onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="code"
                label="Kode"
                required={!isEdit}
                error={errors.code}
                hint={isEdit ? 'Kode tidak dapat diubah' : 'Huruf, angka, _ atau -'}
              >
                <Input
                  id="code"
                  value={v.code}
                  onChange={(e) => set('code')(e.target.value.toUpperCase())}
                  placeholder="DISHUB"
                  disabled={isEdit}
                  className="font-mono"
                  autoFocus={!isEdit}
                />
              </FormField>

              <FormField id="type" label="Jenis">
                <Select value={v.type} onValueChange={(x) => set('type')(x)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ORGANIZATION_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField id="name" label="Nama lengkap" required error={errors.name}>
              <Input
                id="name"
                value={v.name}
                onChange={(e) => set('name')(e.target.value)}
                placeholder="Dinas Perhubungan Provinsi Jambi"
                autoFocus={isEdit}
              />
            </FormField>

            <FormField
              id="logo"
              label="Logo organisasi"
              hint="PNG, JPG, WEBP, atau SVG — maksimal 2 MB, minimal 64×64 px."
            >
              <ImageUpload
                id="logo"
                rule={LOGO_RULE}
                module="organizations"
                subFolder="logos"
                value={logo}
                onChange={setLogo}
                disabled={save.isPending}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="shortName" label="Nama pendek" error={errors.shortName}>
                <Input id="shortName" value={v.shortName} onChange={(e) => set('shortName')(e.target.value)} placeholder="Dishub" />
              </FormField>

              <FormField
                id="parentId"
                label="Induk"
                error={errors.parentId}
                hint={v.type === 'UPTD' ? 'UPTD biasanya berada di bawah OPD' : 'Kosongkan untuk unit tingkat atas'}
              >
                <Select
                  value={v.parentId || '__none'}
                  onValueChange={(x) => set('parentId')(x === '__none' ? '' : x)}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Tanpa induk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Tanpa induk (tingkat atas)</SelectItem>
                    {choices.map(([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField id="description" label="Deskripsi" error={errors.description}>
              <textarea
                id="description"
                value={v.description}
                onChange={(e) => set('description')(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="email" label="Email" error={errors.email}>
                <Input id="email" type="email" value={v.email} onChange={(e) => set('email')(e.target.value)} placeholder="opd@jambiprov.go.id" />
              </FormField>
              <FormField id="phone" label="Telepon" error={errors.phone}>
                <Input id="phone" value={v.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="0741-xxxxxx" />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="website" label="Website" error={errors.website}>
                <Input id="website" value={v.website} onChange={(e) => set('website')(e.target.value)} placeholder="https://…" />
              </FormField>
              <FormField id="address" label="Alamat" error={errors.address}>
                <Input id="address" value={v.address} onChange={(e) => set('address')(e.target.value)} />
              </FormField>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.isActive}
                onChange={(e) => set('isActive')(e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              Organisasi aktif
            </label>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" form="organization-form" variant={isEdit ? 'edit' : 'create'} disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {isEdit ? 'Simpan perubahan' : 'Buat organisasi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
