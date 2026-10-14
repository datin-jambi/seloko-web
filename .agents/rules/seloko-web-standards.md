# Standar Pengembangan & Arsitektur SELOKO WEB

Dokumen ini adalah aturan resmi yang wajib dipatuhi saat menulis kode di `seloko-web`.

---

## 1. Konsep Multi-Tenancy & App Switcher
* **Header `X-App-Code` selalu `seloko`** (gateway). Backend mewajibkan header ini sama dengan `appCode` token; mengikuti aplikasi aktif menyebabkan 401/403.
* **Konteks aplikasi aktif** (`bapenda-profile`, dsb.) dikirim lewat **query param** (`?appCode=`) atau path API domain (`/api/bapenda/*`), bukan header.
* **State Sinkronisasi**: Saat user mengganti aplikasi di App Switcher:
  1. Update active app di Zustand `useAppStore`.
  2. Query menu dinamis (`/api/menus/me?appCode=…`) di-refetch untuk me-render pohon sidebar baru.
  3. Halaman diarahkan ke default dashboard aplikasi tersebut.

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

---

## 4. Struktur Folder Proyek
```text
src/
├── assets/          # Ikon, logo, dan gambar statis
├── components/      # Komponen UI
│   ├── ui/          # Komponen dasar shadcn (Button, Dialog, Card, Input, dll.)
│   ├── layout/      # Sidebar, Header, AppSwitcher, DashboardLayout
│   └── shared/      # Pakai ulang: PageHeader, DataTable, RowActions, ConfirmDialog, SearchBar, PendingApiPage, TopLoader
├── config/          # Konfigurasi aplikasi & konstanta (APP_CODES, env)
├── hooks/           # Custom React hooks (use-list: fetch list — page/search/filter/sort di URL)
├── lib/             # Helper murni (utils, axios instance, formatters)
├── modules/         # Fitur per domain
│   ├── auth/        # Login page, auth guard
│   ├── core/        # DashboardPage (semua app) + pages.tsx: role, permission, aplikasi, menu
│   │   └── users/   # UsersPage, UserDetailPage, use-user-actions (aktif/nonaktif, hapus)
│   └── bapenda/     # pages.tsx: berita, review, kategori, halaman, banner
├── services/        # API service layer (auth.service, menu.service, dll.)
├── stores/          # Zustand store (authStore, appStore, themeStore)
├── types/           # DTO: index.ts (umum), core.ts, bapenda.ts
├── App.tsx          # Router & Providers setup
├── index.css        # Tailwind & Design tokens
└── main.tsx         # React bootstrap
scripts/             # Pemeriksa otomatis (audit:ui, check:agents)
```

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
