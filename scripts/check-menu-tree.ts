// Self-check helper pohon & validasi form menu (src/modules/core/applications/menu-tree.ts).
// Jalankan: npm run check:forms
import assert from 'node:assert/strict'
import {
  buildTree,
  flattenForReorder,
  parentOf,
  parentOptions,
  reorderWithinParent,
  subtreeIds,
  validateMenu,
} from '../src/modules/core/applications/menu-tree.ts'

type Row = { id: string; parentId: string | null; sortOrder: number; label: string }
const row = (id: string, parentId: string | null, sortOrder: number, label = id): Row => ({ id, parentId, sortOrder, label })

// buildTree: urutan mengikuti sortOrder, bukan urutan masukan
const flat = [row('b', null, 2), row('a', null, 1), row('a1', 'a', 1), row('a2', 'a', 0)]
const tree = buildTree(flat)
assert.deepEqual(tree.map((n) => n.id), ['a', 'b'], 'akar urut sortOrder')
assert.deepEqual(tree[0].items.map((n) => n.id), ['a2', 'a1'], 'anak urut sortOrder')

// parentId menggantung → dianggap akar, tidak hilang
assert.deepEqual(buildTree([...flat, row('yatim', 'tidak-ada', 3)]).map((n) => n.id), ['a', 'b', 'yatim'])

// Masukan berupa POHON (bentuk /menus?tree=true): anak yang sudah tertanam wajib ikut.
// Tanpa perataan lebih dulu, sub-menu hilang dari layar.
type TreeNode = Row & { items?: TreeNode[] }
const nested: TreeNode[] = [
  { ...row('p', null, 0, 'Pengguna'), items: [{ ...row('p1', 'p', 0, 'Daftar'), items: [] }] },
  { ...row('q', null, 1, 'Hak Akses'), items: [{ ...row('q1', 'q', 0, 'Role'), items: [] }] },
]
const nestedTree = buildTree(nested)
assert.deepEqual(nestedTree.map((n) => `${n.id}:${n.items.length}`), ['p:1', 'q:1'], 'pohon bertingkat tetap utuh')
assert.deepEqual(nestedTree[0].items.map((n) => n.id), ['p1'])
assert.deepEqual(flattenForReorder(nestedTree), [
  { id: 'p', parentId: null, sortOrder: 0 },
  { id: 'p1', parentId: 'p', sortOrder: 0 },
  { id: 'q', parentId: null, sortOrder: 1 },
  { id: 'q1', parentId: 'q', sortOrder: 0 },
])

// flattenForReorder: sortOrder dinomori ulang 0..n per tingkat
assert.deepEqual(flattenForReorder(tree), [
  { id: 'a', parentId: null, sortOrder: 0 },
  { id: 'a2', parentId: 'a', sortOrder: 0 },
  { id: 'a1', parentId: 'a', sortOrder: 1 },
  { id: 'b', parentId: null, sortOrder: 1 },
])

// subtreeIds: untuk melarang induk sirkular
assert.deepEqual(subtreeIds(tree, 'a'), ['a', 'a2', 'a1'])
assert.deepEqual(subtreeIds(tree, 'b'), ['b'])

// parentOptions: kecualikan diri + turunannya, sertakan depth untuk indentasi
assert.deepEqual(
  parentOptions(tree, 'a').map((o) => `${'  '.repeat(o.depth)}${o.id}`),
  ['b'],
)
assert.deepEqual(parentOptions(tree).map((o) => o.id), ['a', 'a2', 'a1', 'b'])

// reorderWithinParent: urut ulang antar-saudara saja; antar-tingkat ditolak (null).
// Pohon uji: a(a2, a1), b
assert.deepEqual(reorderWithinParent(tree, 'a1', 'a2', 'before')![0].items.map((n) => n.id), ['a1', 'a2'], 'sebelum saudara')
assert.deepEqual(tree[0].items.map((n) => n.id), ['a2', 'a1'], 'pohon asli tidak ikut berubah')
assert.deepEqual(reorderWithinParent(tree, 'a2', 'a1', 'after')![0].items.map((n) => n.id), ['a1', 'a2'], 'sesudah saudara')
assert.deepEqual(reorderWithinParent(tree, 'a2', 'a1', 'before')![0].items.map((n) => n.id), ['a2', 'a1'], 'tetap di tempat')
// Antar-tingkat DITOLAK: drag tidak boleh mengubah hierarki sidebar.
assert.equal(reorderWithinParent(tree, 'a1', 'b', 'before'), null, 'anak ke akar')
assert.equal(reorderWithinParent(tree, 'a', 'a1', 'before'), null, 'akar ke anak')
assert.equal(reorderWithinParent(tree, 'a', 'a', 'before'), null, 'ke dirinya sendiri')
// parentOf memetakan induk tiap node.
assert.equal(parentOf(tree, 'a'), null)
assert.equal(parentOf(tree, 'a1'), 'a')
assert.equal(parentOf(tree, 'tidak-ada'), undefined)

// validateMenu
const ok = { parentId: '', code: 'pengguna.daftar', label: 'Daftar Pengguna', icon: 'users', path: '/seloko/pengguna', isExternal: false, sortOrder: 0 }
assert.deepEqual(validateMenu(ok, { isEdit: false }), {})
assert.deepEqual(validateMenu({ ...ok, code: 'apa saja' }, { isEdit: true }), {}, 'kode tidak divalidasi saat ubah')
assert.ok(validateMenu({ ...ok, code: 'A' }, { isEdit: false }).code)
assert.ok(validateMenu({ ...ok, code: 'a' }, { isEdit: false }).code, 'minimal 2 karakter')
assert.ok(validateMenu({ ...ok, label: '  ' }, { isEdit: false }).label)
assert.ok(validateMenu({ ...ok, isExternal: true, path: '' }, { isEdit: false }).path, 'tautan eksternal wajib URL')
assert.ok(validateMenu({ ...ok, path: 'pengguna' }, { isEdit: false }).path, 'path internal wajib "/"')
assert.equal(validateMenu({ ...ok, path: 'https://contoh.go.id' }, { isEdit: false }).path, undefined)
assert.equal(validateMenu({ ...ok, path: '', isExternal: false }, { isEdit: false }).path, undefined, 'grup boleh tanpa path')
assert.ok(validateMenu({ ...ok, sortOrder: 1.5 }, { isEdit: false }).sortOrder)

console.log('menu-tree: semua cek lolos')
