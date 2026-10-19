import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// ─── Kenapa ada proxy /api ────────────────────────────────────────────────────
// Refresh token disimpan sebagai cookie HttpOnly dengan SameSite=Strict dan
// Path=/api/auth. Bila frontend memanggil API lewat origin berbeda
// (localhost:5199 → localhost:3000), cookie tetap disimpan browser tetapi
// TIDAK ikut terkirim pada permintaan berikutnya kecuali host-nya sama persis.
// Akibatnya /auth/refresh membalas 401 "No refresh token provided" — dan itu
// terjadi begitu frontend dibuka lewat 127.0.0.1, IP LAN, atau host lain.
//
// Dengan proxy ini, semua panggilan API menjadi same-origin (/api/...), jadi
// cookie selalu terkirim apa pun host yang dipakai untuk membuka dev server.
// Build produksi tidak terpengaruh: di sana VITE_API_BASE_URL menunjuk ke URL
// API yang sebenarnya dan proxy ini tidak dipakai.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT) || 3001
  // Target proxy hanya dibaca di sisi server Vite (tanpa awalan VITE_), jadi
  // tidak ikut ter-bundle ke browser.
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port,
      host: true, // Memungkinkan akses via IP LAN jika dibutuhkan
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
