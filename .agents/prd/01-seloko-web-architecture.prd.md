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
  - Mengubah header HTTP `X-App-Code` pada seluruh API request berikutnya.
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
