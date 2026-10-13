import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
export const formatDate = (value?: string | null) => (value ? dateFmt.format(new Date(value)) : '—')
