---
name: human-ui-crafting
description: Standar UI SELOKO WEB agar tidak terlihat seperti template generik buatan AI (Anti-AI-Slop). Wajib dibaca sebelum membuat/mengubah halaman atau komponen.
---

# Human-Crafted UI — Anti-AI-Slop

Token & spesifikasi lengkap: `.agents/prd/02-design-system.prd.md`. Dokumen ini = cara berpikir + larangan.

## 1. Tentukan Jenis Halaman Dulu

Sebelum menulis JSX, sebutkan jenis halamannya:

| Jenis | Contoh di Seloko | Komposisi yang benar |
|---|---|---|
| Daftar/Operasi | Pengguna, Berita, UPTD | Judul + aksi utama, baris filter, **tabel**, pagination |
| Form/Konfigurasi | Tambah pengguna, edit menu | Form satu kolom (maks `max-w-2xl`), label di atas, tombol simpan di bawah |
| Detail | Profil pengguna, detail berita | Daftar `dl` dua kolom label/nilai, aksi di header |
| Ringkasan | Dasbor | Daftar pekerjaan nyata (antrian review, data terbaru) — **bukan** kartu sambutan |

Komposisi "hero + 3 kartu fitur sejajar" **tidak pernah** benar di aplikasi ini.

## 2. Sepuluh Tanda AI-Slop (Dilarang)

1. Gradien (`bg-gradient-*`, `bg-linear-*`) dan warna indigo/violet/ungu.
2. Blur: `backdrop-blur-*`, `blur-2xl/3xl`, blob bercahaya.
3. Glow berwarna: `shadow-primary/20`, `shadow-blue-500/*`.
4. Ikon dalam kotak berwarna di atas/di samping setiap judul kartu (ikon "topper"), apalagi tiap kartu beda warna.
5. Grid kartu fitur sama besar berisi ikon + judul + kalimat promosi.
6. Angka besar/metrik karangan ("1.234 pengguna", "+12%") tanpa data API.
7. Label kecil `uppercase tracking-wider` sebagai judul grup; teks di bawah 12px.
8. Badge dekoratif tanpa fungsi ("Multi-Tenancy", "v1.0.0", "Sesi Aktif").
9. Ikon `Sparkles`/`Wand`/emoji untuk hal biasa.
10. Kotak bersarang: card di dalam card, `rounded-2xl` besar, shadow di semua permukaan.

## 3. Yang Dilakukan Sebagai Gantinya

- **Hierarki = ukuran & bobot teks.** Judul `text-xl font-semibold`, isi `text-sm`, meta `text-xs text-muted-foreground`.
- **Pengelompokan = garis & jarak.** `border-b`, `divide-y`, `gap-*`. Card hanya bila konteks benar-benar terpisah.
- **Satu aksen.** `primary` (royal blue dari logo). Warna lain hanya untuk status (sukses/peringatan/gagal).
- **Ikon fungsional saja**: di menu, di tombol aksi yang ambigu tanpa ikon. Ukuran `h-4 w-4`, warna `currentColor`.
- **Copy pendek & lugas**, bahasa kerja ASN: "Tambah Pengguna", "Simpan", "Hapus". Bukan "Kelola ekosistem secara mulus".
- **Data nyata.** Tidak ada data dari API → `EmptyState`. Jangan isi contoh hardcoded di halaman produksi.
- **Logo resmi** dari `public/Assets/images/` (`LOGO SELOKO S.png` untuk ikon, `LOGO SELOKO.png`, `LOGO BAPENDA.png` — logo Bapenda berwarna putih, hanya di latar gelap).

## 4. Audit Otomatis (Wajib)

```bash
npm run audit:ui
```

`scripts/audit-ai-slop.mjs` memindai `src/` — pola error menghasilkan exit code 1:
- warna `indigo|violet|purple|fuchsia`, gradien, `backdrop-blur`, `blur-2xl/3xl`
- glow `shadow-<warna>/<opasitas>`, ikon `Sparkles`/`Wand`, emoji
- teks `text-[9px]`/`text-[10px]`, `variant="gradient"`

Warning (perlu alasan jika dipertahankan): `uppercase tracking-wider`, `rounded-2xl/3xl`, `shadow-lg/xl/2xl` di luar komponen mengambang.

Halaman **belum selesai** sebelum audit lolos.

## 5. Checklist Manual

- [ ] Jenis halaman sudah ditentukan dan komposisi sesuai §1.
- [ ] Light & dark mode terbaca; sidebar terbuka & ciut tetap rapi.
- [ ] Loading (skeleton), kosong (`EmptyState`), gagal (`ErrorState`) tersedia.
- [ ] Form: label, helper/error di bawah input, tombol disabled saat submit.
- [ ] Aksi berhasil/gagal memberi toast (tengah atas) sesuai PRD 02 §7a — satu pesan, tidak dobel dengan kotak inline.
- [ ] Tidak ada data karangan atau elemen tanpa fungsi.
