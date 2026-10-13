// Deteksi pola UI "AI-slop" di src/. Aturan: .agents/skills/human-ui-crafting/SKILL.md
// Exit 1 bila ada error. Pakai: npm run audit:ui
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const ERRORS = [
  [/\b(?:indigo|violet|purple|fuchsia)-\d{2,3}\b/, 'warna indigo/violet/ungu — pakai token primary'],
  [/\bbg-(?:gradient|linear|radial|conic)-/, 'gradien'],
  [/\bbackdrop-blur/, 'backdrop-blur (glassmorphism)'],
  [/\bblur-(?:2xl|3xl)\b/, 'blob blur'],
  [/\bshadow-(?:primary|[a-z]+-\d{3})\/\d+/, 'glow berwarna'],
  [/\b(?:Sparkles|Wand2?|WandSparkles)\b/, 'ikon Sparkles/Wand'],
  [/text-\[(?:[0-9]|1[01])px\]/, 'teks < 12px'],
  [/variant=["']gradient["']/, 'variant gradient'],
  [/(?![©®™])\p{Extended_Pictographic}/u, 'emoji'],
]
// Komponen mengambang boleh pakai shadow besar.
const FLOATING = /dropdown-menu|dialog|sheet|popover|tooltip|select|toast|sonner/
const WARNINGS = [
  [/\buppercase\b[^"'`]*\btracking-(?:wide|wider|widest)\b/, 'label uppercase tracking-wider'],
  [/\brounded-(?:2xl|3xl)\b/, 'radius terlalu besar'],
  [/\bshadow-(?:lg|xl|2xl)\b/, 'shadow besar di permukaan statis', (f) => !FLOATING.test(f)],
]

const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(name)) files.push(p)
  }
})(ROOT)

let errors = 0
let warnings = 0
for (const file of files) {
  const rel = relative(ROOT, file).replaceAll('\\', '/')
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const [re, msg] of ERRORS) {
      if (re.test(line)) {
        errors++
        console.log(`ERROR  src/${rel}:${i + 1}  ${msg}`)
      }
    }
    for (const [re, msg, applies = () => true] of WARNINGS) {
      if (applies(rel) && re.test(line)) {
        warnings++
        console.log(`warn   src/${rel}:${i + 1}  ${msg}`)
      }
    }
  })
}

console.log(`\naudit:ui — ${files.length} file, ${errors} error, ${warnings} warning`)
process.exit(errors ? 1 : 0)
