import { Toaster as Sonner, type ToasterProps } from 'sonner'
import type { CSSProperties } from 'react'

// Warna mengikuti token tema (light/dark) lewat CSS variable, bukan prop theme.
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      closeButton
      style={
        {
          '--normal-bg': 'hsl(var(--popover))',
          '--normal-text': 'hsl(var(--popover-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--border-radius': 'var(--radius-lg)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm shadow-md',
          description: '!text-muted-foreground',
          success: '[&_[data-icon]]:text-green-700 dark:[&_[data-icon]]:text-green-400',
          error: '[&_[data-icon]]:text-destructive',
        },
      }}
      {...props}
    />
  )
}
