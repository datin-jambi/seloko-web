import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Varian = MAKNA, bukan sekadar warna. Ketentuan pemakaian (PRD 02 §7):
//   create  → aksi membuat/menambah (biru)      contoh: "Tambah Aplikasi", "Buat akun", "Tambah Role"
//   edit    → aksi mengubah (kuning)            contoh: "Ubah", "Simpan perubahan"
//   success → aksi menghidupkan (hijau)         contoh: "Aktifkan"
//   destructive → aksi merusak (merah)          contoh: konfirmasi "Hapus"
//   elevated → aksi utama halaman yang bukan keduanya (biru), sama seperti create
//   outline / secondary / ghost / link → bukan aksi utama (Batal, aksi baris, tautan)
// Tombol memakai dua token dari index.css:
//   `--surface-button` / `--surface-button-hover` — gradien cahaya netral di permukaan
//     (satu token untuk semua warna varian; ini yang membuat tombol terlihat menonjol).
//   `--elevate-button` / `--elevate-button-hover` — kilau tepi atas, shading tepi bawah,
//     bayangan kontak + bayangan lebar (kesan melayang). Rata saat ditekan.
// Jangan menambah `translate-y` lain di sini — bentrok dengan kelas dasar.
const FILLED =
  'bg-[image:var(--surface-button)] hover:bg-[image:var(--surface-button-hover)] shadow-[var(--elevate-button)] hover:shadow-[var(--elevate-button-hover)] active:shadow-none'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        create: cn('bg-primary text-primary-foreground hover:bg-primary/90', FILLED),
        edit: cn('bg-warning text-warning-foreground hover:bg-warning/90', FILLED),
        success: cn('bg-success text-success-foreground hover:bg-success/90', FILLED),
        destructive: cn('bg-destructive-button text-destructive-button-foreground hover:bg-destructive-button/90', FILLED),
        elevated: cn('bg-primary text-primary-foreground hover:bg-primary/90', FILLED),
        default: cn('bg-primary text-primary-foreground hover:bg-primary/90', FILLED),
        outline:
          'border border-input bg-card bg-[image:var(--surface-button)] hover:bg-accent hover:bg-[image:var(--surface-button-hover)] hover:text-accent-foreground',
        secondary:
          'bg-secondary bg-[image:var(--surface-button)] hover:bg-secondary/80 hover:bg-[image:var(--surface-button-hover)] text-secondary-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
