import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { ImageUpload, type UploadedImage } from '@/components/shared/ImageUpload'
import { LOGO_RULE } from '@/config/image-rules'
import { lapakOpdService } from '@/services/lapak-opd.service'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import { organizationKeys } from '@/lib/query-keys'
import {
  buildCreateOrganizationBody,
  buildOrganizationBody,
  EMPTY_ORGANIZATION,
  validateOrganization,
  type OrganizationErrors,
  type OrganizationFormValues,
} from '@/modules/core/organizations/organization-form'
import type { OrganizationListItem } from '@/types/core'

/**
 * Form tambah/ubah OPD untuk CMS Lapak.
 *
 * Sengaja TIDAK memakai ulang `OrganizationFormDialog` milik core: dialog itu
 * menampilkan pemilih **jenis** (OPD/UPTD/Biro) dan **induk**, yang tidak
 * berlaku di sini — mitra Lapak selalu OPD tingkat atas. Validasi field dan
 * pembentukan body tetap memakai `organization-form.ts` yang sama, jadi aturan
 * (kode 2–50 karakter, format email/URL, dsb.) tidak terduplikasi.
 */
export function LapakOpdFormDialog({
  open,
  onOpenChange,
  opd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  opd?: OrganizationListItem | null
}) {
  const qc = useQueryClient()
  const isEdit = !!opd
  // Nilai awal dibaca sekali saat mount. Pemanggil memberi `key` berbeda tiap
  // pembukaan (lihat LapakOpdPage), jadi form selalu segar tanpa effect/reset.
  const [v, setV] = useState<OrganizationFormValues>(() =>
    opd
      ? {
          code: opd.code,
          name: opd.name,
          shortName: opd.shortName ?? '',
          type: 'OPD',
          parentId: '',
          description: opd.description ?? '',
          address: opd.address ?? '',
          phone: opd.phone ?? '',
          email: opd.email ?? '',
          website: opd.website ?? '',
          isActive: opd.isActive,
        }
      : EMPTY_ORGANIZATION,
  )
  const [errors, setErrors] = useState<OrganizationErrors>({})
  const [logo, setLogo] = useState<UploadedImage | null>(() =>
    opd?.logoUrl ? { url: opd.logoUrl, fileId: opd.logoFileId ?? '', size: 0 } : null,
  )

  const set = <K extends keyof OrganizationFormValues>(key: K, value: OrganizationFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }))

  const save = useMutation({
    mutationFn: async () => {
      // Create WAJIB memakai `buildCreateOrganizationBody` — `buildOrganizationBody`
      // sengaja tidak membawa `code` (dipakai untuk update), sehingga POST tanpa
      // kode ditolak server dengan 400.
      const body = {
        ...(isEdit ? buildOrganizationBody(v, true) : buildCreateOrganizationBody(v)),
        // Jenis dan induk dikunci server; dikirim eksplisit agar jelas niatnya.
        type: 'OPD' as const,
        parentId: null,
        ...(logo ? { logoUrl: logo.url, logoFileId: logo.fileId } : {}),
      }
      return isEdit && opd ? lapakOpdService.update(opd.id, body) : lapakOpdService.create(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'OPD berhasil diperbarui' : 'OPD berhasil ditambahkan')
      void qc.invalidateQueries({ queryKey: organizationKeys.public })
      void qc.invalidateQueries({ queryKey: ['lapak', 'opd'] })
      onOpenChange(false)
    },
    onError: (e) => {
      // Error per-field dari server (mis. kode sudah dipakai) ditempel ke input.
      setErrors((prev) => ({ ...prev, ...apiFieldErrors(e) }))
      toast.error(isEdit ? 'Gagal memperbarui OPD' : 'Gagal menambah OPD', {
        description: apiErrorMessage(e),
      })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateOrganization(v, isEdit)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    save.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Ubah ${opd?.name}` : 'Tambah OPD'}</DialogTitle>
            <DialogDescription>
              OPD yang didaftarkan di sini otomatis berjenis OPD tingkat atas dan langsung muncul di direktori Lapak.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kode" id="opd-code" required error={errors.code} hint="Dipakai di URL publik, tidak bisa diubah setelah dibuat.">
                <Input
                  id="opd-code"
                  value={v.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  disabled={isEdit || save.isPending}
                  placeholder="BPKPD"
                  aria-invalid={!!errors.code}
                />
              </FormField>

              <FormField label="Nama pendek" id="opd-short" error={errors.shortName}>
                <Input
                  id="opd-short"
                  value={v.shortName}
                  onChange={(e) => set('shortName', e.target.value)}
                  disabled={save.isPending}
                  placeholder="BPKPD"
                />
              </FormField>
            </div>

            <FormField label="Nama lengkap" id="opd-name" required error={errors.name}>
              <Input
                id="opd-name"
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                disabled={save.isPending}
                placeholder="Badan Pengelolaan Keuangan dan Pendapatan Daerah"
                aria-invalid={!!errors.name}
              />
            </FormField>

            <FormField label="Deskripsi" id="opd-desc" error={errors.description}>
              <Input
                id="opd-desc"
                value={v.description}
                onChange={(e) => set('description', e.target.value)}
                disabled={save.isPending}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Telepon" id="opd-phone" error={errors.phone}>
                <Input id="opd-phone" value={v.phone} onChange={(e) => set('phone', e.target.value)} disabled={save.isPending} />
              </FormField>
              <FormField label="Email" id="opd-email" error={errors.email}>
                <Input
                  id="opd-email"
                  type="email"
                  value={v.email}
                  onChange={(e) => set('email', e.target.value)}
                  disabled={save.isPending}
                  aria-invalid={!!errors.email}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Situs" id="opd-web" error={errors.website}>
                <Input
                  id="opd-web"
                  value={v.website}
                  onChange={(e) => set('website', e.target.value)}
                  disabled={save.isPending}
                  placeholder="https://…"
                  aria-invalid={!!errors.website}
                />
              </FormField>
              <FormField label="Alamat" id="opd-addr" error={errors.address}>
                <Input id="opd-addr" value={v.address} onChange={(e) => set('address', e.target.value)} disabled={save.isPending} />
              </FormField>
            </div>

            <FormField id="opd-logo" label="Logo" hint="Opsional. Tampil di direktori dan halaman detail OPD.">
              <ImageUpload
                id="opd-logo"
                value={logo}
                onChange={setLogo}
                rule={LOGO_RULE}
                module="applications"
                subFolder="opd-logos"
              />
            </FormField>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Simpan perubahan' : 'Tambah OPD'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
