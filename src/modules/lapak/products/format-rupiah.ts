/** Rupiah tanpa desimal — tarif aset daerah selalu bilangan bulat. */
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const formatRupiah = (value: number | null | undefined) =>
  value == null ? '—' : rupiah.format(value)

/**
 * Harga awal = tarif aktif termurah — perhitungan yang sama dengan katalog
 * publik. Dipakai daftar produk & antrean persetujuan.
 */
export const startingPrice = (p: { rates: { isActive: boolean; price: number }[] }) => {
  const active = p.rates.filter((r) => r.isActive).map((r) => r.price)
  return active.length ? Math.min(...active) : null
}
