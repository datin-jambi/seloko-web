// Menghasilkan src/components/shared/lucide-names.ts dari paket lucide-react.
//
// Kenapa perlu: daftar nama ikon yang sah TIDAK bisa diturunkan dari kunci
// `icons` (PascalCase) — `AArrowDown` → `a-arrow-down`, `ArrowDown01` →
// `arrow-down-01`. Dan mengambilnya dari `iconNames` saat runtime menarik
// `dynamicIconImports` (2.100+ dynamic import) sehingga Vite memecah bundle
// menjadi ribuan chunk. Jadi daftarnya dibekukan di sini.
//
// Pakai: node scripts/gen-lucide-names.mjs   (ulangi setelah upgrade lucide-react)
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Path di-resolve dari root repo, bukan folder scripts/ tempat script ini berada.
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)

const { version } = require('lucide-react/package.json')
const { icons } = require('lucide-react')

// Sumber otoritatif nama ikon: berkas dynamic import (satu entri per nama).
const src = readFileSync(`${ROOT}node_modules/lucide-react/dist/esm/dynamicIconImports.mjs`, 'utf8')
const names = [...src.matchAll(/^\s+"([a-z0-9-]+)": \(\)/gm)].map((m) => m[1])

// `arrow-down-01` → `ArrowDown01`
const toPascal = (name) =>
  name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

// Alias tidak punya komponen sendiri (mis. `alarm-check` → `alarm-clock-check`);
// dibuang supaya katalog tidak menampilkan entri kembar.
const real = names.filter((n) => icons[toPascal(n)])

const out = `/**
 * Nama ikon Lucide yang sah, urut abjad — DIHASILKAN dari lucide-react@${version}
 * (dist/esm/dynamicIconImports.mjs). JANGAN diedit tangan; jalankan
 * \`node scripts/gen-lucide-names.mjs\` setelah upgrade lucide-react.
 *
 * Disimpan statis (bukan dari \`iconNames\` runtime) karena modul itu menarik
 * dynamicIconImports dan membuat Vite memecah bundle jadi ribuan chunk.
 * Hanya nama yang punya komponen sendiri; alias dibuang.
 */
export const LUCIDE_ICON_NAMES: string[] = ${JSON.stringify(real)}
`

writeFileSync(`${ROOT}src/components/shared/lucide-names.ts`, out)
console.log(`lucide-names.ts — ${real.length} nama (dari ${names.length}, ${names.length - real.length} alias dibuang)`)
