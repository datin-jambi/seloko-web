---
name: resilience-error-workflow
description: Standar penanganan error visual, Error Boundary, 403/404/500 pages, dan feedback states di frontend
---

# SOP Ketahanan Aplikasi & Penanganan Error (Resilience & Error Handling)

Aplikasi tingkat enterprise tidak boleh mengalami *blank white screen* atau crash yang membingungkan user. Ikuti SOP ini untuk menangani setiap tingkat kesalahan:

---

## 1. Hirarki Penanganan Error
1. **Level Komponen (Local State)**:
   - Tangani error form 400 (`VALIDATION_ERROR`).
   - Petakan object `details: { [field]: "pesan error" }` langsung ke bawah input terkait dengan warna merah lembut (`text-destructive`).
2. **Level Rute / Query (Data Fetching Error)**:
   - Jangan biarkan halaman kosong. Tampilkan komponen `<ErrorState message="..." onRetry={...} />`.
3. **Level Otorisasi (403 Forbidden)**:
   - Jika akun pegawai tidak memiliki hak akses permission ke modul tersebut, tampilkan halaman sopan: *"Akses Ditolak — Anda tidak memiliki izin [permission:code] untuk membuka halaman ini"*.
4. **Level Aplikasi (React Error Boundary)**:
   - Tangkap uncaught exceptions dan tampilkan tombol *"Muat Ulang Halaman"* atau *"Kembali ke Dasbor"*.

---

## 2. Standar State Visual Komponen
Setiap modul tabel atau list **wajib** memiliki 4 kondisi visual:
* **Loading State**: Gunakan skeleton animasi berdimensi sama dengan baris tabel asli (`SkeletonRow`), jangan hanya spinner kecil di tengah.
* **Empty State**: Jika array data kosong (`data.length === 0`), tampilkan ilustrasi ikon, judul informatif (misal: *"Belum Ada Kantor Samsat"*), dan tombol CTA aksi pertama (misal: *"Tambah Samsat Pertama"*).
* **Error State**: Jika API gagal, tampilkan pesan kegagalan ramah manusia dan tombol *"Coba Muat Ulang"*.
* **Success State**: Tabel data rapi dengan pagination dan badge status yang jelas.
