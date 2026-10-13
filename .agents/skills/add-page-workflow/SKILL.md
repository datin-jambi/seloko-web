---
name: add-page-workflow
description: SOP menambah halaman/modul baru di seloko-web — path dari menu DB, hook useList, DataTable, dan halaman PendingApiPage untuk API yang belum ada.
---

# SOP Menambah Halaman / Modul Baru

Halaman mengikuti **path menu di database** (`../seloko-api/prisma/seeds/core/menus.json`), bukan sebaliknya. Path selalu berprefix aplikasi: `/seloko/…`, `/bapenda/…`, `/lapak/…`.

1. **Cek path & permission di seed menu** — path menjadi `<Route path>`; permission sudah difilter backend lewat `/menus/me`.
2. **Cek endpoint di `../seloko-api`** — `../seloko-api/src/app.ts` (prefix terdaftar) + `*.schema.ts` (query & bentuk item). Jangan menebak field.
   - Core (`/users`, `/roles`, …): `meta.total`. Modul bapenda: `meta.totalItems`. `useList` sudah menormalkan keduanya.
   - Filter boolean dikirim sebagai string `'true' | 'false'`.
3. **Tipe item** — `src/types/core.ts` / `src/types/bapenda.ts`. Tulis hanya field yang dipakai UI.
4. **Halaman daftar** — di `src/modules/<domain>/pages.tsx`:
   ```tsx
   const list = useList<UserListItem>('/users', filters?) // filters: objek stabil (useMemo/konstanta)
   <PageHeader title="Pengguna" description="…" />
   <DataTable {...list} columns={cols} rowKey={(r) => r.id} onRetry={list.refetch}
     onPageChange={list.setPage} toolbar={<SearchBar onSearch={list.setSearch} />} />
   ```
   - Kolom didefinisikan di luar komponen. Teks panjang → `<Truncate text=… />` (sel tidak turun baris).
   - Status aktif/terbit → `<ActiveBadge />`; status lain → `Badge` dengan varian PRD 02 §2.
5. **API belum ada** → tetap daftarkan rute dengan `pending('Judul', 'alasan')` (`PendingApiPage`). Jangan isi data karangan.
6. **Daftarkan rute di `src/App.tsx`** di blok aplikasinya. Dasbor tiap app otomatis dari `APP_CONFIGS[code].home`.
7. **Aplikasi baru** → tambah entri `APP_CONFIGS` (`home: '/<prefix>/dashboard'`); konteks app aktif dibaca dari prefix URL (`appCodeFromPath`).
8. **Ikon menu baru** di seed → tambahkan ke `ICON_MAP` `src/components/layout/Sidebar.tsx`.
9. Verifikasi: `npm run lint`, `npm run build`, `npm run audit:ui`, `npm run check:agents`, lalu buka path di browser (data tampil, pagination, pencarian, item sidebar aktif tepat satu).
