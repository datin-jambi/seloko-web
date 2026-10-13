---
name: human-ui-crafting
description: Standar pembuatan antarmuka (UI/UX) manusiawi dan profesional untuk menghindari kesan template generik buatan AI (Anti-AI-Slop)
---

# Human-Crafted UI/UX Standards — Anti-AI-Slop Guidelines

Dokumen skill ini adalah pedoman wajib bagi AI Agent dan developer untuk menghasilkan tampilan yang **otentik, elegan, berwibawa, dan dirancang oleh manusia**, bukan seperti template klise bawaan AI.

---

## 🚫 1. Pola Klise AI yang DILARANG KERAS (Anti-Patterns)
1. **Dilarang memakai "Floating Glow / Blur Blobs" berlebihan**:
   - ❌ Jangan meletakkan bola ungu/cyan blur besar melayang tanpa konteks fungsional di setiap sudut halaman.
   - ✅ Gunakan latar belakang bertekstur arsitektural halus (subtle dot grid / delicate borders), atau kontras warna solid yang bersih.
2. **Dilarang menggunakan Icon Sparkles / Magic Wand untuk hal biasa**:
   - ❌ Jangan pasang ikon `Sparkles` di setiap judul card atau badge hanya untuk memperindah.
   - ✅ Gunakan ikon fungsional yang merepresentasikan data nyata (misal: `Users`, `FileText`, `Building2`, `Shield`).
3. **Dilarang Card Kosong Berlebihan (Low Data Density)**:
   - ❌ Dashboard internal bukan landing page marketing. Jangan membuat kartu raksasa yang isinya hanya 1 baris angka dan ruang kosong melompong.
   - ✅ Dashboard pemerintahan harus **Data-Dense**: tabel yang rapi, baris data terstruktur, filter pencarian jelas, status pill yang ringkas, dan pagination yang efisien.
4. **Dilarang Efek Glassmorphism Berlebihan**:
   - ❌ Jangan membuat seluruh elemen transparan buram (glass blur) sampai teks sulit dibaca.
   - ✅ Gunakan latar belakang `bg-card` solid atau semi-solid dengan border kontras subtle `border-border/70` yang nyaman di mata.

---

## ✨ 2. Prinsip Desain Manusiawi (Human-Crafted Principles)

### A. Tipografi Bertingkat Nyata (Real Visual Hierarchy)
* **Font**: Gunakan **Plus Jakarta Sans** untuk kenyamanan membaca data panjang, dan **JetBrains Mono** untuk angka/NIP/kode UUID.
* **Ukuran & Bobot**:
  - Judul Halaman: `text-2xl font-bold tracking-tight text-foreground`.
  - Subjudul / Helper: `text-xs text-muted-foreground font-medium`.
  - Label Input: `text-xs font-semibold text-foreground`.
  - Data Tabel: `text-xs text-foreground font-normal`.

### B. Palet Warna Nyata Institusi (Jambi Identity)
* **Primer**: Deep Indigo / Slate Navy (`#4f46e5`) — melambangkan integritas dan teknologi inti.
* **Sekunder**: Emerald Green (`#059669`) — warna khas Bapenda Jambi (layanan publik & pendapatan daerah).
* **Netral**: Dark mode berbasis Slate Obsidian (`#0b0f19`), bukan pure black mati (`#000000`).

### C. Aset Resmi (Real Identity Assets)
* Selalu prioritaskan logo resmi instansi yang tersedia di `public/Assets/images/`:
  - `LOGO SELOKO.png`
  - `LOGO SELOKO S.png`
  - `LOGO BAPENDA.png`
* Jangan mengganti logo resmi dengan icon generik buatan AI.

---

## 🤖 3. Audit Otomatis (Wajib Sebelum Selesai)
Jalankan deteksi pola AI-slop secara otomatis:
```bash
npm run audit:ui
```
Script `scripts/audit-ai-slop.mjs` memindai `src/` untuk:
- Ikon `Sparkles`/`Wand` — **error**
- Blur blob (`blur-3xl`, `blur-2xl`) — **error**
- Glassmorphism berlebihan (`backdrop-blur-xl/2xl`) — **error**
- `variant="gradient"` — **error**
- Metrik hardcoded palsu di dashboard — **error**
- Banner gradient & shadow glow berwarna — **warning**

Exit code `1` jika ada error → **dilarang** menyatakan halaman selesai sebelum audit lolos.

---

## 📋 4. Checklist Sebelum Menyelesaikan Halaman (Self-Review)
Sebelum menyatakan pembuatan UI selesai, periksa:
- [ ] Apakah ada elemen blur/glow warna-warni yang tidak fungsional? *(Hapus jika ada)*.
- [ ] Apakah teks kontras dan terbaca jelas baik di Dark Mode maupun Light Mode?
- [ ] Apakah tabel dan form memiliki feedback state (Loading skeleton, Empty state jika kosong, Error alert)?
- [ ] Apakah form input memiliki helper text dan pesan validasi yang jelas di bawah input?
- [ ] Apakah tombol aksi memiliki transisi `active:scale-[0.98]` dan disabled state saat loading?
