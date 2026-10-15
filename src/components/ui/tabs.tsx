import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

// shadcn/ui Tabs (Radix). Tab aktif ditandai latar + teks tegas, bukan garis tebal.
const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex h-auto w-full flex-wrap items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5',
      // Layar sempit: tab MELIPAT ke baris berikutnya, bukan digeser. Menggeser berarti
      // sebagian tab (beserta angkanya) tersembunyi, dan `overflow-x-auto` memaksa sumbu
      // vertikal jadi `auto` pula sehingga muncul panah atas-bawah di ujung kanan.
      // sm ke atas cukup satu baris.
      'sm:h-9 sm:w-auto sm:flex-nowrap',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // h-7 (bukan h-8): tinggi isi TabsList hanya 34px setelah border dan padding,
      // jadi tab 32px membuat isinya meluber 1px — pemicu bilah gulir tersebut di atas.
      'inline-flex h-7 shrink-0 items-center gap-1.5 rounded px-3 text-sm font-medium text-muted-foreground transition-colors',
      'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('focus-visible:outline-none', className)} {...props} />
))
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
