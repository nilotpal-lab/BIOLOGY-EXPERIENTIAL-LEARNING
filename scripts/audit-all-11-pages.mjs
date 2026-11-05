import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 4199
const PREVIEW_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9344

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.id = 1
    this.pending = new Map()
    this.consoleErrors = []
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl)
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve
      this.ws.onerror = reject
    })

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(msg.error)
        else resolve(msg.result)
      } else if (msg.method) {
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
          this.consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '))
        }
      }
    }
  }

  send(method, params = {}) {
    const id = this.id++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    return res?.result?.value
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    })
  }

  close() {
    if (this.ws) this.ws.close()
  }
}

const ALL_11_PAGES = [
  { id: 'overview', name: 'Overview' },
  { id: 'features', name: 'Features' },
  { id: 'explore', name: 'Explore' },
  { id: 'simulation', name: 'Simulation' },
  { id: 'timeline', name: 'Cascade Timeline' },
  { id: 'experiment', name: 'Experiment Studio' },
  { id: 'compare', name: 'Insights & Compare' },
  { id: 'conservation', name: 'Conservation Atlas' },
  { id: 'library', name: 'Data Library' },
  { id: 'import', name: 'Dataset Import' },
  { id: 'methodology', name: 'Methodology & Validation' },
]

const VIEWPORTS = [
  { name: 'Desktop-1920', width: 1920, height: 1080 },
  { name: 'Laptop-1280', width: 1280, height: 800 },
  { name: 'Tablet-768', width: 768, height: 1024 },
  { name: 'Mobile-375', width: 375, height: 812 },
]

async function main() {
  console.log('--- 1. Launching Vite Preview on port ' + PORT + ' ---')
  const preview = spawn('npx.cmd', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    shell: true,
  })

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(PREVIEW_URL)
      if (res.ok) break
    } catch {}
    await wait(250)
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'fwg-audit-all-'))
  console.log('--- 2. Launching Chrome ---')
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ])

  let wsUrl = null
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
      if (res.ok) {
        const tabs = await res.json()
        const t = tabs.find((x) => x.type === 'page') || tabs[0]
        if (t?.webSocketDebuggerUrl) {
          wsUrl = t.webSocketDebuggerUrl
          break
        }
      }
    } catch {}
    await wait(250)
  }

  if (!wsUrl) throw new Error('Chrome remote debugging port not available')

  const cdp = new CDPClient(wsUrl)
  await cdp.connect()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')

  console.log('--- 3. Auditing ALL 11 Pages ---')
  const issuesFound = []

  for (const page of ALL_11_PAGES) {
    console.log(`\nChecking [${page.id}] ${page.name}...`)
    const url = `${PREVIEW_URL}/#/${page.id}`
    await cdp.send('Page.navigate', { url })
    await wait(1200)

    for (const vp of VIEWPORTS) {
      await cdp.setViewport(vp.width, vp.height)
      await wait(400)

      const pageState = await cdp.evaluate(`(() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.textContent?.trim() || '';
        const h2 = document.querySelector('h2')?.textContent?.trim() || '';
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasOverflow = scrollWidth > clientWidth + 2; // allowance for 2px subpixel
        const brokenImages = Array.from(document.querySelectorAll('img'))
          .filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.src);
        const buttons = Array.from(document.querySelectorAll('button')).length;
        const textLen = document.body.innerText.length;

        return {
          title,
          heading: h1 || h2,
          scrollWidth,
          clientWidth,
          hasOverflow,
          brokenImages,
          buttons,
          textLen,
        };
      })()`)

      if (pageState.hasOverflow) {
        const msg = `[OVERFLOW] ${page.id} on ${vp.name}: scrollWidth=${pageState.scrollWidth} > clientWidth=${pageState.clientWidth}`
        console.error(msg)
        issuesFound.push(msg)
      }

      if (pageState.brokenImages.length > 0) {
        const msg = `[BROKEN IMAGE] ${page.id} on ${vp.name}: ${pageState.brokenImages.join(', ')}`
        console.error(msg)
        issuesFound.push(msg)
      }

      if (pageState.textLen < 80) {
        const msg = `[EMPTY/BLANK] ${page.id} on ${vp.name}: body text length is only ${pageState.textLen}`
        console.error(msg)
        issuesFound.push(msg)
      }

      if (vp.name === 'Desktop-1920') {
        console.log(`  Heading: "${pageState.heading}" | Text length: ${pageState.textLen} | Buttons: ${pageState.buttons}`)
      }
    }
  }

  console.log('\n--- 4. Checking Console Errors ---')
  if (cdp.consoleErrors.length > 0) {
    console.error('Console errors detected:', cdp.consoleErrors)
    issuesFound.push(...cdp.consoleErrors.map((e) => `[CONSOLE ERROR] ${e}`))
  } else {
    console.log('Zero console errors detected across all 11 pages and 4 viewports!')
  }

  console.log('\n--- 5. Audit Results Summary ---')
  if (issuesFound.length === 0) {
    console.log('ALL 11 PAGES PASSED AUDIT WITH 0 ISSUES!')
  } else {
    console.log(`Found ${issuesFound.length} issues:`)
    issuesFound.forEach((iss) => console.log(' - ' + iss))
  }

  cdp.close()
  chrome.kill()
  preview.kill()
  process.exit(issuesFound.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
