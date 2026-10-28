// Uji drag & drop urutan menu lewat event mouse asli (CDP), lalu PULIHKAN data.
//
// Aman dijalankan berulang: struktur menu di-snapshot sebelum uji dan
// dikembalikan lewat PATCH /menus/reorder di blok `finally`, apa pun hasilnya.
//
// Pakai: BASE_URL=http://localhost:3005 node scripts/dnd-check.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3005'
const API = 'http://localhost:3000/api'
const APP_ID = process.env.APP_ID ?? '01a17de8-4feb-7382-85ce-07b1112215d8'
const HDR = { 'Content-Type': 'application/json', 'X-App-Code': 'seloko' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: token ? { ...HDR, Authorization: `Bearer ${token}` } : HDR,
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

/** Snapshot susunan menu: [{ id, parentId, sortOrder }] dari API. */
async function snapshot(token) {
  const raw = await api(`/menus?applicationId=${APP_ID}&limit=200`, { token })
  const rows = Array.isArray(raw.data) ? raw.data : raw.data.rows
  return rows.map((r) => ({ id: r.id, parentId: r.parent?.id ?? null, sortOrder: r.sortOrder }))
}

/** Kembalikan susunan ke snapshot. */
async function restore(token, items) {
  return api('/menus/reorder', { method: 'PATCH', token, body: { applicationId: APP_ID, items } })
}

// ── Chrome + CDP ────────────────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'cdp-dnd-'))
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9232', `--user-data-dir=${dir}`, 'about:blank'],
  { stdio: 'ignore' },
)

let wsUrl
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch('http://127.0.0.1:9232/json/list')).json()
    const page = list.find((t) => t.type === 'page')
    if (page?.webSocketDebuggerUrl) {
      wsUrl = page.webSocketDebuggerUrl
      break
    }
  } catch {
    /* belum siap */
  }
  await sleep(250)
}
const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))
let msgId = 0
const pend = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m)
    pend.delete(m.id)
  }
}
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++msgId
    pend.set(i, res)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  const d = r.result?.exceptionDetails
  if (d) throw new Error((d.exception?.description ?? d.text ?? '').split('\n')[0])
  return r.result?.result?.value
}
async function waitFor(expression, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (await ev(expression)) return true
    await sleep(300)
  }
  return false
}

const token = (await api('/auth/login', { method: 'POST', body: { identity: 'superadmin', password: 'SelokoBapenda@2025!' } }))
  .data.accessToken
const original = await snapshot(token)
console.log('snapshot awal:', original.length, 'item')

/** Label menu akar, sesuai urutan render. */
const readRoots = () =>
  ev(`JSON.stringify([...document.querySelectorAll('ul.space-y-3 > li')]
      .map(li => { const b = li.querySelector('button[aria-label^="Seret"]'); return b ? b.getAttribute('aria-label').replace(/^Seret /,'').replace(/ untuk mengubah urutan$/,'') : null })
      .filter(Boolean))`)

let result = { ok: false }
try {
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

  await send('Page.navigate', { url: `${BASE}/login` })
  if (!(await waitFor(`document.querySelectorAll('input').length > 0`))) throw new Error('login tidak termuat')
  await ev(`(async () => {
    const preset = [...document.querySelectorAll('button')].find(b => /superadmin/i.test(b.textContent))
    if (preset) { preset.click(); await new Promise(r => setTimeout(r, 500)) }
    const set = (el, v) => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const user = document.querySelector('input[type="text"], input:not([type])')
    const pass = document.querySelector('input[type="password"]')
    if (user && !user.value) { set(user, 'superadmin'); set(pass, 'SelokoBapenda@2025!') }
    ;[...document.querySelectorAll('button')].find(b => /^masuk$/i.test(b.textContent.trim()))?.click()
    await new Promise(r => setTimeout(r, 3500))
  })()`)

  await send('Page.navigate', { url: `${BASE}/seloko/sistem/aplikasi/${APP_ID}?tab=menus` })
  if (!(await waitFor(`document.querySelectorAll('ul.space-y-3 > li button[aria-label^="Seret"]').length > 1`))) {
    throw new Error('daftar menu tidak termuat')
  }

  const before = JSON.parse(await readRoots())
  console.log('akar awal   :', before)

  const box = (index) =>
    ev(`(() => {
      const li = document.querySelectorAll('ul.space-y-3 > li')[${index}]
      const r = li.querySelector('button[aria-label^="Seret"]').getBoundingClientRect()
      return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top, height: r.height })
    })()`)

  const from = JSON.parse(await box(0))
  const to = JSON.parse(await box(1))
  const targetY = to.top + to.height * 0.85 // bawah tengah → "after"

  const mouse = (type, x, y) =>
    send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: 'left',
      buttons: type === 'mouseReleased' ? 0 : 1,
      clickCount: 1,
    })

  await mouse('mousePressed', from.x, from.y)
  await sleep(120)
  for (let i = 1; i <= 12; i++) {
    const t = i / 12
    await mouse('mouseMoved', from.x + (to.x - from.x) * t, from.y + (targetY - from.y) * t)
    await sleep(45)
  }
  await sleep(250)
  await mouse('mouseReleased', to.x, targetY)
  await sleep(2200)

  const after = JSON.parse(await readRoots())
  console.log('akar akhir  :', after)

  result = {
    ok: after[0] === before[1] && after[1] === before[0],
    before,
    after,
  }
} finally {
  // Selalu pulihkan, termasuk bila uji gagal di tengah jalan.
  await restore(token, original)
  const check = await snapshot(token)
  const same = JSON.stringify(check) === JSON.stringify(original)
  console.log('pulih       :', same ? 'OK — data kembali seperti semula' : 'GAGAL — periksa manual')
  ws.close()
  chrome.kill()
}

console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
