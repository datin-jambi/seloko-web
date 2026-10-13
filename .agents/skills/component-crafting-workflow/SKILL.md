---
name: component-crafting-workflow
description: Standar pembuatan dan kustomisasi komponen shadcn/ui ramah aksesibilitas dan scalable
---

# SOP Pembuatan & Kustomisasi Komponen UI (Shadcn Standards)

Gunakan panduan ini saat membuat atau memodifikasi komponen di `src/components/ui/` dan `src/components/shared/`.

---

## 1. Aturan Dasar Komponen
1. **Headless Primitive**: Selalu bangun di atas **Radix UI** primitives (`@radix-ui/react-*`) agar mendapatkan dukungan aksesibilitas keyboard dan ARIA secara gratis.
2. **ForwardRef Wajib**: Seluruh komponen atomik form dan trigger interaktif wajib menggunakan `React.forwardRef` agar kompatibel dengan library form (seperti `react-hook-form`).
3. **Class Variance Authority (CVA)**: Gunakan `class-variance-authority` untuk mengelola varian visual (`variant`, `size`) secara terstruktur.
4. **Utilitas `cn()`**: Selalu gunakan `cn(...)` dari `@/lib/utils` untuk menggabungkan class Tailwind bawaan dan class override dari pemanggil.

---

## 2. Struktur Template Komponen Atomik
Contoh pola standar komponen atomik:
```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const exampleVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-border bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ExampleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof exampleVariants> {}

const Example = React.forwardRef<HTMLDivElement, ExampleProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(exampleVariants({ variant, size, className }))}
        {...props}
      />
    )
  },
)
Example.displayName = 'Example'

export { Example, exampleVariants }
```

---

## 3. Komponen Khusus (Compound Components)
Untuk komponen kompleks seperti Modal Dialog, Dropdown, atau Sheet:
* Ekspor sub-komponen terpisah (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`).
* Jangan membuat komponen monolitik yang membungkus semua logic dalam satu props raksasa; berikan fleksibilitas komposisi JSX kepada pemanggil.
