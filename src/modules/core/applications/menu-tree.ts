// Pohon menu: bantu baca/ubah struktur, dan validasi formnya.
// Dipisah dari komponen agar bisa diuji via `npm run check:forms`.
// Aturan field mengikuti CreateMenuBodySchema (seloko-api menus.schema.ts).

export type Node = { id: string; parentId: string | null; sortOrder: number }
export type Tree<T extends Node> = T & { items: Tree<T>[] }

const bySort = <T extends Node>(a: T, b: T) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)

/**
 * Datar → pohon. Menerima **dua** bentuk masukan:
 * - daftar datar (mis. `/menus` tanpa `tree`), dan
 * - pohon yang sudah bertingkat (mis. `/menus?tree=true`, di mana `items` sudah terisi).
 * Bentuk pohon diratakan dulu; tanpa itu anak yang sudah tertanam tidak ikut diproses
 * dan sub-menu hilang dari layar.
 * `parentId` yang menunjuk id tidak ada diperlakukan sebagai akar.
 */
export function buildTree<T extends Node>(input: (T & { items?: Tree<T>[] })[]): Tree<T>[] {
  const rows: T[] = []
  const collect = (nodes: (T & { items?: Tree<T>[] })[]) => {
    for (const node of nodes) {
      const { items, ...rest } = node
      rows.push(rest as T)
      if (Array.isArray(items)) collect(items as (T & { items?: Tree<T>[] })[])
    }
  }
  collect(input)

  const ids = new Set(rows.map((r) => r.id))
  const nodes = new Map<string, Tree<T>>(rows.map((r) => [r.id, { ...r, items: [] }]))
  const roots: Tree<T>[] = []

  for (const row of [...rows].sort(bySort)) {
    const node = nodes.get(row.id)!
    const parent = row.parentId && ids.has(row.parentId) ? nodes.get(row.parentId) : undefined
    if (parent) parent.items.push(node)
    else roots.push(node)
  }
  return roots
}

/** Pohon → daftar `{ id, parentId, sortOrder }` untuk PATCH /menus/reorder. */
export function flattenForReorder<T extends Node>(tree: Tree<T>[]): { id: string; parentId: string | null; sortOrder: number }[] {
  const out: { id: string; parentId: string | null; sortOrder: number }[] = []
  const walk = (nodes: Tree<T>[], parentId: string | null) =>
    nodes.forEach((node, index) => {
      out.push({ id: node.id, parentId, sortOrder: index })
      walk(node.items, node.id)
    })
  walk(tree, null)
  return out
}

/** Semua id di bawah satu node, termasuk node itu sendiri. Dipakai untuk melarang induk sirkular. */
export function subtreeIds<T extends Node>(tree: Tree<T>[], id: string): string[] {
  const find = (nodes: Tree<T>[]): Tree<T> | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node
      const hit = find(node.items)
      if (hit) return hit
    }
  }
  const target = find(tree)
  if (!target) return [id]
  const out: string[] = []
  const walk = (node: Tree<T>) => {
    out.push(node.id)
    node.items.forEach(walk)
  }
  walk(target)
  return out
}

/**
 * Pilihan "induk menu": seluruh menu kecuali dirinya sendiri dan turunannya
 * (memilih turunan sendiri akan membuat siklus — ditolak API).
 * Dikembalikan datar dengan `depth` untuk indentasi di dropdown.
 */
export function parentOptions<T extends Node & { label: string }>(
  tree: Tree<T>[],
  excludeId?: string,
): { id: string; label: string; depth: number }[] {
  const blocked = excludeId ? new Set(subtreeIds(tree, excludeId)) : new Set<string>()
  const out: { id: string; label: string; depth: number }[] = []
  const walk = (nodes: Tree<T>[], depth: number) => {
    for (const node of nodes) {
      if (!blocked.has(node.id)) out.push({ id: node.id, label: node.label, depth })
      walk(node.items, depth + 1)
    }
  }
  walk(tree, 0)
  return out
}

/** Pindahkan satu node ke atas/bawah di antara saudara sekandungnya. */
export function moveWithinSiblings<T extends Node>(tree: Tree<T>[], id: string, direction: -1 | 1): Tree<T>[] {
  const clone = structuredClone(tree) as Tree<T>[]
  const walk = (nodes: Tree<T>[]): boolean => {
    const index = nodes.findIndex((n) => n.id === id)
    if (index >= 0) {
      const target = index + direction
      if (target < 0 || target >= nodes.length) return true
      ;[nodes[index], nodes[target]] = [nodes[target], nodes[index]]
      return true
    }
    return nodes.some((n) => walk(n.items))
  }
  walk(clone)
  return clone
}

// ─── Validasi form ────────────────────────────────────────────────────────────
export type MenuFormValues = {
  parentId: string
  code: string
  label: string
  icon: string
  path: string
  isExternal: boolean
  sortOrder: number
}
export type MenuFormErrors = Partial<Record<keyof MenuFormValues, string>>

export function validateMenu(v: MenuFormValues, opts: { isEdit: boolean }): MenuFormErrors {
  const e: MenuFormErrors = {}

  // Kode tidak bisa diubah setelah dibuat (UpdateMenuBodySchema tidak menerimanya).
  if (!opts.isEdit) {
    const code = v.code.trim()
    if (code.length < 2) e.code = 'Kode minimal 2 karakter'
    else if (code.length > 100) e.code = 'Kode maksimal 100 karakter'
    else if (!/^[a-z0-9][a-z0-9_.-]*$/.test(code))
      e.code = 'Huruf kecil, angka, titik, _ atau -, contoh pengguna.daftar'
  }

  const label = v.label.trim()
  if (!label) e.label = 'Label wajib diisi'
  else if (label.length > 100) e.label = 'Label maksimal 100 karakter'

  if (v.icon.trim().length > 50) e.icon = 'Nama ikon maksimal 50 karakter'
  if (v.path.trim().length > 255) e.path = 'Path maksimal 255 karakter'

  // Tautan eksternal harus punya tujuan; item grup cukup dikosongkan.
  if (v.isExternal && !v.path.trim()) e.path = 'Tautan eksternal wajib punya URL'
  // Path internal harus absolut agar tidak menempel ke path halaman CMS.
  if (!v.isExternal && v.path.trim() && !/^https?:\/\//.test(v.path.trim()) && !v.path.trim().startsWith('/'))
    e.path = 'Path internal harus diawali "/" atau berupa URL lengkap'

  if (!Number.isInteger(v.sortOrder)) e.sortOrder = 'Urutan harus bilangan bulat'
  return e
}
