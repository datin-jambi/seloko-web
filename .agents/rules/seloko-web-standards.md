# Standar Pengembangan & Arsitektur SELOKO WEB

Dokumen ini adalah aturan resmi yang wajib dipatuhi saat menulis kode di `seloko-web`.

---

## 1. Konsep Multi-Tenancy & App Switcher
* **Header `X-App-Code` selalu `seloko`** (gateway), termasuk untuk modul Lapak. Backend mewajibkan header ini sama dengan `appCode` token: mengikuti aplikasi aktif — atau menimpanya jadi `lapak-jambi-web` — menyebabkan `403 Token was issued for app…`. Aplikasi `lapak-jambi-web` hanya sumber IZIN (`requirePermission(..., { app })`), bukan nilai header. Detail: PRD 03 §4c-bis.
* **Konteks aplikasi aktif** (`bapenda-profile`, dsb.) dikirim lewat **query param** (`?appCode=`) atau path API domain (`/api/bapenda/*`), bukan header.
* **Sumber daftar environment: `GET /applications/me`** (bukan `/applications`). Hanya `audience === 'INTERNAL'` yang boleh tampil, dan hanya aplikasi yang punya halaman (ada di `APP_WORKSPACE`) yang ditawarkan — kalau tidak, sidebar kosong & halaman 404.
* **`code` aplikasi ≠ segmen URL.** `bapenda-profile` → `/bapenda/…`, `lapak-jambi-web` → `/lapak-jambi/…`. Pakai `appWorkspace()`/`appCodeFromPath()`, jangan menurunkan segmen dari `code`.
* **Dua aplikasi Lapak: jangan campur role-nya.** `lapak-jambi-web` (CMS) memuat role **INTERNAL** untuk pegawai & pengelola; `lapak-jambi-app` (aplikasi publik) memuat role **PUBLIC** seperti `warga`. Akun INTERNAL mengambil penugasan dari aplikasi CMS, akun PUBLIC dari aplikasi publik. Mengambil role dari kedua aplikasi sekaligus membuat role tampil dobel (mis. `superadmin, superadmin`) dan menghapus penugasan di aplikasi yang salah. Endpoint `/lapak/users` sudah memilih aplikasi berdasarkan `accountType`; UI wajib mengirim `accountType` saat meminta pilihan role.
* **Modul Lapak memakai endpoint ber-scope sendiri, bukan endpoint core.** Contoh: pengguna Lapak dilayani `GET /lapak/users`, `GET /lapak/users/:id`, `GET /lapak/users/roles`, `POST /lapak/users`, `PUT /lapak/users/:id`, bukan `GET/POST/PATCH /users` yang menuntut permission aplikasi Seloko dan membuka seluruh pengguna platform. Gerbangnya role `admin`/`superadmin` pada aplikasi Lapak di service, bukan permission. Saat menambah modul Lapak, cek dulu apakah core endpoint-nya menuntut permission Seloko — kalau ya, buat endpoint ber-scope di `../seloko-api/src/modules/lapak/<modul>/`.
* **Logo aplikasi** SELALU lewat `AppLogo` (jangan `<img src={logoUrl}>` mentah). Rantai fallback dievaluasi **per tema**: `logoDarkUrl` untuk gelap, `logoUrl` untuk terang; bila hanya ada `logoUrl`, tema gelap memakainya sebagai mask putih (`currentColor`). Slot yang kosong/mati jatuh ke `icon` dari DB → ikon netral. Jangan menebak ikon dari `code`. Detail tabel fallback: PRD 03 §4f.
* **State Sinkronisasi**: Saat user mengganti aplikasi di App Switcher:
  1. Update active app di Zustand `useAppStore`.
  2. Invalidate query `['menus']` agar sidebar tidak memakai menu environment sebelumnya.
  3. Arahkan halaman ke `appHome(code)` — path berprefix workspace lama akan 404.

---

## 2. Autentikasi & Sesi Pengguna
* **Sesi**: `accessToken` disimpan di memori (`useAuthStore`).
* **Refresh Token**: Dikelola via `HttpOnly Cookie` oleh browser (`withCredentials: true`).
* **Interceptor**:
  - Request: Tambahkan `Authorization: Bearer <token>` dan `X-App-Code: seloko`.
  - Response: Tangani error `401`. Lakukan antrian refresh token (`POST /api/auth/refresh`), jika gagal redirect ke `/login`.

---

## 3. Komponen UI & Shadcn Customization
* Komponen diletakkan di `src/components/ui/`.
* Gunakan utilitas `cn()` dari `src/lib/utils.ts` (`clsx` + `tailwind-merge`).
* Pastikan semua komponen ramah aksesibilitas (Radix UI), mendukung keyboard navigation, dan mendukung Dark/Light Mode.
* Warna & token mengikuti `.agents/prd/02-design-system.prd.md` (navy/royal blue dari logo Seloko, token CSS HSL di `src/index.css`). Jangan pakai kelas warna Tailwind mentah untuk aksen (`indigo-*`, `blue-*`) — pakai token (`primary`, `muted`, `sidebar`).
* Sebelum menyatakan UI selesai: `npm run audit:ui`, `npm run lint`, `npm run build` harus lolos.
* **Semua daftar (tabel all) mulai dengan 10 data per halaman** — `DEFAULT_LIMIT` di `src/hooks/use-list.ts`, selalu dikirim ke API. Jangan set limit awal per halaman. Detail: PRD 03 §4a.
* **Nama entitas di kolom pertama tabel adalah tautan ke detail, dan seluruh baris ikut bereaksi.** Bungkus nama dengan `<Link>` bergaya `font-medium underline-offset-2 hover:font-semibold hover:underline` + `group-hover/row:font-semibold group-hover/row:underline` (baris memakai `group/row`), beri `focus-visible:ring-2` untuk keyboard. Baris: `hover:bg-muted/50 transition-colors cursor-pointer` lewat prop `onRowClick` milik `DataTable`, yang sudah mengabaikan klik pada `button/a/[role=menuitem]`; sel aksi juga menghentikan bubbling. Badge status/jenis akun diletakkan di luar tautan. Klik baris hanya jalur tambahan untuk mouse — tautan nama tetap jalur keyboard, jangan menggantinya dengan `onClick` di `<tr>` saja.
* **Field yang terkunci harus diberi tahu sebelum menyimpan, bukan setelah gagal.** Form yang membuat data dengan bagian tak-bisa-diubah (mis. username/email akun) menampilkan peringatan ringkas di dekat field: apa yang terkunci, dan ke mana harus menghubungi. Dialog ubah memakai peringatan yang sama.
* **Field kata sandi selalu punya tombol tampil/sembunyikan sendiri-sendiri.** Bila form punya `kata sandi` + `ulangi kata sandi`, keduanya memakai state terpisah (`showPassword`, `showConfirm`) dan `aria-label` berbeda (`Tampilkan kata sandi` / `Tampilkan ulangi kata sandi`) — jangan satu tombol mengendalikan dua input, karena pengguna perlu memeriksa salah satunya saja. Tombol `type="button"` (jangan sampai men-submit form), `size-4`, `inset-y-0 right-0 w-9`, input diberi `pr-9`. `autoComplete="new-password"`. Nilai kata sandi tidak pernah ditampilkan kembali dari API.
* **Pencarian yang memanggil server WAJIB debounce, tanpa perlu Enter.** Pakai `SearchBar` (`src/components/shared/SearchBar.tsx`) — komponen itu sudah menunda pengiriman ~350 ms, mengirim langsung saat Enter/×, dan menyinkronkan nilai dari URL (Reset/back-forward). **Jangan** menulis `<Input onChange={...}>` sendiri untuk pencarian list, dan **jangan** memberi `key={params.search}` pada `SearchBar` (remount membuang fokus di tengah mengetik). Untuk pencarian yang sudah punya state lokal + request sendiri, pakai `useDebouncedValue()` (`src/hooks/use-debounced-value.ts`) untuk nilai yang masuk `queryKey`. Pengecualian: filter **di memori** (mis. `IconGrid`, `AppRolesCard` menyaring `all` yang sudah diunduh) boleh instan — tidak ada request per ketikan. Setiap ketikan juga tidak boleh menumpuk riwayat browser: `setSearch` di `useList`/`useLapakList` memakai `replace: true` dan mengembalikan halaman ke 1.

---

## 4. Struktur Folder Proyek
```text
src/
├── assets/          # Ikon, logo, dan gambar statis
├── components/      # Komponen UI
│   ├── ui/          # Komponen dasar shadcn (Button, Dialog, Card, Input, dll.)
│   ├── layout/      # Sidebar, Header, AppSwitcher, DashboardLayout
│   └── shared/      # Pakai ulang: PageHeader, DataTable, RowActions, ConfirmDialog, FormField, SearchBar, PendingApiPage, TopLoader, AppLogo, IconAction, IconPicker, ImageUpload, ListPagination
├── config/          # APP_CODES, APP_WORKSPACE (app ↔ segmen URL), WORKSPACE_ALIAS (lapak-jambi → lapak), menu-icons, env
├── hooks/           # Custom React hooks (use-list: fetch list — page/search/filter/sort di URL;
│                    # use-debounced-value: nilai tertunda 350 ms untuk pencarian ke server)
├── lib/             # Helper murni (utils, phone (normalisasi +62), axios instance, formatters, query-keys)
├── modules/         # Fitur per domain
│   ├── auth/        # Login page, auth guard
│   ├── core/        # DashboardPage (semua app) + pages.tsx (barrel re-export)
│   │   ├── profile/ # ProfilePage (/seloko/profile: identitas + akses aplikasi)
│   │   ├── access/  # RolesPage, RoleDetailPage, PermissionsPage, PermissionDetailPage, RoleFormDialog, PermissionFormDialog, PermissionChecklist, use-access-actions, access-form, paths
│   │   ├── applications/ # ApplicationsPage, ApplicationDetailPage (tab Role/Permission/Menu/Pengguna), AppRolesCard, AppPermissionsCard, AppMenusCard, AppUsersCard, MenuFormDialog, menu-tree, app-users, application-paths
│   │   ├── users/   # UsersPage, UserDetailPage, UserCreatePage, UserEditPage, UserRolesCard, UserAvatar, AppMark, AppCount, AccountTypeBadge, use-user-actions, user-form
│   │   ├── organizations/ # OrganizationsPage, OrganizationDetailPage, OrganizationFormDialog, OrganizationChildrenCard, OrganizationParentCard, organization-form, organization-paths
│   │   └── menus/   # MenusPage (inventaris + filter aplikasi/induk/status)
│   ├── bapenda/     # pages.tsx: berita, review, kategori, halaman, banner
│   │   └── lapak/       # OPD (LapakOpdPage/Detail), categories/ (Kategori Layanan),
│   │                    # products/ (Produk & Layanan: list, detail, approval (antrean PENDING_REVIEW),
│   │                    #   form bertab + anak-anak, ProductImagesField untuk galeri multi-foto),
│   │                    # users/ (LapakUsersPage + LapakUserDetailPage + LapakUserFormDialog:
│   │                    #   daftar/detail pengguna Lapak, tambah akun internal|eksternal + role,
│   │                    #   ubah profil/role/kata sandi ber-scope Lapak),
│                    # lapak-access (gerbang izin), use-lapak-list (list envelope Lapak),
│                    # lapak-paths. Pipeline: .agents/prd/04-modul-lapak.prd.md
├── services/        # API service layer (auth.service, menu.service, storage.service, dll.)
├── stores/          # Zustand store (authStore, appStore, themeStore)
├── types/           # DTO: index.ts (umum), core.ts, bapenda.ts
├── App.tsx          # Router & Providers setup
├── index.css        # Tailwind & Design tokens
└── main.tsx         # React bootstrap
scripts/             # Pemeriksa otomatis (audit:ui, check:agents)
```

---

## 4b. Cache Data (React Query) — Kunci Terpusat

**Semua `queryKey` WAJIB berasal dari `src/lib/query-keys.ts`.** Jangan menulis literal `['/menus']`, `['/applications']`, dst. di komponen.

Alasannya konkret: invalidasi React Query memakai **pencocokan prefix**, sehingga dua penulisan yang tampak sama tetapi beda string tidak pernah cocok:

| Query (dibaca) | Invalidasi (ditulis) | Hasil |
|---|---|---|
| `['menus', activeAppCode]` | `['/menus']` | ❌ tidak cocok — sidebar & dashboard basi |
| `['applications', 'me']` | `['/applications']` | ❌ tidak cocok — App Switcher basi |

Gejalanya: data berubah di server, tetapi UI tetap menampilkan nilai lama sampai halaman di-refresh manual. Bug ini **lolos** dari `tsc`/lint karena key hanya array string biasa.

Aturan:
1. Baca/tulis lewat helper (`menuKeys.all`, `applicationKeys.detail(id)`, dst.).
2. Invalidasi memakai `*.all` (prefix) agar semua varian ikut tersegarkan.
3. Mutasi yang mengubah **angka ringkasan** (mis. jumlah menu) juga harus meng-invalidate detail entitas induknya, karena `counts.*` berasal dari `GET /applications/:id`.
4. Verifikasi dengan `npm run check:invalidation` (menguji perilaku nyata di browser, bukan kompilasi).

---

## 4c. Workspace dari URL — Alias Segmen

`appCodeFromPath()` (`src/config/constants.ts`) menentukan aplikasi mana yang menyala dari segmen pertama URL. **Segmen tidak selalu sama dengan nama workspace**: menu Lapak di DB menunjuk `/lapak-jambi/…`, sedangkan workspace-nya `lapak`. Karena itu ada `WORKSPACE_ALIAS` (`lapak-jambi` → `lapak`).

Gejala bila alias hilang: halaman tampil normal tetapi **sidebar tetap milik aplikasi sebelumnya** (biasanya Seloko), karena `appCodeFromPath` mengembalikan `null` dan `DashboardLayout` tidak menyinkronkan store. Saat menambah prefix rute baru, selalu periksa apakah segmennya sudah dikenali fungsi ini.

---

## 5. Sinkronisasi Dokumen `.agents/` (Wajib)

Dokumen di `.agents/` dan `AGENTS.md` adalah sumber kebenaran untuk agent berikutnya. Dokumen yang basi lebih berbahaya daripada tidak ada dokumen. **Perubahan kode yang menyentuh hal di bawah ini belum selesai sebelum dokumennya diperbarui pada perubahan yang sama:**

| Jika berubah… | Perbarui |
|---|---|
| Folder baru / pindah / hapus di `src/` atau `scripts/` | Pohon §4 di file ini |
| Script npm (`package.json`) | Daftar perintah di `AGENTS.md` |
| Token warna, font, radius, komponen `ui/`, layout shell, toast/loader | `.agents/prd/02-design-system.prd.md` |
| Interceptor, header, alur auth, format response, service pattern | `.agents/prd/03-api-integration.prd.md` + §1–2 file ini |
| App Switcher, store, routing, arsitektur modul | `.agents/prd/01-seloko-web-architecture.prd.md` |
| Cara kerja berulang baru (pola halaman, form, upload, dsb.) | Skill baru `.agents/skills/<nama>/SKILL.md` + daftar di `.agents/README.md` |
| PRD baru | File `.agents/prd/NN-<nama>.prd.md` + daftar di `.agents/prd/README.md` |
| Dockerfile / nginx / compose / env produksi | §6 file ini + perintah di `AGENTS.md` |
| Keputusan/koreksi dari user yang mengubah aturan | Aturan terkait (rules/PRD/skill) — tulis aturannya, bukan riwayatnya |
| Fitur roadmap selesai | Status roadmap di `AGENTS.md` |

Cara menulis:
- Ubah dokumen yang sudah ada sebelum membuat file baru. Satu topik = satu tempat; dokumen lain cukup merujuk.
- Tulis kondisi **sekarang** sebagai aturan ("Header X-App-Code selalu `seloko`"), bukan catatan perubahan ("dulu… sekarang…").
- Path, nama file, dan perintah harus persis seperti di repo.
- Skill baru memakai frontmatter `name` + `description` seperti skill yang ada.

Verifikasi: `npm run check:agents` (`scripts/check-agents-docs.mjs`) memastikan path yang dirujuk ada, folder `src/` tercatat di §4, skill/PRD terdaftar di indeks, dan script npm tercatat di `AGENTS.md`. Isi aturan (seperti header atau alur auth) tidak bisa dicek otomatis — baca ulang bagian terkait saat mengubah kodenya.

---

## 6. Deployment Docker & Keamanan Produksi

Berkas deployment hidup di dua repo: `Dockerfile` + `docker/` di **seloko-web**, `Dockerfile` + `docker-compose.prod.yml` + `.env.prod.example` di **seloko-api**. Kompose produksi dijalankan dari `../seloko-api` (web di-build dengan `build.context: ../seloko-web`).

Aturan wajib:

* **`.env` (dan `.env.prod`) tidak pernah di-commit.** Nilai `VITE_*` punya fallback di `src/config/constants.ts` yang sudah benar untuk produksi: `VITE_API_BASE_URL=/api` relatif → nginx mem-proxy `/api` ke container API. `.env` juga di-.dockerignore, jadi image tidak bergantung mesin pengembang.
* **SPA & API satu origin lewat proxy nginx, bukan CORS.** Refresh token = cookie HttpOnly `SameSite=Strict` `Path=/api/auth`. Beda origin → cookie tidak terkirim → `/auth/refresh` selalu 401. Karena itu `docker/nginx.conf.template` mem-proxy `/api/` ke upstream (env runtime `API_UPSTREAM`, default `api:3000`) dan backend tidak perlu membuka origin luar.
* **`index.html` memakai `<script src="/theme-init.js">` eksternal, bukan inline.** Syarat agar `Content-Security-Policy: script-src 'self'` (tanpa `unsafe-inline`) tetap jalan; inline script dipindah ke `public/theme-init.js`. Jangan kembalikan ke inline.
* **Header keamanan satu sumber: `docker/security-headers.conf`.** `add_header` tidak diwarisi ke location yang punya `add_header` sendiri, jadi berkas ini di-`include` di SETIAP location (`/assets/`, `= /index.html`, `/api/`, `/`). HSTS sengaja nonaktif (komentar) — aktifkan di sini bila sudah HTTPS.
* **Aset ber-hash cache 1 tahun; `index.html` & fallback SPA `no-store`.** Kalau `no-store` hilang, rilis baru tidak kelihatan sampai hard-refresh.
* **Kompose produksi: DB/Redis/broker tanpa `ports:` (jaringan compose internal), hanya `web` yang buka port host.** `postgres`/`redis`/`rabbitmq` pakai healthcheck; `api` menunggu semuanya sehat; `worker` (konsumen audit) memakai image `seloko-api:latest` dengan `command: node dist/workers/consumers/audit.consumer.js`.
* **Migrasi DB otomatis saat start** (`CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]`), jadi `prisma` CLI harus ikut di image → jangan ganti ke `npm ci --omit=dev`.
* **ImageKit private key hanya di env server** (`.env.prod` → container API), tidak pernah di frontend; frontend hanya tahu `IMAGEKIT_URL_ENDPOINT`.

Perintah:

```
# image web saja
docker build -t seloko-web .            # dari seloko-web

# seluruh stack produksi (dari seloko-api)
cp .env.prod.example .env.prod          # isi JWT_SECRET, COOKIE_SECRET, dst.
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

`.env.prod.example` berisi variabel yang diwajibkan compose (`:?` → gagal cepat kalau kosong): `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `RABBITMQ_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, kredensial ImageKit. Generate secret: `openssl rand -base64 48`.

Audit dependensi sebelum rilis: `npm audit` (web) dan `npm audit` (api) paling sedikit 0 critical/high. `npm audit fix` aman untuk web; di API `@fastify/jwt` 9→10 dan `zod` 3→4 adalah upgrade breaking — uji dengan `npm test` setelahnya.
