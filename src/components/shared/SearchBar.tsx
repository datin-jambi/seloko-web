import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/** Jeda kirim pencarian setelah pengguna berhenti mengetik. */
const SEARCH_DEBOUNCE_MS = 350

/**
 * Kotak pencarian dengan **debounce** — tidak perlu menekan Enter.
 *
 * Nilai dikirim otomatis ~350 ms setelah berhenti mengetik, atau langsung saat
 * Enter ditekan / tombol × diklik. Debounce dipakai agar tiap ketikan tidak
 * memicu request & perubahan URL; `placeholderData: keepPreviousData` di hook
 * list membuat tabel tidak berkedip saat menunggu.
 *
 * JANGAN memberi `key={search}` pada komponen ini: remount akan membuang fokus
 * input di tengah mengetik. Sinkronisasi nilai dari URL (tombol Reset, tombol
 * back/forward, tautan yang dibagikan) sudah ditangani efek di bawah.
 */
export function SearchBar({
  value = '',
  onSearch,
  placeholder = 'Cari…',
  debounceMs = SEARCH_DEBOUNCE_MS,
}: {
  value?: string
  onSearch: (v: string) => void
  placeholder?: string
  /** Ubah hanya bila butuh jeda lain (mis. pencarian ke server yang mahal). */
  debounceMs?: number
}) {
  const [text, setText] = useState(value)
  // Nilai luar terakhir yang sudah disinkronkan. Dibandingkan saat render (pola
  // resmi React "adjusting state when props change") agar tidak perlu setState
  // di dalam effect.
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    // Jangan timpa ketikan yang isinya sama (mis. pengguna mengetik spasi di akhir).
    if (text.trim() !== value) setText(value)
  }

  // `onSearch` biasanya arrow function baru setiap render induk. Simpan di ref
  // supaya timer tidak di-reset hanya karena induk render ulang.
  const searchRef = useRef(onSearch)
  useEffect(() => {
    searchRef.current = onSearch
  }, [onSearch])

  // Debounce: kirim setelah berhenti mengetik. Nilai yang sudah sama dengan URL
  // tidak dikirim ulang (mencegah loop & request ganda).
  useEffect(() => {
    const next = text.trim()
    if (next === value) return
    const id = window.setTimeout(() => searchRef.current(next), debounceMs)
    return () => window.clearTimeout(id)
  }, [text, value, debounceMs])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    searchRef.current(text.trim())
  }

  return (
    <form onSubmit={submit} role="search" className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          // Tombol × bawaan input search / Backspace sampai kosong → hapus
          // pencarian langsung, tanpa menunggu debounce.
          if (!next && value) searchRef.current('')
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </form>
  )
}

// Filter enum/boolean (shadcn Select). "Semua" = param dihapus.
// Radix Select tidak menerima value "" pada item → sentinel ALL.
const ALL = '__all'

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  title,
  disabled,
}: {
  label: string
  value?: string
  options: [value: string, label: string][]
  onChange: (v?: string) => void
  /** Alasan singkat pada trigger, mis. kenapa pilihannya masih sedikit. */
  title?: string
  /** Filter yang bergantung pada filter lain (mis. Induk butuh Aplikasi). */
  disabled?: boolean
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)} disabled={disabled}>
      <SelectTrigger
        aria-label={label}
        title={title}
        disabled={disabled}
        // Filter aktif ditandai agar terlihat bahwa daftar sedang dipersempit.
        className={cn('w-auto min-w-36', value && 'border-primary/60 bg-primary/5')}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Semua</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
