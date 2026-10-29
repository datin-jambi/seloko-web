# Standar Pengembangan & Arsitektur SELOKO WEB

Dokumen ini adalah aturan resmi yang wajib dipatuhi saat menulis kode di `seloko-web`.

---

## 1. Konsep Multi-Tenancy & App Switcher
* **Header `X-App-Code` selalu `seloko`** (gateway), termasuk untuk modul Lapak. Backend mewajibkan header ini sama dengan `appCode` token: mengikuti aplikasi aktif — atau menimpanya jadi `lapak-jambi-web` — menyebabkan `403 Token was issued for app…`. Aplikasi `lapak-jambi-web` hanya sumber IZIN (`requirePermission(..., { app })`), bukan nilai header. Detail: PRD 03 §4c-bis.
* **Konteks aplikasi aktif** (`bapenda-profile`, dsb.) dikirim lewat **query param** (`?appCode=`) atau path API domain (`/api/bapenda/*`), bukan header.
* **Sumber daftar environment: `GET /applications/me`** (bukan `/applications`). Hanya `audience === 'INTERNAL'` yang boleh tampil, dan hanya aplikasi yang punya halaman (ada di `APP_WORKSPACE`) yang ditawarkan — kalau tidak, sidebar kosong & halaman 404.
* **`code` aplikasi ≠ segmen URL.** `bapenda-profile` → `/bapenda/…`, `lapak-jambi-web` → `/lapak-jambi/…`. Pakai `appWorkspace()`/`appCodeFromPath()`, jangan menurunkan segmen dari `code`.
* **Modul Lapak memakai endpoint ber-scope sendiri, bukan endpoint core.** Contoh: pengguna Lapak dilayani `GET/POST/PUT /lapak/users` (+ `GET /lapak/users/roles`), bukan `GET/POST/PATCH /users` yang menuntut permission aplikasi Seloko dan membuka seluruh pengguna platform. Gerbangnya role `admin`/`superadmin` pada aplikasi Lapak di service, bukan permission. Saat menambah modul Lapak, cek dulu apakah core endpoint-nya menuntut permission Seloko — kalau ya, buat endpoint ber-scope di `../seloko-api/src/modules/lapak/<modul>/`.
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
├── hooks/           # Custom React hooks (use-list: fetch list — page/search/filter/sort di URL)
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
│   │                    # users/ (LapakUsersPage + LapakUserFormDialog: pengguna aplikasi Lapak,
│   │                    #   tambah akun + role Lapak, ubah profil/role ber-scope Lapak),
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
| Keputusan/koreksi dari user yang mengubah aturan | Aturan terkait (rules/PRD/skill) — tulis aturannya, bukan riwayatnya |
| Fitur roadmap selesai | Status roadmap di `AGENTS.md` |

Cara menulis:
- Ubah dokumen yang sudah ada sebelum membuat file baru. Satu topik = satu tempat; dokumen lain cukup merujuk.
- Tulis kondisi **sekarang** sebagai aturan ("Header X-App-Code selalu `seloko`"), bukan catatan perubahan ("dulu… sekarang…").
- Path, nama file, dan perintah harus persis seperti di repo.
- Skill baru memakai frontmatter `name` + `description` seperti skill yang ada.

Verifikasi: `npm run check:agents` (`scripts/check-agents-docs.mjs`) memastikan path yang dirujuk ada, folder `src/` tercatat di §4, skill/PRD terdaftar di indeks, dan script npm tercatat di `AGENTS.md`. Isi aturan (seperti header atau alur auth) tidak bisa dicek otomatis — baca ulang bagian terkait saat mengubah kodenya.
