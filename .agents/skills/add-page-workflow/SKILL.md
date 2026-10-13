---
name: add-page-workflow
description: Standard operating procedure untuk menambahkan modul/halaman baru di seloko-web
---

# SOP Menambah Halaman / Modul Baru di SELOKO WEB

Ikuti langkah-langkah berikut ketika membuat fitur atau halaman baru di dashboard:

1. **Definisikan Tipe Data & Schema (Types)**:
   - Buat file types di `src/types/<module>.ts`.
   - Sesuaikan dengan DTO respons dari backend `seloko-api`.

2. **Buat Service API (`src/services/<module>.service.ts`)**:
   - Panggil endpoint menggunakan `apiClient`.
   - Kembalikan data yang ter-unwrap secara konsisten.

3. **Buat TanStack Query Hooks (`src/hooks/use-<module>.ts`)**:
   - Bungkus pemanggilan service dengan `useQuery` atau `useMutation`.
   - Atur query key yang menyertakan `activeAppCode` bila datanya scoped per-aplikasi.
   - Siapkan invalidation otomatis saat mutasi berhasil.

4. **Buat Komponen Halaman (`src/modules/<domain>/pages/<Module>Page.tsx`)**:
   - Gunakan komponen shadcn/ui (`Card`, `Button`, `Table`, `Badge`, `Dialog`).
   - Sertakan layout header dengan judul, deskripsi, dan tombol aksi utama.
   - Sediakan state visual: Skeleton loading, Empty state, Error alert.

5. **Daftarkan Rute di `src/App.tsx`**:
   - Lindungi rute dengan `ProtectedRoute`.
   - Cek permission bila halaman membutuhkan izin tertentu (`requirePermission`).
