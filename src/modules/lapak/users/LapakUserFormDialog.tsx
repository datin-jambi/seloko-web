import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Eye, EyeOff, Info, Loader2 } from 'lucide-react'
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
  opds,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: LapakUser | null
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
  const [accountType, setAccountType] = useState<'INTERNAL' | 'PUBLIC'>(user?.accountType ?? 'INTERNAL')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Role diambil per jenis akun: pegawai dari aplikasi CMS, warga dari aplikasi
  // publik. Server sudah memfilter aplikasi + audiens, jadi tidak ada role nyasar.
  const rolesQuery = useQuery({
    queryKey: ['lapak', 'users', 'roles', accountType],
    queryFn: () => lapakUserService.roles(accountType),
    staleTime: 5 * 60_000,
  })
  const roles = rolesQuery.data ?? []

  // Sabuk pengaman: hanya role seaudiens dengan jenis akun yang boleh dipilih.
  const visibleRoles = roles.filter((r) => r.audience === accountType)
  // Server menolak reset kata sandi untuk akun sendiri & superadmin.
  const canSetPassword = !lockRoles && !(isEdit && user.isSuperAdmin)

  /** Ganti jenis akun (hanya saat membuat akun) → buang role yang tak lagi valid. */
  const changeAccountType = (next: 'INTERNAL' | 'PUBLIC') => {
    setAccountType(next)
    const allowed = new Set(roles.filter((r) => r.audience === next).map((r) => r.id))
    setSelected((prev) => new Set([...prev].filter((id) => allowed.has(id))))
    if (errors.roles) setErrors((prev) => ({ ...prev, roles: undefined as unknown as string }))
  }

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
    // Kata sandi hanya dikirim bila diisi (tidak pernah ditampilkan API).
    if (v.password) body.password = v.password
    return body
  }

  const save = useMutation({
    mutationFn: async () => {
      const phoneNumber = normalizePhoneId(v.phoneNumber)
      if (!isEdit) {
        return lapakUserService.create({
          fullName: v.fullName.trim(),
          // Akun eksternal (warga) login dengan email — username tidak dipakai.
          username: accountType === 'INTERNAL' ? v.username.trim().toLowerCase() : undefined,
          email: v.email.trim().toLowerCase(),
          password: v.password,
          nip: accountType === 'INTERNAL' ? v.nip.trim() || undefined : undefined,
          phoneNumber: phoneNumber || undefined,
          accountType,
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
      if (accountType === 'INTERNAL') {
        if (v.username.trim().length < 3) next.username = 'Username minimal 3 karakter.'
        else if (!/^[a-z0-9_.-]+$/.test(v.username.trim()))
          next.username = 'Hanya huruf kecil, angka, titik, _ atau -.'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) next.email = 'Format email tidak valid.'
    }
    // Kata sandi wajib saat membuat akun; saat mengubah opsional (hanya bila diisi).
    const passwordTouched = !isEdit || v.password.length > 0 || v.confirm.length > 0
    if (passwordTouched && canSetPassword) {
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
                : 'Akun baru untuk aplikasi Lapak Jambi — pilih internal (pegawai) atau eksternal (warga). Role Lapak langsung diberikan, jadi pengguna bisa masuk setelah dibuat.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <section className="grid items-start gap-3 sm:grid-cols-2">
              <h2 className="text-sm font-semibold sm:col-span-2">Akun</h2>
              {!isEdit && (
                <p className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs sm:col-span-2">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300"
                    aria-hidden
                  />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Username dan email tidak dapat diubah setelah akun dibuat.
                    </span>{' '}
                    Periksa kembali sebelum menyimpan — setelah tersimpan, perubahan hanya bisa dilakukan admin{' '}
                    <strong>Seloko</strong> (menu Pengguna).
                  </span>
                </p>
              )}
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
                <>
                  <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs sm:col-span-2">
                    <Info
                      className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300"
                      aria-hidden
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        Username, email, dan jenis akun tidak dapat diubah dari Lapak Jambi.
                      </p>
                      <p className="text-muted-foreground">
                        Ketiganya terikat ke identitas akun di pusat — hubungi admin <strong>Seloko</strong> (menu
                        Pengguna) untuk mengubahnya. Di halaman ini yang bisa diubah: nama, NIP, telepon, role Lapak,
                        dan kata sandi.
                      </p>
                    </div>
                  </div>
                  <dl className="grid gap-2 text-sm sm:col-span-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Username</dt>
                      <dd className="font-mono">{user.username ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="break-all">{user.email}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <>
                  <FormField
                    id="lu-accountType"
                    label="Jenis akun"
                    required
                    hint={
                      accountType === 'INTERNAL'
                        ? 'Pegawai — masuk dengan username atau email.'
                        : 'Warga/eksternal — masuk dengan email, tanpa username.'
                    }
                  >
                    <Select
                      value={accountType}
                      onValueChange={(val) => changeAccountType(val as 'INTERNAL' | 'PUBLIC')}
                      disabled={save.isPending}
                    >
                      <SelectTrigger id="lu-accountType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERNAL">Internal (pegawai)</SelectItem>
                        <SelectItem value="PUBLIC">Eksternal (warga)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  {accountType === 'INTERNAL' ? (
                    <FormField
                      id="lu-username"
                      label="Username"
                      required
                      error={errors.username}
                      hint="Huruf kecil, angka, titik, _ atau -"
                    >
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
                  ) : (
                    <p className="self-end rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Akun eksternal tidak memakai username — pengguna masuk dengan email dan kata sandi.
                    </p>
                  )}
                  <FormField
                    id="lu-email"
                    label="Email"
                    required
                    error={errors.email}
                    className={accountType === 'PUBLIC' ? 'sm:col-span-2' : undefined}
                  >
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
                </>
              )}
            </section>

            <section className="grid items-start gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <h2 className="text-sm font-semibold sm:col-span-2">Profil</h2>
              {accountType === 'INTERNAL' ? (
                <FormField id="lu-nip" label="NIP" error={errors.nip} hint="Kosongkan untuk pegawai non-ASN">
                  <Input {...field('nip')} inputMode="numeric" className="tabular-nums" />
                </FormField>
              ) : (
                <p className="self-end rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  NIP hanya untuk akun pegawai.
                </p>
              )}
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

            <section className="grid items-start gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h2 className="text-sm font-semibold">Kata sandi</h2>
                <p className="text-xs text-muted-foreground">
                  {isEdit
                    ? 'Kosongkan bila tidak ingin mengubah. Menyimpan kata sandi baru akan mengakhiri semua sesi pengguna ini, jadi ia harus masuk ulang.'
                    : 'Min. 8 karakter, 1 huruf besar, 1 angka.'}
                </p>
              </div>
              {canSetPassword ? (
                <>
                  <FormField
                    id="lu-password"
                    label={isEdit ? 'Kata sandi baru' : 'Kata sandi'}
                    required={!isEdit}
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
                  <FormField
                    id="lu-confirm"
                    label={isEdit ? 'Ulangi kata sandi baru' : 'Ulangi kata sandi'}
                    required={!isEdit}
                    error={errors.confirm}
                  >
                    <div className="relative">
                      <Input
                        id="lu-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={v.confirm}
                        onChange={(e) => set('confirm')(e.target.value)}
                        autoComplete="new-password"
                        className="pr-9"
                        aria-invalid={!!errors.confirm || undefined}
                        aria-describedby="lu-confirm-msg"
                        disabled={save.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label={showConfirm ? 'Sembunyikan ulangi kata sandi' : 'Tampilkan ulangi kata sandi'}
                        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </FormField>
                </>
              ) : (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
                  {isEdit && user.isSuperAdmin
                    ? 'Kata sandi akun superadmin hanya bisa diubah oleh superadmin di Seloko.'
                    : 'Kata sandi akun sendiri tidak diubah dari halaman ini.'}
                </p>
              )}
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
                {visibleRoles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Belum ada role {accountType === 'INTERNAL' ? 'pegawai' : 'eksternal'} di aplikasi Lapak.
                  </p>
                )}
                {visibleRoles.map((r) => (
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
