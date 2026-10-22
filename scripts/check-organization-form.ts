// Self-check validasi form Organisasi (src/modules/core/organizations/organization-form.ts).
// Jalankan: npm run check:forms
import assert from 'node:assert/strict'
import {
  EMPTY_ORGANIZATION,
  buildCreateOrganizationBody,
  buildOrganizationBody,
  descendantIds,
  parentChoices,

  validateOrganization,
} from '../src/modules/core/organizations/organization-form.ts'

const ok = { ...EMPTY_ORGANIZATION, code: 'DISHUB', name: 'Dinas Perhubungan Provinsi Jambi' }

// ─── Create ──────────────────────────────────────────────────────────────────
assert.deepEqual(validateOrganization(ok, false), {}, 'organisasi valid')

assert.ok(validateOrganization({ ...ok, code: '' }, false).code, 'kode wajib saat create')
assert.ok(validateOrganization({ ...ok, code: 'A' }, false).code, 'kode <2 ditolak')
assert.ok(validateOrganization({ ...ok, code: 'x'.repeat(51) }, false).code, 'kode >50 ditolak')
assert.ok(validateOrganization({ ...ok, code: 'DISH UB' }, false).code, 'kode berspasi ditolak')
assert.ok(validateOrganization({ ...ok, code: 'DISH.UB' }, false).code, 'kode bertitik ditolak')
assert.equal(validateOrganization({ ...ok, code: 'dishub' }, false).code, undefined, 'kode huruf kecil boleh')
assert.equal(validateOrganization({ ...ok, code: 'DIS_HUB-2' }, false).code, undefined, 'underscore & strip boleh')

assert.ok(validateOrganization({ ...ok, name: '' }, false).name, 'nama wajib')
assert.ok(validateOrganization({ ...ok, name: 'A' }, false).name, 'nama <2 ditolak')
assert.ok(validateOrganization({ ...ok, name: 'x'.repeat(201) }, false).name, 'nama >200 ditolak')

// ─── Edit: kode terkunci, tidak divalidasi ───────────────────────────────────
assert.deepEqual(validateOrganization({ ...ok, code: '' }, true), {}, 'kode tidak divalidasi saat edit')

// ─── Field lain ──────────────────────────────────────────────────────────────
assert.ok(validateOrganization({ ...ok, shortName: 'x'.repeat(101) }, false).shortName, 'nama pendek >100 ditolak')
assert.ok(validateOrganization({ ...ok, description: 'x'.repeat(1001) }, false).description, 'deskripsi >1000 ditolak')
assert.ok(validateOrganization({ ...ok, address: 'x'.repeat(501) }, false).address, 'alamat >500 ditolak')
assert.ok(validateOrganization({ ...ok, phone: '1'.repeat(31) }, false).phone, 'telepon >30 ditolak')
assert.ok(validateOrganization({ ...ok, email: 'bukan-email' }, false).email, 'email tanpa @ ditolak')
assert.ok(validateOrganization({ ...ok, email: 'a@b' }, false).email, 'email tanpa domain TLD ditolak')
assert.equal(validateOrganization({ ...ok, email: 'opd@jambiprov.go.id' }, false).email, undefined, 'email valid')
assert.equal(validateOrganization({ ...ok, email: '' }, false).email, undefined, 'email opsional')
assert.ok(validateOrganization({ ...ok, website: 'jambiprov.go.id' }, false).website, 'website tanpa protokol ditolak')
assert.ok(validateOrganization({ ...ok, website: 'ftp://x.go.id' }, false).website, 'protokol non-http ditolak')
assert.equal(validateOrganization({ ...ok, website: 'https://jambiprov.go.id' }, false).website, undefined, 'website valid')
// `logoUrl`/`logoFileId` tidak lagi divalidasi di sini: nilainya berasal dari
// /storage/upload (lihat LOGO_RULE di components/shared/ImageUpload.tsx).

// ─── Body ────────────────────────────────────────────────────────────────────
const create = buildCreateOrganizationBody(ok)
assert.equal(create.code, 'DISHUB')
assert.equal(create.name, 'Dinas Perhubungan Provinsi Jambi')
assert.equal(create.type, 'OPD', 'jenis bawaan OPD')
assert.equal(create.parentId, undefined, 'create tanpa induk tidak mengirim parentId')
assert.equal(create.email, undefined, 'field kosong tidak dikirim saat create')
assert.equal(create.shortName, undefined, 'nama pendek kosong tidak dikirim')

// Update: field yang dikosongkan → null (benar-benar dikosongkan), induk dilepas.
const upd = buildOrganizationBody({ ...ok, email: '', parentId: '' }, true)
assert.equal(upd.email, null, 'update mengosongkan email')
assert.equal(upd.parentId, null, 'update melepas induk')
assert.equal('code' in upd, false, 'update tidak mengirim code')
assert.equal(upd.name, 'Dinas Perhubungan Provinsi Jambi')

// Update dengan induk terisi.
assert.equal(buildOrganizationBody({ ...ok, parentId: 'org-1' }, true).parentId, 'org-1')

// ─── Pilihan induk: diri sendiri + turunannya dibuang ────────────────────────
const fam = [
  { id: 'dinkes', code: 'DINKES', name: 'Dinas Kesehatan', parentId: null },
  { id: 'bapelkes', code: 'BAPELKES', name: 'Balai Pelatihan Kesehatan', parentId: 'dinkes' },
  { id: 'lab', code: 'LAB', name: 'Lab Kesehatan', parentId: 'bapelkes' },
  { id: 'dishub', code: 'DISHUB', name: 'Dinas Perhubungan', parentId: null },
]

assert.deepEqual(parentChoices(fam), [
  ['dinkes', 'DINKES — Dinas Kesehatan'],
  ['bapelkes', 'BAPELKES — Balai Pelatihan Kesehatan'],
  ['lab', 'LAB — Lab Kesehatan'],
  ['dishub', 'DISHUB — Dinas Perhubungan'],
])
assert.deepEqual(
  parentChoices(fam, 'bapelkes'),
  [
    ['dinkes', 'DINKES — Dinas Kesehatan'],
    ['dishub', 'DISHUB — Dinas Perhubungan'],
  ],
  'diri sendiri dan turunannya tidak boleh jadi induk',
)
assert.deepEqual(parentChoices(fam, 'dinkes'), [['dishub', 'DISHUB — Dinas Perhubungan']], 'seluruh turunan dibuang')

// descendantIds: cucu ikut terdeteksi, simpul lain tidak.
assert.deepEqual([...descendantIds(fam, 'dinkes')].sort(), ['bapelkes', 'lab'])
assert.deepEqual([...descendantIds(fam, 'lab')], [], 'daun tidak punya turunan')

// ─── Filter induk sudah dihapus dari UI (tidak dibutuhkan) ───────────────────

console.log('organization-form: semua cek lolos')
