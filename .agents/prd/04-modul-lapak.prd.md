# PRD 04: Pipeline Implementasi Modul Lapak Jambi (CMS)

Sumber kontrak: **[seloko.apidog.io/lapak-jambi](https://seloko.apidog.io/lapak-jambi-11080002f0)**
(10 folder service). Snapshot teks dokumentasi (tidak ikut repo) diunduh ke
`../../docs-api/*.md`; jangan diedit — itu cermin apa adanya.
Catatan header & envelope: PRD 03 §4c-bis.

Status backend: **LIVE** di `http://localhost:3000/api` dan sudah 17 sub-modul.
Sifat kontrak: **masih berkembang** (kata pemilik proyek). Karena itu setiap perubahan
bentuk respons cukup disentuh di satu tempat — lihat §3.

---

## 1. Peta Task → Menu DB

Menu sidebar Lapak berasal dari `../seloko-api/prisma/seeds/core/menus.json`. Path di
bawah **wajib** sama persis dengan `path` menu, kalau tidak menu bisa diklik tapi 404
(aturan `App.tsx`).

| Task | Menu (label · path) | Endpoint | Prioritas |
|---|---|---|---|
| **P0** | — (fondasi) | — | ✅ selesai |
| **P1** | Kategori · `/lapak-jambi/kategori` | `/lapak/categories` (9) | ✅ selesai |
| **P2** | Produk · `/lapak-jambi/produk` | `/lapak/products` (8) | ✅ selesai |
| **P3** | (publik) | `/lapak/organizations/:code` (2) | 🟡 |
| **P4** | Produk → kartu Tarif | `/lapak/rates` (8) | ✅ selesai |
| **P5** | Produk → tab Jadwal | `/lapak/availability` (6) | 🟠 setelah P2 |
| **P6** | Pesanan · `/lapak-jambi/pesanan` | `/lapak/orders` (5) | 🟠 setelah P2 |
| **P7** | SKRD · `/lapak-jambi/pengaturan-skrd` | `/lapak/skrd` (10) | 🟠 setelah P6 |
| **P8** | Tiket · `/lapak-jambi/tiket` | `/lapak/tickets` (5) | 🟠 setelah P6 |
| **P9** | Pengaturan · `/lapak-jambi/pengaturan` | `/lapak/expiry` (5) | 🟡 |
| **P10** | Reservasi · `/lapak-jambi/reservasi`, Laporan · `/lapak-jambi/laporan` | `/lapak/reservations` (4), `/lapak/reports` (2) | 🟡 |

**Catatan penamaan (penting):** permintaan sempat menyebut produk ada di
`/lapak-jambi/objek-retribusi`. Itu **menu berbeda**: *Objek Retribusi* berada di grup
`Management Retribusi`, sedangkan produk ada di grup `Katalog` → **`/lapak-jambi/produk`**.
Backend **belum punya entitas objek retribusi** (tidak ada model/tabel; `LapakProduct`
hanya menyimpan `retributionObjectId` yang menganggur), jadi menu itu tetap `PendingApiPage`.

Menu yang **belum punya endpoint** (tetap `PendingApiPage`, jangan dikerjakan):
`objek-retribusi`, `transaksi`, `penerima`, `produk/persetujuan`, `artikel`, `galeri`,
`banner`, `berita`, `audit`, `pengguna`, `profile`.

---

## 2. Urutan Runtutan (dependency graph)

```text
P0 fondasi ──┬─► P1 Kategori ──┐
             │                  ├─► P2 Produk ──┬─► P4 Tarif
             │                  │               ├─► P5 Jadwal
             │                  │               ├─► P6 Pesanan ──┬─► P7 SKRD
             │                  │               │                └─► P8 Tiket
             │                  └─► P3 Katalog publik (butuh P2 terbit)
             └─► P9 Worker ────────────────────────────────────────┘
                                                     P10 Reservasi/Laporan
```

Aturan penjadwalan:

1. **P0 wajib pertama.** Tanpa `X-App-Code` per-request, semua endpoint Lapak 400.
2. **P1 sebelum P2** — produk wajib `categoryId`.
3. **P2 sebelum P4/P5/P6** — tarif & jadwal menempel ke `productId`; pesanan butuh produk terbit.
4. **P6 sebelum P7/P8** — SKRD & tiket diterbitkan dari pesanan.
5. P3 bisa dikerjakan kapan saja setelah P2 ada data terbit; sifatnya baca-saja.
6. P9/P10 independen, kerjakan saat sisa.

Satu task = satu commit. Setiap task ditutup dengan: `npm run build` (tsc + vite),
`npm run lint`, `npm run audit:ui`, `npm run check:agents`.

---

## 3. Fondasi Teknis (P0)

### 3a. `X-App-Code` tetap `seloko` ⚠️

Rute Lapak **dirancang untuk gateway**. Buktinya dari source backend
(`categories.routes.ts`): `// ── 2. Endpoint CMS (seloko, Bapenda saja) ──`, dan guard-nya
`requirePermission("category:list", { app: LAPAK })` — di situ `app: LAPAK` adalah
**sumber IZIN**, bukan nilai header.

Jangan menimpa header menjadi `lapak-jambi-web`: `authenticate` membandingkan
`payload.appCode` (token) dengan `request.appCode` (header), jadi header berbeda membuat
**semua** request gagal `403 Token was issued for app "seloko" but request targets
"lapak-jambi-web"`. Gejalanya menyesatkan — tampak seperti masalah token.

Verifikasi terhadap server (token gateway `seloko`, `X-App-Code: seloko`):

| Request | Hasil |
|---|---|
| `GET /lapak/categories` | `200` |
| `POST /lapak/categories` | `201` (slug otomatis dari `name`) |
| `DELETE /lapak/categories/:id` | `200` |
| Endpoint publik (segmen akhir `public`) | `200` — header `seloko` **atau** `lapak-jambi-web`; tanpa header `400` |

Jadi **tidak ada** endpoint Lapak yang butuh token per-aplikasi. Bila 403 muncul, periksa
header yang benar-benar dikirim (DevTools → Network) sebelum menyalahkan token.

### 3a-bis. Selisih dokumentasi vs schema (selalu cek schema)

Dokumen Apidog kadang lebih longgar dari kode. Contoh nyata di Rates §3: daftar `unit`
menyertakan `PACKAGE`, padahal `rates.schema.ts` memakai ulang `PricingUnitSchema` dari
`products.schema.ts` yang **tidak** punya `PACKAGE`. Karena tipe frontend diturunkan dari
schema (`src/types/lapak.ts`), mengikuti dokumen akan mengirim nilai yang ditolak `400`.
Aturan: **schema Zod menang** atas tabel dokumentasi.

### 3b. Envelope respons Lapak ≠ envelope Core

| | Core | Lapak |
|---|---|---|
| Bentuk | `{ success, message, data, meta? }` | `{ statusCode, code, message, data, meta? }` |
| Sukses | `success: true` | `code: 'SUCCESS'` |
| Meta total | `meta.total` | `meta.totalItems` |

`apiClient` tidak melakukan unwrap — setiap service menulis `res.data.data` sendiri, jadi
tidak perlu interceptor baru. Tipe `ApiResponse<T>` (frontend) dipakai untuk Core;
Lapak memakai tipe sendiri `LapakResponse<T>` di `types/lapak.ts`. `storage.service.ts`
sudah lebih dulu memakai envelope `{statusCode,...}` — pola yang sama, jangan "dirapikan".

### 3c. Ikon kategori belum terdaftar

Seed `categories.json` memakai `bed-double`, `landmark`, `dumbbell`, `wrench`,
`flask-conical`, `sprout`. Dari 8 kategori, hanya `building-2` & `store` yang ada di
`MENU_ICONS`; sisanya tampil `Circle`. P0 menambahkan nama-nama itu (semua sudah ada di
`lucide-names.ts`, jadi tidak perlu `npm run gen:icons`).

### 3d. Pola halaman yang dipakai ulang

- Daftar: `useList<T>(path)` → state di query string; `DataTable`; `SearchBar`; `RowActions`.
- Mutasi: `useMutation` + `toast` + invalidasi lewat `src/lib/query-keys.ts` (WAJIB, lihat
  rules §4b — jangan tulis literal key di komponen).
- Form: `FormField`, `ConfirmDialog` untuk aksi destruktif, remount via `key` (bukan reset
  di effect).
- Warna: token (`primary`, `muted`, `destructive`), jangan `blue-*`.

### 3e. Gambar produk (multi-foto)

`ProductChildrenSchema.images` menerima **maks 20** gambar per produk — satu produk memang
boleh punya banyak foto, bukan hanya satu cover.

- Field: `url` (wajib, ≤500), `fileId` (nullable), `altText` (≤150), `isPrimary`, `sortOrder`.
- **Replace-set**: `images` yang dikirim menggantikan SELURUH galeri; baris yang tidak
  dikirim di-soft-delete. Karena itu form wajib mengirim seluruh galeri (termasuk yang tidak
  diubah) — `ProductFormDialog` menyimpan state galeri dari `product.images`.
- **`isPrimary` tunggal**: server menormalkan ulang (`normalizePrimary`); bila tak ada yang
  ditandai, gambar dengan `sortOrder` terkecil diangkat. UI tetap menjaga tepat satu agar
  operator melihat hasil akhirnya sebelum simpan.
- **`coverUrl` mengikuti gambar utama** bila `coverUrl` tidak dikirim eksplisit — itulah
  thumbnail katalog (daftar produk), jadi jangan mengirim `coverUrl` terpisah dari galeri.
- **Berkas**: unggah ke `POST /storage/upload` (`module=lapak`, `subFolder=products`) lewat
  `ProductImagesField` (`src/modules/lapak/products/`). Batas klien = `PRODUCT_IMAGE_RULE`
  (5 MB, ≥400×300). Server Lapak **tidak** memeriksa ukuran/dimensi berkas produk (hanya
  `url` divalidasi), jadi aturan klien adalah satu-satunya penjaga kuota ImageKit.
- **Jangan hapus berkas saat tombol hapus ditekan.** Baris DB bisa bertahan bila form
  dibatalkan; dialog menampung `fileId` yang dibuang dan baru menghapusnya di ImageKit
  setelah simpan sukses.
- Detail produk menampilkan galeri (gambar besar + thumbnail terpilih, gambar utama ditandai);
  bila galeri kosong tetapi `coverUrl` ada, cover itu yang ditampilkan. Daftar memakai
  `coverUrl` sebagai thumbnail dan menyertakan jumlah gambar pada baris meta.
- **Detail UI yang dijaga**: unggah lewat tombol **atau lepas berkas** ke area galeri (ada ubin
  "Tambah gambar"), progres unggah terlihat, penghitung `n dari 20`, penghitung karakter alt,
  nomor urut tiap gambar, dan dialog **tidak bisa ditutup** selama unggahan berjalan (berkas
  setengah jalan akan yatim). Tab form memakai penghitung isi (`Gambar (3)`, `Tarif (2)`),
  error memfokuskan field pertama yang salah, dan produk non-draf menampilkan keterangan
  "hanya bisa dibaca" alih-alih tombol simpan.
- Filter daftar: **status** dan **kategori** (`categoryId`, opsi dari `/lapak/categories/public`).

### 3f. Persetujuan Produk

Rute `/lapak-jambi/produk/persetujuan` (+ alias `/lapak/…`), komponen
`LapakProductApprovalPage.tsx`.

- Antrean = `GET /lapak/products?status=PENDING_REVIEW`; server menyaring lingkup OPD.
- Keputusan = `PATCH /lapak/products/:id/status/approve|reject`. **Tidak ada body** — alasan
  penolakan belum didukung API, jadi jangan mengirim `note` yang tidak dibaca.
- Izin diperiksa **di service**, di balik `product:read`: `product:approve` untuk menyetujui,
  `product:reject` untuk menolak. Tombol wajib mengikuti `canApproveProduct` /
  `canRejectProduct` (`lapak-access.ts`); menampilkan "Tolak" tanpa izin hanya menghasilkan 403.
- Transisi sah hanya dari `PENDING_REVIEW` (`TRANSITIONS` backend). Setelah diputuskan baris
  hilang dari antrean karena filternya status.
- `useLapakList(path, { status }, ['status'])` — argumen ketiga `hidden` membuat `status` tetap
  dikirim ke API tetapi tidak dianggap filter UI. Tanpa itu `DataTable` menampilkan tombol
  **Reset** yang tidak mengubah apa pun.
- `DataTable` menerima `emptyDescription` untuk teks kosong khusus konteks (mis. antrean).
- Kolom OPD hanya berguna bagi Bapenda/superadmin (melihat semua OPD); admin OPD tetap melihat
  satu OPD saja.

---

## 4. Di Luar Cakupan (endpoint belum ada)

`/lapak/objek-retribusi`, `/lapak/transaksi` (laporan warga), `/lapak/penerima`,
`/lapak/artikel|galeri|banner` (modul konten, kemungkinan berbagi endpoint Bapenda),
`/lapak/audit`, `/lapak/pengguna`, `/lapak/profile`. Semua tetap `PendingApiPage`.

Catatan: dokumen Kategori §Catatan menyebut *"`/lapak/objek-retribusi` dan
`/lapak/pengaturan-skrd` di menu belum punya endpoint — menyusul"*. Untuk
`pengaturan-skrd` kondisi sudah berubah: `/lapak/skrd/settings` **sudah ada** (P7),
jadi yang dikerjakan adalah `/lapak-jambi/pengaturan-skrd`, bukan menu `pengaturan`.
