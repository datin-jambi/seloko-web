// Cek dokumen .agents/ + AGENTS.md masih sinkron dengan struktur repo.
// Aturan: .agents/rules/seloko-web-standards.md §5. Pakai: npm run check:agents
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const dirs = (p) => readdirSync(join(ROOT, p)).filter((n) => statSync(join(ROOT, p, n)).isDirectory())

const docs = ['AGENTS.md']
;(function walk(dir) {
  for (const n of readdirSync(join(ROOT, dir))) {
    const p = `${dir}/${n}`
    if (statSync(join(ROOT, p)).isDirectory()) walk(p)
    else if (n.endsWith('.md')) docs.push(p)
  }
})('.agents')

const problems = []

// 1. Path yang disebut di dokumen harus ada. Abaikan placeholder <x>, glob *, dan blok kode.
for (const doc of docs) {
  const text = read(doc).replace(/```[\s\S]*?```/g, '')
  for (const [, path] of text.matchAll(/`((?:src|scripts|public|\.agents)\/[^`\s]*)`/g)) {
    if (/[<*]/.test(path)) continue
    if (!existsSync(join(ROOT, path))) problems.push(`${doc}: path tidak ada → ${path}`)
  }
}

// 2. Setiap folder src/ (2 tingkat) tercantum di pohon struktur rules §4.
const rules = '.agents/rules/seloko-web-standards.md'
const tree = read(rules)
for (const d of dirs('src')) {
  for (const name of [d, ...dirs(`src/${d}`)]) {
    if (!tree.includes(`${name}/`)) problems.push(`${rules} §4: folder belum dicatat → ${name}/`)
  }
}

// 3. Setiap skill & PRD terdaftar di indeksnya.
const agentsIndex = read('.agents/README.md')
for (const s of dirs('.agents/skills')) {
  if (!agentsIndex.includes(`${s}/`)) problems.push(`.agents/README.md: skill belum terdaftar → ${s}`)
}
const prdIndex = read('.agents/prd/README.md')
for (const f of readdirSync(join(ROOT, '.agents/prd'))) {
  if (f !== 'README.md' && !prdIndex.includes(f)) problems.push(`.agents/prd/README.md: PRD belum terdaftar → ${f}`)
}

// 4. Script npm tercantum di AGENTS.md.
const agentsMd = read('AGENTS.md')
for (const s of Object.keys(JSON.parse(read('package.json')).scripts)) {
  if (!agentsMd.includes(`npm run ${s}`)) problems.push(`AGENTS.md: script belum dicatat → npm run ${s}`)
}

problems.forEach((p) => console.log(`ERROR  ${p}`))
console.log(`\ncheck:agents — ${docs.length} dokumen, ${problems.length} masalah`)
process.exit(problems.length ? 1 : 0)
