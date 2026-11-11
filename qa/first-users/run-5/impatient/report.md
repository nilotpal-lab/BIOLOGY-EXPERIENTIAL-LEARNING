# QA First-User Walkthrough — Persona: "impatient"

- App: https://foodwebguard.vercel.app/
- Browser: 1366x850, fresh profile, localStorage cleared before walkthrough
- Console/network capture: NOT available in this runtime (not faked)

## 1. Walkthrough narrative

**Step 1 — Landing page (01-landing.webp)**
Expected: a hero page, and as an impatient user I assume the main action is the big green button. Happened: exactly that — "Explore. Simulate. Understand Ecosystems." with a prominent green **Open Explorer →** button and a hint line "Start with the green Open Explorer button — then try the Simulation Lab." No wall of text in the way; the four feature cards below are skimmable. Clicked **Open Explorer** immediately. No friction.

**Step 2 — Explorer (02-explorer.webp)**
Expected: possibly a dataset-picker or a loading spinner before I can see anything. Happened: the Explorer opened instantly with a built-in dataset already loaded (**FW-POND-A · Temperate pond, Freshwater (UK)** — shown top-right), a trophic food-web graph with illustrated nodes, and a species inspector ("Pond algae") on the right. A dataset was already active, so my "load a dataset" goal was satisfied with zero clicks. Pleasant surprise; no friction.

**Step 3 — Simulation page (03-simulation.webp)**
Expected: a "remove species" control somewhere obvious. Happened: clicked **Simulation** in the left workspace sidebar and the Simulation Laboratory loaded in one step. "1. SELECT SIMULATION MODE" (Direct Removal pre-selected), "2. SELECT A SPECIES" with a dropdown that already had **Backswimmer** chosen, and a "Simulation Results" panel on the right showing a labelled *example preview*. The viewport screenshot after clicking Run is 04.

**Step 4 — Finding the Run button (04-simulation-scrolled.webp)**
Expected: the Run button to be visible next to the species picker. Happened: it wasn't in the first viewport — I had to scroll down past "3. SIMULATION SETTINGS" (step-by-step animation toggle, speed) to find the green **▶ Run Simulation →** button. Minor annoyance: the primary action sits below the fold while a big decorative hero banner sits above it. Also noticed the simulation graph had auto-zoomed to **30%**, making node labels unreadable dots.

**Step 5 — Run Simulation (05-after-run.webp)**
Expected: a spinner or a wait, then results. Happened: clicked **Run Simulation**; within ~2 seconds the button area gained a **Reset simulation** button, the right-hand panel showed a red **"Backswimmer Removed"** badge, and the **Cascade Timeline** at the bottom lit up with rounds (Initial State 12 species · 17 links → Round 1 Backswimmer removed, 1 affected → Round 2 Secondary cascade → Round 3 Stabilized state). Affected Species: Direct Effects (1) — **Perch: Lost food source, ↓ 1 link**.

**Step 6 — Confirming results (06-results-panel.webp)**
Expected: clear final metrics. Happened: scrolled back up and confirmed the Simulation Results panel shows **Species Removed 1 (Direct), Links Lost 2 out of 17 (18.8%), Secondary Removals 0, Total Removed 1 out of 12**. One thing that made me pause: the panel still says *"Example preview — computed automatically so you can see how results look. Choose your own species and press Run Simulation to replace it with your own scenario."* even AFTER I pressed Run Simulation. Since I ran the same species (Backswimmer) the numbers are mine, but the caption made me briefly wonder whether my run had actually registered. Skimmed past it; not worth a second attempt.

**GOAL MET:** dataset loaded (built-in FW-POND-A), species selected (Backswimmer), removal scenario run, and simulation results/metrics appeared. Stopped here per instructions.

## 2. Friction log

| # | Quote (as user) | URL | Severity | What happened |
|---|---|---|---|---|
| 1 | "Did my run actually happen? It still says 'example preview'." | https://foodwebguard.vercel.app/#/simulation | 2 minor | The "Example preview — computed automatically…" caption remains in the Simulation Results panel after the user presses Run Simulation, so it is unclear whether the displayed metrics are the user's run or a canned example. |
| 2 | "Why is the Run button hiding down here?" | https://foodwebguard.vercel.app/#/simulation | 2 minor | The primary action (Run Simulation) is below the fold under a settings section, while a large decorative hero banner occupies the top of the page; first viewport shows no way to run anything. |
| 3 | "I can't read any of these node names." | https://foodwebguard.vercel.app/#/simulation | 2 minor | The simulation food-web view auto-zooms to 30%, so species nodes render as tiny unlabeled dots until the user manually zooms in. |
| 4 | "Why do I have to scroll up and down to see what I did?" | https://foodwebguard.vercel.app/#/simulation | 1 cosmetic | Controls (Run) and outcomes (Results metrics, Cascade Timeline, Affected Species) live in three separate scroll regions; a single results view would save a skim. |

Notes: no blockers, no errors, no endless spinners encountered. Dataset was pre-loaded so no dataset-selection friction was exercised. Screenshots 01–06 are in this folder. One screenshot attempt failed with a tooling error (`UnknownVizError` from the browser runtime, not the app) and succeeded on retry — not logged as app friction.

## 3. Verdict

reached first success: yes
actions taken: 5
