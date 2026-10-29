import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { ImageUpload, type UploadedImage } from '@/components/shared/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AVATAR_RULE } from '@/config/image-rules'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import { normalizePhoneId } from '@/lib/phone'
import type { CreateUserBody } from '@/types/core'
import { conflictField, USER_DETAIL, USERS_LIST as LIST, validateCreateUser, type CreateUserErrors } from './user-form'

const EMPTY = {
  fullName: '',
  nip: '',
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirm: '',
  isSuperAdmin: false,
}
type Values = typeof EMPTY

// POST /users — hanya akun pegawai (INTERNAL). Akun warga lahir dari pendaftaran mandiri di aplikasi publik.
export function UserCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const [v, setV] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<CreateUserErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  // Unggahan langsung ke ImageKit; URL+fileId baru ikut saat form disimpan.
  const [avatar, setAvatar] = useState<UploadedImage | null>(null)

  const set = (key: keyof Values) => (value: string | boolean) => {
    setV((prev) => ({ ...prev, [key]: value }))
    // Error field hilang begitu field diubah.
    if (errors[key as keyof CreateUserErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const create = useMutation({
    mutationFn: (body: CreateUserBody) => userService.create(body),
    onSuccess: (user) => {
      void qc.invalidateQueries({ queryKey: ['/users'] })
      toast.success(`Akun ${user.fullName} dibuat`, { description: 'Tugaskan role agar pengguna bisa mengakses aplikasi.' })
      navigate(USER_DETAIL(user.id))
    },
    onError: (e) => {
      const fields = apiFieldErrors(e)
      if (isAxiosError(e) && e.response?.status === 409) {
        const msg = apiErrorMessage(e)
        const field = conflictField(msg)
        if (field) return setErrors({ [field]: msg })
      }
      if (Object.keys(fields).length > 0) return setErrors(fields)
      toast.error('Gagal membuat pengguna', { description: apiErrorMessage(e) })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Telepon dinormalkan SEBELUM validasi agar yang diperiksa bentuk finalnya.
    const values = {
      ...v,
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      username: v.username.trim(),
      phoneNumber: normalizePhoneId(v.phoneNumber),
    }
    const found = validateCreateUser(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Fokus ke field salah pertama.
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    create.mutate({
      fullName: values.fullName,
      username: values.username,
      email: values.email,
      password: values.password,
      nip: values.nip || undefined,
      phoneNumber: values.phoneNumber || undefined,
      avatarUrl: avatar?.url,
      avatarFileId: avatar?.fileId,
      isSuperAdmin: values.isSuperAdmin,
    })
  }

  const field = (key: keyof Values) => ({
    id: key,
    value: v[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key)(e.target.value),
    'aria-invalid': !!errors[key as keyof CreateUserErrors] || undefined,
    'aria-describedby': `${key}-msg`,
    disabled: create.isPending,
  })

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link to={LIST}>
          <ArrowLeft />
          Pengguna
        </Link>
      </Button>
      <PageHeader title="Tambah Pengguna" description="Akun pegawai internal. Role diberikan setelah akun dibuat." />

      <form noValidate onSubmit={submit} className="max-w-2xl rounded-lg border border-border bg-card">
        <fieldset className="grid items-start gap-4 p-5 sm:grid-cols-2" disabled={create.isPending}>
          <legend className="sr-only">Identitas</legend>
          <h2 className="text-sm font-semibold sm:col-span-2">Identitas</h2>
          <FormField
            id="avatar"
            label="Foto profil"
            hint="PNG/JPG/WEBP, maks 2 MB, minimal 100×100 px"
            className="sm:col-span-2"
          >
            <ImageUpload
              id="avatar"
              rule={AVATAR_RULE}
              module="users"
              subFolder="avatars"
              value={avatar}
              onChange={setAvatar}
              disabled={create.isPending}
              savedLabel="Foto tersimpan"
              previewAlt="Pratinjau foto profil"
              previewClassName="rounded-full object-cover p-0"
            />
          </FormField>
          <FormField id="fullName" label="Nama lengkap" required error={errors.fullName} className="sm:col-span-2">
            <Input {...field('fullName')} autoComplete="name" autoFocus />
          </FormField>
          <FormField id="nip" label="NIP" error={errors.nip} hint="Kosongkan untuk pegawai non-ASN">
            <Input {...field('nip')} inputMode="numeric" className="tabular-nums" />
          </FormField>
          <FormField id="phoneNumber" label="Telepon" error={errors.phoneNumber} hint="Ditulis otomatis sebagai +62">
            <Input
              {...field('phoneNumber')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812 3456 7890"
              // Normalkan saat field ditinggalkan supaya operator melihat bentuk tersimpannya.
              onBlur={() => set('phoneNumber')(normalizePhoneId(v.phoneNumber))}
            />
          </FormField>
        </fieldset>

        <fieldset className="grid items-start gap-4 border-t border-border p-5 sm:grid-cols-2" disabled={create.isPending}>
          <legend className="sr-only">Akun</legend>
          <h2 className="text-sm font-semibold sm:col-span-2">Akun</h2>
          <FormField id="username" label="Username" required error={errors.username} hint="Huruf kecil, angka, titik, _ atau -">
            <Input
              {...field('username')}
              // Username wajib huruf kecil — ubah otomatis saat diketik.
              onChange={(e) => set('username')(e.target.value.toLowerCase())}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
          <FormField id="email" label="Email" required error={errors.email}>
            <Input {...field('email')} type="email" autoComplete="off" />
          </FormField>
          <FormField id="password" label="Kata sandi" required error={errors.password} hint="Min. 8 karakter, 1 huruf besar, 1 angka">
            <div className="relative">
              <Input {...field('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="pr-9" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </FormField>
          <FormField id="confirm" label="Ulangi kata sandi" required error={errors.confirm}>
            <Input {...field('confirm')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" />
          </FormField>

          {/* Hanya superadmin yang boleh membuat superadmin lain. */}
          {isSuperAdmin && (
            <label className="flex items-start gap-3 rounded-md border border-border p-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={v.isSuperAdmin}
                onChange={(e) => set('isSuperAdmin')(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">Jadikan superadmin</span>
                <span className="block text-xs text-muted-foreground">
                  Akses penuh ke semua aplikasi tanpa penugasan role. Berikan hanya bila benar-benar perlu.
                </span>
              </span>
            </label>
          )}
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={create.isPending} onClick={() => navigate(LIST)}>
            Batal
          </Button>
          <Button type="submit" variant="create" disabled={create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />}
            {create.isPending ? 'Menyimpan…' : 'Buat akun'}
          </Button>
        </div>
      </form>
    </>
  )
}
