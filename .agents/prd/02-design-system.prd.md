# PRD 02: Design System & Layout Shell

Sumber kebenaran visual SELOKO WEB. Token di `src/index.css`, komponen di `src/components/ui/`.
Jika kode dan dokumen ini berbeda, perbarui salah satunya — jangan biarkan menyimpang.

## 1. Posisi Desain

SELOKO WEB adalah **konsol kerja internal** (permukaan *Operate*), bukan landing page.
Pengguna: ASN BPKPD yang membuka aplikasi berjam-jam untuk mengelola data.

Prioritas, berurutan:
1. Cepat dipindai — hierarki dari ukuran & bobot teks, bukan dari kotak, ikon, atau warna.
2. Padat tapi lega — tabel dan form adalah isi utama, bukan kartu sambutan.
3. Identitas institusi — warna diambil dari logo Seloko, bukan palet bawaan template.
4. Tenang — tanpa gradien, blur, glow, atau animasi yang tidak memberi informasi.

## 2. Warna

Diambil dari `public/Assets/images/LOGO SELOKO.png` (navy `#0B2F7A`, royal blue `#0A55C8`, cyan `#00B4F5`).
Satu warna aksen saja: **royal blue**. Cyan hanya untuk penanda item aktif di sidebar.

| Token | Light | Dark | Fungsi |
|---|---|---|---|
| `background` | `#F5F7FA` | `#0B1220` | Latar area konten |
| `card` | `#FFFFFF` | `#101A2E` | Permukaan tabel/form/panel |
| `foreground` | `#0F1B33` | `#F5F7FA` | Teks utama (navy tinta, bukan hitam) |
| `muted-foreground` | `#5B6780` | slate 65% | Teks sekunder, label meta |
| `border` | `#DDE2EA` | slate 20% | Garis pemisah — alat utama pengelompokan |
| `primary` | `#0A55C8` | `#2A6FD6` | Tombol utama, link, fokus |
| `sidebar` | `#0A1F4D` | `#070F22` | Rel navigasi navy (dua mode) |
| `sidebar-indicator` | `#00B4F5` | sama | Garis 3px item menu aktif |

Status (Badge): `success` emerald, `warning` amber, `info` = primary, `destructive` merah, `neutral` abu (nonaktif/draf). Latar lembut + teks tegas, varian dark punya warna teks sendiri (-300) agar kontras.
Di dark mode gunakan tingkat 400. Jangan pakai `-500` untuk teks di atas putih (kontras kurang).

**Dilarang:** `indigo-*`, `violet-*`, `purple-*`, `fuchsia-*`, gradien apa pun, warna ikon berbeda-beda per kartu.

## 3. Tipografi

- Sans: **Plus Jakarta Sans** (desain Indonesia, sudah dimuat di `index.html`). Bobot 400/500/600/700 saja.
- Angka & kode (NIP, ID, nominal): `font-mono tabular-nums` (stack sistem, tanpa font tambahan).
- Skala:

| Peran | Kelas |
|---|---|
| Judul halaman | `text-xl font-semibold tracking-tight` |
| Judul seksi/panel | `text-sm font-semibold` |
| Teks isi, sel tabel, input | `text-sm` |
| Meta, helper, label kecil | `text-xs text-muted-foreground` |

- Ukuran minimum **12px** (`text-xs`). Dilarang `text-[10px]`, `text-[9px]`.
- Dilarang label `uppercase tracking-wider` sebagai judul grup — pakai sentence case.

## 4. Bentuk & Kedalaman

- Radius dasar `6px` (`rounded-md`). Popover/dialog `rounded-lg`. Dilarang `rounded-2xl`/`rounded-3xl` untuk panel.
- Elevasi: **border, bukan bayangan**. Card tanpa shadow. Shadow hanya untuk lapisan mengambang (dropdown, dialog, toast).
- Dilarang `backdrop-blur`, glow berwarna (`shadow-primary/*`), blob blur.

## 5. Gerak

- Hanya transisi status: hover warna (150ms), lebar sidebar (200ms), buka/tutup popover.
- Selalu `motion-reduce:transition-none` pada transisi ukuran/posisi.
- Tombol: `active:translate-y-px` cukup; tanpa scale/bounce.

## 6. Layout Shell

```
┌────────────┬───────────────────────────────────────────┐
│ Sidebar    │ Header (h-14): [App Switcher]   [tema][user] │
│ navy       ├───────────────────────────────────────────┤
│ 240px /    │ <main> konten, max-w-[1400px], p-6         │
│ 64px       │                                           │
│ ...        │                                           │
│ [Ciutkan]  │                                           │
└────────────┴───────────────────────────────────────────┘
```

- **Sidebar** (`src/components/layout/Sidebar.tsx`):
  - Lebar `240px` (terbuka) / `64px` (ciut). Tombol **Ciutkan / Perluas** di kaki sidebar.
  - Status ciut disimpan di `useAppStore.sidebarCollapsed` (persist `localStorage`).
  - Mode ciut: hanya ikon; label tampil sebagai `title` + `aria-label`. Klik grup menu saat ciut → sidebar terbuka dan grup terekspansi.
  - Layar `< md`: sidebar jadi **drawer** (`fixed`, lebar 256px, tersembunyi) dibuka dari tombol menu (☰) di kiri Header. Overlay `bg-black/60`; tertutup saat overlay diklik, tekan Esc, atau pindah halaman. State `useAppStore.mobileNavOpen` (tidak disimpan). Tombol ciut disembunyikan.
  - Konten tidak boleh mendorong lebar halaman di mobile: tabel lebar menggulir di dalam wadahnya sendiri (`relative overflow-x-auto`). Elemen `absolute` (mis. `sr-only`) wajib punya induk `relative` di dalam wadah gulir — tanpa itu ia dihitung terhadap halaman dan membuat seluruh halaman melebar.
  - Item aktif: latar sedikit lebih terang + garis cyan 3px di kiri + teks putih. Bukan pil biru solid.
  - Header sidebar: logo Seloko + "SELOKO" + nama instansi. Tanpa label "Navigasi Menu", tanpa kotak bantuan/versi API.
- **Header**: latar `card` solid, border bawah. Isi: App Switcher (kiri), toggle tema + menu user (kanan). Tanpa ikon notifikasi sampai fitur notifikasi benar-benar ada.
- **Konten**: judul halaman di kiri atas + aksi utama di kanan sejajar. Tanpa hero/banner sambutan.
- Tema awal dibaca dari `localStorage.theme` oleh skrip inline di `index.html` (tanpa kedip).

## 7. Komponen Shadcn Kustom

| Komponen | Aturan |
|---|---|
| Button | `default` (primary), `outline`, `secondary`, `ghost`, `destructive`, `link`. Tinggi `h-9`, `sm` `h-8`. Tanpa shadow. |
| Card | `rounded-lg border bg-card`, tanpa shadow, tanpa hover-lift. Gunakan hanya bila memang mengelompokkan konten berbeda — jangan bungkus satu tabel dengan card lalu card lagi. |
| Badge | `<span>` tinggi tetap 22px, `rounded-md`, `text-xs font-medium`, border tipis. Badge **status** pakai `dot` (titik warna di depan label) agar terbaca tanpa bergantung warna saja — `ActiveBadge` sudah memakainya. Badge untuk status/sifat penting: Aktif/Nonaktif (`ActiveBadge`), jenis akun (`AccountTypeBadge`: Internal = `info` + ikon gedung, Eksternal = `warning` + ikon globe — bukan abu-abu agar tak terbaca "nonaktif"), Superadmin (`default` solid + ikon perisai), status berita. Badge non-status pakai ikon, bukan titik. Varian di §2. |
| Form | `FormField` (`src/components/shared/FormField.tsx`): label di atas, `*` merah untuk wajib, "opsional" abu untuk tidak wajib, petunjuk/error di bawah (`id-msg`, dihubungkan `aria-describedby`). Grid dua kolom `sm:grid-cols-2 items-start`, satu kolom di mobile. Dikelompokkan per `fieldset` dengan judul kecil; kartu `max-w-2xl`; tombol Batal/Simpan kanan bawah. Tombol simpan `disabled` + "Menyimpan…" selama request. |
| Tooltip | `src/components/ui/tooltip.tsx` (Radix), `TooltipProvider` sekali di `App.tsx`. Pemicu harus elemen fokus-able (button/link) agar terbuka juga lewat keyboard. Dipakai untuk ringkasan yang detailnya opsional. Panel `rounded-lg border-input shadow-lg`, `sideOffset` 8. Tooltip berisi daftar: `p-0`, judul kecil + garis pemisah, baris = penanda + nama + kode (contoh: kolom Aplikasi daftar pengguna). |
| Penanda aplikasi | `AppMark` (`src/modules/core/users/AppMark.tsx`): kotak ikon `rounded-md` per kode aplikasi (seloko = perisai biru, bapenda-profile = gedung sky, lapak = toko/ponsel emerald, lainnya = grid abu). Dipakai di tooltip, kartu akses, dan tumpukan (maks 3, `-space-x-1`, cincin warna latar). Tambah entri saat ada aplikasi baru. |
| Input/Select | `h-9`, border `input`, fokus `ring-2 ring-ring/30` + `border-primary`. Label di atas, pesan error di bawah. Dropdown pilihan selalu shadcn `Select` (`src/components/ui/select.tsx`, Radix) — bukan `<select>` native. |
| DropdownMenu | Solid `bg-popover`, `shadow-md`, tanpa blur. |
| Table | Header kontras: latar token `--table-head` (`bg-table-head`), teks `text-xs font-semibold text-foreground` (bukan uppercase — `audit:ui`), garis bawah `border-b-2 border-input`. Baris `text-sm`, `whitespace-nowrap`, garis `border-b`, hover `bg-muted/50`. |
| Aksi baris | Kolom terakhir tanpa judul (label `sr-only` "Aksi"), `RowActions` = tombol ⋯ `ghost icon-sm` → DropdownMenu. Aksi destruktif di bawah garis pemisah, teks `text-destructive`. Aksi tanpa permission disembunyikan, bukan dinonaktifkan. |
| Dialog/Sheet | `src/components/ui/dialog.tsx`. Overlay `bg-black/60` tanpa blur, panel `border bg-card shadow-lg`. Konfirmasi aksi berisiko lewat `ConfirmDialog` (tombol konfirmasi `destructive` untuk hapus/nonaktifkan, tetap terbuka sampai request selesai). |
| Toast | `sonner` via `src/components/ui/sonner.tsx` (`<Toaster />` sekali di `App.tsx`). Posisi **tengah atas**, ada tombol tutup, warna ikut token tema. |
| Top loader | `src/components/shared/TopLoader.tsx` (dipasang sekali di `App.tsx`). Bar `primary` 2px di atas layar, otomatis aktif selama ada request `apiClient`. |

## 7a. Feedback Aksi

| Situasi | Pakai | Jangan |
|---|---|---|
| Request API berjalan | Top loader (otomatis) + tombol aksi `disabled` dengan label proses ("Menyimpan…") | Spinner layar penuh, overlay yang memblokir |
| Aksi berhasil (simpan, hapus, login, logout) | `toast.success('Data disimpan')` — kalimat pendek, tanpa tanda seru | Toast untuk aksi yang hasilnya sudah terlihat jelas di layar (mis. ganti tema, buka menu) |
| Aksi gagal | `toast.error('Gagal menyimpan', { description: pesanDariApi })` | Pesan teknis mentah (stack, kode HTTP) sebagai judul |
| Validasi field form (400 `details`) | Pesan merah di bawah input terkait | Toast per field |
| Memuat data halaman/tabel | Skeleton | Top loader saja tanpa skeleton |

- Satu aksi = satu toast. Jangan tampilkan pesan yang sama di toast dan kotak inline sekaligus.
- Import langsung `import { toast } from 'sonner'`; jangan buat wrapper/helper toast sendiri.
- Request di luar `apiClient` (axios polos/`fetch`) tidak menggerakkan top loader — selalu lewat `apiClient`.

## 8. Checklist Sebelum Selesai

- `npm run audit:ui` lolos (lihat `.agents/skills/human-ui-crafting/SKILL.md`).
- Cek light **dan** dark mode, sidebar terbuka **dan** ciut.
- Tidak ada data/metrik karangan. Kosong → `EmptyState`, gagal → `ErrorState`, memuat → skeleton.
