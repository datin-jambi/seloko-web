import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Pencarian dikirim saat Enter/submit, bukan tiap ketik — hemat request.
export function SearchBar({ onSearch, placeholder = 'Cari…' }: { onSearch: (v: string) => void; placeholder?: string }) {
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(value.trim())
  }
  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </form>
  )
}
