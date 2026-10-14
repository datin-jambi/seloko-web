import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface RowAction {
  label: string
  icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
  /** false = disembunyikan (mis. tanpa permission). */
  show?: boolean
}

// Menu aksi per baris (⋯). Aksi destruktif dipisah garis di bagian bawah.
export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
  const visible = actions.filter((a) => a.show !== false)
  if (visible.length === 0) return null
  const normal = visible.filter((a) => !a.destructive)
  const danger = visible.filter((a) => a.destructive)
  const item = (a: RowAction) => (
    <DropdownMenuItem
      key={a.label}
      onSelect={a.onSelect}
      className={cn(a.destructive && 'text-destructive focus:bg-destructive/10 focus:text-destructive')}
    >
      <a.icon />
      {a.label}
    </DropdownMenuItem>
  )
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${label}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {normal.map(item)}
        {normal.length > 0 && danger.length > 0 && <DropdownMenuSeparator />}
        {danger.map(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
