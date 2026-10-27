# PRD 01: Arsitektur Frontend & App Switcher SELOKO WEB

## 1. Latar Belakang & Tujuan
SELOKO WEB adalah dashboard terpusat yang melayani pengelolaan multi-aplikasi BPKPD Provinsi Jambi. Sistem ini berfungsi sebagai pintu masuk tunggal bagi pegawai dan administrator untuk:
1. Mengelola identitas, pengguna, hak akses role & permission (Core Seloko).
2. Mengelola konten publik dan layanan Bapenda Jambi (UPTD Samsat, Banner, Berita, Halaman Profil).

## 2. Fitur Utama & Kebutuhan Fungsional
### A. App Switcher
* Komponen dropdown di navbar/sidebar yang menampilkan daftar aplikasi yang dapat diakses oleh user yang sedang login.
* Mengganti aplikasi aktif akan:
  - Mengubah konteks `activeAppCode` di global store.
  - Mengirim konteks baru lewat query param `appCode` (header `X-App-Code` tetap `seloko`, lihat PRD 03).
  - Me-refresh query `/api/menus/me` untuk menampilkan navigasi sidebar yang sesuai dengan aplikasi tersebut.

### B. Dynamic Navigation Tree
* Menu sidebar tidak di-hardcode secara statis.
* Mengonsumsi endpoint backend `/api/menus/me` yang menghasilkan hierarki menu berformat pohon (`tree`), sudah difilter oleh backend berdasarkan role & permissions user saat ini.
* Ikon menu dirender secara dinamis menggunakan mapping icon name ke `lucide-react`.

### C. State & Auth Flow
* `useAuthStore`: Menyimpan status login, data user profile (`id`, `fullName`, `nip`, `email`, `accountType`, `isSuperAdmin`), dan daftar roles.
* Token disimpan di memory state untuk keamanan maksimal terhadap XSS, didukung rotasi refresh token otomatis melalui HttpOnly cookie.

### D. Design System
* Basis: Tailwind CSS + Radix UI (shadcn/ui design language).
* Variasi tema: Light & Dark mode dengan persistensi di local storage.
* Palet warna, tipografi, dan layout shell (sidebar ciut/perluas): lihat `02-design-system.prd.md`.

### E. Routing per Aplikasi
* Path halaman = path menu di DB (`../seloko-api/prisma/seeds/core/menus.json`), berprefix workspace: `/seloko/…`, `/bapenda/…`, `/lapak-jambi/…` (+ alias `/lapak/…`). Semua rute ada di `src/App.tsx`.
* **Segmen URL workspace ≠ `code` aplikasi.** Pemetaan ada di `APP_WORKSPACE` (`WORKSPACES`, `appWorkspace()`, `appCodeFromPath()` di `src/config/constants.ts`) — mis. aplikasi `lapak-jambi-web` hidup di segmen `lapak`. Jangan menurunkan segmen dari `code`.
* Dasbor tiap workspace = `/<workspace>/dashboard` (`workspaceHome()`); `/` diarahkan ke dasbor Seloko. Isi dasbor = pintasan dari menu milik user (grup + menu datar), bukan metrik karangan.
* **URL adalah sumber kebenaran konteks app**: `DashboardLayout` membaca prefix URL (`appCodeFromPath`) dan menyetel `activeAppCode` setiap kali path berubah (aman karena App Switcher memindahkan halaman). Tautan langsung ke `/bapenda/kontent/berita` membuka sidebar Bapenda. Prefix yang tidak diizinkan akun → `ForbiddenPage`.
* Item sidebar aktif = path menu terpanjang yang menjadi prefix URL (`findActivePath`), grup induknya otomatis terbuka.
* Menu yang endpoint API-nya belum ada tetap punya rute, dirender `PendingApiPage` (status saat ini: penugasan role, log audit, galeri, sebagian besar modul lapak).
* **Profil akun** ada di `/seloko/profile` (`src/modules/core/profile/ProfilePage.tsx`): data dari `useAuthStore` + daftar akses dari `GET /applications/me` (cache yang sama dengan switcher). Tidak ada endpoint profil baru.
