// Self-check validasi form pengguna (src/modules/core/users/user-form.ts). Jalankan: npm run check:forms
import assert from 'node:assert/strict'
import { conflictField, validateCreateUser, validatePasswordChange, validateProfile } from '../src/modules/core/users/user-form.ts'
import { normalizePhoneId } from '../src/lib/phone.ts'

const ok = {
  fullName: 'Budi Santoso',
  username: 'budi.santoso',
  email: 'budi@bapenda-jambi.go.id',
  password: 'Rahasia123',
  confirm: 'Rahasia123',
  nip: '199001012020121001',
  phoneNumber: '',
  isSuperAdmin: false,
}

assert.deepEqual(validateCreateUser(ok), {})
assert.ok(validateCreateUser({ ...ok, username: 'Budi' }).username, 'huruf besar ditolak')
assert.ok(validateCreateUser({ ...ok, username: 'ab' }).username, 'terlalu pendek')
assert.ok(validateCreateUser({ ...ok, email: 'budi@' }).email)
assert.ok(validateCreateUser({ ...ok, nip: '1990-01' }).nip)
assert.equal(validateCreateUser({ ...ok, nip: '' }).nip, undefined, 'NIP opsional')
assert.match(validateCreateUser({ ...ok, password: 'rahasia123', confirm: 'rahasia123' }).password!, /huruf besar/)
assert.match(validateCreateUser({ ...ok, password: 'RahasiaSaja', confirm: 'RahasiaSaja' }).password!, /angka/)
assert.match(validateCreateUser({ ...ok, confirm: 'Beda123' }).confirm!, /tidak sama/)
assert.equal(validateCreateUser({ ...ok, confirm: '' }).confirm, 'Ulangi kata sandi')

assert.deepEqual(validateProfile({ fullName: 'Budi', nip: '', phoneNumber: '' }), {})
assert.ok(validateProfile({ fullName: ' ', nip: '', phoneNumber: '' }).fullName, 'nama spasi ditolak')
assert.ok(validateProfile({ fullName: 'Budi', nip: 'abc', phoneNumber: '' }).nip)
// Telepon: semua bentuk umum dinormalkan ke +62, bentuk mustahil ditolak.
assert.equal(normalizePhoneId('0812-3456-7890'), '+6281234567890')
assert.equal(normalizePhoneId('812 3456 7890'), '+6281234567890')
assert.equal(normalizePhoneId('+62 812 3456 7890'), '+6281234567890')
assert.equal(normalizePhoneId('6281234567890'), '+6281234567890')
assert.equal(normalizePhoneId(''), '')
assert.equal(validateProfile({ fullName: 'Budi', nip: '', phoneNumber: '081234567890' }).phoneNumber, undefined)
assert.ok(validateProfile({ fullName: 'Budi', nip: '', phoneNumber: '12' }).phoneNumber, 'nomor terlalu pendek')

assert.equal(conflictField('Username "budi" sudah digunakan'), 'username')
assert.equal(conflictField('Email "a@b.c" sudah terdaftar'), 'email')
assert.equal(conflictField('NIP "1" sudah terdaftar'), 'nip')
assert.equal(conflictField('Lainnya'), undefined)

// Reset kata sandi: kosong = tidak diubah; selebihnya aturan sama dengan create.
assert.deepEqual(validatePasswordChange('', ''), {})
assert.deepEqual(validatePasswordChange('Rahasia123', 'Rahasia123'), {})
assert.ok(validatePasswordChange('rahasia123', 'rahasia123').password, 'huruf besar wajib')
assert.ok(validatePasswordChange('RahasiaSaja', 'RahasiaSaja').password, 'angka wajib')
assert.match(validatePasswordChange('Rahasia123', 'Beda123').confirm!, /tidak sama/)

console.log('user-form: semua cek lolos')
