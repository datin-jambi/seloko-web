/**
 * Normalisasi nomor telepon Indonesia ke format internasional `+62`.
 *
 * Operator biasanya mengetik nomor dalam berbagai bentuk: `0812-3456-7890`,
 * `812 3456 7890`, `62812…`, atau `+62 812…`. Semua bentuk itu harus tersimpan
 * dalam SATU bentuk agar pencarian/penyamaran nomor konsisten; API sendiri
 * hanya menyimpan string (maks 20 karakter) tanpa menormalkan apa pun.
 */
export function normalizePhoneId(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  // `62` di depan = sudah berkode negara; `0` di depan = awalan lokal.
  const national = digits.startsWith('62') ? digits.slice(2) : digits.replace(/^0+/, '')
  return national ? `+62${national}` : ''
}

/**
 * Nomor dianggap sah bila kosong (opsional) atau 8–13 digit setelah `+62`.
 * Rentang ini menampung nomor seluler (9–12 digit) dan telepon kantor.
 */
export function isValidPhoneId(value: string): boolean {
  const normalized = normalizePhoneId(value)
  if (normalized === '') return value.trim() === ''
  return /^\+62\d{8,13}$/.test(normalized)
}

/**
 * Nilai siap tampil: baris lama di DB bisa masih `08…`, jadi normalkan saat
 * dibaca. `null` membuat pemanggil menampilkan “—”.
 */
export function displayPhoneId(value?: string | null): string | null {
  if (!value?.trim()) return null
  return normalizePhoneId(value) || value.trim()
}
