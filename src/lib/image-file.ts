/**
 * Ukuran asli berkas gambar di browser, atau `null` bila tidak bisa diukur
 * (SVG / berkas rusak).
 *
 * Dipakai untuk menolak gambar yang terlalu kecil SEBELUM diunggah. Untuk foto
 * produk Lapak ini satu-satunya pagar: `products.schema.ts` hanya memvalidasi
 * `url`, tanpa memeriksa ukuran/dimensi berkas.
 */
export function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    // SVG tidak punya dimensi raster yang bisa diukur andal lewat <img>.
    if (file.type === 'image/svg+xml') return resolve(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
