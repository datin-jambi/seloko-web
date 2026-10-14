import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
    <form onSubmit={submit} role="search" className="relative w-full max-w-xs">
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
}: {
  label: string
  value?: string
  options: [value: string, label: string][]
  onChange: (v?: string) => void
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger aria-label={label} className="w-auto min-w-36">
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
