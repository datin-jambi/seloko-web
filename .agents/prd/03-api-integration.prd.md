# PRD 03: Standar Komunikasi API & Axios Interceptors

## 1. Konfigurasi Client Axios (`src/lib/api-client.ts`)
* `baseURL`: Mengambil nilai dari `import.meta.env.VITE_API_BASE_URL` (default: `http://localhost:3000/api`).
* `withCredentials: true`: Wajib diset true agar browser mengirim dan menerima HttpOnly cookie `refreshToken`.
* `timeout: 30000`.

## 2. Request Interceptor
```typescript
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Selalu gateway — backend mewajibkan sama dengan appCode token.
  config.headers['X-App-Code'] = APP_CODES.SELOKO
  return config
})
```
* Konteks aplikasi aktif dikirim per request lewat query param, contoh `menuService.getMyMenus()` → `GET /menus/me?appCode=<activeAppCode>`, atau lewat path domain (`/api/bapenda/*`).
* Interceptor juga menghitung request berjalan (`pendingRequests`) untuk `TopLoader` — semua request wajib lewat `apiClient`.

## 3. Response Interceptor & Token Refresh Queue
* Menangkap status HTTP `401 Unauthorized`.
* Jika bukan request ke endpoint `/auth/login` atau `/auth/refresh`, antre request yang tertunda dan lakukan `POST /api/auth/refresh`.
* Setelah refresh sukses, perbarui token di `useAuthStore` dan jalankan kembali request yang tertunda.
* Jika refresh gagal (cookie kedaluwarsa/revoked), bersihkan sesi dan arahkan pengguna ke `/login`.
* **Pulihkan sesi saat reload** (`src/components/shared/ProtectedRoute.tsx`): access token hanya di memori, jadi setelah reload panggil `authService.refresh()` dulu, baru `getMe()`. Jangan memanggil endpoint terproteksi tanpa token lalu mengandalkan interceptor 401 — hasilnya satu 401 merah di network setiap reload.
* Refresh token **dirotasi** (token lama langsung di-revoke, dipakai ulang = semua sesi dicabut). Panggilan refresh paralel wajib berbagi satu promise (`restoreSession`, antrean `isRefreshing` di interceptor); React StrictMode menjalankan effect dua kali di dev.

## 4. Format Standard Response Backend
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

## 4a. Pagination & Filter List
* Envelope list core: `{ success, message, data, meta: { page, limit, total, totalPages, hasNextPage, hasPreviousPage } }`.
* Modul bapenda memakai `totalItems` alih-alih `total`. `useList` (`src/hooks/use-list.ts`) menormalkan ke `PaginationMeta.total`.
* Filter boolean dikirim sebagai string `'true' | 'false'`. Pencarian: `search`. Halaman: `page`.

## 5. Menu Sidebar — `GET /api/menus/me?appCode=<kode>`

Sumber: `../seloko-api/src/modules/core/menus/menus.service.ts` (`getMyMenus`). Response **bukan** array langsung:

```typescript
data: {
  application: { id, code, name, baseUrl, icon }
  menus: MenuItemTree[]   // sudah difilter permission + role, grup tanpa anak dibuang
}
// MenuItemTree = { id, code, label, icon, path, isExternal, sortOrder, items: MenuItemTree[] }
```

* Sub-menu ada di `items` (bukan `children`). `menuService.getMyMenus()` mengembalikan `data.menus`.
* Daftar kosong = user tidak punya akses di app itu; tampilkan kosong, jangan diganti menu karangan. Menu cadangan (`FALLBACK_MENUS` di `Sidebar.tsx`) hanya saat request gagal.
* `icon` adalah nama ikon Lucide kebab-case. Setiap ikon yang dipakai seeder `../seloko-api/prisma/seeds/core/menus.json` wajib ada di `ICON_MAP` `src/components/layout/Sidebar.tsx`; yang tidak terdaftar tampil sebagai lingkaran kosong.
