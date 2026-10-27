import { useState, useId } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImageIcon, Loader2 } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload, type UploadedImage } from '@/components/shared/ImageUpload'
import { IconPicker } from '@/components/shared/IconPicker'
import { APP_FAVICON_RULE, APP_LOGO_RULE, APP_OG_IMAGE_RULE } from '@/config/image-rules'
import { applicationKeys, menuKeys } from '@/lib/query-keys'
import { applicationService } from '@/services/application.service'
import { apiErrorMessage } from '@/lib/utils'
import type {
  ApplicationDetail,
  ApplicationListItem,
  Audience,
  CreateApplicationDTO,
  UpdateApplicationDTO,
} from '@/types/core'

/** Satu berkas media aplikasi. `url`+`fileId` selalu dikirim BERPASANGAN. */
interface MediaValue {
  url: string
  fileId: string
}

interface FormState {
  code: string
  name: string
  audience: Audience
  tagline: string
  description: string
  baseUrl: string
  icon: string
  isActive: boolean
  /** Logo utama — tampil di App Switcher & kepala sidebar. */
  logo: MediaValue | null
  /** Logo versi tema gelap (opsional). */
  logoDark: MediaValue | null
  /** Favicon tab browser (opsional). */
  favicon: MediaValue | null
  /** Gambar Open Graph untuk pratinjau tautan (opsional). */
  ogImage: MediaValue | null
  shortName: string
  primaryColor: string
  contactEmail: string
  contactPhone: string
  maintenanceMode: boolean
}

const EMPTY: FormState = {
  code: '',
  name: '',
  audience: 'INTERNAL',
  tagline: '',
  description: '',
  baseUrl: '',
  icon: 'layout-grid',
  isActive: true,
  logo: null,
  logoDark: null,
  favicon: null,
  ogImage: null,
  shortName: '',
  primaryColor: '',
  contactEmail: '',
  contactPhone: '',
  maintenanceMode: false,
}

/**
 * `logoFileId` WAJIB ikut dikirim bersama `logoUrl`: tanpa fileId berkas lama
 * tidak bisa dihapus dari ImageKit saat logo diganti, sehingga kuota menumpuk.
 * Endpoint detail mengembalikan keduanya, jadi edit bisa mengisinya kembali.
 */
const mediaOf = (url?: string | null, fileId?: string | null): MediaValue | null =>
  url ? { url, fileId: fileId ?? '' } : null

function getInitialForm(initialData?: ApplicationListItem | ApplicationDetail | null): FormState {
  if (!initialData) return EMPTY
  const d = initialData as Partial<ApplicationDetail>
  const settings = d.settings || {}
  return {
    ...EMPTY,
    code: initialData.code || '',
    name: initialData.name || '',
    audience: initialData.audience || 'INTERNAL',
    tagline: initialData.tagline || '',
    description: d.description || '',
    baseUrl: d.baseUrl || '',
    icon: d.icon || 'layout-grid',
    isActive: initialData.isActive ?? true,
    logo: mediaOf(d.logoUrl, d.logoFileId),
    logoDark: mediaOf(d.logoDarkUrl, d.logoDarkFileId),
    favicon: mediaOf(d.faviconUrl, d.faviconFileId),
    ogImage: mediaOf(d.ogImageUrl, d.ogImageFileId),
    shortName: settings.branding?.shortName || '',
    primaryColor: settings.branding?.primaryColor || '',
    contactEmail: settings.contact?.email || '',
    contactPhone: settings.contact?.phone || '',
    maintenanceMode: settings.features?.maintenanceMode || false,
  }
}

/** `UploadedImage` → pasangan url+fileId untuk payload. */
const toMedia = (v: UploadedImage | null): MediaValue | null => (v ? { url: v.url, fileId: v.fileId } : null)

/** Nilai awal komponen `ImageUpload` (butuh `size` untuk label; 0 = ambil dari server). */
const toUploaded = (m: MediaValue | null): UploadedImage | null => (m ? { fileId: m.fileId, url: m.url, size: 0 } : null)

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
  const logoId = useId()
  const logoDarkId = useId()
  const faviconId = useId()
  const ogImageId = useId()
  const shortNameId = useId()
  const primaryColorId = useId()
  const emailId = useId()
  const phoneId = useId()

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const mutation = useMutation({
    mutationFn: async (payload: FormState) => {
      // Settings dibangun ulang utuh: API mengganti objek `settings`, bukan
      // menambal per-field, jadi field yang tidak dikirim akan hilang.
      const settings = {
        branding: {
          shortName: payload.shortName.trim() || null,
          primaryColor: payload.primaryColor.trim() || null,
          faviconUrl: payload.favicon?.url ?? null,
        },
        contact: {
          email: payload.contactEmail.trim() || null,
          phone: payload.contactPhone.trim() || null,
        },
        features: {
          maintenanceMode: payload.maintenanceMode,
        },
      }

      // Media: `null` = pengguna mengosongkan → hapus di server.
      const media = {
        logoUrl: payload.logo?.url ?? null,
        logoFileId: payload.logo?.fileId || null,
        logoDarkUrl: payload.logoDark?.url ?? null,
        logoDarkFileId: payload.logoDark?.fileId || null,
        faviconUrl: payload.favicon?.url ?? null,
        faviconFileId: payload.favicon?.fileId || null,
        ogImageUrl: payload.ogImage?.url ?? null,
        ogImageFileId: payload.ogImage?.fileId || null,
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
          ...media,
        }
        return await applicationService.update(initialData.id, body)
      }
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
        ...media,
      }
      return await applicationService.create(body)
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? 'Aplikasi berhasil diperbarui' : 'Aplikasi baru berhasil ditambahkan')
      // Satu invalidasi untuk seluruh famili `applications` (daftar, detail,
      // `/applications/me`). React Query mencocokkan prefix, jadi ini juga
      // menyegarkan App Switcher & sidebar — sebelumnya `['/applications']`
      // ber-garis miring TIDAK menyentuh `['applications', 'me']`.
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      // Menu sidebar ikut berubah bila logo/nama aplikasi diganti.
      void queryClient.invalidateQueries({ queryKey: menuKeys.all })
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

  const busy = mutation.isPending

  return (
    <form id="application-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      {/* Satu-satunya area yang scroll. Tombol aksi dipindah ke luar form lewat
          atribut `form` agar tetap menempel di bawah. */}
      <DialogBody className="space-y-5">
        <fieldset className="space-y-3" disabled={busy}>
          <legend className="mb-1 text-xs font-semibold text-muted-foreground">Identitas</legend>

          {!isEdit ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={codeId}>
                  Kode Aplikasi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={codeId}
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toLowerCase())}
                  placeholder="mis. lapak-jambi-web"
                  aria-invalid={Boolean(fieldErrors.code)}
                />
                {fieldErrors.code ? (
                  <p className="text-xs text-destructive">{fieldErrors.code}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Huruf kecil, angka, atau tanda hubung (-). Tidak bisa diubah setelah dibuat.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={audienceId}>
                  Audiens <span className="text-destructive">*</span>
                </Label>
                <Select value={form.audience} onValueChange={(v) => set('audience', v as Audience)}>
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  Kode: <strong className="font-mono text-foreground">{form.code}</strong>
                </span>
                <span className="text-muted-foreground">
                  Audiens:{' '}
                  <strong className="text-foreground">{form.audience === 'INTERNAL' ? 'Internal' : 'Publik'}</strong>
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
              onChange={(e) => set('name', e.target.value)}
              placeholder="mis. Lapak Jambi Web"
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={taglineId}>Tagline / Slogan Ringkas</Label>
            <Input
              id={taglineId}
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="mis. Verifikasi merchant UMKM dan katalog produk"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={descId}>Deskripsi Aplikasi</Label>
            <Textarea
              id={descId}
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Deskripsi singkat fungsi aplikasi di lingkungan BPKPD Jambi..."
            />
          </div>
        </fieldset>

        {/* ── Tampilan & Media ─────────────────────────────────────────────── */}
        <fieldset className="space-y-3 border-t border-border pt-4" disabled={busy}>
          <legend className="text-xs font-semibold text-muted-foreground">Tampilan &amp; Media</legend>
          <p className="text-xs text-muted-foreground">
            Logo dipakai App Switcher &amp; kepala sidebar. Bila logo kosong, ikon di bawah yang ditampilkan.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={iconId}>Ikon Launcher (Lucide)</Label>
              <IconPicker
                id={iconId}
                value={form.icon}
                onChange={(name) => set('icon', name)}
                disabled={busy}
                error={fieldErrors.icon}
              />
              <p className="text-xs text-muted-foreground">
                Dipakai saat logo belum diunggah. Klik untuk memilih dari seluruh ikon Lucide.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={baseUrlId}>Base URL</Label>
              <Input
                id={baseUrlId}
                type="url"
                value={form.baseUrl}
                onChange={(e) => set('baseUrl', e.target.value)}
                placeholder="https://lapak.jambiprov.go.id"
                aria-invalid={Boolean(fieldErrors.baseUrl)}
              />
              {fieldErrors.baseUrl ? (
                <p className="text-xs text-destructive">{fieldErrors.baseUrl}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Alamat akses web aplikasi ini.</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={logoId}>Logo Utama</Label>
            <ImageUpload
              id={logoId}
              rule={APP_LOGO_RULE}
              module="applications"
              subFolder="logos"
              value={toUploaded(form.logo)}
              onChange={(v) => set('logo', toMedia(v))}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              PNG/JPG/WEBP/SVG, maks 2 MB, minimal 64×64 px. Latar transparan disarankan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={logoDarkId}>Logo Tema Gelap</Label>
              <ImageUpload
                id={logoDarkId}
                rule={APP_LOGO_RULE}
                module="applications"
                subFolder="logos-dark"
                value={toUploaded(form.logoDark)}
                onChange={(v) => set('logoDark', toMedia(v))}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">Maks 2 MB. Versi terang untuk mode gelap. Opsional.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={faviconId}>Favicon</Label>
              <ImageUpload
                id={faviconId}
                rule={APP_FAVICON_RULE}
                module="applications"
                subFolder="favicons"
                value={toUploaded(form.favicon)}
                onChange={(v) => set('favicon', toMedia(v))}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                Maks <strong className="font-medium text-foreground">1 MB</strong> (lebih kecil dari logo), minimal
                16×16 px. Opsional.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={ogImageId}>Gambar Open Graph (OG)</Label>
            <ImageUpload
              id={ogImageId}
              rule={APP_OG_IMAGE_RULE}
              module="applications"
              subFolder="og-images"
              value={toUploaded(form.ogImage)}
              onChange={(v) => set('ogImage', toMedia(v))}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Pratinjau saat tautan dibagikan (WhatsApp/media sosial). Opsional.
            </p>
          </div>
        </fieldset>

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
            onChange={(e) => set('isActive', e.target.checked)}
            className="size-4 shrink-0 rounded border-input text-primary focus:ring-primary"
            disabled={busy}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {showAdvanced ? '− Sembunyikan pengaturan branding & kontak' : '+ Pengaturan branding & kontak (opsional)'}
          </button>
        </div>

        {showAdvanced && (
          <fieldset className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3" disabled={busy}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={shortNameId} className="text-xs">
                  Nama Singkat / Brand
                </Label>
                <Input
                  id={shortNameId}
                  value={form.shortName}
                  onChange={(e) => set('shortName', e.target.value)}
                  placeholder="mis. Lapak"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={primaryColorId} className="text-xs">
                  Warna Primer (#HEX)
                </Label>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-8 shrink-0 rounded-md border border-input"
                    style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : undefined }}
                  />
                  <Input
                    id={primaryColorId}
                    value={form.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    placeholder="#0F766E"
                    className="h-8 font-mono text-xs"
                    aria-invalid={Boolean(fieldErrors.primaryColor)}
                  />
                </div>
                {fieldErrors.primaryColor && <p className="text-xs text-destructive">{fieldErrors.primaryColor}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={emailId} className="text-xs">
                  Email Helpdesk / Kontak
                </Label>
                <Input
                  id={emailId}
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  placeholder="bapenda@jambiprov.go.id"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={phoneId} className="text-xs">
                  No. Telepon / WA
                </Label>
                <Input
                  id={phoneId}
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  placeholder="0741-XXXXXX"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Mode Maintenance (Pemeliharaan)</span>
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={(e) => set('maintenanceMode', e.target.checked)}
                className="size-3.5 rounded border-input text-primary"
              />
            </div>
          </fieldset>
        )}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
          Batal
        </Button>
        <Button type="submit" form="application-form" variant={isEdit ? 'edit' : 'create'} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Aplikasi'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ApplicationFormDialog({ open, onOpenChange, initialData, onSuccess }: ApplicationFormDialogProps) {
  const isEdit = Boolean(initialData)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            {isEdit ? 'Edit Aplikasi' : 'Tambah Aplikasi Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Perbarui informasi, logo, dan metadata aplikasi ${initialData?.name}.`
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
