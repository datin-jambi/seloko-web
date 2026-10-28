// Path modul OPD di workspace Lapak. Prefix `/lapak-jambi` = menu DB; `/lapak`
// adalah alias lama yang tetap didaftarkan di App.tsx.
const BASE = '/lapak-jambi'

/** Daftar OPD. Dipakai juga sebagai tujuan tombol "kembali" dari halaman detail. */
export const LAPAK_OPD = `${BASE}/opd`
/** Detail OPD memakai KODE (bukan id) karena endpoint publiknya `/organizations/public/:code`. */
export const LAPAK_OPD_DETAIL = (code: string) => `${BASE}/opd/${code}`
