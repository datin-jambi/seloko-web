import type { CreateUserBody } from '../../../types/core.ts'

export const USERS_LIST = '/seloko/pengguna'
export const USER_CREATE = '/seloko/pengguna/tambah'
export const USER_DETAIL = (id: string) => `/seloko/pengguna/${id}`
export const USER_EDIT = (id: string) => `/seloko/pengguna/${id}/ubah`

// Cermin CreateUserBodySchema (../seloko-api/src/modules/core/users/users.schema.ts).
// Server tetap memvalidasi; ini hanya agar user tahu salahnya sebelum submit.
export type CreateUserErrors = Partial<Record<keyof CreateUserBody | 'confirm', string>>

// Field profil yang sama di form tambah & ubah (UpdateUserBodySchema).
type Profile = { fullName: string; nip: string; phoneNumber: string }
export type ProfileErrors = Partial<Record<keyof Profile, string>>

export function validateProfile(v: Profile): ProfileErrors {
  const e: ProfileErrors = {}
  if (v.fullName.trim().length < 2) e.fullName = 'Nama lengkap minimal 2 karakter'
  else if (v.fullName.length > 150) e.fullName = 'Nama lengkap maksimal 150 karakter'
  if (v.nip && !/^\d{1,30}$/.test(v.nip)) e.nip = 'NIP hanya berisi angka (maks. 30 digit)'
  if (v.phoneNumber && v.phoneNumber.length > 20) e.phoneNumber = 'Nomor telepon maksimal 20 karakter'
  return e
}

export function validateCreateUser(v: CreateUserBody & { confirm: string }): CreateUserErrors {
  const e: CreateUserErrors = validateProfile({ fullName: v.fullName, nip: v.nip ?? '', phoneNumber: v.phoneNumber ?? '' })

  if (v.username.length < 3) e.username = 'Username minimal 3 karakter'
  else if (v.username.length > 50) e.username = 'Username maksimal 50 karakter'
  else if (!/^[a-z0-9_.-]+$/.test(v.username))
    e.username = 'Hanya a–z, 0–9, titik, _ atau -'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Format email tidak valid'
  else if (v.email.length > 100) e.email = 'Email maksimal 100 karakter'

  if (v.password.length < 8) e.password = 'Kata sandi minimal 8 karakter'
  else if (v.password.length > 100) e.password = 'Kata sandi maksimal 100 karakter'
  else if (!/[A-Z]/.test(v.password)) e.password = 'Kata sandi harus mengandung minimal 1 huruf besar'
  else if (!/[0-9]/.test(v.password)) e.password = 'Kata sandi harus mengandung minimal 1 angka'

  if (!v.confirm) e.confirm = 'Ulangi kata sandi'
  else if (v.confirm !== v.password) e.confirm = 'Konfirmasi tidak sama dengan kata sandi'
  return e
}

// 409 dari API berbentuk teks ("Username \"x\" sudah digunakan") → arahkan ke field-nya.
export function conflictField(message: string): keyof CreateUserBody | undefined {
  if (/^Username/i.test(message)) return 'username'
  if (/^Email/i.test(message)) return 'email'
  if (/^NIP/i.test(message)) return 'nip'
}
