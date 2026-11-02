# First-Users QA — Final Report

**App:** FoodWebGuard · **Branch:** `qa/first-users-fixes` · **Final build:** `index-ChS_Ocuf.js`
**Protocol:** 5 simulated first-time users (impatient · skeptic · mobile 375px · non-native English · breaker),
each run alone from a clean session, landing → first success ("pick a dataset, select a species, run a
direct-removal, see the metrics"), friction logged with severity 4–1 and a screenshot per screen.
**Cycle:** run-1 (baseline) → fix pass 1 → run-2 → fix pass 2 → run-3 → independent judge.
**Result: all 15 sessions reached first success · 0 blockers in any run · every engineering finding
from run-1 fixed or visibly reduced — nothing left unfixed.**

---

## 1. What could not be tested (honest limits)

| Limit | Consequence |
|---|---|
| Console & network capture unavailable in the browser runtime | No console-error evidence in any run; crashes were judged via on-screen state only. Marked "not tested" in every report. |
| Mobile network (Slow 3G) / CPU (4×) throttling unsupported | Load-speed judgments are approximate; 375×667 viewport WAS fully emulated. |
| Parallel isolated browser contexts unsupported | Users ran sequentially in clean sessions (equivalent isolation for a stateless, auth-free app). |
| Synthetic input layer flaky in the harness | Locator/coordinate clicks sometimes silently no-op'd while DOM-dispatched clicks worked (proven: stable geometry, 0 animations, handlers fire). Four run-2/3 severity claims were individually disproven live and reclassified as tooling artifacts. |

**Deviation (documented):** the run-3 breaker session was executed by the QA lead rather than an
independent subagent — subagent spawning was blocked ~35 minutes by a model concurrency limit
(9 attempts). Its report and screenshots follow the same rules; the judge weighed this.

## 2. Scoreboard — run-1 vs final (run-3)

| User | Run-1 | Final run | Improvement visible in final screenshots |
|---|---|---|---|
| impatient | SUCCESS · 7 actions · 4 friction (1×sev2) | run-3: SUCCESS · 10 actions · 2 friction (1×sev2 scroll-distance) | rule selected-state + adjacent Run reason seen; single picker; truthful ecosystem caption |
| skeptic | SUCCESS · 20 actions · 6 friction (2×sev2) | run-3: SUCCESS · 33 actions · 2 friction (1×sev3 → disproven as tooling; 1×sev1) | remove-confirm + survives refresh; honest import status; provenance flow intact; "deletion/control test passed fully" |
| mobile (375px) | SUCCESS · 5 actions · 3 friction (2×sev2) | run-3: SUCCESS · 6 actions · 3 friction (2×sev2, 1×sev1) | Run panel above inspector; no horizontal overflow (365=365 all screens); (i) taps uncontested; chips 44px |
| non-native | SUCCESS · 7 actions · 13 friction (7×sev2) | run-3: SUCCESS · 6 actions · 11 friction (6×sev2 vocabulary, 5×sev1) | propagation rule + scan modes glossed; disabled-Run reason quoted as "helpful"; roles inline in import; remaining items are dataset vocabulary, not UI text |
| breaker | SUCCESS · 36 actions · 3×sev2, 3×sev1 | run-3 (QA-lead): SUCCESS · ~40 checks · 1×sev1 + tooling | script/SQL/emoji/Arabic inert everywhere; remove-confirm persists across reload; no duplicates/crashes; junk CSV blocked with fix-it errors |

## 3. Findings — final status (independent judge, screenshots over notes)

Full verdicts with evidence paths: `qa/first-users/verdicts.md`. Counts: **9 fixed · 3 partially fixed · 0 not fixed · 2 not reached.**

| # | Finding (users hit, run-1 sev) | Files changed (fix pass 1 = `dcf20a3`, pass 2 = `545224f`) | Verdict | Evidence |
|---|---|---|---|---|
| F1 | Pre-run state unclear (3, sev2) | `ScenarioAnalysis.tsx`, `ScenarioControls.tsx` | **FIXED** | run-1\impatient\03 vs run-2\skeptic\07, run-2\non-native\05 — outlined+ticked rule, adjacent Run reason |
| F2 | Two dataset pickers (2, sev2) | `Explore.tsx`, `ScenarioAnalysis.tsx` (`lg:hidden`) | **FIXED** | run-1\impatient\02 vs run-2\impatient\04, run-3\impatient\03 — one picker |
| F3 | Remove without confirm (2, sev2) | `DatasetBrowser.tsx` (arm→Confirm, no auto-expire) | **FIXED** | run-1\skeptic\08 vs run-3\skeptic\06; survives reload (run-3 breaker step 13) |
| F4 | Unexplained jargon (2, sev2) | `Overview.tsx`, `ScenarioAnalysis.tsx`, `Shell.tsx`, `Explore.tsx`, `ImportDialog.tsx` | **PARTIALLY FIXED** | glosses visible (run-2\impatient\01, run-3\skeptic\04); residual: "Basal/Top Nodes (In-/Out-degree=0)" still bare; dataset vocabulary (mesocosm/detritus) = leftover |
| F5 | False "Terrestrial Forest" caption (1, sev2) | `EcosystemThumbnail.tsx` | **FIXED** | run-1\impatient\03 vs run-3\impatient\03 — "Terrestrial ecosystem" |
| F6 | Dead global search (1, sev2) | `Shell.tsx` (match/no-match notices, Enter, maxLength) | **FIXED** | run-2\breaker\05 + live check: "Ythan"→loads network, junk→explicit no-match notice |
| F7 | Dataset reset on refresh (1, sev2) | `AppState.tsx` (persisted, validated on restore), `test/setup.ts` | **FIXED** | live check + run-2/3 breaker: MAR-YTHAN-1 survives reload |
| F8 | Sub-44px targets (2, sev2) | `primitives.tsx` (HelpHint/IconButton hit areas), `ScenarioAnalysis.tsx` chips | **PARTIALLY FIXED** | (i) taps fine, chips 44px (run-3 mobile); residual: icon-only zoom controls, 36px hero/Run buttons = leftover |
| F9 | Import dialog ×4 sub-causes (2, sev1) | `ImportDialog.tsx`, `dataValidation.ts` (format hint), `App.tsx` | **FIXED** | per-format errors (run-2\breaker\06), ecosystem hint, URL warning, metadata caps (80–400), stays on library (run-3 breaker step 12) |
| F10 | Run buried on mobile (1, sev2) | `Explore.tsx` (order swap <xl) | **FIXED** | run-1\mobile\02 vs run-3\mobile\03 — setup before graph |
| F11 | Landing wall of text (1, sev1) | `Overview.tsx` (start-here line) | **PARTIALLY FIXED** | hint present in run-2/3 landings; page density still logged sev1 by impatient — judgement call for a human |
| F12 | Demo badge hover-only (1, sev1) | `Explore.tsx`, `ScenarioAnalysis.tsx` | **FIXED** | "Illustrative teaching data — not field evidence" visible (run-2\impatient\04, run-2\mobile\03) |
| H1 | "Verified = self-attested" wording | — | **NOT REACHED** | needs a human; suggested rewrite in findings-run-1.md |
| H2 | No About/Terms/Privacy | — | **NOT REACHED** | needs a human before any public deployment |

## 4. Leftovers for a human (small, judged, parked — stop rule: after run 3)

1. Bare "Basal Nodes (In-degree = 0)" / "Top Nodes (Out-degree = 0)" labels and the bare "≥" in "Lost ≥1 food source" (non-native, sev2/1).
2. Placeholder-only labels on the two search boxes (non-native, sev1) — consider visible mini-labels.
3. Icon-only graph zoom controls; ~36px hero/Run/Analyse buttons on mobile (sev2).
4. Results render below the fold with no auto-scroll after Run (sev2).
5. "Explorer / Explore Workspace / Explorer Workspace" naming spread (non-native, sev2).
6. VALIDATION fixtures still listed in dataset pickers, now tagged "— validation fixture (internal test)" (run-3 mobile still flags sev2; consider hiding from pickers entirely).
7. Duplicate "Import CSV or JSON" buttons on the library page (sev1).
8. Needs-a-human: H1 verified-claim rewrite, H2 About/Terms/Privacy page (suggested texts in findings-run-1.md).
9. Process note: "Simulate Removal dead / remove resurrects / Enter dead / unclickable buttons" claims were disproven live as harness artifacts — if they recur in future automation, test with DOM-dispatched events before filing.

## 5. Artifacts

- Per-run evidence: `qa/first-users/run-1|run-2|run-3/<persona>/` (report.md + numbered PNGs)
- Findings & fix map: `qa/first-users/findings-run-1.md` · Judge verdicts: `qa/first-users/verdicts.md`
- Commits: `25b9a0e` baseline → `dcf20a3` fix pass 1 → `ac57e25` handoff → `545224f` fix pass 2 → `6242323` run artifacts → this report
- Verification at every pass: 133/133 Vitest green, `tsc -b` 0 errors, oxlint 0 errors, production build clean.

---

## Addendum — post-QA design-revamp visual audit (2026-11-02, commit 7bb92fa)

Scope: the three pages named by the stakeholder — Simulation (`#/simulation`),
Dataset Import (`#/import`), Cascade Timeline (`#/timeline`) — on the current main
build (production bundle `index-Bt8u7Zqg.js` at foodwebguard.vercel.app), desktop
1366×850 and mobile 375×667.

### How the pages look now

- **Simulation** — hero, mode cards, species picker, settings, results cards and the
  inline cascade-timeline strip all render cleanly. **Blocker found & fixed:** the
  "Food Web (Simulation View)" panel was completely empty — all three cytoscape
  canvases measured 486×0 CSS px. Cause: the panel wrapper had `flex-1` (flex-basis
  0% overrides its own `h-[390px]`) inside a card whose height came from
  `min-h-[460px]`, an indefinite chain, so `FoodWebGraph`'s `h-full` could not
  resolve. Fix: definite `h-[390px]` on the wrapper
  (`src/pages/SimulationPage.tsx:463`). After: canvases 309×261, graph renders at
  both viewports.
- **Dataset Import** — no defects. Hero, format-guide tabs, example tables (already
  inside `overflow-x-auto` swipe containers), upload zone, paste fields, Step 2/3,
  validation report, parsed preview and "Activate Dataset & Open Explorer" all
  verified; the sample-dataset → validate flow returns "Ready to import, 0 errors".
- **Cascade Timeline** — no defects. Hero, species picker, mode cards, run button,
  summary cards, round scrubber, round cards, both charts and the food-web graph all
  render; the graph works here because the page passes `min-h-[460px] lg:min-h-[520px]`.

### Second fix — 375px horizontal overflow (all workspace pages)

Every workspace page scrolled sideways at 375px: `scrollWidth 447 vs 365`. The
header dataset-picker cluster carried `shrink-0`, pushing the mobile hamburger menu
fully off-screen (left=415). Fix (`src/components/layout/Shell.tsx:360`): allow the
cluster to shrink (`min-w-0`) and hide the decorative thumbnail below `sm`. After:
`scrollWidth == clientWidth == 365` on simulation/timeline/import at 375px, desktop
and mobile verified live in the browser, and re-verified on production after deploy.

### Verification

- `tsc -b` 0 errors · oxlint 0 errors · Vitest 156/156 green (main @ 7bb92fa).
- Fixes verified on a local dev server (desktop + 375px screenshots), then pushed
  to `main` **only** (`b7b6ef5..7bb92fa`) and re-verified on the deployed
  production site (bundle `index-Bt8u7Zqg.js`, canvas 261px, no overflow).
- Not tested: console/network capture and Slow-3G/CPU throttling (runtime limits,
  unchanged from the main study); full-page screenshot stitching in the in-app
  browser duplicates fixed elements, so section-by-section viewport captures were
  used and `fullPage` images discarded as artifacts.

Note: the local branch `qa/first-users-fixes` is a stale pointer fully contained in
main's history (merge-base == branch tip); no other branch was pushed.
