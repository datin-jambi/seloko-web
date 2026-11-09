/**
 * Kunci query React Query — SATU sumber nama untuk semua modul.
 *
 * Kenapa terpusat: invalidasi React Query memakai pencocokan prefix pada array
 * key. Dua penulisan yang "kelihatan sama" tetapi beda string tidak akan pernah
 * cocok — mis. query `['menus', appCode]` (Sidebar) TIDAK ter-invalidasi oleh
 * `['/menus']` (AppMenusCard). Akibatnya data berubah tetapi UI tetap lama
 * sampai halaman di-refresh manual.
 *
 * Aturan:
 * 1. Selalu impor dari sini; jangan menulis literal `['/menus']` di komponen.
 * 2. `menuKeys.all` berlaku untuk semua varian menu (sidebar, tree, by-app),
 *    jadi invalidasi menu cukup `queryClient.invalidateQueries({ queryKey: menuKeys.all })`.
 * 3. Kunci detail = `[..., id]` supaya invalidasi `[..., id]` tidak menyentuh
 *    daftar, dan invalidasi daftar (prefix) ikut menyegarkan detail.
 */

/** Semua varian menu aplikasi. */
export const menuKeys = {
  all: ['menus'] as const,
  /** Menu sidebar untuk environment aktif (`GET /menus/my`). */
  sidebar: (appCode: string | null | undefined) => ['menus', 'sidebar', appCode ?? 'none'] as const,
  /** Pohon menu sebuah aplikasi di CMS. */
  byApp: (appId: string) => ['menus', 'by-app', appId] as const,
}

/** Aplikasi + daftar aplikasi pengguna. */
export const applicationKeys = {
  all: ['applications'] as const,
  list: () => ['applications', 'list'] as const,
  detail: (id: string) => ['applications', 'detail', id] as const,
  /** `/applications/me` — dipakai App Switcher; `staleTime` panjang. */
  mine: ['applications', 'me'] as const,
}

/** Role sebuah aplikasi. */
export const roleKeys = {
  all: ['roles'] as const,
  byApp: (appId: string) => ['roles', 'by-app', appId] as const,
}

/** Permission sebuah aplikasi. */
export const permissionKeys = {
  all: ['permissions'] as const,
  byApp: (appId: string) => ['permissions', 'by-app', appId] as const,
  modules: (appId: string) => ['permissions', 'modules', appId] as const,
}

/** Pengguna. */
export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
  /** Pengguna yang punya akses ke satu aplikasi (dihitung di klien dari /users). */
  byApp: (appId: string) => ['users', 'by-app', appId] as const,
}

/** Organisasi / OPD. */
export const organizationKeys = {
  all: ['organizations'] as const,
  detail: (id: string) => ['organizations', 'detail', id] as const,
  /** Daftar publik (cukup login) — dipakai direktori OPD di aplikasi lain. */
  public: ['organizations', 'public'] as const,
}

/**
 * Modul Lapak Jambi. Prefix `['lapak']` sengaja dipakai semua entitas di bawah,
 * sehingga invalidasi borongan (`lapakKeys.all`) aman untuk aksi yang mengubah
 * angka ringkasan lintas modul — mis. menghapus OPD memengaruhi katalog.
 */
export const lapakKeys = {
  all: ['lapak'] as const,
  /** OPD dari endpoint Lapak (gerbang izin aplikasi Lapak, bukan Core). */
  opd: ['lapak', 'opd'] as const,
  categories: ['lapak', 'categories'] as const,
  category: (id: string) => ['lapak', 'categories', id] as const,
  /** Kategori publik — dipakai filter katalog & form produk. */
  categoriesPublic: ['lapak', 'categories', 'public'] as const,
  products: ['lapak', 'products'] as const,
  product: (id: string) => ['lapak', 'products', id] as const,
  productPublic: ['lapak', 'products', 'public'] as const,
  rates: ['lapak', 'rates'] as const,
  /** Jam operasional & tanggal tutup satu produk. */
  availability: (productId: string) => ['lapak', 'availability', productId] as const,
  orders: ['lapak', 'orders'] as const,
  order: (id: string) => ['lapak', 'orders', id] as const,
  skrd: ['lapak', 'skrd'] as const,
  skrdSettings: ['lapak', 'skrd', 'settings'] as const,
  tickets: ['lapak', 'tickets'] as const,
  /** Profil OPD + katalog publiknya (`/lapak/organizations/:code`). */
  catalogOpd: (code: string) => ['lapak', 'catalog', code] as const,
}
