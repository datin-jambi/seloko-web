import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Pencarian dikirim saat Enter/submit, bukan tiap ketik — hemat request.
export function SearchBar({
  value = '',
  onSearch,
  placeholder = 'Cari…',
}: {
  value?: string
  onSearch: (v: string) => void
  placeholder?: string
}) {
  const [text, setText] = useState(value)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(text.trim())
  }
  return (
    <form onSubmit={submit} role="search" className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          // Tombol × bawaan input search mengosongkan nilai → hapus pencarian langsung.
          if (!e.target.value && value) onSearch('')
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
