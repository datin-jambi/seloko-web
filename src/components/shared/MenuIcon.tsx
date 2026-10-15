import { createElement } from 'react'
import { menuIcon } from '@/config/menu-icons'

/**
 * Merender ikon menu dari namanya. Memakai `createElement` (bukan variabel komponen
 * di dalam JSX) karena nama ikon berasal dari data, bukan pilihan saat menulis kode.
 */
export function MenuIcon({ name, className = 'size-4' }: { name?: string | null; className?: string }) {
  return createElement(menuIcon(name), { className })
}
