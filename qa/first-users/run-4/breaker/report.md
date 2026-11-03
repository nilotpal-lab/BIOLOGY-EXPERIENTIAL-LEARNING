# QA First-User Walkthrough — persona "breaker"
App: https://foodwebguard.vercel.app/ (no login; all state in the browser)
Date: 2026-11-03. Viewport 1366x850. Screenshots: `NN-slug.png` in this folder.

## 1. Walkthrough narrative (what I did, what I expected, what happened)

**Environment prep.** Cleared localStorage, reloaded. Landing page (01-landing.png) loaded clean with "No scenario has been saved in this browser yet."

**Attempt 1 — the obvious CTA.** I scrolled to the bottom status widget and double-clicked **"Open the first demo network"** (02-landing-bottom-status.png, 03-status-widget.png). Expected: the demo pond network loads. Happened: the click never registered (actionability timeout) even though the DOM said the button was visible; the widget never appeared in my viewport no matter how I scrolled. I tried twice (double-click + single click), then gave up and used the top-nav **Datasets** instead. Friction F1.

**Datasets → Research Library** (05-datasets-page.png). Before loading anything I junked the **global species search** box with `'; DROP TABLE users; -- 🐟🐟<script>alert(1)</script>` (06-search-junk.png). Expected: crash or a weird dropdown. Happened: accepted silently, rendered as plain text, no dropdown, no crash. Good.

**Loaded a real research dataset.** Clicked View Dataset → "Explore RES-FW-A in Workspace" (07, 08). RES-FW-A (11 species / 18 links) loaded into the workspace header. Cosmetic: the Explore graph renders with a large blank band above it (08).

**Simulation Lab.** Sidebar → Simulation. Surprise: the page **already showed "Simulation Results — Carp Removed"** with metrics filled in before I had selected anything or pressed Run (auto-selected Carp). As a first-timer I thought someone else's run was replayed into my browser. Friction F3.

**Junk at the selector, then run.** The species picker is a dropdown, so no free-text junk possible there; I switched it to *Phytoplankton* and **double-clicked Run Simulation** (09, 10). Expected: double-submit, duplicated run, or freeze. Happened: single clean run — SPECIES REMOVED 1, LINKS LOST 3/18 (16.7%), SECONDARY 0, TOTAL 1/11, Affected species: Rotifer/Cladocera "Food depleted", Bellamya "Lost food source". **FIRST SUCCESS: dataset loaded, species selected, removal run, metrics visible.** A stray empty white rectangle overlapped the graph in 09 (cosmetic).

**Refresh mid-session.** Reloaded (11-after-refresh.png). Expected: everything gone (state is "in the browser"). Happened: dataset choice RES-FW-A **survived**, but my Phytoplankton scenario **reverted to the default "Carp Removed"** and the search-box junk was wiped. Friction F4.

**Dataset Import abuse.** Sidebar → Dataset Import opens the "Data Intake Studio" modal (12-dataset-import.png). I filled every metadata field with junk (13):
- Dataset Name: `O'Brien 🐟🐉 صيد السمك <script>alert(1)</script>`
- Source Citation: `<script>alert('citation')</script> ; DROP TABLE users; --`
- Origin/Repository: 5,000 chars of `JUNK...`
- Source URL/DOI: `'; DROP TABLE users; -- https://🎯.example/عربي`
- Licence: `CC-بوش 🄯 emoji licence ' OR 1=1 --`
All accepted as plain text, nothing executed.

**Validate with NO data file** (14). Expected: silent success or crash. Happened: proper block — "Import blocked / 1 errors / 1 warnings", `EMPTY_FILE: Both a node CSV file and a link CSV file are required.` and `METADATA_URL_UNUSUAL` flagging my fake URL; **Import dataset button correctly disabled**.

**Hostile CSV paste** (15, 16, 17). Node CSV rows named `O'Brien <b>bold</b>`, `🐟 crab سلطعون`, `'; DROP TABLE users; --`; link CSV `p1→c1, p2→c1`. Validate → **"Ready to import"** with soft warnings only (`ROLE_NORMALISED`: "predator" stored as "other"; `ICON_KEY_MISSING`; `METADATA_URL_UNUSUAL`). Preview table renders every hostile name **as escaped text** — `<b>bold</b>` shows literally, no bolding, no script execution. **Double-clicked Import dataset** → imported exactly once (18-after-import.png): banner "…imported with 3 node(s) and 2 link(s)… now the active network". No duplicate import. My junk dataset is now in the library / active network — noted, left in place (my junk, per rules).

**Refresh again** (19): junk dataset **survived** refresh and stayed the active network. Import persistence is solid.

**Two tabs.** Opened a second tab on the same app (20-tab2-landing.png; its status widget said "No scenario has been saved"). Clicked Open Explorer → **my junk dataset appears in tab 2's network dropdown AND is selected as the active network** (21-tab2-junk-network.png). The graph renders node labels `'; DROP TABLE users; --`, `O'Brien <b>bold</b>`, `…سلطعون` — all plain text, inspector heading escaped too. State is fully shared across tabs (localStorage).

**Malformed JSON** (23, 24). Reopened the import dialog (my earlier junk metadata was **gone** — dialog state not preserved, F5), switched to JSON mode, pasted `{not json ;; ; DROP TABLE users; -- 🐟 <script>alert(1)</script>` → clean block: `MALFORMED_JSON: The file is not valid JSON. Expected property name or '}' in JSON at position 1 (line 1 column 2)`. No crash, no stack trace.

**Methodology filter.** Junked "Filter test checks…" with emoji + SQLi + script tag (25-filter-junk.png). Renders as text, the check list filters to empty without crashing.

## 2. Friction log

| # | Quote (as the user) | URL | Severity | What happened |
|---|---|---|---|---|
| F1 | "There's a big friendly 'Open the first demo network' button and it just… won't press." | /#/ (bottom status widget) | **2 minor** | Button reported visible but unclickable (click/actionability timeout twice); widget couldn't be scrolled into view. Worked around via top-nav Datasets. |
| F2 | "Why does it already show a Carp removal? I never ran anything." | /#/simulation | **2 minor** | Simulation page auto-selects Carp and shows full "Simulation Results — Carp Removed" on entry/reload without pressing Run Simulation; misleading first-run impression. |
| F3 | "I ran Phytoplankton, refreshed, and my run is gone — it's Carp again." | /#/simulation | **2 minor** | Refresh keeps the loaded dataset but discards the user's run species/scenario, reverting to the default Carp scenario. |
| F4 | "I typed all that metadata, closed the dialog for a second, and everything I typed vanished." | /#/methodology (import dialog) | **2 minor** | Closing and reopening the import dialog clears all typed metadata (lost input). |
| F5 | "The graph has a random empty white block sitting on top of it." | /#/simulation, /#/explore | **1 cosmetic** | White rectangle artifact overlapping the food-web graph (09); large blank band above the Explore graph (08). |
| F6 | "I keep double-clicking everything and nothing blew up. Disappointing." | multiple | **1 cosmetic (positive)** | Double-clicks on Run Simulation and Import dataset caused no double-execution, no duplicates. |

Severity scale: 4 blocker, 3 major, 2 minor, 1 cosmetic. **No severity-3 or severity-4 issues found.**

## 3. Crash / duplicate / lost-input / unescaped-output summary

- **Crashes:** none. No frozen page, no blank screen, no visible error stack. Empty input, 5,000-char input, emoji, Arabic, apostrophes, `<script>alert(1)</script>`, `'; DROP TABLE users; --`, malformed JSON, and an empty-data validate were all handled with readable messages (EMPTY_FILE, MALFORMED_JSON, METADATA_URL_UNUSUAL) or silent acceptance as text.
- **Duplicates:** none. Double-clicked "Run Simulation" and "Import dataset": single execution each, no duplicated scenarios or datasets.
- **Lost input:** (a) global search junk and dialog metadata are lost on reload/dialog close (F4, F3 partial); (b) the run scenario reverts to Carp on refresh (F3). The imported dataset itself persists across refresh and across tabs.
- **Unescaped output:** none found. `<script>alert(1)</script>` and `<b>bold</b>` render literally in: search box, import preview table, graph node labels, species inspector heading, header dataset chip, network dropdown option, methodology filter. No script execution, no HTML injection.

**Cleanup note (my own junk):** my junk import ("O'Brien 🐟🐉 صيد السمك <script>alert(1)</script>", 3 nodes / 2 links, species `'; DROP TABLE users; --`) succeeded and is left in the app's dataset library and active-network slot; I did not delete it and did not touch any built-in dataset.

## 4. Verdict

First success (load dataset → select species → run removal → see results/metrics) was reached on the Simulation Lab with RES-FW-A / Phytoplankton, after a workaround around the dead "Open the first demo network" CTA.

reached first success: yes — actions taken: 35
