import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { IconEntry } from './lucide-catalog'

/** Batas kotak yang dirender sekaligus — 2.100 <button> membuat panel tersendat. */
const PAGE = 120

export interface IconGridProps {
  entries: IconEntry[]
  query: string
  onQueryChange: (q: string) => void
  limit: number
  onMore: () => void
  value: string
  onSelect: (name: string) => void
  onClose: () => void
  searchRef: React.RefObject<HTMLInputElement | null>
}

/**
 * Isi panel pemilih ikon (berat: menarik seluruh katalog Lucide).
 *
 * Dipisah dari `IconPicker` supaya berkas ini hanya diunduh saat dialog
 * dibuka — lihat `IconPicker` yang memuatnya lewat `lazy()`.
 */
export default function IconGrid({
  entries,
  query,
  onQueryChange,
  limit,
  onMore,
  value,
  onSelect,
  onClose,
  searchRef,
}: IconGridProps) {
  const q = query.trim().toLowerCase()
  const matches = q ? entries.filter((e) => e.name.includes(q)) : entries
  const visible = matches.slice(0, limit)

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Pilih ikon</h2>
          <p className="text-xs text-muted-foreground tabular-nums">{matches.length} ikon Lucide cocok</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Tutup" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="relative">
          <Search aria-hidden className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari nama ikon, mis. store, shield, chart"
            className="pl-8"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Nama yang tersimpan di database adalah nama kebab-case di bawah tiap ikon.
        </p>
      </div>

      {/* `max-h` + scroll di sini, bukan di dialog: header & pencarian tetap terlihat. */}
      <div className="max-h-[52vh] overflow-y-auto p-3">
        {visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">Tidak ada ikon yang cocok dengan “{query}”.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1.5">
            {visible.map(({ name, Icon }) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onSelect(name)}
                  aria-pressed={name === value}
                  title={name}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 rounded-md border px-1 py-2 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    name === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  <span className="w-full truncate text-center text-[0.6875rem] leading-tight">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {visible.length < matches.length && (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="outline" size="sm" onClick={onMore}>
              Tampilkan {Math.min(PAGE, matches.length - visible.length)} ikon lagi
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
