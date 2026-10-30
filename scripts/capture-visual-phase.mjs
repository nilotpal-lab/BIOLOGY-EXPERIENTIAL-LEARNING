import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PORT = 4195
const PREVIEW_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9338

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const pageArg = process.argv[2] || 'landing-page'
const hashArg = process.argv[3] || '#overview'

async function capture() {
  const targetDir = join(process.cwd(), 'qa', 'visual', pageArg)
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })

  console.log(`Starting preview server on port ${PORT}...`)
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

  console.log('Starting headless Chrome...')
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    '--user-data-dir=C:\\Users\\nilot\\AppData\\Local\\Temp\\chrome-visual-phase',
    'about:blank',
  ])

  let wsUrl = null
  for (let i = 0; i < 30; i++) {
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
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data)
        if (msg.id === id) {
          ws.removeEventListener('message', handler)
          if (msg.error) reject(msg.error)
          else resolve(msg.result)
        }
      }
      ws.addEventListener('message', handler)
      ws.send(JSON.stringify({ id, method, params }))
    })
  }

  await send('Page.enable')

  // 1. Desktop 1440x900 (100% zoom)
  console.log(`Capturing Desktop 1440x900 at 100% zoom for ${hashArg}...`)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: `${PREVIEW_URL}/${hashArg}` })
  await wait(2000)

  const desktopShot = await send('Page.captureScreenshot', { format: 'png' })
  if (desktopShot?.data) {
    const p = join(targetDir, 'implementation-100-percent.png')
    writeFileSync(p, Buffer.from(desktopShot.data, 'base64'))
    console.log(`Saved: ${p}`)
  }

  // 2. Mobile 390x844
  console.log(`Capturing Mobile 390x844 for ${hashArg}...`)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send('Page.navigate', { url: `${PREVIEW_URL}/${hashArg}` })
  await wait(2000)

  const mobileShot = await send('Page.captureScreenshot', { format: 'png' })
  if (mobileShot?.data) {
    const p = join(targetDir, 'implementation-mobile.png')
    writeFileSync(p, Buffer.from(mobileShot.data, 'base64'))
    console.log(`Saved: ${p}`)
  }

  ws.close()
  chrome.kill()
  preview.kill()
  console.log('Capture complete.')
}

capture().catch((e) => {
  console.error('Error during capture:', e)
  process.exit(1)
})
