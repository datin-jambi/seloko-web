// Verifikasi bahwa mutasi menyegarkan cache React Query (tanpa reload manual).
//
// Memeriksa perilaku NYATA di browser, bukan sekadar kompilasi: login, buka
// detail aplikasi, ganti ikon lewat UI, lalu pastikan halaman detail langsung
// menampilkan nilai baru. Ini menangkap bug "invalidasi tidak cocok"
// (mis. `['/menus']` vs `['menus', appCode]`) yang tidak terdeteksi build/lint.
//
// Pakai: node scripts/query-invalidation-check.mjs   (butuh dev server + backend)
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3009'
const APP_ID = process.env.APP_ID ?? '01a17de8-4feb-7382-85ce-07b1112215d8'
const NEW_ICON = process.env.ICON ?? 'shield'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const userDir = mkdtempSync(join(tmpdir(), 'cdp-'))
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9224', `--user-data-dir=${userDir}`, 'about:blank'],
  { stdio: 'ignore' },
)

async function pageWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:9224/json/list')).json()
      const page = list.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* belum siap */
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
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text)
  return r.result?.result?.value
}
async function waitFor(expr, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (await evaluate(expr)) return true
    await sleep(300)
  }
  return false
}

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Page.enable')
await send('Page.navigate', { url: `${BASE}/login` })
if (!(await waitFor(`document.querySelectorAll('input').length > 0`))) throw new Error('login tidak termuat')

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
  ;[...document.querySelectorAll('button')].find(b => /^masuk$/i.test(b.textContent.trim()))?.click()
  await new Promise(r => setTimeout(r, 3000))
})()`)

await send('Page.navigate', { url: `${BASE}/seloko/sistem/aplikasi/${APP_ID}` })
if (!(await waitFor(`!!document.querySelector('button[aria-label^="Lihat"]')`))) throw new Error('detail aplikasi tidak termuat')

/** Nilai baris "Ikon Launcher" (teks setelah label). */
const readIconRow = () =>
  evaluate(`(() => {
    const dt = [...document.querySelectorAll('dt')].find(d => /Ikon Launcher/i.test(d.textContent))
    return dt?.parentElement?.querySelector('dd')?.innerText?.trim() ?? null
  })()`)

const before = await readIconRow()

// Ganti ikon lewat UI: buka dialog edit → ikon picker → pilih → simpan.
await evaluate(`(() => {[...document.querySelectorAll('button')].find(b => /^edit$/i.test(b.textContent.trim()))?.click()})()`)
if (!(await waitFor(`!!document.querySelector('[role="dialog"]')`))) throw new Error('dialog edit tidak terbuka')

await evaluate(`(() => {
  const dlg = document.querySelector('[role="dialog"]')
  const trig = [...dlg.querySelectorAll('button')].find(b => b.hasAttribute('aria-invalid') && b.id)
  trig?.click()
})()`)
if (!(await waitFor(`[...document.querySelectorAll('dialog')].some(d => d.open)`))) throw new Error('icon picker tidak terbuka')
// Katalog ikon di-`lazy()` + Suspense: `<dialog>` bisa sudah `open` sebelum
// input pencarian ter-render. Tunggu input benar-benar ada.
if (!(await waitFor(`(() => {
  const pick = [...document.querySelectorAll('dialog')].find(d => d.open)
  return !!(pick && pick.querySelector('input'))
})()`))) throw new Error('isi icon picker tidak termuat')

await evaluate(`(async () => {
  const pick = [...document.querySelectorAll('dialog')].find(d => d.open)
  const input = pick.querySelector('input')
  // Set nilai lewat native setter agar React menerima perubahan. Setter harus
  // diambil dari instance elemen (bukan prototype lintas-realm) supaya tidak
  // "Illegal invocation" saat dipanggil lewat CDP.
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, ${JSON.stringify(NEW_ICON)})
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise(r => setTimeout(r, 700))
  const target = [...pick.querySelectorAll('li button')].find(b => b.getAttribute('title') === ${JSON.stringify(NEW_ICON)})
  if (!target) throw new Error('ikon tidak ditemukan: ' + ${JSON.stringify(NEW_ICON)})
  target.click()
  await new Promise(r => setTimeout(r, 500))
  const save = [...document.querySelector('[role="dialog"]').querySelectorAll('button')].find(b => /Simpan Perubahan/.test(b.textContent))
  save.click()
  await new Promise(r => setTimeout(r, 3500))
})()`)

// Tanpa navigasi/reload: baca ulang baris ikon.
const after = await readIconRow()

const result = {
  iconBefore: before,
  iconAfter: after,
  expected: NEW_ICON,
  refreshedWithoutReload: after?.includes(NEW_ICON) ?? false,
}

console.log(JSON.stringify(result, null, 2))
ws.close()
chrome.kill()
process.exit(result.refreshedWithoutReload ? 0 : 1)
