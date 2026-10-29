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
 * tidak habis oleh berkas besar.
 */
export const LOGO_RULE: ImageRule = {
  maxBytes: 2 * 1024 * 1024,
  minWidth: 64,
  minHeight: 64,
  accept: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
}

// ─── Media Aplikasi ───────────────────────────────────────────────────────────
// Batas di bawah ini HARUS sama dengan `validateImageKitMedia()` di
// seloko-api/src/modules/core/applications/applications.service.ts. Server
// memeriksa ulang berkas via ImageKit saat simpan, jadi aturan klien yang lebih
// longgar berujung 400 setelah unggahan selesai ("Ukuran berkas favicon terlalu
// besar..."), dan aturan yang lebih ketat menolak berkas yang sebenarnya sah.
const IMAGE_ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/** Logo utama & logo tema gelap: 2 MB, ≥64×64 px. */
export const APP_LOGO_RULE: ImageRule = {
  maxBytes: 2 * 1024 * 1024,
  minWidth: 64,
  minHeight: 64,
  accept: IMAGE_ACCEPT,
}

/** Favicon: 1 MB, ≥16×16 px (server: `validateImageKitMedia(..., "favicon", 1, 16)`). */
export const APP_FAVICON_RULE: ImageRule = {
  maxBytes: 1 * 1024 * 1024,
  minWidth: 16,
  minHeight: 16,
  accept: IMAGE_ACCEPT,
}

/** Gambar Open Graph: 3 MB, ≥200×200 px (server: `..., "Open Graph image", 3, 200`). */
export const APP_OG_IMAGE_RULE: ImageRule = {
  maxBytes: 3 * 1024 * 1024,
  minWidth: 200,
  minHeight: 200,
  accept: IMAGE_ACCEPT,
}

/**
 * Foto avatar pengguna: 2 MB, ≥100×100 px.
 *
 * Cermin `validateAvatarImage()` di
 * `seloko-api/src/modules/core/users/users.service.ts`. Server memeriksa ulang
 * berkas di ImageKit saat simpan, jadi aturan klien yang lebih longgar baru
 * ketahuan setelah unggahan selesai (berkas yatim di ImageKit).
 * SVG sengaja tidak diterima: avatar dirender kecil dan bentuk vektornya
 * bisa menyimpang dari bingkai bulat.
 */
export const AVATAR_RULE: ImageRule = {
  maxBytes: 2 * 1024 * 1024,
  minWidth: 100,
  minHeight: 100,
  accept: ['image/png', 'image/jpeg', 'image/webp'],
}
