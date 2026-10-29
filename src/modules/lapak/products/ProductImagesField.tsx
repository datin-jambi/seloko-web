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
  readOnly,
}: {
  images: ProductImageInput[]
  onChange: (next: ProductImageInput[]) => void
  onRemoveFile?: (fileId: string) => void
  readOnly?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    if (!files?.length) return
    setError(null)
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setError(`Maksimal ${MAX_IMAGES} gambar per produk.`)
      return
    }
    const picked = Array.from(files)
    const accepted = picked.slice(0, room)
    if (picked.length > room) setError(`Hanya ${room} gambar pertama diunggah (maksimal ${MAX_IMAGES}).`)

    setBusy(true)
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
      setBusy(false)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const accept = (PRODUCT_IMAGE_RULE.accept ?? ['image/png', 'image/jpeg']).join(',')

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {images.length}/{MAX_IMAGES} gambar · maks {formatFileSize(PRODUCT_IMAGE_RULE.maxBytes)} per berkas ·
          minimal {PRODUCT_IMAGE_RULE.minWidth}×{PRODUCT_IMAGE_RULE.minHeight} px. Gambar utama menjadi thumbnail
          katalog.
        </p>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || images.length >= MAX_IMAGES}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {busy ? `Mengunggah… ${progress?.done ?? 0}/${progress?.total ?? 0}` : 'Tambah gambar'}
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

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-input p-6 text-center">
          <ImagePlus className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Belum ada gambar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Foto aset boleh lebih dari satu. Tandai satu sebagai gambar utama.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((img, i) => (
            <li
              key={img.id ?? `${img.url}-${i}`}
              className={cn(
                'flex gap-3 rounded-lg border p-2',
                img.isPrimary ? 'border-primary/50 bg-primary/5' : 'border-border',
              )}
            >
              <a
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="relative shrink-0"
                title="Buka gambar di tab baru"
              >
                <img
                  src={img.url}
                  alt={img.altText ?? ''}
                  loading="lazy"
                  className="size-20 rounded-md border border-border bg-muted object-cover"
                />
                {img.isPrimary && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                    Utama
                  </span>
                )}
              </a>

              <div className="grid min-w-0 flex-1 content-start gap-1.5">
                <Input
                  value={img.altText ?? ''}
                  onChange={(e) => patch(i, { altText: e.target.value || null })}
                  maxLength={150}
                  placeholder="Teks alternatif (opsional)"
                  aria-label={`Teks alternatif gambar ${i + 1}`}
                  disabled={readOnly}
                  className="h-8 text-xs"
                />
                {!readOnly && (
                  <div className="flex items-center gap-0.5">
                    <IconAction
                      icon={Star}
                      tone={img.isPrimary ? 'success' : 'neutral'}
                      label={img.isPrimary ? 'Gambar utama' : 'Jadikan gambar utama'}
                      disabled={img.isPrimary}
                      onClick={() => makePrimary(i)}
                    />
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
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
