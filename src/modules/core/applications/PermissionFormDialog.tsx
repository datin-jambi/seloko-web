import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { permissionService } from '@/services/permission.service'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type { PermissionListItem } from '@/types/core'
import { validatePermission, type PermissionFormValues } from './access-form'

/**
 * Tambah/ubah permission milik satu aplikasi. `code` dan `applicationId` terkunci
 * setelah dibuat (UpdatePermissionBodySchema): kode dipakai literal di route API.
 */
export function PermissionFormDialog({
  applicationId,
  permission,
  onClose,
  onSaved,
}: {
  applicationId: string
  /** Ada = mode ubah. */
  permission?: PermissionListItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!permission
  const [v, setV] = useState<PermissionFormValues>({
    code: permission?.code ?? '',
    name: permission?.name ?? '',
    module: permission?.module ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PermissionFormValues, string>>>({})

  const save = useMutation({
    mutationFn: async () =>
      isEdit
        ? ((await permissionService.update(permission.id, { name: v.name.trim(), module: v.module.trim() })), null)
        : permissionService.create({
            applicationId,
            code: v.code.trim(),
            name: v.name.trim(),
            module: v.module.trim(),
          }),
    onSuccess: () => {
      toast.success(isEdit ? `Permission ${v.name.trim()} diperbarui` : `Permission ${v.code.trim()} dibuat`)
      void qc.invalidateQueries({ queryKey: ['/permissions'] })
      void qc.invalidateQueries({ queryKey: ['/applications', applicationId] })
      onSaved()
      onClose()
    },
    onError: (e) => {
      const fields = apiFieldErrors(e)
      if (Object.keys(fields).length > 0) return setErrors(fields)
      toast.error(isEdit ? 'Gagal memperbarui permission' : 'Gagal membuat permission', {
        description: apiErrorMessage(e),
      })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validatePermission(v)
    setErrors(found)
    if (Object.keys(found).length > 0) return document.getElementById(Object.keys(found)[0])?.focus()
    save.mutate()
  }

  const field = (key: keyof PermissionFormValues) => ({
    id: key,
    value: v[key],
    disabled: save.isPending,
    'aria-invalid': !!errors[key] || undefined,
    'aria-describedby': `${key}-msg`,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setV((p) => ({ ...p, [key]: e.target.value }))
      if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    },
  })

  return (
    <Dialog open onOpenChange={(o) => !save.isPending && !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah permission' : 'Tambah permission'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Hanya nama dan modul yang bisa diubah. Kode dipakai langsung oleh route API sehingga dikunci.'
              : 'Permission adalah hak akses terkecil yang dicek route API.'}
          </DialogDescription>
        </DialogHeader>

        <form id="permission-form" noValidate onSubmit={submit} className="grid gap-4">
          {isEdit ? (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Kode</span>
              <p className="font-mono text-sm text-muted-foreground">{permission.code}</p>
            </div>
          ) : (
            <FormField id="code" label="Kode" required error={errors.code} hint="Format <entity>:<action>, contoh user:list">
              <Input {...field('code')} autoFocus spellCheck={false} className="font-mono" />
            </FormField>
          )}

          <FormField id="name" label="Nama" required error={errors.name}>
            <Input {...field('name')} autoFocus={isEdit} placeholder="mis. Lihat daftar pengguna" />
          </FormField>

          <FormField
            id="module"
            label="Modul"
            required
            error={errors.module}
            hint="Nama grup di daftar centang role, mis. Pengguna"
          >
            <Input {...field('module')} placeholder="mis. Pengguna" />
          </FormField>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="permission-form" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {save.isPending ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Buat permission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
