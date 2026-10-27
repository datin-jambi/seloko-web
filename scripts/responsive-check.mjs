// Uji responsif nyata lewat Chrome DevTools Protocol: buka halaman detail
// aplikasi pada lebar tertentu, login, lalu ukur kisi aset & modal.
//
// Pakai: W=375 H=700 node scripts/responsive-check.mjs
//        W=1440 H=900 node scripts/responsive-check.mjs
//
// Butuh dev server jalan (BASE_URL, default http://localhost:3006) dan backend
// di localhost:3000. Sesi memakai refresh cookie, jadi login dilakukan lewat form.
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3006'
const APP_ID = process.env.APP_ID ?? '01a17de8-4feb-7382-85ce-07b1112215d8'
const WIDTH = Number(process.env.W ?? 375)
const HEIGHT = Number(process.env.H ?? 700)

const userDir = mkdtempSync(join(tmpdir(), 'cdp-'))
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9223', `--user-data-dir=${userDir}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** URL WebSocket target page pertama. */
async function pageWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:9223/json/list')).json()
      const page = list.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* chrome belum siap */
    }
    await sleep(250)
  }
  throw new Error('Chrome DevTools tidak siap')
}

const ws = new WebSocket(await pageWs())
await new Promise((r) => (ws.onopen = r))
let msgId = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++msgId
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  return r.result?.result?.value
}

/** Tunggu sampai ekspresi bernilai truthy (React selesai mount). */
async function waitFor(expression, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return true
    await sleep(300)
  }
  return false
}

await send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 2,
  mobile: WIDTH < 768,
})
await send('Page.enable')
await send('Page.navigate', { url: `${BASE}/login` })
if (!(await waitFor(`document.querySelectorAll('input').length > 0`))) {
  throw new Error('Halaman login tidak termuat')
}

await evaluate(`(async () => {
  const set = (el, v) => {
    Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const preset = [...document.querySelectorAll('button')].find(b => /superadmin/i.test(b.textContent))
  if (preset) { preset.click(); await new Promise(r => setTimeout(r, 400)) }
  const user = document.querySelector('input[type="text"], input:not([type])')
  const pass = document.querySelector('input[type="password"]')
  if (user && !user.value) { set(user, 'superadmin'); set(pass, 'SelokoBapenda@2025!') }
  const submit = [...document.querySelectorAll('button')].find(b => /^masuk$/i.test(b.textContent.trim()))
  submit?.click()
  await new Promise(r => setTimeout(r, 3000))
})()`)

await send('Page.navigate', { url: `${BASE}/seloko/sistem/aplikasi/${APP_ID}` })
await waitFor(`[...document.querySelectorAll('section')].some(s => s.textContent.includes('Aset Visual'))`)

const page = await evaluate(`(() => {
  const sec = [...document.querySelectorAll('section')].find(s => s.textContent.includes('Aset Visual'))
  const grid = sec?.querySelector('.grid')
  return {
    path: location.pathname,
    winW: innerWidth,
    docW: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    assetGridCols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
    assetCardW: grid ? Math.round(grid.children[0].getBoundingClientRect().width) : null,
  }
})()`)

const modal = await evaluate(`(async () => {
  document.querySelector('button[aria-label^="Lihat"]')?.click()
  await new Promise(r => setTimeout(r, 700))
  const dlg = document.querySelector('[role="dialog"]')
  if (!dlg) return { error: 'modal tidak terbuka' }
  const r = dlg.getBoundingClientRect()
  const body = dlg.querySelector('.overflow-y-auto')
  return {
    modalW: Math.round(r.width),
    modalH: Math.round(r.height),
    marginEachSide: Math.round(r.left),
    fitsWidth: r.left >= 0 && r.right <= innerWidth,
    fitsHeight: r.top >= 0 && r.bottom <= innerHeight,
    bodyScrollable: body ? body.scrollHeight > body.clientHeight : null,
    imgW: Math.round(dlg.querySelector('img')?.getBoundingClientRect().width ?? 0),
  }
})()`)

console.log(`VIEWPORT ${WIDTH}x${HEIGHT}`)
console.log(JSON.stringify({ page, modal }, null, 2))

ws.close()
chrome.kill()
