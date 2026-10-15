# SELOKO WEB — Agent Instructions & Conventions

Selamat datang di proyek **SELOKO WEB** (Dashboard Terpusat & Ekosistem Multi-Aplikasi BPKPD Provinsi Jambi).

Aplikasi ini adalah dashboard frontend internal yang dibangun menggunakan **React (TypeScript), Vite, Tailwind CSS, shadcn/ui kustom, Zustand, TanStack Query, dan Axios**. Aplikasi ini mengonsumsi backend **SELOKO API** (`../seloko-api`) yang terdokumentasi di [seloko.apidog.io](https://seloko.apidog.io/).

---

## 📌 Panduan & Aturan Resmi Proyek
### A. Living PRD & Arsitektur Frontend:
- **Master PRD Index:** Buka [`.agents/prd/README.md`](file:///.agents/prd/README.md)
  - Arsitektur App Switcher & Multi-Tenancy Gateway ([`01-seloko-web-architecture.prd.md`](file:///.agents/prd/01-seloko-web-architecture.prd.md)).
  - Standar Komponen & Theme Tokens ([`02-design-system.prd.md`](file:///.agents/prd/02-design-system.prd.md)).
  - Integrasi API & Dynamic Menu ([`03-api-integration.prd.md`](file:///.agents/prd/03-api-integration.prd.md)).

### B. Aturan Wajib (Rules):
1. **Multi-Tenancy via `X-App-Code` & App Switcher:** Buka [`.agents/rules/seloko-web-standards.md`](file:///.agents/rules/seloko-web-standards.md)
   - Header `X-App-Code` selalu `seloko` (gateway); konteks aplikasi aktif dikirim lewat query param `appCode` atau path domain.
   - App Switcher di header secara otomatis mengubah active app code, me-reload menu dinamis (`/api/menus/me`), dan me-reset filter konteks.
2. **Kredensial & Autentikasi (JWT + HttpOnly Cookie):**
   - Access token disimpan di in-memory auth state / memory storage.
   - Refresh token disimpan via `HttpOnly Cookie` dari backend (`withCredentials: true` wajib aktif).
   - Auto-refresh token via Axios interceptor jika menerima error `401 UNAUTHORIZED`.
3. **Standar Komponen UI & Shadcn:**
   - Gunakan path alias `@/*` untuk impor file (`@/components/*`, `@/lib/*`, `@/hooks/*`, `@/services/*`).
   - Komponen shadcn/ui disesuaikan (customized) dengan tema BPKPD Jambi (dukungan Dark/Light mode, transisi halus, token HSL kustom).
4. **Navigasi Dinamis (Dynamic RBAC Sidebar):**
   - Sidebar mengonsumsi `GET /api/menus/me` dan memetakan kode icon Lucide secara aman.
   - Navigasi dilindungi route guard berbasis permissions (`auth.me.permissions`).

---

## 🛠️ Perintah Standar Pengembangan
- `npm run dev` — Menjalankan development server Vite.
- `npm run build` — Memvalidasi TypeScript dan membuat production bundle.
- `npm run lint` — Memeriksa linter kode.
- `npm run audit:ui` — Memeriksa pola UI "AI-slop" (lihat skill `human-ui-crafting`).
- `npm run check:agents` — Memeriksa dokumen `.agents/` masih sinkron dengan struktur repo.
- `npm run check:forms` — Self-check validasi form (`scripts/check-*.ts`, Node `--experimental-strip-types`).
- `npm run preview` — Menjalankan hasil build secara lokal.

---

## 🔄 Menjaga Dokumen Tetap Sinkron
Setiap perubahan struktur, aturan, token desain, alur API, atau keputusan baru dari user **wajib** memperbarui (atau membuat) file terkait di `.agents/` pada perubahan yang sama. Peta "ubah X → perbarui Y" ada di [`.agents/rules/seloko-web-standards.md` §5](file:///.agents/rules/seloko-web-standards.md). Tutup pekerjaan dengan `npm run check:agents`.

---

## 🗺️ Roadmap Fitur SELOKO WEB
1. ⏳ **Inisialisasi Fondasi & App Switcher Architecture** (Vite + TS + Tailwind + Shadcn/UI + Axios Interceptor + Zustand Store).
2. ⏳ **Halaman Autentikasi Modern** (Login internal ASN/Pegawai, Error handling, Auto refresh session).
3. ⏳ **Main Dashboard Layout & Dynamic Sidebar** (App Switcher di Header, Hierarchical Tree Menu via `/api/menus/me`, User Profile Dropdown, Dark/Light Mode).
4. ⏳ **Modul Core Seloko** (Manajemen Pengguna & NIP, Hak Akses Role & Permission, Manajemen Aplikasi, Manajemen Menu).
5. ⏳ **Modul Domain Bapenda CMS** (UPTD Samsat & Geo-Location Map, Banner Drag-and-Drop Reorder, News / Artikel CMS dengan alur review status).
6. ⏳ **Integrasi Storage ImageKit** (Komponen Upload File Multipart, Preview Gambar, ImageKit CDN optimization).
