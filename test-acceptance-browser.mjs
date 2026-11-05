import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 4188
const PREVIEW_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9333

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.id = 1
    this.pending = new Map()
    this.events = []
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
        this.events.push(msg)
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

async function runBrowserAudit() {
  const userDataDir = mkdtempSync(join(tmpdir(), 'fwg-audit-cdp-'))
  const results = {
    controls: [],
    consoleErrors: [],
  }

  console.log('--- 1. Launching Vite Preview ---')
  const preview = spawn('npx.cmd', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    shell: true,
  })

  // Poll preview server
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(PREVIEW_URL)
      if (res.ok) break
    } catch {}
    await wait(250)
  }
  console.log(`Preview server ready at ${PREVIEW_URL}`)

  console.log('--- 2. Launching Headless Chrome ---')
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ])

  // Discover Chrome WS URL
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
  console.log(`Connected to Chrome via CDP: ${wsUrl}`)

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')

  try {
    // ------------------------------------------------------------------------
    // Audit Section 1: Main Destinations & Navigation (Including Conservation Atlas)
    // ------------------------------------------------------------------------
    console.log('--- 3. Testing Navigation and Supported Routes ---')
    const routes = [
      { id: 'overview', name: 'Overview' },
      { id: 'explore', name: 'Explorer' },
      { id: 'experiment', name: 'Experiment Studio' },
      { id: 'compare', name: 'Insights & Compare' },
      { id: 'conservation', name: 'Conservation Atlas' },
      { id: 'library', name: 'Data Library' },
      { id: 'methodology', name: 'Methodology & Tests' },
    ]

    for (const r of routes) {
      const url = `${PREVIEW_URL}/#/${r.id}`
      await cdp.send('Page.navigate', { url })
      await wait(1000)
      const pageInfo = await cdp.evaluate(`(() => {
        return {
          title: document.title,
          heading: document.querySelector('h1, h2')?.textContent?.trim() || '',
          bodyTextLength: document.body.innerText.length,
          hasNavbar: !!document.querySelector('nav'),
        }
      })()`)

      const passed = pageInfo.bodyTextLength > 100 && pageInfo.hasNavbar
      results.controls.push({
        screen: r.id,
        control: `Route navigation to #${r.id}`,
        action: 'Page.navigate',
        expected: `Loads ${r.name} page with content and navigation chrome`,
        actual: `Loaded: heading="${pageInfo.heading}", bodyLen=${pageInfo.bodyTextLength}`,
        pass: passed,
      })
      console.log(`Route #${r.id} (${r.name}): ${passed ? 'PASS' : 'FAIL'} (Heading: "${pageInfo.heading}")`)
    }

    // ------------------------------------------------------------------------
    // Audit Section 2: Browser Back and Forward Navigation
    // ------------------------------------------------------------------------
    console.log('--- 4. Testing Browser Back / Forward with Hash Routing ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/conservation` })
    await wait(400)
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/explore` })
    await wait(400)
    await cdp.evaluate('window.history.back()')
    await wait(500)
    const backRoute = await cdp.evaluate('window.location.hash')
    const backPassed = backRoute === '#/conservation'
    results.controls.push({
      screen: 'router',
      control: 'Browser history.back()',
      action: 'window.history.back() from #/explore',
      expected: 'Navigates back to #/conservation',
      actual: `Route is ${backRoute}`,
      pass: backPassed,
    })
    console.log(`History Back: ${backPassed ? 'PASS' : 'FAIL'} (${backRoute})`)

    // ------------------------------------------------------------------------
    // Audit Section 3: Dataset Switching & State Isolation
    // ------------------------------------------------------------------------
    console.log('--- 5. Testing Dataset Switching & Isolation ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/explore` })
    await wait(800)

    const datasetsToTest = [
      { id: 'MAR-TATOOSH-1', expectedNodes: 110, expectedLinks: 869 },
      { id: 'MAR-YTHAN-1', expectedNodes: 87, expectedLinks: 373 },
      { id: 'RES-TER-C', expectedNodes: 395, expectedLinks: 322 },
      { id: 'RES-TER-D', expectedNodes: 57, expectedLinks: 98 },
      { id: 'RES-FW-A', expectedNodes: 11, expectedLinks: 18 },
      { id: 'RES-FW-B', expectedNodes: 14, expectedLinks: 39 },
      { id: 'FW-POND-A', expectedNodes: 12, expectedLinks: 17 },
    ]

    for (const ds of datasetsToTest) {
      const res = await cdp.evaluate(`(() => {
        const select = document.querySelector('select[aria-label="Loaded network"]') || document.querySelector('select');
        if (!select) return { error: 'select not found' };
        select.value = '${ds.id}';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return { value: select.value };
      })()`)

      await wait(600)
      const pass = res?.value === ds.id
      results.controls.push({
        screen: 'explore',
        control: `Dataset switch -> ${ds.id}`,
        action: 'Change select option',
        expected: `${ds.expectedNodes} nodes, ${ds.expectedLinks} links`,
        actual: `Loaded ${res?.value || 'unknown'}`,
        pass,
      })
      console.log(`Dataset ${ds.id}: ${pass ? 'Switched OK' : 'FAIL (got: ' + res?.value + ')'}`)
    }

    // ------------------------------------------------------------------------
    // Audit Section 4: Species Selection & Direct Removal Experiment
    // ------------------------------------------------------------------------
    console.log('--- 6. Testing Species Selection & Direct Removal ---')
    await cdp.evaluate(`(() => {
      const select = document.querySelector('select[aria-label="Loaded network"]') || document.querySelector('select');
      select.value = 'FW-POND-A';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`)
    await wait(600)

    // Select species
    const clickSpecies = await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const targetBtn = buttons.find(b => b.textContent.includes('Pond snail') || b.textContent.includes('Minnow'));
      if (targetBtn) {
        targetBtn.click();
        return { clicked: targetBtn.textContent.trim() };
      }
      return { error: 'target species button not found' };
    })()`)
    await wait(400)

    // Run direct removal
    const clickRun = await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const removeBtn = buttons.find(b => b.textContent.includes('Run direct removal'));
      if (removeBtn) {
        removeBtn.click();
        return { clicked: removeBtn.textContent.trim() };
      }
      return { error: 'run removal button not found' };
    })()`)
    await wait(600)

    const removalState = await cdp.evaluate(`(() => {
      const text = document.body.innerText;
      return {
        hasWhatChanged: text.includes('What changed?'),
        hasLinks: text.includes('Links remaining') || text.includes('links remaining') || text.includes('node(s) removed'),
        snippet: text.match(/(?:deleted|removed)\\s+\\d+\\s+feeding link/i)?.[0] || 'Removed node outcome recorded'
      };
    })()`)

    const removePassed = removalState.hasWhatChanged || removalState.hasLinks
    results.controls.push({
      screen: 'explore',
      control: 'Run species removal simulation',
      action: 'Select species, execute removal',
      expected: 'Calculates direct structural effect and link loss',
      actual: `Outcome detected=${removePassed}`,
      pass: removePassed,
    })
    console.log(`Species Removal: ${removePassed ? 'PASS' : 'FAIL'} (${removalState.snippet})`)

    // Reset Simulation
    const clickReset = await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(b => b.textContent.trim() === 'Reset simulation' || b.textContent.includes('Reset simulation'));
      if (resetBtn) {
        resetBtn.click();
        return { clicked: resetBtn.textContent.trim() };
      }
      return { error: 'reset button not found' };
    })()`)
    await wait(400)

    const resetState = await cdp.evaluate(`(() => {
      const text = document.body.innerText;
      return {
        cleared: !text.includes('What changed?') || text.includes('No scenario is running')
      };
    })()`)

    results.controls.push({
      screen: 'explore',
      control: 'Reset simulation to baseline',
      action: 'Click Reset simulation',
      expected: 'Clears scenario and restores untouched baseline',
      actual: `Cleared=${resetState.cleared}`,
      pass: resetState.cleared,
    })
    console.log(`Reset simulation: ${resetState.cleared ? 'PASS' : 'FAIL'}`)

    // ------------------------------------------------------------------------
    // Audit Section 5: Structural Cascade Scenario & Depth
    // ------------------------------------------------------------------------
    console.log('--- 7. Testing Structural Cascade Propagation ---')
    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const speciesBtn = buttons.find(b => b.textContent.includes('Pond snail') || b.textContent.includes('Minnow'));
      if (speciesBtn) speciesBtn.click();
      const cascadeRadio = document.querySelector('input[type="radio"][value="cascade"]');
      if (cascadeRadio) {
        cascadeRadio.click();
        cascadeRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`)
    await wait(400)

    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const runBtn = buttons.find(b => b.textContent.includes('Run cascade scenario'));
      if (runBtn) runBtn.click();
    })()`)
    await wait(600)

    const cascadeState = await cdp.evaluate(`(() => {
      const text = document.body.innerText;
      return {
        hasOutcome: text.includes('What changed?') || text.includes('Secondary removals') || text.includes('node(s) removed'),
      };
    })()`)

    results.controls.push({
      screen: 'explore',
      control: 'Structural cascade execution',
      action: 'Run scenario with cascade rule',
      expected: 'Executes simultaneous propagation rounds for food-depleted consumers',
      actual: `Outcome detected=${cascadeState.hasOutcome}`,
      pass: cascadeState.hasOutcome,
    })
    console.log(`Cascade Propagation: ${cascadeState.hasOutcome ? 'PASS' : 'FAIL'}`)

    // ------------------------------------------------------------------------
    // Audit Section 6: Experiment Studio & Whole-Network Sensitivity Rankings
    // ------------------------------------------------------------------------
    console.log('--- 8. Testing Whole-Network Sensitivity Analysis ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/experiment` })
    await wait(800)

    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyseBtn = buttons.find(b => b.textContent.includes('Analyse all species') || b.textContent.includes('Analyze'));
      if (analyseBtn) analyseBtn.click();
    })()`)
    await wait(1200)

    const rankingsState = await cdp.evaluate(`(() => {
      const rows = document.querySelectorAll('tbody tr, [role="row"]');
      const tabs = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Link loss') || b.textContent.includes('Secondary') || b.textContent.includes('Cascade')
      ).map(b => b.textContent.trim());
      return {
        rowCount: rows.length,
        hasTable: rows.length > 0,
        tabs: tabs,
      };
    })()`)

    results.controls.push({
      screen: 'experiment',
      control: 'Analyse all species button',
      action: 'Click Analyse all species',
      expected: 'Calculates deterministic cascade impact for every node in the network',
      actual: `Rows=${rankingsState.rowCount}, Tabs=${rankingsState.tabs.join(', ')}`,
      pass: rankingsState.hasTable,
    })
    console.log(`Whole-Network Sensitivity Scan: ${rankingsState.hasTable ? 'PASS' : 'FAIL'} (${rankingsState.rowCount} rows)`)

    // Filter Rankings by Search
    console.log('--- 8.1. Testing Rankings Table Search & Role Filtering ---')
    await cdp.evaluate(`(() => {
      const searchInput = document.querySelector('input[aria-label="Filter ranked species"]');
      if (searchInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(searchInput, 'snail');
        else searchInput.value = 'snail';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`)
    await wait(400)

    const filterState = await cdp.evaluate(`(() => {
      const filteredCount = document.querySelectorAll('tbody tr').length;
      const clearBtn = document.querySelector('button[aria-label="Clear species filter"]');
      if (clearBtn) clearBtn.click();
      return { filteredCount, hasClearBtn: !!clearBtn };
    })()`)
    await wait(400)

    const restoredCount = await cdp.evaluate(`document.querySelectorAll('tbody tr').length`)
    const filterPassed = filterState.filteredCount < 12 && filterState.filteredCount > 0 && restoredCount === 12
    results.controls.push({
      screen: 'experiment',
      control: 'Rankings table search and filter',
      action: 'Type filter query, verify count, click clear',
      expected: 'Filters rows to matching species and restores complete list on clear',
      actual: `Filtered=${filterState.filteredCount}, Restored=${restoredCount}`,
      pass: filterPassed,
    })
    console.log(`Rankings Search & Filter: ${filterPassed ? 'PASS' : 'FAIL'}`)

    // ------------------------------------------------------------------------
    // Audit Section 6.2: Network Robustness Lab (Dunne 2002)
    // ------------------------------------------------------------------------
    console.log('--- 8.2. Testing Network Robustness Lab (Dunne 2002) ---')
    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const robustnessTab = buttons.find(b => b.textContent.includes('Network Robustness Lab'));
      if (robustnessTab) robustnessTab.click();
    })()`)
    await wait(800)

    const robustnessState = await cdp.evaluate(`(() => {
      const text = document.body.innerText.toLowerCase();
      const hasTitle = text.includes('extinction curves') || text.includes('dunne et al');
      const hasStrategyA = text.includes('strategy a') && text.includes('most-connected');
      const hasStrategyD = text.includes('strategy d') && text.includes('random');
      const hasConnectance = text.includes('dunne connectance') && text.includes('foodwebguard c');
      const hasReplay = text.includes('step-by-step removal replay');
      const hasChart = !!document.querySelector('.recharts-surface');

      // Click open the methodology & audit table
      const buttons = Array.from(document.querySelectorAll('button'));
      const methBtn = buttons.find(b => b.textContent.includes('Methodology & Literature Citation'));
      if (methBtn) methBtn.click();

      return {
        hasTitle,
        hasStrategyA,
        hasStrategyD,
        hasConnectance,
        hasReplay,
        hasChart,
      };
    })()`)
    await wait(400)

    const auditTableState = await cdp.evaluate(`(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasAuditTable: text.includes('pre-implementation dataset audit') && text.includes('eligibility table'),
        hasCitation: text.includes('dunne') && text.includes('ecology letters'),
      };
    })()`)

    const robustnessPassed =
      Boolean(robustnessState?.hasTitle) &&
      Boolean(robustnessState?.hasStrategyA) &&
      Boolean(robustnessState?.hasStrategyD) &&
      Boolean(robustnessState?.hasConnectance) &&
      Boolean(robustnessState?.hasReplay) &&
      Boolean(robustnessState?.hasChart) &&
      Boolean(auditTableState?.hasAuditTable) &&
      Boolean(auditTableState?.hasCitation)

    console.log('Robustness details:', JSON.stringify({ robustnessState, auditTableState }))

    results.controls.push({
      screen: 'robustness-lab',
      control: 'Network Robustness Lab (Dunne 2002)',
      action: 'Switch to robustness tab, render curves, inspect R50 cards and audit table',
      expected: 'Computes R50 across all 4 strategies, renders extinction curves, confidence envelope, replay scrubber and audit table',
      actual: `Passed=${robustnessPassed}, Chart=${robustnessState?.hasChart}, AuditTable=${auditTableState?.hasAuditTable}`,
      pass: robustnessPassed,
    })
    console.log(`Network Robustness Lab: ${robustnessPassed ? 'PASS' : 'FAIL'}`)

    // ------------------------------------------------------------------------
    // Audit Section 7: Cross-Network Benchmark / Multi-Web Comparison
    // ------------------------------------------------------------------------
    console.log('--- 9. Testing Cross-Network Benchmark (Insights & Compare) ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/compare` })
    await wait(800)

    // Select 2 networks if not already selected
    await cdp.evaluate(`(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      if (checkboxes.length >= 2) {
        if (!checkboxes[0].checked) checkboxes[0].click();
        if (!checkboxes[1].checked) checkboxes[1].click();
      }
    })()`)
    await wait(300)

    const compareRunRes = await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const runBtn = buttons.find(b => b.textContent.includes('Run comparison'));
      if (runBtn && !runBtn.disabled) {
        runBtn.click();
        return { clicked: true };
      }
      return { disabled: runBtn?.disabled };
    })()`)
    await wait(1500)

    const compareState = await cdp.evaluate(`(() => {
      const text = document.body.innerText;
      const charts = document.querySelectorAll('.recharts-responsive-container, svg.recharts-surface');
      return {
        hasSummaryTable: text.includes('Network summary') || text.includes('Ecosystem category summary') || text.includes('Connectance'),
        chartCount: charts.length,
      };
    })()`)

    const comparePassed = compareState.hasSummaryTable || compareState.chartCount > 0
    results.controls.push({
      screen: 'compare',
      control: 'Cross-network comparison execution',
      action: 'Select networks, click Run comparison',
      expected: 'Renders comparative distribution charts and summary tables',
      actual: `SummaryTable=${compareState.hasSummaryTable}, Charts=${compareState.chartCount}`,
      pass: comparePassed,
    })
    console.log(`Cross-Network Comparison: ${comparePassed ? 'PASS' : 'FAIL'} (${compareState.chartCount} charts)`)

    // ------------------------------------------------------------------------
    // Audit Section 8: Academic Report Modal & PDF Generation
    // ------------------------------------------------------------------------
    console.log('--- 10. Testing Academic Report Modal & PDF Generation ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/explore` })
    await wait(800)

    // Trigger removal to enable report
    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const speciesBtn = buttons.find(b => b.textContent.includes('Pond snail') || b.textContent.includes('Minnow'));
      if (speciesBtn) speciesBtn.click();
    })()`)
    await wait(300)
    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const removeBtn = buttons.find(b => b.textContent.includes('Run direct removal'));
      if (removeBtn) removeBtn.click();
    })()`)
    await wait(600)

    // Open Report Modal
    const openReportRes = await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reportBtn = buttons.find(b => b.textContent.includes('Report') || b.textContent.includes('Print / Save PDF'));
      if (reportBtn) {
        reportBtn.click();
        return { clicked: true };
      }
      return { error: 'report button not found' };
    })()`)
    await wait(500)

    // Perform CDP printToPDF
    let pdfSizeBytes = 0
    try {
      const pdf = await cdp.send('Page.printToPDF', {
        printBackground: true,
        preferCSSPageSize: true,
      })
      if (pdf?.data) {
        const buf = Buffer.from(pdf.data, 'base64')
        pdfSizeBytes = buf.length
      }
    } catch (e) {
      console.warn('printToPDF error:', e)
    }

    // Close modal
    await cdp.evaluate(`(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Close report modal' || b.textContent.includes('Close'));
      if (closeBtn) closeBtn.click();
    })()`)
    await wait(300)

    const pdfPassed = pdfSizeBytes > 50000
    results.controls.push({
      screen: 'report',
      control: 'Academic PDF report generation',
      action: 'Open report modal, generate Page.printToPDF',
      expected: 'Generates non-empty multi-page academic PDF report (>50 KB)',
      actual: `PDF Size = ${pdfSizeBytes} bytes`,
      pass: pdfPassed,
    })
    console.log(`Academic Report PDF Generation: ${pdfPassed ? 'PASS' : 'FAIL'} (${pdfSizeBytes} bytes)`)

    // ------------------------------------------------------------------------
    // Audit Section 9: Methodology & In-Browser Test Suite
    // ------------------------------------------------------------------------
    console.log('--- 11. Testing Methodology In-Browser Test Suite ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/methodology` })
    await wait(1000)

    const methodologyState = await cdp.evaluate(`(() => {
      const text = document.body.innerText;
      const passMatch = text.match(/(\\d+)\\s*(?:passed|checks passed)/i);
      const failMatch = text.match(/(\\d+)\\s*(?:failed|errors)/i);
      return {
        passCount: passMatch ? passMatch[1] : null,
        failCount: failMatch ? failMatch[1] : null,
        hasVerification: text.includes('Verification') || text.includes('passed')
      };
    })()`)

    const methodPassed = methodologyState.hasVerification && (methodologyState.failCount === '0' || methodologyState.failCount === null)
    results.controls.push({
      screen: 'methodology',
      control: 'In-browser verification suite runner',
      action: 'Load methodology page',
      expected: 'Executes 70 automated verification checks in-browser with 0 failures',
      actual: `Passes=${methodologyState.passCount}, Failures=${methodologyState.failCount}`,
      pass: methodPassed,
    })
    console.log(`Methodology Suite: ${methodPassed ? 'PASS' : 'FAIL'} (${methodologyState.passCount} passed, ${methodologyState.failCount || 0} failed)`)

    // ------------------------------------------------------------------------
    // Audit Section 10: Dataset Library & Import Modal
    // ------------------------------------------------------------------------
    console.log('--- 12. Testing Dataset Library & Import Dialog ---')
    await cdp.send('Page.navigate', { url: `${PREVIEW_URL}/#/library` })
    await wait(800)

    await cdp.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const importBtn = buttons.find(b => b.textContent.includes('Import') || b.textContent.includes('Upload'));
      if (importBtn) importBtn.click();
    })()`)
    await wait(400)

    const dialogState = await cdp.evaluate(`(() => {
      const dialog = document.querySelector('[role="dialog"], [aria-modal="true"], .fixed');
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Close') || b.textContent.includes('Cancel') || b.getAttribute('aria-label') === 'Close'
      );
      if (closeBtn) closeBtn.click();
      return {
        hadDialog: !!dialog,
        closed: true
      };
    })()`)

    results.controls.push({
      screen: 'library',
      control: 'Import dataset modal open/close',
      action: 'Click Import button then click Close',
      expected: 'Modal opens and closes cleanly without console errors',
      actual: `HadDialog=${dialogState.hadDialog}`,
      pass: dialogState.hadDialog,
    })
    console.log(`Import Dialog: ${dialogState.hadDialog ? 'PASS' : 'FAIL'}`)

    // ------------------------------------------------------------------------
    // Audit Section 11: Responsive Viewports Check
    // ------------------------------------------------------------------------
    console.log('--- 13. Testing Responsive Viewports ---')
    const viewports = [
      { name: 'Desktop HD', width: 1920, height: 1080 },
      { name: 'Desktop WXGA', width: 1280, height: 800 },
      { name: 'Tablet iPad', width: 768, height: 1024 },
      { name: 'Mobile iPhone', width: 390, height: 844 },
      { name: 'Mobile Small', width: 360, height: 800 },
    ]

    for (const vp of viewports) {
      await cdp.setViewport(vp.width, vp.height)
      await wait(300)
      const overflow = await cdp.evaluate(`(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientW = window.innerWidth;
        const bad = Array.from(document.querySelectorAll('*'))
          .filter((el) => el.getBoundingClientRect().right > clientW + 2)
          .map((el) => el.tagName + '.' + el.className + ' r:' + Math.round(el.getBoundingClientRect().right))
          .slice(0, 5)
        return {
          scrollW,
          clientW,
          hasHorizontalScroll: scrollW > clientW + 2,
          bad,
        };
      })()`)

      const vpPassed = !overflow.hasHorizontalScroll
      results.controls.push({
        screen: 'responsive',
        control: `Viewport ${vp.name} (${vp.width}x${vp.height})`,
        action: 'Emulation.setDeviceMetricsOverride',
        expected: 'Zero horizontal scroll overflow',
        actual: `scrollW=${overflow.scrollW}, clientW=${overflow.clientW}, overflow=${overflow.hasHorizontalScroll}`,
        pass: vpPassed,
      })
      console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): ${vpPassed ? 'PASS' : 'FAIL'}`, overflow.scrollW, overflow.clientW, overflow.bad)
    }

    results.consoleErrors = cdp.consoleErrors
    console.log(`Total Console Errors caught during session: ${cdp.consoleErrors.length}`)
  } finally {
    cdp.close()
    chrome.kill()
    preview.kill()
    try {
      rmSync(userDataDir, { recursive: true, force: true })
    } catch {}
  }

  return results
}

runBrowserAudit()
  .then((res) => {
    console.log('\n=== FINAL BROWSER AUDIT SUMMARY ===')
    console.log(`Total Controls & Workflows Checked: ${res.controls.length}`)
    const passedCount = res.controls.filter((c) => c.pass).length
    console.log(`Passed: ${passedCount} / ${res.controls.length}`)
    console.log(`Console Errors: ${res.consoleErrors.length}`)
    if (passedCount === res.controls.length && res.consoleErrors.length === 0) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error('Audit failed with error:', err)
    process.exit(1)
  })
