# QA First-User Walkthrough — Persona: "impatient"

- App: https://foodwebguard.vercel.app/
- Date: 2026-11-03
- Browser: ZCode in-app browser, viewport 1366x850
- Environment prep: `localStorage.clear()` + reload done before walkthrough. "Environment preparation is complete."

---

## 1. Walkthrough narrative (expected vs happened)

### Step 1 — Landing page (01-homepage.webp)
- **Expected:** a hero, a green "Open Explorer" button (the page even tells me: "New here? Start with the green Open Explorer button — then try the Simulation Lab"). Good — the app tells me where to click. Zero reading needed beyond one line.
- **Happened:** Page loaded clean, big illustration, stats (6 ecosystems, 200+ species). Two "Open Explorer" buttons on the page (hero + bottom CTA) — fine.
- **Action:** clicked the hero "Open Explorer" button.

### Step 2 — Open Explorer click, first attempt FAILED
- **Quote:** "It's a big green button, why is nothing happening?"
- Playwright locator click on "Open Explorer" timed out (page busy / unresponsive to the synthetic click). Retried once with a direct coordinate click — **worked**, URL changed to `#/explore`.
- Screenshot: 02-explorer-loaded.webp

### Step 3 — Explorer view loads a dataset automatically (02-explorer-loaded.webp)
- **Expected:** I'd have to hunt for a dataset picker first. 
- **Happened (pleasant surprise):** a built-in dataset "FW-POND-A · Temperate pond" (12 nodes, 17 links) was ALREADY loaded and drawn as a trophic graph. Inspector on the right already showed "Pond algae" selected. This is exactly what an impatient user wants — the demo is one click deep.
- **Friction:** my scripted click on "Heron" in the (hidden) species-list panel timed out — the list panel exists in the DOM but is not visibly open, so clicking DOM items blind fails.
- **Workaround:** clicked the Heron node directly on the graph with coordinates — **worked**, inspector switched to Heron ("Selected species: Heron — Simulation will start from this node"). Note: clicking the node also zoomed the canvas from 93% to ~110%.

### Step 4 — Run the removal (03-heron-selected-sim-panel.webp)
- **Quote:** "Heron's the top bird, let's delete it. Run direct removal — green button, go."
- **Expected:** press "Run direct removal", get numbers.
- **Happened:** The simulation panel in the right inspector had mode radios ("Direct removal" pre-checked) and the green "Run direct removal" button. Clicked it — **worked immediately**. "Reset simulation" became enabled and a "1 removed" chip appeared, plus export buttons (Academic PDF Report, CSVs, JSON).
- **Friction:** the metrics/summary section appeared BELOW the fold in the inspector, behind export buttons and long paragraphs. Scrolling that panel with synthetic scroll timed out twice (30s each) and stopped moving. Impatient me gave up on scrolling the Explore inspector.

### Step 5 — Find the results in the Simulation tab instead (07-simulation-lab-results.webp)
- **Quote:** "Forget scrolling — sidebar says 'Simulation'. That sounds like where results live."
- **Expected:** maybe I'd have to re-select species and re-run.
- **Happened:** the Simulation Laboratory page (URL `#/simulation`) REMEMBERED Heron as the selected species and the run state. "Simulation Results — Heron Removed" panel was visible immediately with: Species Removed 1 (Direct), Links Lost 2 out of 17 (11.8%), Secondary Removals 0, Total Removed 1 of 12, Affected Species tabs (Direct Effects 0 / Cascade Effects 0), and a Cascade Timeline (Round 1: Heron removed, Round 3: Stabilized state, 1 total removed). A full "Scenario Results Summary" with ~10 metric tiles and a "What changed?" narrative was also present in the DOM (06 screenshot attempt captured the export section at 05-results-metrics-scrolled.webp).

### FIRST SUCCESS
Loaded built-in dataset (FW-POND-A), selected a species (Heron), ran a removal scenario, and saw simulation results/metrics — reached via Explorer "Run direct removal" + Simulation Lab results panel.

---

## 2. Friction log

| # | Quote (user voice) | URL | Severity | What happened |
|---|---|---|---|---|
| 1 | "Big green button, why is nothing happening?" | https://foodwebguard.vercel.app/ | 2 minor | First click on hero "Open Explorer" did not register (timeout); needed a retry via raw coordinates. Real users tapping once and seeing nothing would wonder if the site is frozen. |
| 2 | "Which Heron do I click? The list is invisible but it's there." | https://foodwebguard.vercel.app/#/explore | 2 minor | Species-list panel items exist in DOM but panel is not visibly open; clicking them fails/times out. Only clicking nodes on the graph worked. |
| 3 | "I clicked the bird and the map moved — I didn't ask for zoom." | https://foodwebguard.vercel.app/#/explore | 1 cosmetic | Clicking a graph node to select it also changed canvas zoom (93% -> ~110%), view shifted. |
| 4 | "Walls of text before the one button I need." | https://foodwebguard.vercel.app/#/explore | 1 cosmetic | Simulation mode radios carry multi-sentence legal-style descriptions; the run button sits below long text. |
| 5 | "I ran it — where are the numbers? Just export buttons." | https://foodwebguard.vercel.app/#/explore | 2 minor | After running, the results summary is below the fold in the right inspector, behind 6 export buttons and a long paragraph; scrolling that panel with mouse-wheel scroll timed out and did not always respond. I gave up and found results in the "Simulation" sidebar tab instead. |
| 6 | "It says Heron status: 'present' — didn't I just remove it?" | https://foodwebguard.vercel.app/#/explore | 2 minor | After the removal ran ("1 removed" chip visible), the graph tooltip/status still showed "Heron … Status: present". Probably baseline info, but confusing right after a removal. |
| 7 | "Scroll is broken or super slow on this panel." | https://foodwebguard.vercel.app/#/explore | 2 minor | Synthetic wheel scroll over the right inspector panel timed out (30 s) twice and stopped applying; had to switch navigation paths to see results. |

No blockers, no majors, no spinners, no blank areas, no visible error text encountered. No console/network capture available in this runtime (not faked); observations are from visible page state only.

---

## 3. Verdict

reached first success: yes
actions taken: 10
