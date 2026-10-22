/**
 * Aturan berkas gambar yang boleh diunggah ke /storage/upload.
 *
 * Dipisah dari komponen agar file komponen hanya mengekspor komponen
 * (aturan Fast Refresh: `only-export-components`).
 */
export interface ImageRule {
  /** Byte. */
  maxBytes: number
  /** Piksel. Berlaku untuk gambar raster; SVG tidak punya dimensi pasti. */
  minWidth?: number
  minHeight?: number
  /** MIME yang diterima, mis. image/png. */
  accept?: string[]
}

/**
 * Logo organisasi.
 *
 * Langit-langit server (storage.controller.ts) 50 MB — jauh lebih longgar dari
 * kebutuhan logo, jadi batas ketat ditegakkan di klien supaya kuota ImageKit
 * tidak habis oleh berkas besar. 2 MB / 64×64 px mengikuti batas "media
 * aplikasi" (<2 MB, ≥32×32 px) yang sudah dipakai modul Applications.
 */
export const LOGO_RULE: ImageRule = {
  maxBytes: 2 * 1024 * 1024,
  minWidth: 64,
  minHeight: 64,
  accept: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
}
