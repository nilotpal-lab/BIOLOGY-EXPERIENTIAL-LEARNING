# QA First-User Walkthrough — Persona "non-native"

- Tester: English is my second language. I follow ONLY what the UI literally says.
- App: https://foodwebguard.vercel.app/
- Date: 2026-11-04
- Browser: viewport 1366x850, fresh profile (localStorage cleared before walkthrough).

---

## Walkthrough narrative

### 1. Landing page (NN-01-landing.png, NN-02-home-middle.png)

**Expected:** a science website about food webs. **Happened:** yes.

- "REAL ECOSYSTEMS. REAL INSIGHTS." and "Comparative food-web disruption and vulnerability analysis" — I understood "food-web" (we learn this word in biology), but "disruption and vulnerability analysis" is heavy English. I guessed it means "what happens when the web is broken".
- The helper line "New here? Start with the green **Open Explorer** button — then try the Simulation Lab." is the best text on the page for me. It literally tells me the order of steps. I followed it.
- "Cascade Timeline — Explore ecosystem collapse round by round": "cascade" is not a word I knew. I guessed "waterfall", then later understood it means "chain reaction". The page never explains the word on first use.
- Feature cards have only small arrow icons (→) in the corner — I guessed the whole card is clickable. It worked but was not labeled.

### 2. Wrong turn — I landed on "Methodology & Validation" (NN-03-methodology.png)

**Expected:** clicking the green "Open Explorer" button goes to the explorer. **Happened:** my click (a coordinate fallback after the page scrolled under me) landed on the "Methodology & Validation" page instead. This was my navigation miss, but I stayed and read, because this page has wording problems for a non-native reader:

- "These are the same expectations the automated test suite asserts with **Vitest**." — I do not know "Vitest". This is programmer vocabulary on a science page. The sentence says nothing to me.
- "70 passed · 0 failed · 70 total" — checks of what? I guessed the website testing its own math. The "·" separator is used a lot in this app.
- The dataset list shows codes: "FW-POND-A", "RES-FW-A · Shallow-lake mesocosm (Pond1, heated + insecticide)". The code "FW-POND-A" alone would mean nothing to me; luckily a human-readable name sits next to it.

### 3. Explore (NN-04-explore.png)

I clicked "Explore" in the left WORKSPACE sidebar (the label is literal and easy). The temperate pond food web was already loaded with "FW-POND-A · Temperate pond" in the top-right selector — good, I did not need to "load" anything myself.

- "**Force Layout**" button next to "Trophic Layout" — unexplained jargon. I thought "force" meant the button forces something. I did not dare click it.
- "**Hide inspector**" — "inspector" is technical English. I guessed it means the right-side information panel. Correct, but I only knew from trial.
- "**Presentation view**" — ambiguous. I thought it makes a slide show for class. I still do not know.
- "Degree (Links) **2 (0 in · 2 out)**" — nobody explains what "in" and "out" mean. I first guessed "in = what it eats". Later, with Perch, the panel showed "Recorded food sources (4): Tadpole, Pond snail, Minnow, Backswimmer" under "4 in" — so "in" = what the animal eats. My first guess was **backwards**. This needs a tooltip.
- "**Basal organism** (no incoming food sources recorded in dataset)" — jargon "basal", but the parenthesis explains it. Good.
- Search box placeholder "Search species (**e.g.** Carp, **Macrobrachium**, Heron ...)" — "e.g." is an abbreviation I had to learn in school; and "Macrobrachium" is a Latin name with no common name next to it.

### 4. Selecting a species (NN-05-perch-selected.png)

I clicked the "Perch" fish node in the web. The node highlighted, teal links lit up, a floating card said "Perch — Apex predator — Recorded food sources: 4 — Status: present", and the right panel changed to Perch (Trophic Level 4.2, Degree 5 (4 in · 1 out)). Clear and satisfying. "Status: present" I understood as "still alive".

### 5. Simulation Laboratory (NN-06-simulation-page.png, NN-07-cascade-mode.png)

I clicked "Simulation" in the sidebar. The page is numbered "1. SELECT SIMULATION MODE / 2. SELECT A SPECIES / 3. SIMULATION SETTINGS" — excellent for me; literal steps in order.

- My Perch selection carried over into the species box automatically. Pleasant surprise.
- The results panel already showed numbers before I ran anything, but it honestly says: "**Example preview** — computed automatically so you can see how results look. Choose your own species and press Run Simulation to replace it..." Good — this stopped me from thinking I had already run it.
- I chose "**Direct Removal + Cascade**" (mode 2) because after the landing page I understood "cascade" = chain reaction.
- The food web in "Simulation View" opened at **ZOOM 30%** — the web was tiny, circles unreadable. I had to zoom myself.
- "Animation speed: Slow / Normal / Fast" with "Normal" highlighted — clear.

I pressed the green "**Run Simulation →**" button.

### 6. Results — FIRST SUCCESS (NN-08-simulation-results.png)

**Expected:** metrics appear after pressing Run. **Happened:** yes.

- "SPECIES REMOVED 1 (Direct)", "LINKS LOST 5 out of 17 (29.4%)", "SECONDARY REMOVALS 0 (via cascade)", "TOTAL REMOVED 1 out of 12" — I understood all of these. "(via cascade)" — "via" is French/Spanish-like loanword, understandable.
- "Affected Species: Heron — Lost food source — ↓ -1 link" — the "↓ -1 link" symbol pair is not explained. I decoded it as "one feeding link lost".
- "**ROUND 2 Secondary cascade —**" — a bare em dash "—". Does it mean "nothing happened" or "not calculated"? I guessed "nothing happened" only because ROUND 3 says "Stabilized state".
- The slider says "**Round 1 / 1**" but the timeline strip shows ROUND 1, ROUND 2, ROUND 3. Conflicting numbers; I expected "Round 1 / 3".

**First success reached:** I loaded a built-in dataset (preloaded FW-POND-A), selected a species (Perch), ran a removal scenario (Direct Removal + Cascade), and saw simulation results/metrics appear.

---

## Friction log

| # | Quote | URL | Severity |
|---|-------|-----|----------|
| 1 | "These are the same expectations the automated test suite asserts with Vitest." | https://foodwebguard.vercel.app/#/methodology | 2 — developer jargon ("test suite", "Vitest") on a user-facing science page |
| 2 | "Force Layout" | https://foodwebguard.vercel.app/#/explore | 2 — unexplained jargon button; I was afraid to click it |
| 3 | "Degree (Links) 5 (4 in · 1 out)" | https://foodwebguard.vercel.app/#/explore | 2 — "in"/"out" direction never defined; my first interpretation was the opposite of the real meaning |
| 4 | "Hide inspector" | https://foodwebguard.vercel.app/#/explore | 2 — technical word "inspector" for the info panel |
| 5 | "ROUND 2 Secondary cascade —" | https://foodwebguard.vercel.app/#/simulation | 2 — bare em dash not explained (does it mean zero events or "pending"?) |
| 6 | "Round 1 / 1" beside a timeline showing ROUND 1–ROUND 3 | https://foodwebguard.vercel.app/#/simulation | 2 — conflicting round numbering confused me |
| 7 | "ZOOM 30%" (default simulation web view) | https://foodwebguard.vercel.app/#/simulation | 2 — web renders nearly unreadable at default zoom |
| 8 | "Presentation view" | https://foodwebguard.vercel.app/#/explore | 1 — ambiguous; I guessed "slide show mode" |
| 9 | "Search species (e.g. Carp, Macrobrachium, Heron ...)" | all workspace pages | 1 — "e.g." abbreviation; Latin name without a common name |
| 10 | "FW-POND-A · Temperate pond" | header dataset selector | 1 — dataset codes unexplained, but human-readable name is adjacent |
| 11 | "Basal organism (no incoming food sources recorded in dataset)." | https://foodwebguard.vercel.app/#/explore | 1 — jargon "basal", softened by the parenthesis |
| 12 | "Heron — Lost food source — ↓ -1 link" | https://foodwebguard.vercel.app/#/simulation | 1 — arrow/minus symbols not explained |

Notes: no blocker (4) or major (3) issues found on the happy path — the numbered steps, the "New here?" tip, and the honest "Example preview" label carried me through. My environment had intermittent screenshot-surface timeouts and a flood of leftover tabs from other test runs; this is test-tooling, not the app, so it is not counted in the friction log.

---

reached first success: yes
actions taken: 10
