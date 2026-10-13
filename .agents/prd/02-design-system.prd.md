# PRD 02: Design System & Customized Shadcn/UI

## 1. Filosofi Desain
Dashboard internal Pemerintah Provinsi Jambi (BPKPD) harus memberikan impresi:
- **Profesional, berwibawa, dan aman**: Warna primer berbasis Deep Slate / Indigo Navy dengan aksen aksen Emerald / Cyan yang elegan.
- **Modern & Data-Dense**: Layout yang rapi, tipografi bersih (Inter/Plus Jakarta Sans), spasi konsisten, kontras tinggi yang nyaman dibaca, serta dukungan Dark Mode penuh.
- **Responsif & Interaktif**: Animasi mikro yang halus, feedback state (loading, empty, error), tooltips informatif, dan badge status warna-warni yang jelas.

## 2. Token Warna & Styling
- Base background: `bg-background` (Dark: `#0b0f19` / Light: `#f8fafc`).
- Primary color: `#4f46e5` / Indigo-600 untuk fokus aksi utama.
- Card/Surface: `bg-card` dengan border subtle `border-border/60` dan glassmorphism halus di header.
- Status badging:
  - Sukses/Aktif: Emerald (`bg-emerald-500/10 text-emerald-500 border-emerald-500/20`).
  - Warning/Review: Amber (`bg-amber-500/10 text-amber-500 border-amber-500/20`).
  - Draf/Inaktif: Zinc/Slate (`bg-zinc-500/10 text-zinc-400 border-zinc-500/20`).
  - Ditolak/Error: Rose (`bg-rose-500/10 text-rose-500 border-rose-500/20`).

## 3. Komponen Shadcn Kustom
1. **Button**: Variasi `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` dengan animasi hover & focus ring tajam.
2. **Card**: Header, Title, Description, Content, Footer dengan border halus.
3. **Badge**: Pill badge untuk status peran, audience (`INTERNAL`/`PUBLIC`), dan status publikasi.
4. **Input & Select**: Form input dengan label jelas dan pesan error validasi.
5. **DropdownMenu**: Menu mengambang dengan transisi popover halus.
6. **Dialog & Sheet**: Modal konfirmasi aksi & slide-over drawer untuk form edit cepat.
7. **Table**: Data table dengan hover row, border terstruktur, dan pagination bar.
