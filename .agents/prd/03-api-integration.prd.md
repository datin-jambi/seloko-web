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

## 4. Format Response Backend

Dua bentuk envelope hidup berdampingan di SELOKO API — frontend wajib menerima keduanya.

| Modul | Envelope | Total di `meta` |
|---|---|---|
| Core (`/users`, `/roles`, `/permissions`, `/applications`, `/menus`, `/auth`) | `{ success, message, data, meta? }` | `total` |
| Bapenda (`/bapenda/*`, artikel bersama) | `{ statusCode, code, message, data, meta? }` | `totalItems` |

`meta` lainnya sama: `{ page, limit, totalPages, hasNextPage, hasPreviousPage }`.

Error (dari `setErrorHandler` `../seloko-api/src/app.ts`): `{ statusCode, code, message, details? }`.
* `code: "VALIDATION_ERROR"` (400) → `details: { [field]: pesan }` — tampilkan di bawah input terkait.
* Selain itu tampilkan `message` (toast untuk aksi, `ErrorState` untuk daftar).

## 4a. Fetch Data List (Pagination, Search, Filter, Sort)

Sumber kebenaran parameter: `List*QuerySchema` di `../seloko-api/src/modules/**/*.schema.ts`. Dokumentasi [seloko.apidog.io](https://seloko.apidog.io/llms.txt) boleh dipakai sebagai rujukan, tetapi **kode menang bila berbeda** (contoh: apidog menulis `shortBy`/`shortOrder` dan tipe `boolean`; kode menerima `sortBy`/`sortOrder` dan string `"true"|"false"`).

### Parameter

| Param | Aturan API | Catatan frontend |
|---|---|---|
| `page` | int ≥1, default 1 | Tidak ditulis ke URL bila 1 |
| `limit` | default 20 (permissions & menus: 50), maks 100 (permissions & menus: 200) | Dipilih user di footer tabel (`PAGE_SIZES` = 10/20/50/100, aman untuk semua endpoint). Tidak dikirim sampai user memilih → API memakai default-nya |
| `search` | string, di-trim | Dikirim saat Enter, bukan tiap ketik |
| Filter boolean (`isActive`, `isPublished`, `isSuperAdmin`, `isSystemRole`, `showOnPublicMap`) | string `"true"` / `"false"` | Kosong = semua (param tidak dikirim) |
| Filter enum (`status`, `accountType`, `audience`) | nilai enum persis | Label Indonesia di UI, nilai asli ke API |
| Filter relasi (`applicationId`, `categoryId`) | UUID | Opsi diambil dari endpoint list terkait |
| `sortBy` + `sortOrder` | **hanya modul bapenda/artikel**; enum per endpoint | Kolom diberi `sortKey` = nilai `sortBy`. Endpoint core tidak mendukung — jangan beri `sortKey` |

Endpoint tanpa pagination: `GET /bapenda/news/categories` (mengembalikan seluruh daftar, filter `search` & `isActive`).

### Implementasi — `src/hooks/use-list.ts` + `src/components/shared/DataTable.tsx`

* **State list = query string URL** (`useSearchParams`). Refresh, tombol back, dan tautan yang dibagikan membuka posisi yang sama. Jangan simpan page/search/filter di `useState`.
* Semua param di URL diteruskan apa adanya ke API; `fixed` untuk param yang dikunci halaman (mis. `{ status: 'PENDING_REVIEW' }` di Antrian Review — objek di luar komponen agar stabil).
* Mengubah search/filter/sort mengembalikan ke halaman 1. Nilai kosong menghapus param.
* `queryKey: [path, params]` + `placeholderData: keepPreviousData` → tabel tidak berkedip saat ganti halaman.
* Meta dinormalkan: `total ?? totalItems`.
* `DataTable` menangani: skeleton (memuat), `ErrorState` + coba lagi (gagal), kosong ("Belum ada …" vs "Tidak ada hasil" + tombol **Hapus filter** bila ada search/filter), header urut (`aria-sort`), footer pagination.
* Footer pagination (tampil bila `meta.total > 0`): `Tampilkan [limit]` · `1–20 dari 61` · `Halaman 1 / 4` · tombol sebelumnya/berikutnya. Endpoint tanpa `meta` (kategori berita) tidak menampilkan footer.
* Toolbar: `SearchBar` (beri `key={params.search}` agar sinkron saat URL berubah) + `FilterSelect` (shadcn `Select` dari `src/components/ui/select.tsx`, opsi `[nilai, label]`, item pertama "Semua" = param dihapus). Jangan pakai `<select>` native.

Contoh lengkap: skill `add-page-workflow`.

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
