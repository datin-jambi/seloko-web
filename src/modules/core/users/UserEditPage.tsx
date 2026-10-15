import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormField } from '@/components/shared/FormField'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type { UpdateUserBody, UserDetail } from '@/types/core'
import { conflictField, USER_DETAIL, validateProfile, type ProfileErrors } from './user-form'
import { AccountTypeBadge } from './AccountTypeBadge'

// PATCH /users/:id — profil saja. Username, email, jenis akun tetap (tidak ada di UpdateUserBodySchema).
export function UserEditPage() {
  const { id = '' } = useParams()
  const { data: u, isPending, error, refetch } = useQuery({
    queryKey: ['/users', id],
    queryFn: () => userService.get(id),
  })

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
      <Link to={USER_DETAIL(id)}>
        <ArrowLeft />
        {u?.fullName ?? 'Detail pengguna'}
      </Link>
    </Button>
  )

  if (error)
    return (
      <>
        {back}
        <ErrorState message={apiErrorMessage(error)} onRetry={() => void refetch()} />
      </>
    )
  if (isPending)
    return (
      <>
        {back}
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-80 max-w-2xl animate-pulse rounded-lg bg-muted" />
      </>
    )

  return (
    <>
      {back}
      <PageHeader title="Ubah Pengguna" description="Perubahan profil langsung berlaku. Role diatur dari halaman detail." />
      {/* key: form diisi ulang bila data pengguna berbeda */}
      <EditForm key={u.id} user={u} />
    </>
  )
}

function EditForm({ user }: { user: UserDetail }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const initial = {
    fullName: user.fullName,
    nip: user.nip ?? '',
    phoneNumber: user.phoneNumber ?? '',
    isSuperAdmin: user.isSuperAdmin,
  }
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState<ProfileErrors>({})

  // Hanya field yang berubah yang dikirim (API menolak body kosong).
  const changes: UpdateUserBody = {}
  if (v.fullName.trim() !== initial.fullName) changes.fullName = v.fullName.trim()
  if (v.nip !== initial.nip) changes.nip = v.nip || null
  if (v.phoneNumber !== initial.phoneNumber) changes.phoneNumber = v.phoneNumber || null
  if (v.isSuperAdmin !== initial.isSuperAdmin) changes.isSuperAdmin = v.isSuperAdmin
  const dirty = Object.keys(changes).length > 0

  const save = useMutation({
    mutationFn: (body: UpdateUserBody) => userService.update(user.id, body),
    onSuccess: (updated) => {
      qc.setQueryData(['/users', user.id], updated)
      void qc.invalidateQueries({ queryKey: ['/users'] })
      toast.success('Perubahan disimpan')
      navigate(USER_DETAIL(user.id))
    },
    onError: (e) => {
      if (isAxiosError(e) && e.response?.status === 409) {
        const field = conflictField(apiErrorMessage(e))
        if (field === 'nip') return setErrors({ nip: apiErrorMessage(e) })
      }
      const fields = apiFieldErrors(e)
      if (Object.keys(fields).length > 0) return setErrors(fields)
      toast.error('Gagal menyimpan perubahan', { description: apiErrorMessage(e) })
    },
  })

  const set = (key: keyof typeof v) => (value: string | boolean) => {
    setV((prev) => ({ ...prev, [key]: value }))
    if (errors[key as keyof ProfileErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateProfile(v)
    setErrors(found)
    if (Object.keys(found).length > 0) return document.getElementById(Object.keys(found)[0])?.focus()
    if (dirty) save.mutate(changes)
  }

  const field = (key: 'fullName' | 'nip' | 'phoneNumber') => ({
    id: key,
    value: v[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key)(e.target.value),
    'aria-invalid': !!errors[key] || undefined,
    'aria-describedby': `${key}-msg`,
  })

  return (
    <form noValidate onSubmit={submit} className="max-w-2xl rounded-lg border border-border bg-card">
      <fieldset className="grid items-start gap-4 p-5 sm:grid-cols-2" disabled={save.isPending}>
        <legend className="sr-only">Identitas</legend>
        <h2 className="text-sm font-semibold sm:col-span-2">Identitas</h2>
        <FormField id="fullName" label="Nama lengkap" required error={errors.fullName} className="sm:col-span-2">
          <Input {...field('fullName')} autoComplete="name" />
        </FormField>
        <FormField id="nip" label="NIP" error={errors.nip} hint="Kosongkan untuk pegawai non-ASN">
          <Input {...field('nip')} inputMode="numeric" className="tabular-nums" />
        </FormField>
        <FormField id="phoneNumber" label="Telepon" error={errors.phoneNumber}>
          <Input {...field('phoneNumber')} type="tel" autoComplete="tel" />
        </FormField>
      </fieldset>

      <section className="grid gap-3 border-t border-border p-5">
        <h2 className="text-sm font-semibold">Akun</h2>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Username</dt>
          <dd className="break-all">{user.username ?? '—'}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-muted-foreground">Jenis akun</dt>
          <dd>
            <AccountTypeBadge type={user.accountType} />
          </dd>
        </dl>
        <p className="text-xs text-muted-foreground">Username, email, dan jenis akun tidak dapat diubah.</p>

        {/* Hanya superadmin yang boleh mengubah status superadmin, dan tidak untuk akunnya sendiri. */}
        {me?.isSuperAdmin && me.id !== user.id && (
          <label className="mt-1 flex items-start gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={v.isSuperAdmin}
              disabled={save.isPending}
              onChange={(e) => set('isSuperAdmin')(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Superadmin</span>
              <span className="block text-xs text-muted-foreground">
                Akses penuh ke semua aplikasi tanpa penugasan role.
              </span>
            </span>
          </label>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-end">
        {!dirty && <span className="text-xs text-muted-foreground sm:mr-auto">Belum ada perubahan</span>}
        <Button type="button" variant="outline" disabled={save.isPending} onClick={() => navigate(USER_DETAIL(user.id))}>
          Batal
        </Button>
        <Button type="submit" variant="edit" disabled={save.isPending || !dirty}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {save.isPending ? 'Menyimpan…' : 'Simpan perubahan'}
        </Button>
      </div>
    </form>
  )
}
