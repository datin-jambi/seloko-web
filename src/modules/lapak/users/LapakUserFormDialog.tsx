import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/shared/FormField'
import { lapakUserService } from '@/services/lapak/user.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import { normalizePhoneId } from '@/lib/phone'
import type {
  LapakRoleAssignmentInput,
  LapakRoleOption,
  LapakUser,
  UpdateLapakUserBody,
} from '@/types/lapak'

/** Sentinel Select — Radix menolak item bernilai string kosong. */
const ALL_ORG = '__all_org__'

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x))

/**
 * Tambah / ubah pengguna Lapak.
 *
 * Lingkup data dikunci oleh halaman ini: yang dibuat selalu akun pegawai
 * (INTERNAL) tanpa superadmin, dan role yang bisa dipilih hanya role milik
 * aplikasi Lapak. Pada mode ubah, `roles` hanya dikirim bila operator memang
 * mengubahnya — supaya lingkup OPD per-role yang sudah ada tidak tertimpa
 * hanya karena form dibuka.
 */
export function LapakUserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  opds,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: LapakUser | null
  roles: LapakRoleOption[]
  opds: { id: string; name: string }[]
  onSaved?: () => void
}) {
  const isEdit = !!user
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  // Server menolak perubahan role untuk akun sendiri; UI ikut menonaktifkan.
  const lockRoles = isEdit && user.id === me?.id

  const initialRoleIds = new Set(user?.roles.map((r) => r.roleId) ?? [])
  const initialScope = (() => {
    const list = user?.roles ?? []
    if (list.length === 0 || list.some((r) => r.organizations.length === 0)) return ''
    const ids = new Set(list.flatMap((r) => r.organizations.map((o) => o.id)))
    return ids.size === 1 ? [...ids][0] : ''
  })()

  const [v, setV] = useState({
    fullName: user?.fullName ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    confirm: '',
    nip: user?.nip ?? '',
    phoneNumber: normalizePhoneId(user?.phoneNumber ?? '') || (user?.phoneNumber ?? ''),
  })
  const [selected, setSelected] = useState<Set<string>>(initialRoleIds)
  const [organizationId, setOrganizationId] = useState(initialScope)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof typeof v) => (value: string) => {
    setV((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined as unknown as string }))
  }

  const toggleRole = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (errors.roles) setErrors((prev) => ({ ...prev, roles: undefined as unknown as string }))
  }

  const rolesDirty = !sameSet(selected, initialRoleIds) || organizationId !== initialScope
  const rolesPayload: LapakRoleAssignmentInput[] = [...selected].map((roleId) => ({
    roleId,
    ...(organizationId ? { organizationIds: [organizationId] } : {}),
  }))

  const updateBody = (): UpdateLapakUserBody => {
    const body: UpdateLapakUserBody = {}
    if (!isEdit) return body
    const phoneNumber = normalizePhoneId(v.phoneNumber)
    if (v.fullName.trim() !== user.fullName) body.fullName = v.fullName.trim()
    if (v.nip.trim() !== (user.nip ?? '')) body.nip = v.nip.trim() || null
    if (phoneNumber !== (user.phoneNumber ? normalizePhoneId(user.phoneNumber) : '')) {
      body.phoneNumber = phoneNumber || null
    }
    if (rolesDirty && !lockRoles) body.roles = rolesPayload
    return body
  }

  const save = useMutation({
    mutationFn: async () => {
      const phoneNumber = normalizePhoneId(v.phoneNumber)
      if (!isEdit) {
        return lapakUserService.create({
          fullName: v.fullName.trim(),
          username: v.username.trim().toLowerCase(),
          email: v.email.trim().toLowerCase(),
          password: v.password,
          nip: v.nip.trim() || undefined,
          phoneNumber: phoneNumber || undefined,
          roles: rolesPayload,
        })
      }

      // Hanya field yang berubah yang dikirim (API menolak body kosong).
      return lapakUserService.update(user.id, updateBody())
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? `${saved.fullName} diperbarui` : `Akun ${saved.fullName} dibuat`, {
        description: isEdit ? undefined : 'Role Lapak sudah aktif — pengguna bisa langsung masuk.',
      })
      void qc.invalidateQueries({ queryKey: ['lapak-list', '/lapak/users'] })
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e) => {
      if (isAxiosError(e) && e.response?.status === 409) {
        return toast.error('Data sudah dipakai', { description: apiErrorMessage(e) })
      }
      const fields = apiFieldErrors(e)
      if (Object.keys(fields).length > 0) {
        setErrors(fields)
        return
      }
      toast.error(isEdit ? 'Gagal memperbarui pengguna' : 'Gagal membuat pengguna', {
        description: apiErrorMessage(e),
      })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (v.fullName.trim().length < 2) next.fullName = 'Nama minimal 2 karakter.'
    if (!isEdit) {
      if (v.username.trim().length < 3) next.username = 'Username minimal 3 karakter.'
      else if (!/^[a-z0-9_.-]+$/.test(v.username.trim()))
        next.username = 'Hanya huruf kecil, angka, titik, _ atau -.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) next.email = 'Format email tidak valid.'
      if (v.password.length < 8) next.password = 'Kata sandi minimal 8 karakter.'
      else if (!/[A-Z]/.test(v.password)) next.password = 'Harus ada minimal 1 huruf besar.'
      else if (!/[0-9]/.test(v.password)) next.password = 'Harus ada minimal 1 angka.'
      if (v.confirm !== v.password) next.confirm = 'Konfirmasi tidak sama.'
    }
    if (selected.size === 0) next.roles = 'Pilih minimal satu role Lapak.'

    if (Object.keys(next).length > 0) {
      setErrors(next)
      const first = Object.keys(next)[0]
      document.getElementById(`lu-${first}`)?.focus()
      return
    }
    if (isEdit && Object.keys(updateBody()).length === 0) {
      toast.info('Belum ada perubahan untuk disimpan')
      return
    }
    setErrors({})
    save.mutate()
  }

  const field = (key: 'fullName' | 'nip' | 'phoneNumber') => ({
    id: `lu-${key}`,
    value: v[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key)(e.target.value),
    'aria-invalid': !!errors[key] || undefined,
    'aria-describedby': `lu-${key}-msg`,
    disabled: save.isPending,
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah pengguna Lapak' : 'Tambah pengguna Lapak'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Perubahan hanya berlaku untuk data akun dan role di aplikasi Lapak. Role aplikasi lain tidak disentuh.'
                : 'Akun pegawai baru untuk aplikasi Lapak Jambi. Role Lapak langsung diberikan, jadi pengguna bisa masuk setelah dibuat.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <section className="grid items-start gap-3 sm:grid-cols-2">
              <h2 className="text-sm font-semibold sm:col-span-2">Akun</h2>
              <FormField
                id="lu-fullName"
                label="Nama lengkap"
                required
                error={errors.fullName}
                className="sm:col-span-2"
              >
                <Input {...field('fullName')} autoComplete="name" placeholder="Budi Santoso" />
              </FormField>

              {isEdit ? (
                <div className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-muted-foreground">
                    Username <span className="font-mono text-foreground">{user.username ?? '—'}</span> · Email{' '}
                    <span className="text-foreground">{user.email}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Username, email, dan jenis akun tidak dapat diubah dari sini.
                  </span>
                </div>
              ) : (
                <>
                  <FormField id="lu-username" label="Username" required error={errors.username} hint="Huruf kecil, angka, titik, _ atau -">
                    <Input
                      id="lu-username"
                      value={v.username}
                      onChange={(e) => set('username')(e.target.value.toLowerCase())}
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={!!errors.username || undefined}
                      aria-describedby="lu-username-msg"
                      disabled={save.isPending}
                    />
                  </FormField>
                  <FormField id="lu-email" label="Email" required error={errors.email}>
                    <Input
                      id="lu-email"
                      type="email"
                      value={v.email}
                      onChange={(e) => set('email')(e.target.value)}
                      autoComplete="off"
                      aria-invalid={!!errors.email || undefined}
                      aria-describedby="lu-email-msg"
                      disabled={save.isPending}
                    />
                  </FormField>
                  <FormField
                    id="lu-password"
                    label="Kata sandi"
                    required
                    error={errors.password}
                    hint="Min. 8 karakter, 1 huruf besar, 1 angka"
                  >
                    <div className="relative">
                      <Input
                        id="lu-password"
                        type={showPassword ? 'text' : 'password'}
                        value={v.password}
                        onChange={(e) => set('password')(e.target.value)}
                        autoComplete="new-password"
                        className="pr-9"
                        aria-invalid={!!errors.password || undefined}
                        aria-describedby="lu-password-msg"
                        disabled={save.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </FormField>
                  <FormField id="lu-confirm" label="Ulangi kata sandi" required error={errors.confirm}>
                    <Input
                      id="lu-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={v.confirm}
                      onChange={(e) => set('confirm')(e.target.value)}
                      autoComplete="new-password"
                      aria-invalid={!!errors.confirm || undefined}
                      aria-describedby="lu-confirm-msg"
                      disabled={save.isPending}
                    />
                  </FormField>
                </>
              )}
            </section>

            <section className="grid items-start gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <h2 className="text-sm font-semibold sm:col-span-2">Profil</h2>
              <FormField id="lu-nip" label="NIP" error={errors.nip} hint="Kosongkan untuk pegawai non-ASN">
                <Input {...field('nip')} inputMode="numeric" className="tabular-nums" />
              </FormField>
              <FormField id="lu-phoneNumber" label="Telepon" error={errors.phoneNumber} hint="Ditulis otomatis sebagai +62">
                <Input
                  {...field('phoneNumber')}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0812 3456 7890"
                  onBlur={() => set('phoneNumber')(normalizePhoneId(v.phoneNumber))}
                />
              </FormField>
            </section>

            <section className="grid gap-3 border-t border-border pt-4">
              <div>
                <h2 className="text-sm font-semibold">Akses Lapak</h2>
                <p className="text-xs text-muted-foreground">
                  Hanya role milik aplikasi Lapak yang bisa diberikan. Akun baru tidak pernah menjadi superadmin
                  global.
                </p>
              </div>

              <fieldset className="grid gap-1.5 sm:grid-cols-2" disabled={lockRoles || save.isPending}>
                <legend className="mb-1 text-xs font-medium text-muted-foreground">
                  Role <span className="text-destructive">*</span>
                </legend>
                {roles.length === 0 && (
                  <p className="text-xs text-muted-foreground">Belum ada role aktif di aplikasi Lapak.</p>
                )}
                {roles.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-2 py-1.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleRole(r.id)}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      aria-describedby={errors.roles ? 'lu-roles-msg' : undefined}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium leading-tight">{r.name}</span>
                      {r.description && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">
                          {r.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
              {errors.roles && (
                <p id="lu-roles-msg" className="text-xs text-destructive">
                  {errors.roles}
                </p>
              )}

              <FormField
                id="lu-scope"
                label="Lingkup OPD"
                hint="Berlaku untuk semua role di atas. Pilih “Semua OPD” untuk penugasan level Bapenda."
              >
                <Select
                  value={organizationId || ALL_ORG}
                  onValueChange={(next) => setOrganizationId(next === ALL_ORG ? '' : next)}
                  disabled={lockRoles || save.isPending}
                >
                  <SelectTrigger id="lu-scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ORG}>Semua OPD</SelectItem>
                    {opds.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {lockRoles && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Role akun Anda sendiri tidak bisa diubah dari halaman ini (mencegah admin mengunci dirinya).
                </p>
              )}
            </section>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Batal
            </Button>
            <Button type="submit" variant={isEdit ? 'edit' : 'create'} disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {save.isPending ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Buat akun'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
