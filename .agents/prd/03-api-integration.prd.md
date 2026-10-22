# PRD 03: Standar Komunikasi API & Axios Interceptors

## 1. Konfigurasi Client Axios (`src/lib/api-client.ts`)
* `baseURL`: Mengambil nilai dari `import.meta.env.VITE_API_BASE_URL` (default: `/api` — **relatif**, bukan `http://localhost:3000/api`).
* **Dev wajib same-origin lewat proxy Vite** (`vite.config.ts` mem-proxy `/api` → `API_PROXY_TARGET`, default `http://localhost:3000`). Alasannya: refresh token disimpan sebagai cookie `HttpOnly` `SameSite=Strict` `Path=/api/auth`, dan cookie hanya ikut terkirim bila request dianggap same-origin. Memakai base URL absolut saat dev membuat `/auth/refresh` membalas **401 `No refresh token provided`** begitu frontend dibuka lewat `127.0.0.1`, IP LAN, atau host selain `localhost` — login bisa berhasil (token di memori) tetapi sesi hilang saat reload. Jangan kembalikan ke URL absolut untuk dev.
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
* `code: "VALIDATION_ERROR"` (400) → `details: { [field]: pesan }` — tampilkan di bawah input terkait (`apiFieldErrors()` di `src/lib/utils.ts`).
* Menu (`/menus`) memakai permission **`application:read`** (lihat) dan **`application:update`** (tambah/ubah/urutkan/hapus) — bukan `menu:*`. Tidak ada permission `menu:*` di seed; memakai nama itu membuat tombol tidak pernah muncul.
* `GET /menus?tree=true&applicationId=` mengembalikan pohon **sudah bertingkat** (`items` terisi), sedangkan `GET /menus` tanpa `tree` berupa daftar datar. Helper `buildTree()` menerima keduanya (meratakan dulu) — menganggapnya selalu datar membuat sub-menu hilang dari layar.
* `code` dan `applicationId` menu terkunci setelah dibuat (`UpdateMenuBodySchema` tidak menerimanya). `parentId` boleh dipindah, tetapi **hanya** satu arah (PUT /menus/reorder juga menerima `parentId`). Pilih induk lewat `parentOptions()` yang membuang diri sendiri + turunannya, karena API menolak siklus ("Menu tidak dapat menjadi parent untuk dirinya sendiri").
* Hapus menu bersifat cascade: sub-menu di bawahnya ikut terhapus (`deletedChildrenCount`).
* Bentuk respons `/menus` berbeda menurut `tree`: dengan `tree=true` tiap node punya `parentId` + `items`, tanpa `tree` hanya ada objek `parent` (tidak ada `parentId`). Jangan menyangka dua bentuk respons itu sama — daftar datar tidak cukup untuk menyusun hierarki, jadi pilihan "Induk menu" mengambil `tree=true`. Tipe terpisah: `MenuCmsNode` vs `MenuListItemFull`.
* Filter daftar menu: `applicationId`, `parentId` (UUID, atau nilai khusus **`root`** untuk menu tingkat atas), `isActive`, `search`, `page`, `limit`. Tidak ada `sortBy`.
* Filter "Induk" bergantung pada aplikasi → dinonaktifkan sampai aplikasi dipilih, dan mengganti aplikasi otomatis menghapus `parentId` (induk dari aplikasi lain tidak berlaku).
* Detail aplikasi (`GET /applications/:id`) sudah membawa `roles[]` dan `permissionsByModule[]`, tetapi halaman detail mengambil ulang daftar role (`GET /roles?applicationId=`) dan permission (`GET /permissions?applicationId=`) agar hasil tambah/ubah langsung tampil dan bisa dipakai sebagai pilihan di dialog.
* **Hak akses punya halaman sendiri** (`src/modules/core/access/`, rute `/seloko/akses/role` & `/seloko/akses/permission`, plus `/:id` untuk detail): daftar lintas aplikasi dengan filter, tambah/ubah/hapus dari satu tempat. Dialog role/permission dipakai bersama tab detail aplikasi — saat dipanggil tanpa `applicationId` (dari daftar all) aplikasi dipilih di dalam dialog. Filter daftar: Role = `applicationId` (UUID), `audience`, `isSystemRole`, `isActive`, `search`; Permission = `applicationId`, `module`, `search`. Tidak ada `sortBy`.
* `GET /permissions/modules?applicationId=` (wajib) mengisi dropdown filter Modul. Karena butuh aplikasi, filter Modul **dinonaktifkan sampai aplikasi dipilih**, dan mengganti aplikasi menghapus `module` (modul aplikasi lain tidak berlaku) — sama pola dengan filter Induk di halaman Menu.
* Detail role (`GET /roles/:id`) dan detail permission (`GET /permissions/:id`) jadi halaman `/:id`. Penugasan pengguna **per role** tidak punya endpoint (hanya `userCount`); daftar role + menu **per permission** datang dari `GET /permissions/:id` (`roles[]`, `menus[]`) dan ditampilkan di detailnya.
* Role: `PATCH /roles/:id` (nama/deskripsi) lalu `PUT /roles/:id/permissions` (menyetel **seluruh** permission, bukan menambah). `GET /roles/:id` mengembalikan seluruh permission aplikasi + `granted` — inilah sumber centang di dialog. `applicationId` & `audience` terkunci setelah dibuat; role sistem (`isSystemRole`) tidak bisa diganti nama atau dihapus.
* Permission: `POST /permissions` (kode + nama + modul), `PATCH /permissions/:id` (hanya nama/modul), `DELETE`. `code` dan `applicationId` terkunci: kode dipakai literal di `requirePermission(...)`. Hapus permission mencabutnya dari sekian role dan membuka menu yang memakainya.
* Tombol create/update/delete role & permission digate permission `role:create|update|delete` dan `permission:create|update|delete` (superadmin lolos semua) — sama seperti di tab detail aplikasi.

### 4b. Organisasi (OPD / Unit Kerja)

Rute `/seloko/organisasi` (+ `/:id`). Modul: `src/modules/core/organizations/`.

* **Application vs Organization**: Application = batas menu & permission; Organization = batas **DATA**. Hierarki lewat `parentId` (OPD → UPTD).
* Endpoint CMS: `GET /organizations` (`organization:list`), `GET /:id` (`organization:read`, membawa `parent` + `counts.children` + `counts.userAppRoleScopes`), `POST` (`organization:create`), `PUT /:id` (`organization:update`), `PATCH /:id/active` (`organization:update`), `DELETE /:id` (`organization:delete`).
* Filter daftar: `page`, `limit`, `search` (kode/nama/nama pendek), `type` (`OPD|UPTD|BIRO|LAINNYA`), `isActive`, `parentId`, `rootsOnly=true`, `sortBy` (`code|name|createdAt`), `sortOrder`. **Satu-satunya modul core yang mendukung sortBy** — kolom bisa diberi `sortKey`.
* `code` unik **global** dan **tidak bisa diubah** setelah dibuat (dipakai seeder & segmen URL publik `/lapak/opd/<code>`), jadi field kode terkunci saat edit.
* `PATCH /:id/active` dengan `isActive:false` **menurun ke seluruh sub-unit**; mengaktifkan kembali hanya baris yang disebut.
* `DELETE` → soft-delete; `409` bila masih punya sub-unit **aktif** atau masih dipakai penugasan role.
* **Untuk pilihan OPD di form lain** (produk lapak, penugasan role) pakai `organizationService.activePublic()` → `GET /organizations/public`, BUKAN `/organizations`: yang kedua butuh `organization:list` milik seloko sehingga admin OPD kena `403`.
* **Upload logo organisasi** memakai `POST /storage/upload` (`multipart/form-data`, field `file`, `?module=organizations&subFolder=logos`). Respons `{ fileId, url, name, size, filePath, thumbnailUrl }` — simpan **berpasangan** `logoUrl` + `logoFileId`; `logoFileId` wajib agar berkas lama bisa dihapus saat diganti.
* Bentuk respons storage BEDA: `{ statusCode, code, message, data }`, bukan `{ success, message, data }`.
* **Axios multipart WAJIB `headers: { 'Content-Type': undefined }`** — instance `apiClient` memasang `application/json` global; tanpa ini server membalas `400 Content-Type request harus berupa multipart/form-data`.
* Batas berkas logo (klien, `src/config/image-rules.ts` → `LOGO_RULE`): ≤2 MB, ≥64×64 px, PNG/JPG/WEBP/SVG. Dimensi & ukuran diperiksa SEBELUM unggah; setelah unggah, `size` resmi dari respons yang ditampilkan.
* Metadata logo tersimpan (`size`/`width`/`height`) TIDAK ada di payload organisasi — `ImageUpload` mengambilnya lewat `GET /storage/:fileId` saat pratinjau butuh angka.
* Kolom **Bagian** di daftar memakai `counts.children` dari `GET /organizations` (ditambahkan ke `ListOrganizationsResponseSchema`); bila tidak ada, UI menampilkan `—` alih-alih menebak nol.
* **Manajemen induk ada di halaman detail** (`OrganizationParentCard`): PUT `parentId` untuk pindah, `parentId: null` untuk melepas. Pilihan induk membuang diri sendiri **dan seluruh turunannya** (`descendantIds`) — server menolak siklus dengan `400`, jadi opsi yang pasti gagal tidak ditampilkan.
* **Tabel "bagian dalam organisasi"** (`OrganizationChildrenCard`) memakai `GET /organizations?parentId=<id>` dengan state halaman LOKAL (bukan query string) agar tidak bertabrakan dengan param daftar induk saat Back. Tombol "Tambah sub-unit" membuka dialog dengan `defaultParentId` terisi; **tombol pensil per baris** membuka dialog yang sama dalam mode ubah (`organization={row}`), sehingga sub-unit bisa diedit tanpa meninggalkan halaman induk. `canCreate`/`canUpdate` diteruskan dari detail agar kolom Aksi hanya muncul bagi yang berhak.
* Detail organisasi punya tiga aksi header (Nonaktifkan / Ubah / Hapus). `PageHeader` memakai `flex-wrap` — jangan dihapus, karena 3 tombol melebihi 360px dan membuat halaman melebar di mobile.
* Daftar pengguna per aplikasi: `GET /users` **belum** punya filter `applicationId`. Sementara daftar disaring di browser (maks 10 halaman / 1.000 pengguna, ditandai di UI). Bila pengguna tumbuh, tambahkan filter `applicationId` di API.
* Penugasan role (`POST /users/:id/roles`): role wajib seaudiens dengan jenis akun — dialog hanya memuat `GET /roles?applicationId&audience=<accountType>&isActive=true`. Upsert: pasangan sama hanya memperbarui `expiresAt`. `expiresAt` dikirim ISO akhir hari lokal.
* 409 duplikat (mis. `Username "x" sudah digunakan`) → arahkan ke field-nya (`conflictField()`), bukan toast.
* Form memvalidasi di klien dengan aturan yang sama dengan skema Zod API (fungsi murni, mis. `validateCreateUser` di `src/modules/core/users/user-form.ts`, `validateRole`/`validatePermission` di `src/modules/core/access/access-form.ts`, diuji `npm run check:forms`). Server tetap sumber kebenaran.
* Selain itu tampilkan `message` (toast untuk aksi, `ErrorState` untuk daftar).

## 4a. Fetch Data List (Pagination, Search, Filter, Sort)

Sumber kebenaran parameter: `List*QuerySchema` di `../seloko-api/src/modules/**/*.schema.ts`. Dokumentasi [seloko.apidog.io](https://seloko.apidog.io/llms.txt) boleh dipakai sebagai rujukan, tetapi **kode menang bila berbeda** (contoh: apidog menulis `shortBy`/`shortOrder` dan tipe `boolean`; kode menerima `sortBy`/`sortOrder` dan string `"true"|"false"`).

### Parameter

| Param | Aturan API | Catatan frontend |
|---|---|---|
| `page` | int ≥1, default 1 | Tidak ditulis ke URL bila 1 |
| `limit` | default API beda-beda (10 / 20 / 50), maks 100 (permissions & menus: 200) | **Aturan: semua daftar mulai dengan 10 data** (`DEFAULT_LIMIT` di `use-list.ts`). Limit selalu dikirim ke API — jangan bergantung pada default API. User boleh ganti di footer (`PAGE_SIZES` = 10/20/50/100, aman untuk semua endpoint). Nilai 10 tidak ditulis ke URL |
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
* Footer pagination (tampil bila `meta.total > 0`): `Tampilkan [limit]` · `1–10 dari 61` · `Halaman 1 / 7` · tombol sebelumnya/berikutnya. Endpoint tanpa `meta` (kategori berita) tidak menampilkan footer.
* Tombol **Reset** (outline, ikon `RotateCcw`) muncul otomatis di ujung toolbar saat ada search/filter aktif; mengosongkan seluruh query string. Filter `Select` yang aktif diberi border `primary` agar terlihat daftar sedang dipersempit.
* Kolom aksi: prop `actions={(row) => <RowActions … />}`. Klik baris: prop `onRowClick` (klik pada tombol/menu/tautan di dalam baris tidak memicunya). Baris punya `group/row`: kolom utama (nama) dibuat `<Link>` ke detail dengan `group-hover/row:font-bold group-hover/row:underline` sebagai petunjuk baris bisa diklik dan akses keyboard.
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
