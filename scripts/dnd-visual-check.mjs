// Uji umpan balik visual saat drag: garis sisip, sorotan sasaran, pratinjau overlay.
// Menangkap kondisi DI TENGAH drag (bukan setelahnya), lalu memulihkan data menu.
//
// Pakai: BASE_URL=http://localhost:3006 node scripts/dnd-visual-check.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3006'
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
const snapshot = async (token) => {
  const raw = await api(`/menus?applicationId=${APP_ID}&limit=200`, { token })
  const rows = Array.isArray(raw.data) ? raw.data : raw.data.rows
  return rows.map((r) => ({ id: r.id, parentId: r.parent?.id ?? null, sortOrder: r.sortOrder }))
}

const dir = mkdtempSync(join(tmpdir(), 'cdp-vis-'))
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9234', `--user-data-dir=${dir}`, 'about:blank'],
  { stdio: 'ignore' },
)
let wsUrl
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch('http://127.0.0.1:9234/json/list')).json()
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

const token = (await api('/auth/login', { method: 'POST', body: { identity: 'superadmin', password: 'SelokoBapenda@2025!' } })).data
  .accessToken
const original = await snapshot(token)
let result = { ok: false }

try {
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: `${BASE}/login` })
  await waitFor(`document.querySelectorAll('input').length > 0`)
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
    throw new Error('menu tidak termuat')
  }

  const box = (index) =>
    ev(`(() => {
      const li = document.querySelectorAll('ul.space-y-3 > li')[${index}]
      const r = li.querySelector('button[aria-label^="Seret"]').getBoundingClientRect()
      return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top, height: r.height })
    })()`)

  // MODE=reject → seret anak ("Daftar Pengguna") ke baris akar terakhir.
  // Penanda harus berubah merah + label "beda tingkat" (jatuh tidak akan diterima).
  let from, to
  if (process.env.MODE === 'reject') {
    const pick = (label) =>
      ev(`(() => {
        const b = [...document.querySelectorAll('button[aria-label^="Seret"]')]
          .find(x => x.getAttribute('aria-label').startsWith(${JSON.stringify('Seret ')} + ${JSON.stringify(label)}))
        if (!b) return null
        const r = b.getBoundingClientRect()
        return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top, height: r.height })
      })()`)
    from = JSON.parse(await pick('Daftar Pengguna'))
    const roots = JSON.parse(
      await ev(`JSON.stringify([...document.querySelectorAll('ul.space-y-3 > li')]
        .map(li => li.querySelector('button[aria-label^="Seret"]')?.getAttribute('aria-label') ?? '')
        .filter(Boolean))`),
    )
    const last = roots.at(-1).replace(/^Seret /, '').replace(/ untuk mengubah urutan$/, '')
    to = JSON.parse(await pick(last))
  } else {
    from = JSON.parse(await box(0))
    to = JSON.parse(await box(1))
  }
  const mouse = (type, x, y) =>
    send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 })

  await mouse('mousePressed', from.x, from.y)
  await sleep(120)
  // Berhenti di paruh ATAS baris kedua → penanda "before" harus muncul di atasnya.
  const targetY = to.top + to.height * 0.3
  for (let i = 1; i <= 12; i++) {
    const t = i / 12
    await mouse('mouseMoved', from.x + (to.x - from.x) * t, from.y + (targetY - from.y) * t)
    await sleep(45)
  }
  await sleep(400)

  // ── Baca kondisi DI TENGAH drag ─────────────────────────────────────────
  const mid = JSON.parse(
    await ev(`JSON.stringify((() => {
      // Garis sisip: span absolute berwarna (primary/destructive) dengan tinggi ~3px.
      const bars = [...document.querySelectorAll('span')].filter(s => {
        const st = getComputedStyle(s)
        return st.position === 'absolute'
          && st.backgroundColor !== 'rgba(0, 0, 0, 0)'
          && parseFloat(st.height) <= 4
          && parseFloat(st.height) > 0
      })
      const label = [...document.querySelectorAll('span')].find(s => /di sini|beda tingkat/.test(s.textContent ?? ''))
      // Overlay pratinjau: elemen pointer-events-none dengan bayangan besar.
      const overlay = [...document.querySelectorAll('div')].find(d =>
        typeof d.className === 'string' && d.className.includes('pointer-events-none') && d.className.includes('shadow-lg'))
      const highlighted = [...document.querySelectorAll('div')]
        .filter(d => typeof d.className === 'string' && /ring-2/.test(d.className) && /bg-(primary|destructive)\\/10/.test(d.className))
      return {
        insertBars: bars.length,
        barColor: bars[0] ? getComputedStyle(bars[0]).backgroundColor : null,
        positionLabel: label ? label.textContent.trim() : null,
        overlayText: overlay ? overlay.innerText.trim() : null,
        highlightedRows: highlighted.length,
        liveRegion: document.querySelector('[aria-live="assertive"]')?.textContent ?? null,
      }
    })())`),
  )

  // Screenshot kondisi drag.
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const shotPath = join(tmpdir(), 'dnd-drag-state.png')
  writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'))

  await mouse('mouseReleased', to.x, targetY)
  await sleep(1500)

  const rejectMode = process.env.MODE === 'reject'
  result = {
    ok: rejectMode
      ? mid.positionLabel === 'beda tingkat' && typeof mid.barColor === 'string' && !mid.barColor.includes('62, 125')
      : mid.insertBars > 0 && mid.overlayText !== null && mid.positionLabel === 'di sini ↑',
    mode: rejectMode ? 'reject' : 'reorder',
    mid,
    screenshot: shotPath,
  }
} finally {
  await api('/menus/reorder', { method: 'PATCH', token, body: { applicationId: APP_ID, items: original } })
  const check = await snapshot(token)
  console.log('pulih       :', JSON.stringify(check) === JSON.stringify(original) ? 'OK' : 'GAGAL')
  ws.close()
  chrome.kill()
}

console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
