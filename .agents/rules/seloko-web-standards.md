# Standar Pengembangan & Arsitektur SELOKO WEB

Dokumen ini adalah aturan resmi yang wajib dipatuhi saat menulis kode di `seloko-web`.

---

## 1. Konsep Multi-Tenancy & App Switcher
* **Header `X-App-Code`**: Setiap request ke API harus membawa `X-App-Code` sesuai aplikasi aktif yang sedang dipilih di App Switcher (`seloko`, `bapenda-profile`, dsb.).
* **State Sinkronisasi**: Saat user mengganti aplikasi di App Switcher:
  1. Update active app di Zustand `useAppStore`.
  2. Cache header Axios otomatis terbarui.
  3. Query menu dinamis (`/api/menus/me`) di-refetch untuk me-render pohon sidebar baru.
  4. Halaman diarahkan ke default dashboard aplikasi tersebut.

---

## 2. Autentikasi & Sesi Pengguna
* **Sesi**: `accessToken` disimpan di memori (`useAuthStore`).
* **Refresh Token**: Dikelola via `HttpOnly Cookie` oleh browser (`withCredentials: true`).
* **Interceptor**:
  - Request: Tambahkan `Authorization: Bearer <accessToken>` dan `X-App-Code: <currentAppCode>`.
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
│   └── shared/      # Komponen pakai ulang (DataTable, ConfirmModal, FileUploader)
├── config/          # Konfigurasi aplikasi & konstanta (APP_CODES, env)
├── hooks/           # Custom React hooks (useAuth, usePermissions, useTheme)
├── lib/             # Helper murni (utils, axios instance, formatters)
├── modules/         # Fitur per domain
│   ├── auth/        # Login page, auth guard
│   ├── core/        # Dashboard, Users, Roles, Apps, Menus
│   └── bapenda/     # UPTD Samsat, Banners, News/Articles, Pages
├── services/        # API service layer (auth.service, menu.service, dll.)
├── stores/          # Zustand store (authStore, appStore, themeStore)
├── types/           # TypeScript interfaces & DTOs
├── App.tsx          # Router & Providers setup
├── index.css        # Tailwind & Design tokens
└── main.tsx         # React bootstrap
```
