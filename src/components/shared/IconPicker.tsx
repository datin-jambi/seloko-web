import { lazy, Suspense, useRef, useState } from 'react'
import { Circle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { menuIcon } from '@/config/menu-icons'

// Katalog ~2.100 ikon hanya diunduh saat panel pertama kali dibuka.
const IconGrid = lazy(async () => {
  const [{ ICON_ENTRIES }, grid] = await Promise.all([
    import('./lucide-catalog'),
    import('./IconGrid'),
  ])
  // Katalog diteruskan lewat prop agar `IconGrid` tetap murni presentasional.
  const Component = grid.default
  return { default: (props: Omit<React.ComponentProps<typeof Component>, 'entries'>) => <Component {...props} entries={ICON_ENTRIES} /> }
})

const PAGE = 120

export interface IconPickerProps {
  id?: string
  value: string
  onChange: (name: string) => void
  disabled?: boolean
  error?: string
}

/**
 * Pemilih ikon Lucide: tombol pemicu + panel berisi kisi seluruh ikon.
 *
 * Panel memakai `<dialog>` native agar fokus terkunci, Escape menutup, dan klik
 * di luar menutup tanpa menulis ulang logika popover. Pencarian mencocokkan nama
 * kebab-case (`layout-dashboard`) — itulah yang disimpan di DB, jadi operator
 * belajar nama tersimpannya sambil mencari.
 *
 * Berkas ini SENGAJA tidak mengimpor katalog: `IconGrid` di-`lazy()` supaya
 * bundle awal tidak membawa 2.100 ikon.
 */
export function IconPicker({ id, value, onChange, disabled, error }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Buka/tutup lewat `showModal()`/`close()`, bukan atribut `open`: atribut itu
  // membuat dialog non-modal (fokus tidak terkunci, tanpa backdrop).
  const setOpen = (next: boolean) => {
    const el = dialogRef.current
    if (!el) return
    if (next && !el.open) {
      setQuery('')
      setLimit(PAGE)
      el.showModal()
      requestAnimationFrame(() => searchRef.current?.focus())
    }
    if (!next && el.open) el.close()
  }

  return (
    <>
      <div className="flex items-stretch gap-2">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input bg-muted/40 text-primary [&_svg]:size-4"
        >
          {value ? (
            // `menuIcon` memakai peta statis `MENU_ICONS`: cukup untuk pratinjau
            // 30-an ikon umum tanpa menarik katalog penuh.
            (() => {
              const Icon = menuIcon(value)
              return <Icon />
            })()
          ) : (
            <Circle className="text-muted-foreground" />
          )}
        </span>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setOpen(true)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-w-0 flex-1 justify-start font-mono text-xs font-normal"
        >
          <span className="truncate">{value || 'Pilih ikon…'}</span>
        </Button>
        {value && !disabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Kosongkan ikon" onClick={() => onChange('')}>
                <X />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kosongkan ikon</TooltipContent>
          </Tooltip>
        )}
      </div>

      {error && (
        <p id={`${id}-err`} className="text-xs text-destructive">
          {error}
        </p>
      )}

      <dialog
        ref={dialogRef}
        aria-label="Pilih ikon Lucide"
        onClose={() => setQuery('')}
        onClick={(e) => {
          // Klik pada backdrop = klik pada <dialog> itu sendiri (isi ada di dalam).
          if (e.target === dialogRef.current) setOpen(false)
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-lg border border-border bg-card p-0 text-card-foreground backdrop:bg-black/60"
      >
        <Suspense
          fallback={
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat katalog ikon…
            </div>
          }
        >
          <IconGrid
            query={query}
            onQueryChange={(q) => {
              setQuery(q)
              setLimit(PAGE)
            }}
            limit={limit}
            onMore={() => setLimit((n) => n + PAGE)}
            value={value}
            onSelect={(name) => {
              onChange(name)
              setOpen(false)
            }}
            onClose={() => setOpen(false)}
            searchRef={searchRef}
          />
        </Suspense>
      </dialog>
    </>
  )
}
