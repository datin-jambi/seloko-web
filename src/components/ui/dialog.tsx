import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// shadcn/ui Dialog, token PRD 02: overlay gelap polos (tanpa blur), panel border + shadow-lg.
//
// TATA LETAK (berlaku untuk SEMUA modal):
//   ┌─────────────────────┐
//   │ DialogHeader        │ ← tetap (tidak ikut scroll)
//   ├─────────────────────┤
//   │ DialogBody          │ ← HANYA bagian ini yang scroll
//   ├─────────────────────┤
//   │ DialogFooter        │ ← tetap (tidak ikut scroll)
//   └─────────────────────┘
//
// Panel memakai flex-column + `max-h`; Header/Footer `shrink-0`, Body `flex-1
// overflow-y-auto min-h-0`. `min-h-0` wajib: tanpa itu flex item menolak
// menyusut di bawah tinggi kontennya dan footer ikut terdorong keluar.
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <X className="size-4" />
        <span className="sr-only">Tutup</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/** Judul + deskripsi. Selalu menempel di atas (tidak ikut scroll). */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('shrink-0 space-y-1.5 border-b border-input bg-card px-5 py-4 pr-12', className)}
    {...props}
  />
)

/**
 * Isi modal yang dapat digulir.
 *
 * Bungkus SEMUA konten (form, field, tabel) dengan ini. Bila modal hanya berisi
 * teks pendek (mis. ConfirmDialog), membungkusnya tetap aman — tidak ada scroll
 * yang muncul sampai isinya melebihi tinggi panel.
 */
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
)

/** Tombol aksi. Selalu menempel di bawah (tidak ikut scroll). */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col-reverse gap-2 border-t border-input bg-muted/40 px-5 py-3 sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
)

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-base font-semibold', className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
