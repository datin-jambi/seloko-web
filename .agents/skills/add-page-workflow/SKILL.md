---
name: add-page-workflow
description: SOP menambah halaman/modul baru di seloko-web — path dari menu DB, hook useList, DataTable, dan halaman PendingApiPage untuk API yang belum ada.
---

# SOP Menambah Halaman / Modul Baru

Halaman mengikuti **path menu di database** (`../seloko-api/prisma/seeds/core/menus.json`), bukan sebaliknya. Path selalu berprefix aplikasi: `/seloko/…`, `/bapenda/…`, `/lapak/…`.

1. **Cek path & permission di seed menu** — path menjadi `<Route path>`; permission sudah difilter backend lewat `/menus/me`.
2. **Cek endpoint di `../seloko-api`** — `../seloko-api/src/app.ts` (prefix terdaftar) + `*.schema.ts` (query & bentuk item). Jangan menebak field.
   - Catat: param filter, ada/tidaknya `sortBy` (+ enum-nya), endpoint ber-pagination atau tidak. Rujukan [seloko.apidog.io](https://seloko.apidog.io/llms.txt); kode menang bila berbeda.
3. **Tipe item** — `src/types/core.ts` / `src/types/bapenda.ts`. Tulis hanya field yang dipakai UI.
4. **Halaman daftar** — di `src/modules/<domain>/pages.tsx`. Aturan param: PRD 03 §4a.
   ```tsx
   // Kolom di luar komponen. sortKey hanya bila endpoint punya sortBy (modul bapenda).
   const columns: Column<BannerListItem>[] = [
     { header: 'Judul', sortKey: 'title', cell: (b) => <Truncate text={b.title} /> },
     { header: 'Status', cell: (b) => <ActiveBadge active={b.isActive} /> },
   ]

   export function BannersPage() {
     const list = useList<BannerListItem>('/bapenda/banners') // param ke-2: param terkunci (konstanta)
     const { params, setSearch, setFilter } = list
     return (
       <>
         <PageHeader title="Banner" />
         <DataTable list={list} columns={columns} rowKey={(b) => b.id} emptyTitle="Belum ada banner"
           toolbar={<>
             <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari judul" />
             <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
           </>} />
       </>
     )
   }
   ```
   - Hanya pasang filter yang ada di `List*QuerySchema` endpoint itu. Jangan tambah filter yang tidak diminta.
   - Teks panjang → `<Truncate />` (sel tidak turun baris). Status aktif/terbit → `<ActiveBadge />`; status lain → `Badge` varian PRD 02 §2.
   - Opsi filter relasi (kategori, aplikasi) → `useQuery` ke endpoint list terkait, `staleTime` panjang.
   - Modul besar (punya detail/aksi) → folder sendiri `src/modules/<domain>/<modul>/` seperti `core/users/`.
5a. **Detail & aksi** (contoh lengkap: `src/modules/core/users/`)
   - Detail = rute `/<app>/<modul>/:id`, `useQuery({ queryKey: ['/<endpoint>', id] })`. Daftar membuka detail lewat `onRowClick` + aksi "Lihat detail".
   - Aksi baris → `actions={(row) => <RowActions label=… actions={[…]} />}`; `show: hasPermission('<kode>')` sesuai `requirePermission` di `*.routes.ts`. Jangan tawarkan aksi ke akun sendiri bila berisiko mengunci diri.
   - Aksi berisiko → `ConfirmDialog`; mutasi + toast + `invalidateQueries({ queryKey: ['/<endpoint>'] })` dikumpulkan dalam satu hook `use-<modul>-actions.tsx` agar dipakai daftar dan detail.
5. **API belum ada** → tetap daftarkan rute dengan `pending('Judul', 'alasan')` (`PendingApiPage`). Jangan isi data karangan.
6. **Daftarkan rute di `src/App.tsx`** di blok aplikasinya. Dasbor tiap app otomatis dari `APP_CONFIGS[code].home`.
7. **Aplikasi baru** → tambah entri `APP_CONFIGS` (`home: '/<prefix>/dashboard'`); konteks app aktif dibaca dari prefix URL (`appCodeFromPath`).
8. **Ikon menu baru** di seed → tambahkan ke `ICON_MAP` `src/components/layout/Sidebar.tsx`.
9. Verifikasi: `npm run lint`, `npm run build`, `npm run audit:ui`, `npm run check:agents`, lalu di browser: data tampil, tiap filter & urut mengubah request API (`?…` di network), refresh mempertahankan state, "Hapus filter" mengosongkan, item sidebar aktif tepat satu.
