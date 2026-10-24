import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PORT = 4192
const PREVIEW_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9335
const ARTIFACT_DIR = 'C:\\Users\\nilot\\.gemini\\antigravity\\brain\\74b87be0-e31c-4754-9c89-66d229b1a545'

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function capture() {
  const localOutDir = join(process.cwd(), 'screenshots')
  const artifactOutDir = join(ARTIFACT_DIR, 'screenshots')
  if (!existsSync(localOutDir)) mkdirSync(localOutDir, { recursive: true })
  if (!existsSync(artifactOutDir)) mkdirSync(artifactOutDir, { recursive: true })

  console.log('Starting preview server...')
  const preview = spawn('npx.cmd', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    shell: true,
  })

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(PREVIEW_URL)
      if (res.ok) break
    } catch {}
    await wait(250)
  }

  console.log('Starting Chrome...')
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    '--user-data-dir=C:\\Users\\nilot\\AppData\\Local\\Temp\\chrome-shots-audit',
    'about:blank',
  ])

  let wsUrl = null
  for (let i = 0; i < 20; i++) {
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

  if (!wsUrl) throw new Error('Could not connect to Chrome CDP')

  const ws = new WebSocket(wsUrl)
  await new Promise((resolve) => {
    ws.onopen = resolve
  })

  let msgId = 1
  function send(method, params = {}) {
    const id = msgId++
    return new Promise((resolve) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data)
        if (msg.id === id) {
          ws.removeEventListener('message', handler)
          resolve(msg.result)
        }
      }
      ws.addEventListener('message', handler)
      ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    return res?.result?.value
  }

  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  function saveShot(fileName, base64Data) {
    const buf = Buffer.from(base64Data, 'base64')
    writeFileSync(join(localOutDir, fileName), buf)
    writeFileSync(join(artifactOutDir, fileName), buf)
    console.log(`Saved screenshot: ${fileName}`)
  }

  const pages = [
    { name: '01_overview.png', hash: '#/overview' },
    { name: '02_explorer.png', hash: '#/explore' },
    { name: '03_experiment_studio_systematic.png', hash: '#/experiment' },
    { name: '05_insights_compare.png', hash: '#/compare' },
    { name: '06_conservation_atlas.png', hash: '#/conservation' },
    { name: '07_data_library.png', hash: '#/library' },
    { name: '08_methodology.png', hash: '#/methodology' },
  ]

  for (const p of pages) {
    console.log(`Navigating to ${p.hash}...`)
    await send('Page.navigate', { url: `${PREVIEW_URL}/${p.hash}` })
    await wait(1800)
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    if (shot?.data) saveShot(p.name, shot.data)
  }

  // Interactive removal studio tab on Experiment Studio
  console.log('Capturing Experiment Studio - Interactive Removal Studio tab...')
  await send('Page.navigate', { url: `${PREVIEW_URL}/#/experiment` })
  await wait(1200)
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Interactive Removal Studio'));
    if (btn) btn.click();
  })()`)
  await wait(1500)
  const interactiveShot = await send('Page.captureScreenshot', { format: 'png' })
  if (interactiveShot?.data) saveShot('04_experiment_studio_interactive.png', interactiveShot.data)

  // Presentation mode in Explorer
  console.log('Capturing Explorer - Presentation Mode...')
  await send('Page.navigate', { url: `${PREVIEW_URL}/#/explore` })
  await wait(1200)
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Presentation view'));
    if (btn) btn.click();
  })()`)
  await wait(1500)
  const presShot = await send('Page.captureScreenshot', { format: 'png' })
  if (presShot?.data) saveShot('09_presentation_mode.png', presShot.data)

  // Mobile viewport
  console.log('Capturing Mobile Explorer (390x844)...')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send('Page.navigate', { url: `${PREVIEW_URL}/#/explore` })
  await wait(1500)
  const mobileShot = await send('Page.captureScreenshot', { format: 'png' })
  if (mobileShot?.data) saveShot('10_mobile_explorer.png', mobileShot.data)

  ws.close()
  chrome.kill()
  preview.kill()
}

capture()
  .then(() => {
    console.log('All screenshots captured successfully.')
    process.exit(0)
  })
  .catch((e) => {
    console.error('Error in capture:', e)
    process.exit(1)
  })
