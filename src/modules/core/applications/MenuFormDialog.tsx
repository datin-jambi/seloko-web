import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import { MENU_ICON_NAMES } from '@/config/menu-icons'
import { MenuIcon } from '@/components/shared/MenuIcon'
import { menuAdminService } from '@/services/menu-admin.service'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type { ApplicationDetail, MenuCmsNode } from '@/types/core'
import { parentOptions, validateMenu, type MenuFormErrors, type MenuFormValues, type Tree } from './menu-tree'

const NO_PARENT = '__root'

/** Role pembatas: pilih beberapa role sekaligus (checkbox), kosong = terbuka untuk semua role aplikasi. */
function RolePicker({
  roles,
  selected,
  onToggle,
  disabled,
}: {
  roles: { id: string; name: string }[]
  selected: Set<string>
  onToggle: (id: string, checked: boolean) => void
  disabled?: boolean
}) {
  if (roles.length === 0)
    return <p className="text-xs text-muted-foreground">Aplikasi ini belum punya role.</p>
  return (
    <div className="grid max-h-40 gap-1 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-2">
      {roles.map((r) => (
        <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60">
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            disabled={disabled}
            onChange={(e) => onToggle(r.id, e.target.checked)}
            className="size-3.5 shrink-0 accent-primary"
          />
          <span className="truncate font-mono">{r.name}</span>
        </label>
      ))}
    </div>
  )
}

/**
 * Tambah/ubah item menu. `code` dan `applicationId` terkunci setelah dibuat
 * (UpdateMenuBodySchema). Induk dipilih dari pohon; diri sendiri dan turunannya
 * tidak ditawarkan agar tidak membuat siklus.
 */
export function MenuFormDialog({
  app,
  tree,
  roles,
  menu,
  defaultParentId,
  onClose,
  onSaved,
}: {
  app: ApplicationDetail
  tree: Tree<MenuCmsNode>[]
  roles: { id: string; name: string }[]
  /** Ada = mode ubah. */
  menu?: MenuCmsNode | null
  /** Induk awal saat menambah dari tombol "Tambah sub-menu". */
  defaultParentId?: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!menu
  const [v, setV] = useState<MenuFormValues>({
    parentId: menu?.parentId ?? defaultParentId ?? '',
    code: menu?.code ?? '',
    label: menu?.label ?? '',
    icon: menu?.icon ?? '',
    path: menu?.path ?? '',
    isExternal: menu?.isExternal ?? false,
    sortOrder: menu?.sortOrder ?? 0,
  })
  const [errors, setErrors] = useState<MenuFormErrors>({})
  const [permissionId, setPermissionId] = useState(menu?.permissionId ?? '')
  // Role pembatas jarang diubah: dilipat supaya form tetap ringkas.
  const [showRoles, setShowRoles] = useState((menu?.roles.length ?? 0) > 0)
  const [roleIds, setRoleIds] = useState<Set<string>>(new Set(menu?.roles.map((r) => r.id) ?? []))

  const options = parentOptions(tree, menu?.id)

  const save = useMutation({
    mutationFn: async () => {
      const base = {
        parentId: v.parentId || null,
        label: v.label.trim(),
        icon: v.icon.trim() || null,
        path: v.path.trim() || null,
        isExternal: v.isExternal,
        sortOrder: v.sortOrder,
        permissionId: permissionId || null,
        roleIds: [...roleIds],
      }
      if (isEdit) {
        await menuAdminService.update(menu.id, base)
        return
      }
      await menuAdminService.create({ ...base, applicationId: app.id, code: v.code.trim() })
    },
    onSuccess: () => {
      toast.success(isEdit ? `Menu ${v.label.trim()} diperbarui` : `Menu ${v.label.trim()} dibuat`)
      void qc.invalidateQueries({ queryKey: ['/menus'] })
      onSaved()
      onClose()
    },
    onError: (e) => {
      const fields = apiFieldErrors(e)
      if (Object.keys(fields).length > 0) return setErrors(fields)
      toast.error(isEdit ? 'Gagal memperbarui menu' : 'Gagal membuat menu', { description: apiErrorMessage(e) })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateMenu(v, { isEdit })
    setErrors(found)
    if (Object.keys(found).length > 0) return document.getElementById(Object.keys(found)[0])?.focus()
    save.mutate()
  }

  const field = (key: 'code' | 'label' | 'icon' | 'path' | 'sortOrder') => ({
    id: key,
    value: String(v[key]),
    disabled: save.isPending,
    'aria-invalid': !!errors[key] || undefined,
    'aria-describedby': `${key}-msg`,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setV((p) => ({ ...p, [key]: key === 'sortOrder' ? Number(raw) : raw }))
      if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    },
  })

  const parentLabel = options.find((o) => o.id === (menu?.parentId ?? defaultParentId))?.label

  return (
    <Dialog open onOpenChange={(o) => !save.isPending && !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Ubah menu ${menu.label}` : 'Tambah menu'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Kode menu tidak dapat diubah. Path relatif digabung ke Base URL aplikasi, path absolut dipakai apa adanya.'
              : `Item navigasi untuk ${app.name}. Path boleh dikosongkan bila menu ini hanya wadah sub-menu.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form id="menu-form" noValidate onSubmit={submit} className="grid gap-4">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FormField
              id="parentId"
              label="Induk menu"
              hint={isEdit && menu.parentId ? undefined : 'Biarkan kosong untuk menu tingkat atas'}
            >
              <Select
                value={v.parentId || NO_PARENT}
                onValueChange={(val) => setV((p) => ({ ...p, parentId: val === NO_PARENT ? '' : val }))}
                disabled={save.isPending}
              >
                <SelectTrigger id="parentId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>{isEdit ? 'Menu tingkat atas' : 'Tingkat atas (tanpa induk)'}</SelectItem>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {'\u00A0'.repeat(o.depth * 3)}
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="sortOrder" label="Urutan" error={errors.sortOrder} hint="Angka kecil tampil lebih dulu">
              <Input {...field('sortOrder')} type="number" step={1} className="tabular-nums" />
            </FormField>

            {isEdit ? (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">Kode</span>
                <p className="font-mono text-sm text-muted-foreground">{menu.code}</p>
              </div>
            ) : (
              <FormField id="code" label="Kode" required error={errors.code} hint="Unik dalam aplikasi, contoh pengguna.daftar">
                <Input
                  {...field('code')}
                  autoFocus
                  spellCheck={false}
                  className="font-mono"
                  onChange={(e) => {
                    const raw = e.target.value.toLowerCase()
                    setV((p) => ({ ...p, code: raw }))
                    if (errors.code) setErrors((p) => ({ ...p, code: undefined }))
                  }}
                />
              </FormField>
            )}

            <FormField id="label" label="Label" required error={errors.label} hint="Teks yang dibaca pengguna">
              <Input {...field('label')} autoFocus={isEdit} />
            </FormField>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <FormField id="path" label="Path / URL" error={errors.path} hint={'Internal: "/seloko/pengguna". Eksternal: URL lengkap'}>
              <Input {...field('path')} className="font-mono text-sm" spellCheck={false} />
            </FormField>

            <FormField id="icon" label="Ikon" error={errors.icon} hint="Nama ikon Lucide yang dipakai sidebar">
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                  <MenuIcon name={v.icon} />
                </span>
                <Select
                  value={v.icon || '__none'}
                  onValueChange={(val) => setV((p) => ({ ...p, icon: val === '__none' ? '' : val }))}
                  disabled={save.isPending}
                >
                  <SelectTrigger id="icon" className="w-full">
                    <SelectValue placeholder="Tanpa ikon" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none">Tanpa ikon</SelectItem>
                    {MENU_ICON_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormField>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={v.isExternal}
              disabled={save.isPending}
              onChange={(e) => setV((p) => ({ ...p, isExternal: e.target.checked }))}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Tautan eksternal</span>
              <span className="block text-xs text-muted-foreground">
                Dibuka di tab baru (mis. aplikasi lain). Wajib memakai URL lengkap.
              </span>
            </span>
          </label>

          <FormField
            id="permissionId"
            label="Permission pembatas"
            hint="Menu hanya tampil bagi yang punya permission ini. Kosongkan bila tidak dibatasi."
          >
            <Select
              value={permissionId || '__none'}
              onValueChange={(val) => setPermissionId(val === '__none' ? '' : val)}
              disabled={save.isPending}
            >
              <SelectTrigger id="permissionId" className="w-full">
                <SelectValue placeholder="Tanpa pembatas" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__none">Tanpa pembatas</SelectItem>
                {app.permissionsByModule.flatMap((g) =>
                  g.permissions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {g.module} · {p.name} ({p.code})
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-1.5">
            <button
              type="button"
              onClick={() => setShowRoles(!showRoles)}
              className="w-fit text-left text-sm font-medium hover:text-primary"
            >
              {showRoles ? '− ' : '+ '}Role pembatas
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {roleIds.size > 0 ? `${roleIds.size} dipilih` : 'opsional'}
              </span>
            </button>
            {showRoles && (
              <RolePicker
                roles={roles}
                selected={roleIds}
                disabled={save.isPending}
                onToggle={(id, checked) =>
                  setRoleIds((prev) => {
                    const next = new Set(prev)
                    if (checked) next.add(id)
                    else next.delete(id)
                    return next
                  })
                }
              />
            )}
          </div>

          {isEdit && menu && (
            <p className="text-xs text-muted-foreground">
              Saat ini di bawah: <strong className="text-foreground">{parentLabel ?? 'menu tingkat atas'}</strong>
            </p>
          )}
        </form>
        </DialogBody>


        <DialogFooter>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="menu-form" variant={isEdit ? 'edit' : 'create'} disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {save.isPending ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Buat menu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
