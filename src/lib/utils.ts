import { clsx, type ClassValue } from 'clsx'
import { isAxiosError } from 'axios'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
export const formatDate = (value?: string | null) => (value ? dateFmt.format(new Date(value)) : '—')

const dateTimeFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
export const formatDateTime = (value?: string | null) => (value ? dateTimeFmt.format(new Date(value)) : '—')

// Pesan error API untuk toast/ErrorState. Envelope error: { statusCode, code, message }.
export const apiErrorMessage = (error: unknown) =>
  (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) ||
  (error instanceof Error ? error.message : 'Terjadi kesalahan')

// Error per field dari 400 VALIDATION_ERROR (`details: { field: pesan }`). PRD 03 §4.
export const apiFieldErrors = (error: unknown): Record<string, string> =>
  (isAxiosError<{ code?: string; details?: Record<string, string> }>(error) &&
    error.response?.data?.code === 'VALIDATION_ERROR' &&
    error.response.data.details) ||
  {}
