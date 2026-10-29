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
  // Default gateway. `??=` (bukan `=`): modul Lapak menimpa header ini per
  // request karena token/izinnya milik aplikasi lain — lihat §4c.
  config.headers['X-App-Code'] ??= APP_CODES.SELOKO
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
| Lapak (`/lapak/*`) | `{ statusCode, code, message, data, meta? }` | `totalItems` |

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

### 4c-bis. Modul Lapak: `X-App-Code` tetap `seloko`

Modul Lapak (`src/modules/lapak/**`, `src/services/lapak/*`) memanggil endpoint
`/api/lapak/*`, tetapi **header tetap `seloko`** — sama seperti modul lain.

* **JANGAN menimpa `X-App-Code` menjadi `lapak-jambi-web`.** Rute CMS Lapak memang
  dirancang untuk gateway; `../seloko-api/src/modules/lapak/categories/categories.routes.ts`
  menulis `// ── 2. Endpoint CMS (seloko, Bapenda saja) ──`. Di situ
  `requirePermission("category:list", { app: LAPAK })`, dan `app: LAPAK` adalah
  **sumber IZIN** (permission `category:*` milik aplikasi Lapak), BUKAN nilai header.
* `authenticate` membandingkan `payload.appCode` (dari token) dengan `request.appCode`
  (dari header). Menimpa header membuat **semua** request gagal
  `403 Token was issued for app "seloko" but request targets "lapak-jambi-web"`.
  Gejalanya menyesatkan: tampak seperti masalah token/pengaturan, padahal hanya header.
* Endpoint publik (segmen akhir `public`) hanya mewajibkan header itu **ada** — `seloko`
  maupun `lapak-jambi-web` sama-sama `200`; tanpa header `400 Missing required header`.
* **Envelope & paginasi**: `{ statusCode, code, message, data, meta }` dengan
  `meta.totalItems`. Karena itu daftar Lapak memakai `useLapakList`
  (`src/modules/lapak/use-lapak-list.ts`), bukan `useList` Core — `useList` membaca
  `meta.total` sehingga `meta` kosong dan paginasi hilang.
* **Kontrak sudah diverifikasi end-to-end** terhadap server: baca daftar, buat kategori
  (slug otomatis dari `name`), dan hapus — semuanya `200/201` dengan token gateway
  `seloko`. Tidak ada endpoint Lapak yang butuh token per-aplikasi.
* Pelajaran: dokumen ini sempat menyimpulkan "blokir token per-aplikasi" dari pengujian
  yang sendiri menyuntikkan header salah. Saat 403 muncul, **periksa header yang dikirim
  lebih dulu** (DevTools → Network → Request Headers) sebelum menyalahkan token.

### 4d. Super App: Environment INTERNAL & Sidebar per Platform

SELOKO web adalah **super app**: satu login, satu aplikasi React, untuk mengelola **semua platform**. Berpindah environment **hanya mengganti daftar menu sidebar** — halaman yang sedang dibuka TIDAK berpindah.

* **Hanya aplikasi ber-audience `INTERNAL` yang tampil.** Situs publik adalah produk untuk warga dan TIDAK masuk switcher. Filter ada di `useActiveApp()`: `apps.filter(a => a.audience === 'INTERNAL' && hasCmsRoute(a.code))`.
* **Setiap platform punya pasangan aplikasi** — jangan tertukar. Nilai di bawah adalah `code` **nyata** di DB (`prisma/seeds/core/applications.json`):
  | Platform | Aplikasi CMS (INTERNAL) | Situs publik (PUBLIC) |
  |---|---|---|
  | Core | `seloko` | — |
  | Bapenda | `bapenda-profile` | `bapenda-portal` |
  | Lapak | `lapak-jambi-web` | `lapak-jambi-app` |

  Penamaan menyesatkan tetapi mengikat: **`bapenda-profile` adalah CMS**, padanan publiknya `bapenda-portal`; **`lapak-jambi-web` adalah CMS**, padanan publiknya `lapak-jambi-app`. Konstanta di `src/config/constants.ts` (`APP_CODES`) harus sama persis — salah satu huruf saja membuat aplikasi hilang dari switcher karena pencocokan `code` gagal.
* **Code aplikasi ≠ segmen URL.** `lapak-jambi-web` dirender di `/lapak-jambi/…` (mengikuti menu DB) dan `/lapak/…` (alias); `bapenda-profile` di `/bapenda/…`. Pemetaan app → segmen ada di `APP_WORKSPACE`/`appWorkspace()`. Memakai `code` sebagai segmen membuat sidebar meminta `/menus/me?appCode=lapak` — aplikasi itu tidak ada, server 404, sidebar kosong.
  Menu CMS **harus** menempel di aplikasi INTERNAL. Bila menempel di aplikasi PUBLIC, sidebar CMS jadi kosong (`/menus/me?appCode=<cms>` mengembalikan 0 item).
* **Sumber daftar: `GET /applications/me`** (tanpa `requirePermission`, isinya milik pemanggil). Endpoint ini mengembalikan `audience` — dibutuhkan untuk memisahkan CMS dari situs publik. **JANGAN pakai `GET /applications`** (menuntut `application:list` → admin OPD 403).
* **Korelasi akun → environment.** Daftar sudah tersaring server berdasarkan **role & permission** akun. Akun tanpa role di suatu platform tidak pernah melihat environment itu (Admin Seloko → 1; Editor Bapenda → Bapenda saja; superadmin → semua CMS).
* **`activeAppCode` di store hanyalah preferensi.** Satu browser dipakai bergantian akun; `useActiveApp()` mengoreksi ke environment sah saat render (bukan `useEffect`) agar tidak berkedip.
* **`DashboardLayout` membaca prefix URL setiap kali path berubah.** Aman karena App Switcher memang memindahkan halaman ke beranda workspace tujuan (`appHome(code)` → `/<workspace>/dashboard`). Berpindah environment tanpa memindahkan halaman mempertahankan path berprefix workspace lama → 404. Bila prefix URL menunjuk aplikasi yang tidak boleh dipakai akun, layout merender `ForbiddenPage`, bukan sidebar kosong.
* **`FALLBACK_MENUS` sengaja kosong**; sidebar & dasbor memakai `activeAppCode` hasil `useActiveApp`, dengan `enabled: !!activeAppCode` pada query menu.
* **`baseUrl` = alamat situs publik**, BUKAN tujuan CMS. Jangan dipakai memutuskan "punya halaman di sini".
* Prefix path menu (`/bapenda/...`, `/lapak-jambi/...`, `/lapak/...`) harus punya `<Route>` di `App.tsx`; tanpa itu menu bisa diklik tapi 404. Daftar rute yang dihasilkan program ditulis sebagai array yang di-*spread* (mis. `lapakRoutes`), BUKAN komponen — `<Routes>` hanya menerima `<Route>`/Fragment.

### 4f. Logo & Ikon Aplikasi (App Switcher)

`GET /applications/me` mengirim `logoUrl`, `logoDarkUrl`, `faviconUrl`, dan `icon` (nama ikon Lucide, mis. `building-2`).

* **Rantai fallback dievaluasi PER TEMA** (`src/components/shared/AppLogo.tsx`), karena slot terang dan gelap bisa punya status muat berbeda:

  | yang tersedia | tema terang | tema gelap |
  |---|---|---|
  | `logoUrl` + `logoDarkUrl` | `logoUrl` | `logoDarkUrl` |
  | `logoUrl` saja | `logoUrl` | mask putih `logoUrl` |
  | `logoDarkUrl` saja | `icon` DB | `logoDarkUrl` |
  | kosong / mati semua | `icon` DB → `LayoutGrid` netral | sama |

  Rantai global (satu daftar untuk kedua tema) **salah** untuk data nyata: ada aplikasi yang `logoUrl`-nya menunjuk CDN mati sementara `logoDarkUrl` (ImageKit) masih hidup. Dengan rantai global, tema terang ikut merender logo mati sehingga tersisa kotak kosong padahal `icon` DB tersedia.
* **Satu berkas logo pun harus mengikuti tema.** Tanpa `logoDarkUrl`, slot gelap merender `logoUrl` sebagai **mask** ber-`currentColor`, sehingga warna mengikuti kelas pemanggil (`text-primary` → `dark:text-white`). Alasan mask, bukan `filter: invert()`: logo bisa berwarna (bukan hitam pekat) sehingga invert menghasilkan warna komplementer yang salah, bukan putih. Syaratnya PNG transparan/SVG (dicek `canMask`); JPEG berlatar putih akan jadi kotak penuh, jadi berkas non-PNG/SVG dirender sebagai gambar biasa. Varian `logoDarkUrl` bila ada **tidak** di-mask — berkasnya sudah disiapkan untuk latar gelap.
* **URL mati harus turun ke ikon, bukan kotak kosong.** `logoUrl` hanya string di DB, jadi CDN pindah/berkas dihapus tidak terdeteksi API. `AppLogo` mencatat kegagalan muat per-`src` di state lalu merender ulang rantai fallback. Jangan sekadar mengembalikan `null` di `onError` tanpa eskalasi — hasilnya area kosong. Mask tidak memicu `onError` (bukan elemen gambar), jadi keberadaan berkas diuji lewat `Image()`. Pola yang sama dipakai `MediaRow` di halaman detail (`Aset Visual`), yang menampilkan pesan "Berkas tidak dapat dimuat" alih-alih ikon gambar rusak.
* **Semua tampilan logo aplikasi WAJIB lewat `AppLogo`**, jangan `<img src={logoUrl}>` mentah: hanya `AppLogo` yang punya fallback & deteksi URL mati. Pemanggil di latar **gelap tetap** (rel sidebar navy di kedua tema) memberi `className="text-white"`; di latar **mengikuti tema** memberi `className="text-primary dark:text-white"`. `variant="original"` memaksa berkas apa adanya untuk pratinjau aset (halaman detail), di mana yang diperiksa justru berkas aslinya.
* **JANGAN menebak ikon dari `code`.** Peta per-kode (perilaku lama `AppMark`) tidak mengenal aplikasi baru dan mencampur kode INTERNAL dengan PUBLIC. Penanda ringkas di tabel (`AppMark`) juga memakai `icon` dari DB.
* Varian terang/gelap dirender bersamaan lalu dipilih CSS (`dark:hidden` / `hidden dark:block`), bukan `document.documentElement` — supaya reaktif terhadap `ThemeToggle`.
* Identitas di kepala Sidebar memakai aplikasi **aktif** (logo + nama dari API), bukan hardcode "SELOKO": satu super app, sidebar berganti isi.
* Ikon yang dipakai seeder (`applications.json` & `menus.json`, mis. `globe`, `store`, `layout-dashboard`, `building-2`) wajib terdaftar di `MENU_ICONS` (`src/config/menu-icons.ts`); nama tak dikenal tampil sebagai lingkaran kosong.

### 4g. Media Aplikasi (logo, favicon, OG) & Pemilih Ikon

**Data media sudah ada di API — jangan biarkan tak tampil.** `ApplicationShape` (`applications.schema.ts`) mengirim `logoUrl`/`logoFileId`, `logoDarkUrl`/`logoDarkFileId`, `faviconUrl`/`faviconFileId`, `ogImageUrl`/`ogImageFileId`, dan `settings.branding.faviconUrl`. `Create`/`Update` menerima semuanya.

* **URL dan `fileId` selalu BERPASANGAN.** `logoFileId` wajib ikut dikirim bersama `logoUrl`: tanpa itu berkas lama tidak bisa dihapus dari ImageKit saat logo diganti, sehingga kuota menumpuk. `ImageUpload` sudah melakukan hapus-berkas-lama saat mengganti/mengosongkan, tetapi hanya bila `fileId` diberikan.
* **Halaman detail menampilkan `Aset Visual`** sebagai **daftar baris ringkas** (`AssetCard.tsx`, thumbnail `size-10`) di kolom kiri bawah Deskripsi. Klik baris membuka modal pratinjau besar berisi URL & `fileId`; metadata itu tidak ditampilkan di halaman agar tidak penuh. Gambar kosong/gagal dimuat diganti `public/Assets/images/asset-placeholder.svg`.
* **Susunan halaman detail**: ringkasan angka → kolom kiri (Informasi Aplikasi, Deskripsi, Aset Visual) + kolom kanan (Tab Role/Permission/Menu/Pengguna). Tab tetap di kolom kanan; aset visual jangan dibuatkan kisi kartu besar karena memperpanjang halaman.
* **Direktori OPD di Lapak** (`src/modules/lapak/LapakOpdPage.tsx`, rute `/lapak-jambi/opd` + alias `/lapak/opd`) berupa **tabel** (`DataTable`) atas data master Organisasi yang SAMA dengan `/seloko/organisasi`, tetapi **hanya OPD mitra** — UPTD/Biro adalah unit di bawah OPD, bukan mitra retribusi. Detail per OPD di `/lapak-jambi/opd/:code` (`LapakOpdDetailPage.tsx`) memakai **kode**, bukan id.
* **Endpoint**: daftar memakai `GET /lapak/opd/tampilan` (gerbang izin aplikasi Lapak, cukup `organization:read`; CRUD lewat `/lapak/opd`), detail memakai `GET /organizations/public/:code` yang hanya butuh `authenticate`. JANGAN memakai `GET /organizations` / `GET /organizations/:id`: keduanya menuntut `organization:list`/`organization:read` milik aplikasi **Seloko**, sehingga pengguna Lapak kena 403. Endpoint tampilan mengembalikan seluruh daftar tanpa paginasi, jadi pencarian & paginasi dilakukan di klien (state lokal di `LapakOpdPage`, bukan `useList`) agar `DataTable` tetap bisa dipakai.
* **Hak kelola OPD di Lapak memakai ROLE, bukan permission.** Aplikasi `lapak-jambi-web` tidak punya permission `organization:*` sama sekali, dan guard memeriksa izin pada aplikasi pemilik modul (`app: APP_CODES.SELOKO`), sehingga admin Lapak tidak akan pernah lolos lewat `organization:*`. Karena itu `lapak-access.ts` membaca **role pada aplikasi Lapak** lewat `GET /permissions/:applicationId/me` (tanpa permission; isinya izin pemanggil sendiri) dan menganggap `admin`/`superadmin` sebagai pengelola. JANGAN menambah permission `organization:update` ke aplikasi Lapak sebagai jalan pintas: itu membuka SELURUH endpoint master organisasi (termasuk hapus) untuk pemegang izin tersebut — jauh lebih luas dari kebutuhan halaman ini. Semua data diambil dari endpoint publik, jadi pembatasan ini murni pada tampilan/UI, bukan pagar keamanan data (memang baca-saja).
* **Folders unggah**: `module=applications` dengan `subFolder` = `logos`, `logos-dark`, `favicons`, `og-images`.
* **Batas berkas BERBEDA per aset — jangan pakai satu aturan untuk semuanya.** Sumber kebenaran = `validateImageKitMedia()` di `seloko-api/src/modules/core/applications/applications.service.ts`; nilainya dicerminkan di `src/config/image-rules.ts`:

  | Aset | Aturan klien | Batas server |
  |---|---|---|
  | Logo utama / logo gelap | `APP_LOGO_RULE` — 2 MB, ≥64×64 | `logo` / `logo tema gelap`, 2 MB, 64 |
  | Favicon | `APP_FAVICON_RULE` — **1 MB**, ≥16×16 | `favicon`, **1 MB**, 16 |
  | Open Graph | `APP_OG_IMAGE_RULE` — 3 MB, ≥200×200 | `Open Graph image`, 3 MB, 200 |
  | Avatar pengguna | `AVATAR_RULE` — 2 MB, ≥100×100 | `validateAvatarImage`, 2 MB, 100 |

  Server memeriksa ulang berkas via ImageKit **saat simpan**, jadi aturan klien yang lebih longgar baru ketahuan setelah unggahan selesai: `400 BAD_REQUEST "Ukuran berkas favicon terlalu besar (1.52 MB). Maksimal yang diizinkan adalah 1 MB."` Berkas sudah terlanjur masuk ImageKit dan menjadi yatim. `ImageUpload` menolak berdasarkan `rule.maxBytes` **sebelum** request, jadi pastikan `rule` tiap `ImageUpload` cocok dengan asetnya — favicon memakai `APP_FAVICON_RULE`, bukan `LOGO_RULE`.
* `LOGO_RULE` tetap dipakai untuk logo **organisasi** (modul lain); jangan mencampurnya dengan aturan media aplikasi.
* **`settings` diganti utuh, bukan ditambal.** Kirim seluruh objek `settings` setiap update; field yang tidak dikirim akan hilang dari DB.

**Pemilih ikon (`src/components/shared/IconPicker.tsx`) — jangan input teks.**

* **Tiga berkas, sengaja dipisah** agar bundle awal tetap ramping:
  * `IconPicker.tsx` — pemicu (pratinjau + nama + tombol kosongkan) + `<dialog>`; **tidak** mengimpor katalog.
  * `IconGrid.tsx` — isi panel: pencarian + kisi; di-`lazy()` dari `IconPicker`.
  * `lucide-catalog.ts` — nama → komponen (1.881 ikon); dimuat hanya bersama `IconGrid`.
  Hasil build: **3 chunk**, bundle utama ~775 kB (sama seperti sebelum fitur), katalog 167 kB gzip diunduh sekali saat panel pertama kali dibuka. **Jangan impor katalog dari `IconPicker`/komponen yang dirender saat aplikasi mulai.**
* **Nama ikon diambil dari daftar statis `lucide-names.ts`, bukan diturunkan dari kunci `icons`.** Konversi PascalCase→kebab tidak bisa dibalik: `AArrowDown` → `a-arrow-down` (bukan `aarrow-down`), `ArrowDown01` → `arrow-down-01`, `Axis3d` → `axis-3d`. Regex naif membuat ~100 nama salah dan nilainya **ditolak saat disimpan ke DB**.
* `lucide-names.ts` **dihasilkan** oleh `npm run gen:icons` (`scripts/gen-lucide-names.mjs`) dari `dist/esm/dynamicIconImports.mjs`; jalankan ulang setelah upgrade `lucide-react`. Jangan diedit tangan.
* **Jangan pakai `iconNames`/`DynamicIcon` dari `lucide-react/dist/esm/DynamicIcon.mjs`** untuk mengambil daftar nama: modul itu menarik `dynamicIconImports` sehingga Vite memecah bundle menjadi **1.800+ chunk** dan bundle utama membengkak ~150 kB.
* Panel = `<dialog>` native (`showModal()`) agar fokus terkunci, Escape menutup, dan klik backdrop menutup tanpa popover kustom. Kisi dirender bertahap (`PAGE` = 120); merender 1.900 `<button>` sekaligus membuat panel tersendat.
* Pencarian mencocokkan nama kebab-case — itulah nilai yang disimpan di DB, jadi operator sekaligus belajar nama tersimpannya.
* Jangan `setState` di dalam `useEffect` untuk reset kueri: lakukan di handler pembuka (`setOpen`). Linter `react(set-state-in-effect)` menandainya sebagai render berantai.
* Pratinjau ikon di tombol pemicu memakai `menuIcon()` (`MENU_ICONS`, ±30 ikon umum) agar tidak menarik katalog. Ikon di luar peta tampil sebagai lingkaran netral sampai panel dibuka.

### 4h. Pengguna (Avatar, NIK, Penugasan Role Berlingkup OPD)

Sumber: `../seloko-api/src/modules/core/users/users.schema.ts` (`UserShape`, `UserDetailShape`).

* **Field profil lengkap sudah dikirim API** — jangan biarkan tak tampil: `avatarUrl`/`avatarFileId`, `nik` (**selalu termasking**, mis. `••••••••••••1234`), `phoneNumber`, `emailVerifiedAt`, `createdAt`/`updatedAt`/`deletedAt`, `totalApplications`, `totalRoles`.
* **Semua avatar pengguna lewat `UserAvatar`** (`src/modules/core/users/UserAvatar.tsx`): `AvatarImage` Radix otomatis jatuh ke `AvatarFallback` inisial saat URL kosong/mati. Jangan menulis inisial manual per halaman.
* **Detail mengirim dua bentuk penugasan**: `applications[]` (dikelompokkan per aplikasi, tiap role punya `organizations[]`) **dan** `roles[]` datar (`UserRoleShape`, lengkap dengan `applicationCode`/`applicationName`). Keduanya sah — pakai yang sesuai tampilan.
* **`organizations` kosong = berlaku untuk SEMUA OPD**, bukan "tanpa akses". UI wajib menulis "Semua OPD", bukan `—`.
* **`GET /users/:id/roles`** (permission `user-app-role:list`) mengembalikan `meta` **dan** `summary` di **akar** respons (di luar `data`) — bukan bentuk `ApiResponse` biasa. `status` bawaannya `active`; kirim `all` untuk audit. Dipakai lewat `userService.listRoles()`.
* **`POST /users/:id/roles`** menerima `organizationIds` (maks 50). Daftar itu **mengganti** lingkup lama, bukan menambah; kosong = seluruh OPD. Role wajib seaudiens dengan jenis akun (server menolak `400`).
* **`PATCH /users/:id`** menerima `fullName`, `phoneNumber`, `avatarUrl`/`avatarFileId`, `nip`, `nik`, `password`, `isSuperAdmin` — minimal satu field. **Jangan mengisi input NIK dengan nilai termasking** (bisa tersimpan sebagai `••••1234`); input mulai kosong dan hanya dikirim bila operator mengetik 16 digit.
* **Reset kata sandi lewat `PATCH /users/:id` juga** (bukan endpoint terpisah). Server menolak `403` bila pemanggil bukan superadmin, menghitung hash argon2id, **mencabut semua refresh token** pengguna itu, dan membuang cache izinnya. UI menampilkan bagian "Kata sandi" hanya untuk superadmin dan bukan untuk akunnya sendiri (mengganti kata sandi sendiri akan mengakhiri sesi yang sedang dipakai), lengkap dengan tombol tampil/sembunyikan. `password` tidak pernah dikembalikan API.
* **Avatar divalidasi server** (`validateAvatarImage`): maks 2 MB, minimal 100×100 px, `fileId` wajib ada di ImageKit. `avatarUrl` dan `avatarFileId` selalu berpasangan (file lama dihapus otomatis saat diganti).
* **Unggah avatar lewat `ImageUpload`** (`AVATAR_RULE`, `module=users`, `subFolder=avatars`) di form tambah **dan** ubah. Berkas diunggah saat dipilih; URL+`fileId` baru ikut saat form disimpan, jadi membatalkan form meninggalkan berkas yatim di ImageKit.
* **Nomor telepon selalu disimpan `+62`.** API hanya menyimpan string (maks 20 karakter) tanpa menormalkan apa pun, jadi penormatan ada di klien: `normalizePhoneId()` (`src/lib/phone.ts`) dipanggil sebelum validasi & sebelum dikirim, dan `displayPhoneId()` menormalkan baris lama (`08…`) saat ditampilkan. Jangan menulis nomor mentah ke UI.
* Filter daftar: `accountType`, `isActive`, `isSuperAdmin` — ketiganya sudah dipakai toolbar daftar pengguna.

### 4e. Organisasi (OPD / Unit Kerja)

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
* `icon` adalah nama ikon Lucide kebab-case. Setiap ikon yang dipakai seeder `../seloko-api/prisma/seeds/core/menus.json` wajib ada di `MENU_ICONS` (`src/config/menu-icons.ts`) — satu sumber untuk `MenuIcon`, `AppLogo`, dan dropdown pemilihan ikon di form menu. Yang tidak terdaftar tampil sebagai lingkaran kosong.
* `menuService.getMyMenus(appCode)` menerima `appCode` sebagai ARGUMEN; jangan membaca store di dalam `queryFn` — nilai itu harus sama dengan `queryKey` (`['menus', appCode]`) agar respons tidak masuk cache environment yang salah saat pengguna berganti cepat.
