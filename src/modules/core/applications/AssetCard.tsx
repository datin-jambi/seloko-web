import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Gambar pengganti bila aset kosong atau gagal dimuat. */
const PLACEHOLDER = '/Assets/images/asset-placeholder.svg'

export interface AssetCardProps {
  label: string
  /** URL aset; `null`/kosong = belum diunggah. */
  url?: string | null
  /** ID berkas penyimpanan (ImageKit) — ditampilkan di modal, bukan di halaman. */
  fileId?: string | null
  /** Keterangan singkat pemakaian aset (dipakai sebagai tooltip + subjudul modal). */
  hint?: string
  /** Latar gelap untuk pratinjau logo versi terang. */
  tint?: 'dark'
}

/**
 * Petak aset visual: pratinjau kecil + label, klik membuka modal detail.
 *
 * Sengaja KOMPAK (bukan kartu besar): empat aset ini hanya pelengkap halaman
 * detail, dan versi besar mendorong isi utama ke bawah. Detail penuh — gambar
 * besar, URL, `fileId` — ada di modal, jadi halaman tidak penuh metadata.
 */
export function AssetCard({ label, url, fileId, hint, tint }: AssetCardProps) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)

  const src = url && !failed ? url : PLACEHOLDER
  const isPlaceholder = src === PLACEHOLDER

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={hint}
        /* Target sentuh tetap nyaman (±64px tinggi) meski kartunya kecil. */
        className="group flex w-full items-center gap-2.5 rounded-md border border-border p-1.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label={`Lihat ${label}`}
      >
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border/70',
            tint === 'dark' ? 'bg-sidebar' : 'bg-muted/40',
          )}
        >
          <img
            src={src}
            alt={isPlaceholder ? `Gambar pengganti untuk ${label}` : label}
            className="size-full object-contain p-1"
            onError={() => setFailed(true)}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{label}</span>
          <span className="block truncate text-[0.6875rem] text-muted-foreground">
            {url && !failed ? hint : 'Belum ada'}
          </span>
        </span>
        <Maximize2
          aria-hidden
          className="mr-1 size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Besar tapi responsif: hampir seluruh layar, tetap `w-` terhitung di mobile. */}
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{hint || 'Pratinjau aset aplikasi.'}</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div
              className={cn(
                'flex items-center justify-center rounded-md border border-border p-3',
                tint === 'dark' ? 'bg-sidebar' : 'bg-muted/40',
              )}
            >
              <img
                src={src}
                alt={isPlaceholder ? `Gambar pengganti untuk ${label}` : label}
                className="max-h-[55vh] w-auto max-w-full object-contain"
                onError={() => setFailed(true)}
              />
            </div>

            {isPlaceholder && (
              <p className="text-xs text-destructive">
                {url
                  ? 'Berkas tidak dapat dimuat — URL tersimpan tetapi tidak dapat diakses.'
                  : 'Belum ada berkas. Unggah lewat tombol Edit aplikasi.'}
              </p>
            )}

            {/* URL & fileId hanya di modal agar halaman detail tidak penuh. */}
            <dl className="space-y-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="break-all font-mono">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      {url}
                    </a>
                  ) : (
                    <span className="italic text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">File ID</dt>
                <dd className="break-all font-mono">
                  {fileId || <span className="italic text-muted-foreground">—</span>}
                </dd>
              </div>
            </dl>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Daftar aset visual halaman detail aplikasi — satu kolom, baris ringkas. */
export function AssetGrid({
  items,
}: {
  items: Array<Pick<AssetCardProps, 'label' | 'url' | 'fileId' | 'hint' | 'tint'>>
}) {
  return (
    <div className="space-y-1.5 p-3">
      {items.map((item) => (
        <AssetCard key={item.label} {...item} />
      ))}
    </div>
  )
}
