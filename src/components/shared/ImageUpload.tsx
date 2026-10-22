import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ImagePlus, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiErrorMessage, cn } from '@/lib/utils'
import { formatFileSize, storageService, type StorageFile } from '@/services/storage.service'
import type { ImageRule } from '@/config/image-rules'

export interface UploadedImage {
  fileId: string
  url: string
  size: number
  width?: number
  height?: number
}

interface Props {
  id: string
  rule: ImageRule
  /** Folder tujuan di ImageKit. */
  module: string
  subFolder?: string
  /** Nilai awal (mis. logo yang sudah tersimpan). */
  value?: UploadedImage | null
  onChange: (next: UploadedImage | null) => void
  disabled?: boolean
  error?: string
}

const readDimensions = (file: File): Promise<{ width: number; height: number } | null> =>
  new Promise((resolve) => {
    // SVG tidak punya dimensi raster yang bisa diukur lewat <img> dengan andal.
    if (file.type === 'image/svg+xml') return resolve(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })

/**
 * Input berkas gambar: pilih/lepas berkas → unggah ke /storage/upload → simpan
 * `fileId` + `url` ke entitas pemanggil.
 *
 * Ukuran & dimensi diperiksa SEBELUM unggah (hemat kuota, umpan balik instan).
 * Setelah unggah, metadata resmi dari server (`size`) yang dipakai menampilkan
 * ukuran sebenarnya, bukan asumsi dari `File`.
 */
export function ImageUpload({
  id,
  rule,
  module,
  subFolder,
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [localError, setLocalError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const accept = (rule.accept ?? ['image/png', 'image/jpeg', 'image/webp']).join(',')
  const maxLabel = formatFileSize(rule.maxBytes)
  const dimLabel =
    rule.minWidth && rule.minHeight ? `, minimal ${rule.minWidth}×${rule.minHeight} px` : ''

  // Metadata resmi dari server untuk berkas yang SUDAH tersimpan: payload
  // entitas hanya membawa `logoUrl` + `logoFileId`, tanpa ukuran/dimensi.
  // Tanpa ini pratinjau akan menampilkan "0 B".
  const needMeta = !!value?.fileId && !value.size
  const meta = useQuery({
    queryKey: ['storage', 'details', value?.fileId],
    queryFn: () => storageService.details(value!.fileId),
    enabled: needMeta,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const displaySize = value?.size || meta.data?.size || 0
  const displayWidth = value?.width ?? meta.data?.width
  const displayHeight = value?.height ?? meta.data?.height

  const handleFile = async (file: File) => {
    setLocalError(null)

    if (rule.accept && !rule.accept.includes(file.type)) {
      setLocalError(`Format tidak didukung. Gunakan ${rule.accept.map((t) => t.replace('image/', '').toUpperCase()).join(', ')}.`)
      return
    }
    if (file.size > rule.maxBytes) {
      setLocalError(`Ukuran ${formatFileSize(file.size)} melebihi batas ${maxLabel}.`)
      return
    }

    const dims = await readDimensions(file)
    if (dims && rule.minWidth && rule.minHeight) {
      if (dims.width < rule.minWidth || dims.height < rule.minHeight) {
        setLocalError(`Dimensi ${dims.width}×${dims.height} px terlalu kecil (minimal ${rule.minWidth}×${rule.minHeight} px).`)
        return
      }
    }

    setBusy(true)
    setProgress(0)
    try {
      const prevFileId = value?.fileId
      const res: StorageFile = await storageService.upload(file, {
        module,
        subFolder,
        onProgress: setProgress,
      })

      onChange({
        fileId: res.fileId,
        url: res.url,
        // `size` dari server = ukuran berkas yang benar-benar tersimpan.
        size: res.size,
        width: dims?.width,
        height: dims?.height,
      })

      // Ganti logo = berkas lama tidak lagi dirujuk. Kegagalan hapus tidak
      // menggagalkan form (sama seperti backend yang menghapus asinkron).
      if (prevFileId) void storageService.remove(prevFileId).catch(() => undefined)
    } catch (e) {
      // Status HTTP ikut ditampilkan: 401/400/413 perlu tindakan berbeda, dan
      // tanpa angka itu pesan "gagal" saja tidak bisa didiagnosis.
      const status = isAxiosError(e) ? e.response?.status : undefined
      setLocalError(`Gagal mengunggah berkas${status ? ` (${status})` : ''}: ${apiErrorMessage(e)}`)
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    // Reset supaya memilih berkas yang sama dua kali tetap memicu onChange.
    e.target.value = ''
    if (f) void handleFile(f)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (disabled || busy) return
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  const clear = () => {
    const prevFileId = value?.fileId
    onChange(null)
    setLocalError(null)
    if (prevFileId) void storageService.remove(prevFileId).catch(() => undefined)
  }

  const shownError = error ?? localError

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={onPick}
        className="sr-only"
        disabled={disabled || busy}
        aria-describedby={shownError ? `${id}-msg` : undefined}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
          {/* Berkas dari ImageKit; bukan data lokal, jadi <img> biasa sudah cukup. */}
          <img
            src={value.url}
            alt="Pratinjau logo organisasi"
            className="size-14 shrink-0 rounded-md border border-border bg-muted object-contain p-1"
          />
          <div className="min-w-0 flex-1 text-xs">
            <div className="truncate font-medium text-foreground">Logo tersimpan</div>
            <div className="text-muted-foreground">
              {displaySize ? formatFileSize(displaySize) : meta.isPending ? 'memuat ukuran…' : 'ukuran tidak diketahui'}
              {displayWidth && displayHeight ? ` · ${displayWidth}×${displayHeight} px` : ''}
            </div>
            <a
              href={value.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Buka berkas
            </a>
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            >
              <RefreshCw />
              Ganti
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={disabled || busy}
              onClick={clear}
            >
              <Trash2 />
              Hapus
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled && !busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input p-4 text-center transition-colors',
            dragging && 'border-primary bg-primary/5',
            (disabled || busy) && 'opacity-70',
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Mengunggah… {progress}%</p>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <ImagePlus className="size-5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Upload className="size-3.5" />
                Pilih gambar
              </button>
              <p className="text-xs text-muted-foreground">atau lepaskan berkas di sini</p>
              <p className="text-xs text-muted-foreground">
                Maks {maxLabel}
                {dimLabel}
              </p>
            </>
          )}
        </div>
      )}

      {shownError && (
        <p id={`${id}-msg`} className="text-xs text-destructive">
          {shownError}
        </p>
      )}
    </div>
  )
}
