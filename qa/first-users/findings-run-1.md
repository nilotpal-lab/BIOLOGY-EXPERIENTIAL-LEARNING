# First-users QA — merged run-1 findings (ranked, one item per root cause)

Run date: 2026-10-24 · Build: baseline commit `25b9a0e` · Server: `npm run preview` @ localhost:4173
Users: impatient, skeptic (trust re-aim), mobile (375px), non-native, breaker — all 5 reached first success.
Ranking: blockers first, then users-hit count, then severity. No severity-4 (blocker) or severity-3 findings occurred.

| # | Users hit | Max sev | Root cause | Likely cause (file:line) |
|---|---|---|---|---|
| F1 | 3 (impatient, non-native, mobile) | 2 | Pre-run state unclear: rule "selected" state too subtle to see; disabled Run button's reason not adjacent to the button | `src/pages/ScenarioAnalysis.tsx:344-405` (border-tint-only active state; reason only in right panel `:505-511`); Explorer hint small `src/components/graph/ScenarioControls.tsx:133-140` |
| F2 | 2 (impatient, non-native) | 2 | Two synchronized dataset pickers (sidebar "Current Network" + page "Loaded network") with no cue they are the same control | `src/components/layout/Shell.tsx:429-452`, `src/pages/Explore.tsx:574-591`, `src/pages/ScenarioAnalysis.tsx:154-172` |
| F3 | 2 (skeptic, breaker) | 2 | "Remove imported dataset" deletes instantly — no confirmation, no undo | `src/components/datasets/DatasetBrowser.tsx:119-129` |
| F4 | 2 (non-native ×8 terms, skeptic ×1) | 2 | Scientific jargon shown without a plain-language explanation next to the term: connectance formula, "Trophic Levels", "deterministic/stochastic", "Systematic Sensitivity Scan", "Propagation Rule" (word), in/out-degree, "taxa", import role vocabulary | `src/pages/Overview.tsx:208,234,244,414`, `src/pages/ScenarioAnalysis.tsx:111-123,196,214,346-348`, `src/pages/Explore.tsx:768`, `src/components/layout/Shell.tsx:476`, `src/components/imports/ImportDialog.tsx` (role values not listed inline) |
| F5 | 1 (non-native) | 2 | Sidebar landscape card shows a hard-coded caption "Terrestrial Forest" even when a grassland/savanna terrestrial network is loaded (reads as a factual label; user thought the dataset switch failed) | `src/components/layout/EcosystemThumbnail.tsx:90-92` (terrestrial branch caption) |
| F6 | 1 (breaker) | 2 | Global header search is a no-op: input stores a query, submit button has no handler, Enter does nothing — dead UI control | `src/components/layout/Shell.tsx:307-330` |
| F7 | 1 (breaker) | 2 | Chosen dataset silently resets to default after refresh (selection not persisted, unlike imports and last analysis) | `src/state/AppState.tsx:118` (init only, never persisted) |
| F8 | 2 (mobile, non-native) | 2 | Undersized / icon-only controls: metric "(i)" info buttons ~16-20px (under 44px touch target, and title-tooltips don't exist on touch); graph zoom controls icon-only | `src/components/ui/primitives.tsx:281-291` (HelpHint, 13px icon, no hit area), `src/components/graph/FoodWebGraph.tsx:322-334` |
| F9 | 2 (skeptic, breaker), 4 sub-causes | 1 | Import dialog gaps: (a) stale text from the other format tab leaks into validation → wrong error wording ("Both a node CSV file…" on the JSON tab); (b) ecosystem silently defaults to Freshwater; (c) metadata fields accept anything (no URL/DOI check, no max length); (d) successful import force-navigates to Explorer and hijacks the active network | (a) `src/components/imports/ImportDialog.tsx:155-173` + `src/core/dataValidation.ts:769-774` (dispatch on content, not selected format); (b) `ImportDialog.tsx:84`; (c) `ImportDialog.tsx:83-89`; (d) `src/App.tsx:62` + `AppState.tsx:188` |
| F10 | 1 (mobile) | 2 | On 375px the Run/simulation panel sits a long scroll below the graph and the inspector | `src/pages/Explore.tsx:914-938` (right column is order-3; inspector above controls) |
| F11 | 1 (impatient) | 1 | Landing page reads as a wall of text; primary "go experiment" path not prominent enough for a skimmer | `src/pages/Overview.tsx:150-265` (CTAs exist in header `:170-189` but small) |
| F12 | 1 (non-native) | 1 | "Illustrative demo" status badge explains itself only via hover title | `src/components/ui/primitives.tsx` (StatusBadge — title-only) |

## Needs a human (wording / policy — suggested rewrites, not auto-applied)

1. **"Research source verified" is self-attested** (skeptic, sev2). The UI cannot show the audit trail inline; DOIs/CSV exports allow re-derivation. Suggested rewrite for the Methodology page, under "How verification works": *"Verified means: this bundle's node and link tables were regenerated from the committed source files by an automated test (researchDatasets.test.ts, 130+ checks) that compares them record-by-record. The full audit trail is in src/data/research/FINAL_REPORT.md, and every claim can be re-derived from the DOI and CSV exports linked on each dataset."*
2. **No About / Terms / Privacy page** (skeptic, sev1). Irrelevant while local-only, required before any public deployment. Suggested one-pager: who built it (course/team), no accounts, no analytics, imports stay in localStorage, third-party font request (Google Fonts) is the only external call.

## Not app bugs (recorded, not fixed)

- Breaker: automation-layer synthetic clicks frequently timed out while dispatched clicks worked — harness artifact, no overlay found.
- Breaker: empty-string paste did not clear the species filter — automation artifact (real users clear fields).

## Not tested (tooling limits, honestly marked)

- Console error capture and network request capture — not available in the in-app browser runtime.
- Mobile network throttling (Slow 3G) and CPU throttling (4x) — not available; 375px viewport WAS emulated.
