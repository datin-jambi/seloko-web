/** Rupiah tanpa desimal — tarif aset daerah selalu bilangan bulat. */
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const formatRupiah = (value: number | null | undefined) =>
  value == null ? '—' : rupiah.format(value)
