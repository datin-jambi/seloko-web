import { useState, useId } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applicationService } from '@/services/application.service'
import { apiErrorMessage } from '@/lib/utils'
import type {
  ApplicationDetail,
  ApplicationListItem,
  Audience,
  CreateApplicationDTO,
  UpdateApplicationDTO,
} from '@/types/core'

interface FormState {
  code: string
  name: string
  audience: Audience
  tagline: string
  description: string
  baseUrl: string
  icon: string
  isActive: boolean
  shortName: string
  primaryColor: string
  contactEmail: string
  contactPhone: string
  maintenanceMode: boolean
}

function getInitialForm(initialData?: ApplicationListItem | ApplicationDetail | null): FormState {
  if (!initialData) {
    return {
      code: '',
      name: '',
      audience: 'INTERNAL',
      tagline: '',
      description: '',
      baseUrl: '',
      icon: 'layout-grid',
      isActive: true,
      shortName: '',
      primaryColor: '',
      contactEmail: '',
      contactPhone: '',
      maintenanceMode: false,
    }
  }

  const detail = initialData as Partial<ApplicationDetail>
  const settings = detail.settings || {}
  return {
    code: initialData.code || '',
    name: initialData.name || '',
    audience: initialData.audience || 'INTERNAL',
    tagline: initialData.tagline || '',
    description: detail.description || '',
    baseUrl: detail.baseUrl || '',
    icon: detail.icon || 'layout-grid',
    isActive: initialData.isActive ?? true,
    shortName: settings.branding?.shortName || '',
    primaryColor: settings.branding?.primaryColor || '',
    contactEmail: settings.contact?.email || '',
    contactPhone: settings.contact?.phone || '',
    maintenanceMode: settings.features?.maintenanceMode || false,
  }
}

interface ApplicationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ApplicationListItem | ApplicationDetail | null
  onSuccess?: (app: ApplicationDetail) => void
}

function ApplicationFormInner({
  initialData,
  onOpenChange,
  onSuccess,
}: {
  initialData?: ApplicationListItem | ApplicationDetail | null
  onOpenChange: (open: boolean) => void
  onSuccess?: (app: ApplicationDetail) => void
}) {
  const isEdit = Boolean(initialData)
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(() => getInitialForm(initialData))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(() => {
    const s = (initialData as Partial<ApplicationDetail>)?.settings
    return Boolean(s?.branding?.shortName || s?.contact?.email)
  })

  const codeId = useId()
  const nameId = useId()
  const audienceId = useId()
  const taglineId = useId()
  const descId = useId()
  const baseUrlId = useId()
  const iconId = useId()
  const shortNameId = useId()
  const primaryColorId = useId()
  const emailId = useId()
  const phoneId = useId()

  const mutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const settings = {
        branding: {
          shortName: payload.shortName.trim() || undefined,
          primaryColor: payload.primaryColor.trim() || undefined,
        },
        contact: {
          email: payload.contactEmail.trim() || undefined,
          phone: payload.contactPhone.trim() || undefined,
        },
        features: {
          maintenanceMode: payload.maintenanceMode,
        },
      }

      if (isEdit && initialData) {
        const body: UpdateApplicationDTO = {
          name: payload.name.trim(),
          tagline: payload.tagline.trim() || null,
          description: payload.description.trim() || null,
          baseUrl: payload.baseUrl.trim() || null,
          icon: payload.icon.trim() || null,
          isActive: payload.isActive,
          settings,
        }
        return await applicationService.update(initialData.id, body)
      } else {
        const body: CreateApplicationDTO = {
          code: payload.code.trim().toLowerCase(),
          name: payload.name.trim(),
          audience: payload.audience,
          tagline: payload.tagline.trim() || null,
          description: payload.description.trim() || null,
          baseUrl: payload.baseUrl.trim() || null,
          icon: payload.icon.trim() || null,
          isActive: payload.isActive,
          settings,
        }
        return await applicationService.create(body)
      }
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? 'Aplikasi berhasil diperbarui' : 'Aplikasi baru berhasil ditambahkan')
      void queryClient.invalidateQueries({ queryKey: ['/applications'] })
      if (initialData?.id) {
        void queryClient.invalidateQueries({ queryKey: ['/applications', initialData.id] })
      }
      onOpenChange(false)
      onSuccess?.(saved)
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { code?: string; message?: string; details?: Record<string, string> } }
      }
      const data = axiosErr.response?.data
      if (data?.code === 'VALIDATION_ERROR' && data.details) {
        setFieldErrors(data.details)
        toast.error('Periksa kembali data yang dimasukkan', {
          description: 'Beberapa field tidak memenuhi validasi backend.',
        })
      } else {
        toast.error(isEdit ? 'Gagal memperbarui aplikasi' : 'Gagal menambahkan aplikasi', {
          description: apiErrorMessage(err),
        })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!isEdit) {
      if (!form.code.trim()) {
        errors.code = 'Kode aplikasi wajib diisi'
      } else if (!/^[a-z0-9_-]+$/.test(form.code.trim())) {
        errors.code = 'Hanya boleh huruf kecil, angka, garis bawah (_), atau tanda hubung (-)'
      }
    }
    if (!form.name.trim()) {
      errors.name = 'Nama aplikasi wajib diisi'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter'
    }

    if (form.baseUrl.trim()) {
      try {
        new URL(form.baseUrl.trim())
      } catch {
        errors.baseUrl = 'Format URL tidak valid (contoh: https://contoh.jambiprov.go.id)'
      }
    }

    if (form.primaryColor.trim() && !/^#[0-9a-fA-F]{6}$/.test(form.primaryColor.trim())) {
      errors.primaryColor = 'Warna harus format hex 6 digit (contoh: #0F766E)'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    mutation.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {!isEdit ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={codeId}>
              Kode Aplikasi <span className="text-destructive">*</span>
            </Label>
            <Input
              id={codeId}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
              placeholder="mis. lapak-jambi-web"
              aria-invalid={Boolean(fieldErrors.code)}
              disabled={mutation.isPending}
            />
            {fieldErrors.code ? (
              <p className="text-xs text-destructive">{fieldErrors.code}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Huruf kecil, angka, atau tanda hubung (-).</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={audienceId}>
              Audiens <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.audience}
              onValueChange={(val) => setForm({ ...form, audience: val as Audience })}
              disabled={mutation.isPending}
            >
              <SelectTrigger id={audienceId}>
                <SelectValue placeholder="Pilih audiens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">Internal (Pegawai BPKPD)</SelectItem>
                <SelectItem value="PUBLIC">Publik (Warga / Eksternal)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Tipe target pengguna aplikasi.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Kode: <strong className="font-mono text-foreground">{form.code}</strong>
            </span>
            <span className="text-muted-foreground">
              Audiens: <strong className="text-foreground">{form.audience === 'INTERNAL' ? 'Internal' : 'Publik'}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={nameId}>
          Nama Aplikasi <span className="text-destructive">*</span>
        </Label>
        <Input
          id={nameId}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="mis. Lapak Jambi Web"
          aria-invalid={Boolean(fieldErrors.name)}
          disabled={mutation.isPending}
        />
        {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={taglineId}>Tagline / Slogan Ringkas</Label>
        <Input
          id={taglineId}
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          placeholder="mis. Verifikasi merchant UMKM dan katalog produk"
          disabled={mutation.isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={descId}>Deskripsi Aplikasi</Label>
        <Textarea
          id={descId}
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Deskripsi singkat fungsi aplikasi di lingkungan BPKPD Jambi..."
          disabled={mutation.isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={baseUrlId}>Base URL</Label>
          <Input
            id={baseUrlId}
            type="url"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://lapak.jambiprov.go.id"
            aria-invalid={Boolean(fieldErrors.baseUrl)}
            disabled={mutation.isPending}
          />
          {fieldErrors.baseUrl ? (
            <p className="text-xs text-destructive">{fieldErrors.baseUrl}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Alamat akses web aplikasi ini.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={iconId}>Nama Ikon (Lucide)</Label>
          <Input
            id={iconId}
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value.toLowerCase() })}
            placeholder="mis. store, shield, wallet"
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">Ikon yang tampil di launcher / switcher.</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <div>
          <div className="text-sm font-medium">Status Aplikasi Aktif</div>
          <div className="text-xs text-muted-foreground">
            Jika dinonaktifkan, aplikasi tidak dapat diakses dan disembunyikan dari launcher.
          </div>
        </div>
        <input
          type="checkbox"
          id="isActiveToggle"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          disabled={mutation.isPending}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-medium text-primary hover:underline focus-visible:outline-none"
        >
          {showAdvanced ? '− Sembunyikan pengaturan branding & kontak' : '+ Pengaturan branding & kontak (opsional)'}
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={shortNameId} className="text-xs">Nama Singkat / Brand</Label>
              <Input
                id={shortNameId}
                value={form.shortName}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                placeholder="mis. Lapak"
                className="h-8 text-xs"
                disabled={mutation.isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={primaryColorId} className="text-xs">Warna Primer (#HEX)</Label>
              <Input
                id={primaryColorId}
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                placeholder="#0F766E"
                className="h-8 text-xs font-mono"
                aria-invalid={Boolean(fieldErrors.primaryColor)}
                disabled={mutation.isPending}
              />
              {fieldErrors.primaryColor && (
                <p className="text-xs text-destructive">{fieldErrors.primaryColor}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={emailId} className="text-xs">Email Helpdesk / Kontak</Label>
              <Input
                id={emailId}
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="bapenda@jambiprov.go.id"
                className="h-8 text-xs"
                disabled={mutation.isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={phoneId} className="text-xs">No. Telepon / WA</Label>
              <Input
                id={phoneId}
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="0741-XXXXXX"
                className="h-8 text-xs"
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Mode Maintenance (Pemeliharaan)</span>
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-input text-primary"
              disabled={mutation.isPending}
            />
          </div>
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => onOpenChange(false)}
        >
          Batal
        </Button>
        <Button type="submit" variant={isEdit ? 'edit' : 'create'} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Aplikasi'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: ApplicationFormDialogProps) {
  const isEdit = Boolean(initialData)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Aplikasi' : 'Tambah Aplikasi Baru'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Perbarui informasi dan metadata aplikasi ${initialData?.name}.`
              : 'Daftarkan aplikasi baru ke dalam ekosistem gateway Seloko BPKPD.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ApplicationFormInner
            key={initialData?.id ?? 'create'}
            initialData={initialData}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
