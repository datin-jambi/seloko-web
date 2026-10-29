import type { CreateUserBody } from '../../../types/core.ts'
import { isValidPhoneId, normalizePhoneId } from '../../../lib/phone.ts'

export const USERS_LIST = '/seloko/pengguna'
export const USER_CREATE = '/seloko/pengguna/tambah'
export const USER_DETAIL = (id: string) => `/seloko/pengguna/${id}`
export const USER_EDIT = (id: string) => `/seloko/pengguna/${id}/ubah`

// Cermin CreateUserBodySchema (../seloko-api/src/modules/core/users/users.schema.ts).
// Server tetap memvalidasi; ini hanya agar user tahu salahnya sebelum submit.
export type CreateUserErrors = Partial<Record<keyof CreateUserBody | 'confirm', string>>

// Field profil yang sama di form tambah & ubah (UpdateUserBodySchema).
// `nik` hanya ada di PATCH (tambah akun pegawai tidak menerimanya).
type Profile = { fullName: string; nip: string; phoneNumber: string; nik?: string }
export type ProfileErrors = Partial<Record<keyof Profile, string>>

export function validateProfile(v: Profile): ProfileErrors {
  const e: ProfileErrors = {}
  if (v.fullName.trim().length < 2) e.fullName = 'Nama lengkap minimal 2 karakter'
  else if (v.fullName.length > 150) e.fullName = 'Nama lengkap maksimal 150 karakter'
  if (v.nip && !/^\d{1,30}$/.test(v.nip)) e.nip = 'NIP hanya berisi angka (maks. 30 digit)'
  // Nomor disimpan seragam +62 (lihat src/lib/phone.ts); server hanya membatasi
  // panjang 20 karakter, jadi penormatan & validasi bentuk ada di klien.
  if (v.phoneNumber) {
    const phone = normalizePhoneId(v.phoneNumber)
    if (!isValidPhoneId(phone)) e.phoneNumber = 'Nomor tidak valid (contoh: 0812 3456 7890)'
    else if (phone.length > 20) e.phoneNumber = 'Nomor telepon maksimal 20 karakter'
  }
  // NIK lengkap 16 digit; API membalas versi termasking saat dibaca, jadi
  // field ini hanya diisi bila operator memang menggantinya.
  if (v.nik && !/^\d{16}$/.test(v.nik)) e.nik = 'NIK harus 16 digit angka'
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

// Reset kata sandi (khusus superadmin) — aturan sama dengan CreateUserBodySchema.
// Kosong = tidak diubah, jadi tidak ada error.
export type PasswordErrors = { password?: string; confirm?: string }

export function validatePasswordChange(password: string, confirm: string): PasswordErrors {
  const e: PasswordErrors = {}
  if (!password) return e
  if (password.length < 8) e.password = 'Kata sandi minimal 8 karakter'
  else if (password.length > 100) e.password = 'Kata sandi maksimal 100 karakter'
  else if (!/[A-Z]/.test(password)) e.password = 'Harus mengandung minimal 1 huruf besar'
  else if (!/[0-9]/.test(password)) e.password = 'Harus mengandung minimal 1 angka'
  if (!confirm) e.confirm = 'Ulangi kata sandi baru'
  else if (confirm !== password) e.confirm = 'Konfirmasi tidak sama dengan kata sandi'
  return e
}
