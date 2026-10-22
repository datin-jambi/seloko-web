import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import { roleService } from '@/services/role.service'
import { applicationService } from '@/services/application.service'
import { userService } from '@/services/user.service'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type { Audience, RoleListItem } from '@/types/core'
import { buildCreateRoleBody, validateRole, type RoleFormValues } from './access-form'
import { PermissionChecklist, type PermissionGroup } from './PermissionChecklist'

/**
 * Tambah/ubah role milik satu aplikasi. `applicationId` dan `audience` terkunci
 * setelah dibuat (UpdateRoleBodySchema). Saat ubah, permission dimuat dari
 * `GET /roles/:id` yang sudah menandai `granted`.
 *
 * Dipakai dari dua tempat:
 * - Tab Role pada detail aplikasi → `applicationId` + `appAudience` + `permissionGroups` terisi.
 * - Halaman Role (lintas aplikasi) → ketiganya kosong; aplikasi dipilih di dalam dialog dan
 *   audience/permission mengikuti aplikasi terpilih (dimuat dari `GET /applications/:id`).
 */
export function RoleFormDialog({
  applicationId,
  appAudience,
  role,
  permissionGroups,
  onClose,
  onSaved,
}: {
  /** Terisi = konteks aplikasi (terkunci). Kosong + tidak mengubah = aplikasi dipilih di sini. */
  applicationId?: string
  appAudience?: Audience
  /** Ada = mode ubah. */
  role?: RoleListItem | null
  permissionGroups?: PermissionGroup[]
  onClose: () => void
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!role
  // Aplikasi terpilih. Saat membuat dari lintas aplikasi nilai awal kosong.
  const [pickedAppId, setPickedAppId] = useState(applicationId ?? role?.applicationId ?? '')
  const [v, setV] = useState<RoleFormValues>({
    name: role?.name ?? '',
    description: role?.description ?? '',
    audience: role?.audience ?? 'INTERNAL',
    isActive: role?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Sekali operator mengubah centang, state lokal yang berlaku — bukan `granted` dari server.
  const [touched, setTouched] = useState(false)

  // Detail aplikasi hanya perlu saat membuat dari lintas aplikasi: untuk tahu audiens
  // (aplikasi internal hanya menerima role internal) dan daftar permission-nya.
  const needsAppDetail = !isEdit && !applicationId && !!pickedAppId
  const appDetail = useQuery({
    queryKey: ['/applications', pickedAppId],
    queryFn: () => applicationService.get(pickedAppId),
    enabled: needsAppDetail,
  })

  const apps = useQuery({
    queryKey: ['/applications', 'active'],
    queryFn: userService.activeApps,
    enabled: !isEdit && !applicationId,
    staleTime: 5 * 60_000,
  })

  // Detail role membawa seluruh permission aplikasi + `granted`.
  const detail = useQuery({
    queryKey: ['/roles', role?.id],
    queryFn: () => roleService.get(role!.id),
    enabled: isEdit,
    // Sekali muat cukup: centang dipegang di state lokal sampai disimpan.
    staleTime: Infinity,
  })

  const groups: PermissionGroup[] = isEdit
    ? (detail.data?.permissionsByModule ?? [])
    : (permissionGroups ?? appDetail.data?.permissionsByModule ?? [])
  const audience: Audience | undefined = isEdit
    ? role?.audience
    : (appAudience ?? appDetail.data?.audience)

  const fromServer = isEdit && detail.data ? new Set(detail.data.permissionsByModule.flatMap((g) => g.permissions.filter((p) => p.granted).map((p) => p.id))) : selected
  const active = touched ? selected : fromServer
  const setActive = (id: string, checked: boolean) => {
    const next = new Set(active)
    if (checked) next.add(id)
    else next.delete(id)
    setTouched(true)
    setSelected(next)
  }

  // Ganti aplikasi = permission & audiens aplikasi lama tidak berlaku lagi.
  const pickApp = (id: string) => {
    setPickedAppId(id)
    setSelected(new Set())
    setTouched(false)
    setV((p) => ({ ...p, audience: 'INTERNAL' }))
  }

  const save = useMutation({
    mutationFn: async () => {
      const permissionIds = [...active]
      if (isEdit) {
        await roleService.update(role.id, {
          name: v.name.trim(),
          description: v.description.trim() || null,
        })
        await roleService.setPermissions(role.id, permissionIds)
        return
      }
      await roleService.create(buildCreateRoleBody(pickedAppId, v, permissionIds))
    },
    onSuccess: () => {
      toast.success(isEdit ? `Role ${v.name.trim()} diperbarui` : `Role ${v.name.trim()} dibuat`)
      void qc.invalidateQueries({ queryKey: ['/roles'] })
      void qc.invalidateQueries({ queryKey: ['/applications', pickedAppId] })
      onSaved()
      onClose()
    },
    onError: (e) => {
      const fields = apiFieldErrors(e)
      if (Object.keys(fields).length > 0) return setErrors(fields)
      toast.error(isEdit ? 'Gagal memperbarui role' : 'Gagal membuat role', { description: apiErrorMessage(e) })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!isEdit && !pickedAppId) return toast.error('Pilih aplikasi dulu')
    const found = validateRole(v)
    setErrors(found)
    if (Object.keys(found).length > 0) return document.getElementById(Object.keys(found)[0])?.focus()
    save.mutate()
  }

  const busy = save.isPending || (isEdit && detail.isPending) || (needsAppDetail && appDetail.isPending)

  return (
    <Dialog open onOpenChange={(o) => !save.isPending && !o && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Ubah role ${role?.name}` : 'Tambah role'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Nama dan deskripsi bisa diubah. Centang permission lalu simpan — daftar dikirim seluruhnya sekaligus.'
              : 'Role mengelompokkan permission. Aplikasi dan audiens tidak bisa diubah setelah role dibuat.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form id="role-form" noValidate onSubmit={submit} className="grid gap-4">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            {/* Aplikasi: terpilih tetap saat membuat dari lintas aplikasi. */}
            {!isEdit && !applicationId ? (
              <FormField id="applicationId" label="Aplikasi" required hint="Menentukan permission yang bisa dicentang">
                <Select value={pickedAppId} onValueChange={pickApp} disabled={busy}>
                  <SelectTrigger id="applicationId" className="w-full">
                    <SelectValue placeholder="Pilih aplikasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {(apps.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}

            <FormField id="name" label="Nama role" required error={errors.name} hint="Huruf kecil, angka, atau tanda hubung">
              <Input
                id="name"
                value={v.name}
                disabled={busy}
                spellCheck={false}
                aria-invalid={!!errors.name || undefined}
                aria-describedby="name-msg"
                onChange={(e) => {
                  setV((p) => ({ ...p, name: e.target.value.toLowerCase() }))
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
              />
            </FormField>

            {!isEdit ? (
              <FormField id="audience" label="Audiens" required hint="Aplikasi internal hanya menerima role pegawai">
                <Select
                  value={v.audience}
                  onValueChange={(a) => setV((p) => ({ ...p, audience: a as Audience }))}
                  disabled={busy || !audience || audience === 'INTERNAL'}
                >
                  <SelectTrigger id="audience" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL">Internal (pegawai)</SelectItem>
                    <SelectItem value="PUBLIC">Publik (warga)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            ) : (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">Audiens</span>
                <p className="text-sm text-muted-foreground">
                  {role?.audience === 'INTERNAL' ? 'Internal (pegawai)' : 'Publik (warga)'} — tidak dapat diubah
                </p>
              </div>
            )}
          </div>

          <FormField id="description" label="Deskripsi" error={errors.description}>
            <Textarea
              id="description"
              rows={2}
              value={v.description}
              disabled={busy}
              placeholder="Untuk apa role ini dipakai…"
              aria-invalid={!!errors.description || undefined}
              aria-describedby="description-msg"
              onChange={(e) => setV((p) => ({ ...p, description: e.target.value }))}
            />
          </FormField>

          {!isEdit && (
            <label className="flex items-center gap-3 rounded-md border border-border p-3">
              <input
                type="checkbox"
                checked={v.isActive}
                disabled={busy}
                onChange={(e) => setV((p) => ({ ...p, isActive: e.target.checked }))}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-medium">Aktifkan role setelah dibuat</span>
            </label>
          )}

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">
              Permission
              {(isEdit && detail.isPending) || (needsAppDetail && appDetail.isPending) ? (
                <Loader2 className="ml-2 inline size-3.5 animate-spin text-muted-foreground" />
              ) : null}
            </span>
            <PermissionChecklist groups={groups} selected={active} onToggle={setActive} disabled={busy} />
          </div>
        </form>
        </DialogBody>


        <DialogFooter>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="role-form" variant={isEdit ? 'edit' : 'create'} disabled={busy || (!isEdit && !pickedAppId)}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {save.isPending ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Buat role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
