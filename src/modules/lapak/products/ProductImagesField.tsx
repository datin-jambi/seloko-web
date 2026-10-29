import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconAction } from '@/components/shared/IconAction'
import { PRODUCT_IMAGE_RULE } from '@/config/image-rules'
import { readImageDimensions } from '@/lib/image-file'
import { apiErrorMessage, cn } from '@/lib/utils'
import { formatFileSize, storageService } from '@/services/storage.service'
import type { ProductImageInput } from '@/types/lapak'

/** `ProductChildrenSchema.images` dibatasi 20 di backend — jangan lebih. */
const MAX_IMAGES = 20

/**
 * Galeri gambar produk (satu objek, banyak foto).
 *
 * Aturan backend yang dicerminkan di sini:
 * - `images` bersifat **replace-set**: yang tampil di sini dikirim apa adanya;
 *   baris yang hilang di-soft-delete server.
 * - `isPrimary` **tunggal**. Server menormalkan ulang (first by `sortOrder`),
 *   tetapi UI tetap menjaga tepat satu utama agar operator melihat hasil akhirnya.
 * - `coverUrl` katalog mengikuti gambar utama bila `coverUrl` tidak diisi.
 * - Urutan ditentukan `sortOrder`; di sini selalu disamakan dengan indeks array.
 *
 * Berkas diunggah saat dipilih. `onRemoveFile` dipanggil untuk berkas yang
 * dibuang agar pemanggil bisa menghapusnya di ImageKit **setelah** simpan
 * berhasil — menghapus langsung akan mematahkan gambar kalau form dibatalkan.
 */
export function ProductImagesField({
  images,
  onChange,
  onRemoveFile,
  onBusyChange,
  readOnly,
}: {
  images: ProductImageInput[]
  onChange: (next: ProductImageInput[]) => void
  onRemoveFile?: (fileId: string) => void
  /** Dipakai induk untuk menahan dialog tertutup saat unggahan berjalan. */
  onBusyChange?: (busy: boolean) => void
  readOnly?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const markBusy = (value: boolean) => {
    setBusy(value)
    onBusyChange?.(value)
  }

  /** Normalisasi: urutan = indeks, dan selalu ada tepat satu gambar utama. */
  const normalize = (list: ProductImageInput[]): ProductImageInput[] => {
    const next = list.map((img, idx) => ({ ...img, sortOrder: idx }))
    if (next.length > 0 && !next.some((img) => img.isPrimary)) next[0].isPrimary = true
    return next
  }

  const patch = (index: number, value: Partial<ProductImageInput>) =>
    onChange(normalize(images.map((img, i) => (i === index ? { ...img, ...value } : img))))

  const makePrimary = (index: number) =>
    onChange(normalize(images.map((img, i) => ({ ...img, isPrimary: i === index }))))

  const remove = (index: number) => {
    const target = images[index]
    // Berkas baru/ lama tidak dihapus sekarang — lihat komentar di atas.
    if (target?.fileId) onRemoveFile?.(target.fileId)
    onChange(normalize(images.filter((_, i) => i !== index)))
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(normalize(next))
  }

  const validate = async (file: File): Promise<string | null> => {
    const rule = PRODUCT_IMAGE_RULE
    if (rule.accept && !rule.accept.includes(file.type)) {
      return `${file.name}: format tidak didukung (pakai PNG, JPG, atau WEBP).`
    }
    if (file.size > rule.maxBytes) {
      return `${file.name}: ukuran ${formatFileSize(file.size)} melebihi batas ${formatFileSize(rule.maxBytes)}.`
    }
    const dims = await readImageDimensions(file)
    if (dims && rule.minWidth && rule.minHeight && (dims.width < rule.minWidth || dims.height < rule.minHeight)) {
      return `${file.name}: ${dims.width}×${dims.height} px terlalu kecil (minimal ${rule.minWidth}×${rule.minHeight}).`
    }
    return null
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length || readOnly) return
    setError(null)
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setError(`Maksimal ${MAX_IMAGES} gambar per produk.`)
      return
    }
    const picked = Array.from(files)
    const accepted = picked.slice(0, room)
    if (picked.length > room) setError(`Hanya ${room} gambar pertama diunggah — maksimal ${MAX_IMAGES} per produk.`)

    markBusy(true)
    setProgress({ done: 0, total: accepted.length })
    const added: ProductImageInput[] = []
    try {
      for (const [i, file] of accepted.entries()) {
        const invalid = await validate(file)
        if (invalid) {
          setError(invalid)
          setProgress({ done: i + 1, total: accepted.length })
          continue
        }
        const stored = await storageService.upload(file, { module: 'lapak', subFolder: 'products' })
        added.push({
          url: stored.url,
          fileId: stored.fileId,
          altText: null,
          isPrimary: false,
          sortOrder: images.length + added.length,
        })
        setProgress({ done: i + 1, total: accepted.length })
      }
      if (added.length > 0) onChange(normalize([...images, ...added]))
    } catch (e) {
      setError(`Gagal mengunggah: ${apiErrorMessage(e)}`)
    } finally {
      markBusy(false)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const canAdd = !readOnly && images.length < MAX_IMAGES
  const accept = (PRODUCT_IMAGE_RULE.accept ?? ['image/png', 'image/jpeg']).join(',')

  return (
    <div
      className={cn('space-y-3 rounded-lg transition-shadow', dragging && 'ring-2 ring-primary/40')}
      onDragOver={(e) => {
        if (readOnly || busy) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!readOnly && !busy) void upload(e.dataTransfer.files)
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium tabular-nums">
            {images.length} dari {MAX_IMAGES} gambar
          </p>
          <p className="text-xs text-muted-foreground">
            PNG/JPG/WEBP · maks {formatFileSize(PRODUCT_IMAGE_RULE.maxBytes)} · minimal{' '}
            {PRODUCT_IMAGE_RULE.minWidth}×{PRODUCT_IMAGE_RULE.minHeight} px
          </p>
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || !canAdd}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {busy ? `Mengunggah… ${progress?.done ?? 0}/${progress?.total ?? 0}` : 'Pilih gambar'}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        id="p-images"
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        disabled={busy || readOnly}
        onChange={(e) => void upload(e.target.files)}
      />

      {dragging && (
        <p className="rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1.5 text-xs text-primary">
          Lepaskan berkas untuk mengunggah.
        </p>
      )}

      {busy && progress && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-label="Progres unggah gambar"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {error && (
        <p className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {images.length === 0 && readOnly ? (
        <p className="rounded-lg border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Produk ini belum punya gambar.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li
              key={img.id ?? `${img.url}-${i}`}
              className={cn(
                'overflow-hidden rounded-lg border bg-card',
                img.isPrimary ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border',
              )}
            >
              <a
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-[4/3] bg-muted"
                title="Buka gambar ukuran penuh"
              >
                <img
                  src={img.url}
                  alt={img.altText ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
                />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
                  {img.isPrimary ? 'Utama' : `#${i + 1}`}
                </span>
                {img.isPrimary && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-xs text-white">
                    Thumbnail katalog
                  </span>
                )}
              </a>

              <div className="grid gap-1.5 p-2">
                <div className="relative">
                  <Input
                    value={img.altText ?? ''}
                    onChange={(e) => patch(i, { altText: e.target.value || null })}
                    maxLength={150}
                    placeholder="Teks alternatif"
                    aria-label={`Teks alternatif gambar ${i + 1}`}
                    disabled={readOnly}
                    className="h-8 pr-14 text-xs"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground tabular-nums">
                    {(img.altText ?? '').length}/150
                  </span>
                </div>
                {!readOnly && (
                  <div className="flex items-center justify-between gap-1">
                    <IconAction
                      icon={Star}
                      tone={img.isPrimary ? 'success' : 'neutral'}
                      label={img.isPrimary ? 'Sudah menjadi gambar utama' : 'Jadikan gambar utama'}
                      disabled={img.isPrimary}
                      onClick={() => makePrimary(i)}
                    />
                    <div className="flex items-center gap-0.5">
                      <IconAction
                        icon={ChevronLeft}
                        label={`Geser gambar ${i + 1} ke kiri`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      />
                      <IconAction
                        icon={ChevronRight}
                        label={`Geser gambar ${i + 1} ke kanan`}
                        disabled={i === images.length - 1}
                        onClick={() => move(i, 1)}
                      />
                      <IconAction
                        icon={Trash2}
                        tone="destructive"
                        label={`Hapus gambar ${i + 1}`}
                        onClick={() => remove(i)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}

          {/* Ubin tambah: jalur unggah yang selalu terlihat, sekaligus sasaran drop. */}
          {canAdd && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input bg-muted/20 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                <span>{busy ? 'Mengunggah…' : 'Tambah gambar'}</span>
                <span className="text-xs">atau lepas berkas di sini</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {images.length > 0 && !readOnly && (
        <p className="text-xs text-muted-foreground">
          Urutan di sini = urutan di portal. Gambar bertanda <strong>Utama</strong> dipakai sebagai thumbnail
          katalog.
        </p>
      )}
    </div>
  )
}
