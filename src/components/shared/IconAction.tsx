import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Nada warna tombol aksi ikon. Warnanya menyatakan JENIS aksi, bukan selera —
 * sejalan dengan PRD 02 §7b (varian tombol = makna). Bedanya, di sini warnanya
 * lembut (latar tint + ikon berwarna) supaya enam tombol berjajar tidak jadi
 * blok warna pekat yang bersaing dengan isi baris.
 */
export type IconActionTone = 'primary' | 'warning' | 'success' | 'destructive' | 'neutral'

// Kontras teks diuji di kedua tema. `warning` & `success` memakai skala eksplisit
// seperti `Badge` karena token `--warning` (kuning terang) tidak lolos kontras AA
// sebagai teks di atas latar terang. `warning` memakai 600 (bukan 700 seperti
// `success`) karena kuning kehilangan kontras lebih cepat saat digelapkan —
// di light mode 700 terbaca cokelat, bukan kuning.
const TONES: Record<IconActionTone, string> = {
  primary: 'text-primary hover:bg-primary/15 focus-visible:ring-primary/40',
  warning: 'text-amber-600 hover:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-400/15',
  success: 'text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-400/15',
  destructive: 'text-destructive hover:bg-destructive/15',
  neutral: 'text-muted-foreground hover:text-foreground',
}

interface IconActionProps {
  icon: LucideIcon
  /** Dipakai sebagai `aria-label` SEKALIGUS isi tooltip — satu sumber, tak bisa melenceng. */
  label: string
  tone?: IconActionTone
  onClick?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Tombol aksi ikon + tooltip (Radix/shadcn `Tooltip`).
 *
 * Ikon saja tanpa keterangan hanya bisa ditebak; tooltip memberi nama aksinya
 * saat hover DAN saat fokus keyboard (trigger = button asli). `label` wajib,
 * jadi tombol tanpa keterangan tidak mungkin dibuat lewat komponen ini.
 */
export function IconAction({ icon: Icon, label, tone = 'neutral', onClick, disabled, className }: IconActionProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(TONES[tone], className)}
    >
      <Icon />
    </Button>
  )

  return (
    <Tooltip>
      {/* Tombol ber-`disabled` mendapat `pointer-events-none`, sehingga hover tidak
          pernah sampai ke trigger dan tooltip tak muncul. Pembungkus span membuat
          tooltip tetap terbuka saat kursor di atas tombol yang sedang tidak bisa dipakai. */}
      <TooltipTrigger asChild>{disabled ? <span className="inline-flex">{button}</span> : button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
