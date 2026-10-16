// Self-check validasi & penyusun body form hak akses (src/modules/core/access/access-form.ts).
// Jalankan: npm run check:forms
import assert from 'node:assert/strict'
import {
  buildCreateRoleBody,
  buildCreatePermissionBody,
  validatePermission,
  validateRole,
} from '../src/modules/core/access/access-form.ts'

const role = { name: 'verifikator', description: '', audience: 'INTERNAL' as const, isActive: true }
assert.deepEqual(validateRole(role), {})
assert.ok(validateRole({ ...role, name: 'Verifikator' }).name, 'huruf besar ditolak')
assert.ok(validateRole({ ...role, name: 'ab' }).name, 'terlalu pendek')
assert.ok(validateRole({ ...role, name: 'a b' }).name, 'spasi ditolak')
assert.ok(validateRole({ ...role, description: 'x'.repeat(501) }).description, 'deskripsi maks 500')
assert.equal(validateRole({ ...role, description: '' }).description, undefined, 'deskripsi opsional')

const perm = { code: 'user:list', name: 'Lihat pengguna', module: 'Pengguna' }
assert.deepEqual(validatePermission(perm), {})
assert.ok(validatePermission({ ...perm, code: 'userlist' }).code, 'tanpa titik dua ditolak')
assert.ok(validatePermission({ ...perm, code: 'User:list' }).code, 'huruf besar ditolak')
assert.ok(validatePermission({ ...perm, code: 'user:List' }).code, 'action huruf besar ditolak')
assert.ok(validatePermission({ ...perm, name: 'ab' }).name)
assert.ok(validatePermission({ ...perm, module: 'x' }).module)

// Body create: field opsional hanya dikirim bila terisi; nama/kode di-trim.
assert.deepEqual(buildCreatePermissionBody('app-1', { ...perm, code: ' user:list ' }), {
  applicationId: 'app-1',
  code: 'user:list',
  name: 'Lihat pengguna',
  module: 'Pengguna',
})
assert.deepEqual(buildCreateRoleBody('app-1', role, ['p1', 'p2']), {
  applicationId: 'app-1',
  name: 'verifikator',
  audience: 'INTERNAL',
  permissionIds: ['p1', 'p2'],
  isActive: true,
})
assert.equal(buildCreateRoleBody('app-1', role, []).description, undefined, 'deskripsi kosong tidak dikirim')
assert.equal(
  buildCreateRoleBody('app-1', { ...role, description: '  untuk verifikasi  ' }, []).description,
  'untuk verifikasi',
  'deskripsi di-trim',
)

console.log('access-form: semua cek lolos')
