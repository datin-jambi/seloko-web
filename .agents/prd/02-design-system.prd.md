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

**Dilarang:** `indigo-*`, `violet-*`, `purple-*`, `fuchsia-*`, gradien apa pun — **kecuali** gradien cahaya netral pada permukaan tombol (§7b), warna ikon berbeda-beda per kartu.

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
- Elevasi: **border, bukan bayangan**. Card tanpa shadow. Bayangan hanya untuk (a) lapisan mengambang (dropdown, dialog, toast) dan (b) tombol, lewat token `--elevate-button` + `--surface-button` (§7b), tanpa glow berwarna. Cakupan sempit ini yang membedakan dari AI-slop: gradien/bayangan tidak boleh muncul di card, panel, atau latar halaman.
- Dilarang `backdrop-blur`, glow berwarna (`shadow-primary/*`), blob blur.

## 5. Gerak

- Hanya transisi status: hover warna (150ms), lebar sidebar (200ms), buka/tutup popover.
- Selalu `motion-reduce:transition-none` pada transisi ukuran/posisi.
- Tombol: bayangan lebih tegas saat hover, lalu `active:translate-y-px` + bayangan hilang (kesan tertekan). Tanpa scale/bounce.

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
| Button | Varian menyatakan **makna**, bukan sekadar warna — lihat tabel di §7b. Tinggi `h-9`, `sm` `h-8`. Tombol berisi memakai bayangan tipis agar terlihat timbul; `outline`/`secondary`/`ghost`/`link` tetap rata. |
| Card | `rounded-lg border bg-card`, tanpa shadow, tanpa hover-lift. Gunakan hanya bila memang mengelompokkan konten berbeda — jangan bungkus satu tabel dengan card lalu card lagi. |
| Badge | `<span>` tinggi tetap 22px, `rounded-md`, `text-xs font-medium`, border tipis. Badge **status** pakai `dot` (titik warna di depan label) agar terbaca tanpa bergantung warna saja — `ActiveBadge` sudah memakainya. Badge untuk status/sifat penting: Aktif/Nonaktif (`ActiveBadge`), jenis akun (`AccountTypeBadge`: Internal = `info` + ikon gedung, Eksternal = `warning` + ikon globe — bukan abu-abu agar tak terbaca "nonaktif"), Superadmin (`default` solid + ikon perisai), status berita. Badge non-status pakai ikon, bukan titik. Varian di §2. |
| Form | `FormField` (`src/components/shared/FormField.tsx`): label di atas, `*` merah untuk wajib, "opsional" abu untuk tidak wajib, petunjuk/error di bawah (`id-msg`, dihubungkan `aria-describedby`). Grid dua kolom `sm:grid-cols-2 items-start`, satu kolom di mobile. Dikelompokkan per `fieldset` dengan judul kecil; kartu `max-w-2xl`; tombol Batal/Simpan kanan bawah. Tombol simpan `disabled` + "Menyimpan…" selama request. |
| Tooltip | `src/components/ui/tooltip.tsx` (Radix), `TooltipProvider` sekali di `App.tsx`. Pemicu harus elemen fokus-able (button/link) agar terbuka juga lewat keyboard. Dipakai untuk ringkasan yang detailnya opsional. Panel `rounded-lg border-input shadow-lg`, `sideOffset` 8. Tooltip berisi daftar: `p-0`, judul kecil + garis pemisah, baris = penanda + nama + kode (contoh: kolom Aplikasi daftar pengguna). |
| Tab | `src/components/ui/tabs.tsx` (Radix). Dipakai di detail aplikasi (Role / Permission / Pengguna). Pilihan tab disimpan di query string (`?tab=`) agar tautan & segarkan tetap di tab yang sama. Di layar sempit `TabsList` **melipat** ke baris berikutnya (`flex-wrap`, satu baris penuh hanya di `sm` ke atas). Jangan pakai `overflow-x-auto` di sini: pada bilah gulir klasik (Windows) bilah horizontalnya memakan ~15px tinggi kotak sehingga tab terhimpit, dan `auto` di satu sumbu memaksa sumbu lain jadi `auto` juga sehingga muncul bilah gulir vertikal kecil (panah atas-bawah) di ujung kanan. Tinggi tab harus lebih kecil dari tinggi `TabsList` (`h-7` di dalam `h-9`). Angka di setiap tab wajib sejenis: `counts.*` untuk Role/Permission, dan jumlah pengguna sungguhan untuk tab Pengguna. |
| Pohon (hierarki) | Panel detail aplikasi tab Menu (`AppMenusCard.tsx`): tiap menu tingkat atas = **kartu sendiri** (latar `muted`, judul tebal, ikon dalam kotak `size-8`); anak menggantung di bawahnya dengan `border-l-2` pada `<ul>` sebagai garis penghubung + siku horizontal per baris. `margin-left` garis kini **5.75rem** = px-3 (12) + pegangan drag size-6 (24) + gap-x-2 (8) + chevron size-6 (24) + gap-x-2 (8) + size-8/2 (16) — **hitung ulang bila padding/ukuran salah satu elemen kiri berubah**; pernah meleset 32px tepat saat pegangan drag ditambahkan (garis tidak lagi di tengah ikon induk, selalu ukur `getBoundingClientRect`). Chevron buka/tutup ada di baris induk DAN di kaki grup ("Sembunyikan sub-menu", `aria-expanded`). |
| Urut-ulang drag & drop | Tab Menu memakai `@dnd-kit` lewat `MenuTreeDnd.tsx`: tiap baris dibungkus `SortableRow`, pegangan `GripVertical` `size-6` di paling kiri (`aria-label="Seret <label> untuk mengubah urutan"`, `touch-none`, `cursor-grab`). **Drag hanya mengubah urutan di antara saudara sekandung** — `reorderWithinParent()` (`menu-tree.ts`) mengembalikan `null` untuk gerakan antar-tingkat, dan UI menampilkan toast yang mengarahkan ke form "Ubah → Induk menu". Ini keputusan sadar: pengujian awal dengan drop-mode `inside` membuat `Dashboard` tanpa sengaja jadi anak `Pengguna` hanya karena gerakan meleset beberapa piksel. Jangan kembalikan mode `inside` tanpa konfirmasi eksplisit. `PointerSensor` memakai `activationConstraint.distance: 6` supaya tombol aksi di baris tetap bisa diklik; `KeyboardSensor` + `sortableKeyboardCoordinates` memberi jalur keyboard. Tombol naik/turun lama sudah dihapus. Simpan urutan tetap satu `PATCH /menus/reorder` (satu transaksi). Verifikasi: `npm run check:dnd`. |
| Umpan balik visual drag | Saat menyeret, pengguna harus tahu **akan jatuh di mana** — tanpa ini drag terasa buta (keluhan nyata pengguna). Empat penanda wajib ada, semuanya di `MenuTreeDnd.tsx`: (1) **garis sisip** `h-[3px]` `bg-primary` di tepi atas/bawah baris sasaran (`-top-1.5`/`-bottom-1.5`, bukan `inset-x-1` — garis harus menyentuh tepi), (2) **titik** `size-2.5` di ujung kiri garis, (3) **label teks** `di sini ↑` / `di sini ↓` di kanan baris sasaran — ini yang paling menghapus keraguan, jangan dihapus demi minimalisme, (4) **`DragOverlay`** berisi nama menu yang mengikuti kursor sementara baris asli `opacity-40`. Saat sasaran beda tingkat, semuanya jadi `destructive` + label `beda tingkat`. Baris sasaran juga diberi `bg-primary/10 ring-2 ring-primary/40`. Status dibagikan lewat `menu-dnd-context.ts` (dipisah agar Fast Refresh tidak rusak). Pembaca layar menerima `aria-live="assertive"` berisi **nama menu** (`Akan diletakkan sebelum Pengguna.`) — jangan pernah mengumumkan id/UUID. Penting saat menguji: `DragOverlay` dirender di portal sehingga **tidak ada di dalam** `<ul>`; jangan cari overlay sebagai anak baris. Verifikasi: `npm run check:dnd` (mode normal + `MODE=reject`). |
| Tombol aksi ikon | `IconAction` (`src/components/shared/IconAction.tsx`) — tombol ikon + tooltip shadcn (Radix) untuk aksi baris. `label` wajib dan dipakai **sekaligus** sebagai `aria-label` + isi tooltip, jadi tombol tanpa keterangan tidak mungkin dibuat. Nada warna = makna (lihat §7b): `primary` = tambah sub-menu / buka detail, `warning` = ubah, `success` = aktifkan, `destructive` = hapus, `neutral` = urutkan/nonaktifkan. Warna dipakai sebagai **tint** (`text-*` + `hover:bg-*/15`), bukan blok pekat: enam tombol berjajar tidak boleh bersaing dengan isi baris. Tombol `disabled` dibungkus `<span>` di dalam `TooltipTrigger` — tanpa itu `pointer-events-none` membuat tooltip tak pernah muncul. `warning` memakai `amber-600` (bukan 700) karena kuning jadi tampak cokelat bila digelapkan lebih jauh. **Aksi yang berpindah halaman** (mis. "Atur role" → detail pengguna) memakai prop `to` sehingga dirender `<a>`; jangan mencampur tautan teks + tombol ikon di satu baris. |
| Pemilih ikon | `IconPicker` (`src/components/shared/IconPicker.tsx`) — tombol pemicu (pratinjau ikon + nama `font-mono` + tombol kosongkan) membuka `<dialog>` native berisi kisi **seluruh ikon Lucide** (2.100+, dari `iconNames`) dengan pencarian. Ganti input teks nama ikon dengan komponen ini di setiap form yang meminta ikon. Satu ikon = satu tombol `aria-pressed`, nama kebab-case tercetak di bawah (nilai yang disimpan DB), kisi dimuat bertahap 120. Panel bukan popover: `showModal()` memberi fokus terkunci + Escape tanpa kode tambahan. |
| Media/aset visual | **Baris ringkas, bukan kartu besar.** `AssetCard` (`src/modules/core/applications/AssetCard.tsx`) — satu kolom, tiap baris = thumbnail `size-10` + label + status, tinggi ±54px. Empat aset ini hanya pelengkap; versi kartu besar (2×2 atau 4 kolom) mendorong isi utama ke bawah dan halaman terasa kebesaran. Klik baris membuka modal `sm:max-w-3xl` berisi pratinjau besar + **URL & `fileId`** — metadata itu TIDAK boleh ditumpuk di halaman detail. Gambar yang gagal dimuat diganti placeholder `public/Assets/images/asset-placeholder.svg`; jangan biarkan ikon gambar rusak tampil. Saat aset ada, baris menampilkan `hint` (mis. "Mode gelap"); bila kosong menampilkan "Belum ada". |
| Panel daftar dalam halaman | Kartu detail: header (`h2` + jumlah + aksi kanan) → `ul` berbaris dengan `divide-y`. Baris punya **`IconAction`** (ikon berwarna + tooltip, lihat baris "Tombol aksi ikon"). Daftar yang bisa panjang diberi **pencarian lokal** di header (`Input` ber-ikon `Search`, filter di klien) dan **`ListPagination`** (`src/components/shared/ListPagination.tsx`) di kaki: pemilih "Baris 10/25/50/100", rentang "1–10 dari 13", "Halaman 1 / 2", tombol prev/next. Pencarian & ukuran halaman mengembalikan ke halaman 1. Contoh acuan: `AppRolesCard.tsx`. Nilai penting (nama permission) tidak dipotong — kode/ID yang `font-mono` boleh di-`truncate` + `title`. Grup permission per modul: `lg/xl:grid-cols-2`, satu kolom di mobile. |
| Pagination (klien) | `ListPagination` + `PAGE_SIZES` (`page-sizes.ts`). Dipakai daftar yang sudah dimuat penuh (Role/Pengguna di detail aplikasi). `DataTable` punya kontrol sendiri karena memaginasi di server — jangan menyatukan keduanya. Selalu jaga halaman aktif di dalam batas (`Math.min(page, totalPages)`) supaya menghapus baris terakhir tidak menyisakan halaman kosong. **Daftar yang dikelompokkan** (permission per modul): paginasi daftar DASAR lalu kelompokkan ulang baris di halaman aktif, dan tampilkan `n dari total` pada header modul yang terbelah. Hitung jumlah kelompok dari SELURUH hasil filter, bukan dari grup di halaman aktif — kalau tidak, halaman 2 menulis "1 modul" padahal ada 3. |
| Penanda aplikasi | `AppMark` (`src/modules/core/users/AppMark.tsx`): kotak ikon `rounded-md`, sumber ikon = `icon` dari DB (bukan peta per-kode). Untuk logo asli pakai `AppLogo`. |
| Input/Select | `h-9`, border `input`, fokus `ring-2 ring-ring/30` + `border-primary`. Label di atas, pesan error di bawah. Dropdown pilihan selalu shadcn `Select` (`src/components/ui/select.tsx`, Radix) — bukan `<select>` native. |
| Top loader | `src/components/shared/TopLoader.tsx` (dipasang sekali di `App.tsx`). Bar `primary` 2px di atas layar, otomatis aktif selama ada request `apiClient`. |
| DropdownMenu | Solid `bg-popover`, `shadow-md`, tanpa blur. |
| Table | Header kontras: latar token `--table-head` (`bg-table-head`), teks `text-xs font-semibold text-foreground` (bukan uppercase — `audit:ui`), garis bawah `border-b-2 border-input`. Baris `text-sm`, `whitespace-nowrap`, garis `border-b`, hover `bg-muted/50`. |
| Aksi baris | Kolom terakhir tanpa judul (label `sr-only` "Aksi"), `RowActions` = tombol ⋯ `ghost icon-sm` → DropdownMenu. Aksi destruktif di bawah garis pemisah, teks `text-destructive`. Aksi tanpa permission disembunyikan, bukan dinonaktifkan. |
| Dialog/Sheet | `src/components/ui/dialog.tsx`. Overlay `bg-black/60` tanpa blur, panel `border bg-card shadow-lg`. Konfirmasi aksi berisiko lewat `ConfirmDialog` (tombol konfirmasi `destructive` untuk hapus/nonaktifkan, tetap terbuka sampai request selesai). |

### 6a. Aturan Wajib Semua Modal (termasuk create/edit)

Struktur **tiga lapis tetap**: judul di atas, aksi di bawah, **hanya isi yang boleh digulir**.

```
┌────────────────────────┐
│ DialogHeader (sticky)  │  shrink-0
├────────────────────────┤
│ DialogBody  (scroll)   │  flex-1 min-h-0 overflow-y-auto
├────────────────────────┤
│ DialogFooter (sticky)  │  shrink-0
└────────────────────────┘
```

* **Bungkus SEMUA konten** modal dengan `<DialogBody>`. Tanpa itu isinya jadi flex-item biasa tanpa scroll dan akan mendorong footer keluar dari panel.
* `DialogContent` sudah `flex flex-col` + `max-h-[calc(100dvh-2rem)]` + `overflow-hidden`; **jangan** menambahkan `overflow-y-auto` atau `max-h-[90vh]` di `DialogContent` — itu membuat header & footer ikut tergulir (bug lama yang pernah terjadi di 4 dialog).
* `min-h-0` pada `DialogBody` wajib: flex item menolak menyusut di bawah tinggi kontennya tanpa itu.
* Header & footer memakai border pemisah (`border-input`) dan footer berlatar `bg-muted/40`, supaya batas area scroll terlihat di mode terang maupun gelap.
* Lebar: `DialogContent` default `max-w-lg`. Sesuaikan per kebutuhan lewat `sm:max-w-*` — **jangan** memakai `max-w-*` tanpa prefix `sm:` karena akan mengalahkan `w-[calc(100%-2rem)]` di mobile. Acuan: konfirmasi → `sm:max-w-md`, form 2 kolom → `sm:max-w-2xl`, **form aplikasi (identitas + media + branding) → `sm:max-w-4xl`**, pratinjau media → `sm:max-w-4xl`, permission checklist panjang → `sm:max-w-3xl`.
* **"Besar" bukan berarti lebar tetap.** Modal lebar tetap (`w-[896px]`) merusak mobile. Semua ukuran besar wajib memakai pola `w-[calc(100%-2rem)]` (dari `DialogContent`) + `sm:max-w-*` + `max-h-[calc(100dvh-2rem)]`; verifikasi dengan `W=375 node scripts/responsive-check.mjs`.
* Bila tombol aksi perlu berada di luar `<form>` (mis. markup lama), beri `form="<id-form>"` pada tombol submit agar tetap berfungsi. Utamakan tetap di dalam form — footer `shrink-0` sudah cukup menahan posisi.
* `ConfirmDialog` menaruh deskripsi di `DialogBody` (bukan header) sehingga teks panjang bisa digulir tanpa memakan judul.

### 6b. Susunan Halaman Detail Aplikasi

```
[ PageHeader + kartu ringkasan: Role / Permission / Menu / Pengguna ]
┌──────────────────────────┬────────────────────────────────────────┐
│ kiri (24rem)             │ kanan (1fr)                            │
│  Informasi Aplikasi      │  Tab Role / Permission / Menu/Pengguna │
│  Deskripsi               │  └ daftar isi tab                      │
│  Aset Visual (ringkas)   │                                        │
└──────────────────────────┴────────────────────────────────────────┘
```

* Tab ada di **kolom kanan** (posisi aslinya) — isinya daftar panjang, jadi wajar menempati kolom lebar.
* **Aset Visual di kolom kiri**, di bawah Deskripsi, dalam bentuk **baris ringkas** (`AssetCard`). Jangan dibuatkan kisi kartu besar: versi itu memperpanjang halaman secara berlebihan.
* Jangan pindahkan tab ke bawah selebar halaman: sudah dicoba, hasilnya aset visual naik ke posisi yang tidak semestinya dan halaman jadi tidak seimbang.

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

## 7b. Ketentuan Tombol (Makna → Warna)

Warna tombol menyatakan **jenis aksi**, bukan selera. Pilih varian sesuai tabel; jangan
menentukan warna langsung lewat `className` (mis. `bg-amber-*`) karena akan menyimpang
dari ketentuan ini.

| Aksi | Varian | Warna | Contoh pemakaian |
|---|---|---|---|
| Membuat / menambah | `create` | biru (`primary`) | "Tambah Aplikasi", "Tambah role", "Buat akun", "Buat permission" |
| Mengubah | `edit` | kuning (`warning`) | "Edit", "Ubah", "Simpan perubahan" |
| Menghidupkan kembali | `success` | hijau (`success`) | "Aktifkan" |
| Merusak / menghapus | `destructive` | merah | "Hapus", konfirmasi hapus & nonaktifkan |
| Bukan aksi utama | `outline` / `secondary` / `ghost` / `link` | — | "Batal", aksi ikon per baris, tautan |

- Halaman **tidak** memakai varian `default`/`elevated` untuk aksi baru; keduanya peninggalan
  `shadcn` dan tetap ada hanya agar tidak memecah kode lama.
- Tombol **submit** di dialog mengikuti aksi yang dilakukannya: `create` saat menambah,
  `edit` saat mengubah. Contoh: `variant={isEdit ? 'edit' : 'create'}`.
- Tombol **Batal** selalu `outline`; bukan berwarna, karena ia bukan aksi utama.
- Warna diambil dari token (`--success`, `--warning`, `--destructive`, `--primary`), bukan
  kelas warna mentah Tailwind, agar ikut tema terang/gelap.
- Kontras teks terhadap latar wajib ≥ 4.5:1 di kedua tema (diuji: kuning 6.48, hijau 5.12,
  merah 5.83 pada mode terang).
- Teks tombol kuning memakai `--warning-foreground` gelap — **jangan** putih di atas kuning.

**Efek mengambang + menonjol.** Dua token, keduanya di `src/index.css`:

| Token | Isi | Fungsi |
|---|---|---|
| `--surface-button` / `--surface-button-hover` | gradien cahaya **netral** (putih → transparan → sedikit gelap) | kilau permukaan — inilah yang membuat tombol terasa menonjol ke arah mata |
| `--elevate-button` / `--elevate-button-hover` | kilau tepi atas 1px + shading tepi bawah + bayangan kontak + bayangan lebar | kesan melayang |

- Gradien permukaan dipasang di atas warna varian (`bg-[image:var(--surface-button)]`), jadi
  **satu** token bekerja untuk semua warna. Jangan menulis gradien per varian.
- **Kilaunya wajib berhenti di ~50% tinggi** (nilainya nol tepat di garis teks). Kalau kilau
  menutupi teks, kontras teks putih pada tombol hijau/merah jatuh di bawah AA.
- Saat hover kilau sedikit naik; saat ditekan bayangan hilang dan tombol turun 1px.
- Ini **pengecualian gradien satu-satunya** di proyek: hanya permukaan tombol, netral, dan
  tidak boleh menutupi teks. `outline`/`secondary` boleh ikut memakai kilau yang sama.
- Kuning `edit` cerah (`--warning` mode terang 43 97% 54%) wajib berteks gelap
  (`--warning-foreground`): kontras 10.4:1 (terang) / 12.1:1 (gelap).
- Merah tombol memakai `--destructive-button` terpisah dari `--destructive`, karena latar
  tombol harus cukup gelap agar teks putih lolos AA sementara badge destruktif perlu terang.

## 8. Checklist Sebelum Selesai


- `npm run audit:ui` lolos (lihat `.agents/skills/human-ui-crafting/SKILL.md`).
- Cek light **dan** dark mode, sidebar terbuka **dan** ciut.
- Tidak ada data/metrik karangan. Kosong → `EmptyState`, gagal → `ErrorState`, memuat → skeleton.
