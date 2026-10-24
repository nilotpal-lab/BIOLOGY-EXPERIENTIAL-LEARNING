# FIRST-USERS QA — CONTINUE HERE AFTER REOPENING THE LAPTOP

This file is the durable handoff for the FoodWebGuard first-users QA study.
Written 2026-10-25 before a planned laptop shutdown. If the agent session lost
context, this file plus git history is everything needed to continue at full pace.

## Project

- App: FoodWebGuard — React 19 + TS + Vite static build (no backend, no auth).
- Root: `C:\Users\nilot\OneDrive\Desktop\IMPORTANT\JAIN\SUBJECTS\3RD SEM\BIOLOGY\EXPERIENTIAL LEARNING\BIO EXPERIENTIAL`
- Git: initialized during this study. Branch `qa/first-users-fixes` is current.
  - `25b9a0e` baseline (pre-QA, 133/133 tests green)
  - `dcf20a3` fix pass: all 12 findings F1–F12 fixed, 133/133 tests green, tsc clean, lint 0 errors, dist rebuilt.
- Findings list with file:line causes: `qa/first-users/findings-run-1.md`
- Run-1 raw material: `qa/first-users/run-1/<id>/report.md` + screenshots for
  impatient, skeptic, mobile, non-native, breaker. All 5 reached first success, 0 blockers.

## Study contract (user-approved decisions)

- First success = "pick any dataset, select a species, run a direct-removal
  scenario, see the resulting metrics."
- Skeptic persona re-aimed at trust & provenance (no pricing/terms/privacy exist in this app).
- 5 personas run SEQUENTIALLY (one shared in-app browser, clean localStorage each).
- "Needs a human" list lives in findings-run-1.md (verified-claim wording; About/Terms/Privacy).
- Not-testable marks: console/network capture, Slow-3G/4x-CPU throttling (375px viewport IS emulated).

## Remaining work (in order)

1. **Restart the app server** (dies at shutdown):
   ```bash
   cd "<project root>" && npm run preview -- --port 4173 --strictPort
   ```
   (run in background; verify with `curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/` → 200;
   confirm served bundle is the fixed one: index html should reference an asset hash ≠ `index-BgmSF7qt.js`, which was the pre-fix build)
2. **Run-2** — rerun all 5 personas as FRESH subagents (general-purpose), one at a time,
   60s cooldown between spawns (model concurrency limit). Folders:
   `qa/first-users/run-2/{impatient,skeptic,mobile,non-native,breaker}/` (currently empty).
   Each subagent gets: the URL, its persona, first-success definition, its folder, the
   walkthrough rules (screenshot every screen NN-slug.png to disk, friction log with
   severity 4/3/2/1, try-twice-then-quit, 60-action cap, no code/docs reading, clean
   localStorage, close tab at end). Persona texts + full mechanics block are in the
   conversation; essentials:
   - impatient: skims, 10s/screen, quits at first error/spinner/confusing field.
   - skeptic (trust re-aim): provenance, citations, licences, verified-vs-demo labels,
     methodology, import→remove round trip; pricing/legal marked not-found.
   - mobile: viewport 375x667 via tab.setViewportSize, touch-only, flags <44px targets,
     horizontal overflow (scrollWidth vs clientWidth), layout jumps; throttling honestly marked not-testable.
   - non-native: follows UI literally, logs every jargon/idiom/unlabeled icon/placeholder-only
     label and any wrong turn caused by wording.
   - breaker: junk pastes (empty, 5k chars, emoji, Arabic, O'Brien, <script>, SQL), refresh/back
     mid-submit, double-clicks, two tabs; flags crashes/duplicates/lost input/unescaped output.
3. **Judge** — a FRESH subagent that did no fixing compares the run-1 findings list
   (F1–F12 in findings-run-1.md) against BOTH runs' screenshots and marks each item
   fixed / not fixed / not reached / new. Screenshots beat notes. Verdicts written to
   `qa/first-users/verdicts.md`.
4. If anything is not fixed: ONE more fix pass on the same branch, run-3 with all 5
   users and a fresh judge. Stop after run 3; leftovers go to the human list.
5. **Final report** `qa/first-users/report.md`: what couldn't be tested, run-1 vs final
   scoreboard per user, ranked findings with status + screenshots + files changed,
   needs-a-human list. Then commit.

## Fix map (what changed in dcf20a3, for reference during judging)

- F1 `ScenarioAnalysis.tsx` — ticked/ringed rule buttons + aria-pressed, adjacent disabled-Run reason; `ScenarioControls.tsx` hint enlarged.
- F2 page-level "Loaded network" pickers now `lg:hidden` (sidebar picker is the single desktop control) — `Explore.tsx`, `ScenarioAnalysis.tsx`.
- F3 `DatasetBrowser.tsx` — two-click remove (Confirm/Cancel, 6s auto-disarm).
- F4 plain-language notes: Overview (connectance, basal/top, taxa, trophic), ScenarioAnalysis (deterministic/stochastic, sensitivity scan explainer, propagation rule), Shell trophic tooltip, Explore in/out tooltip, ImportDialog trophic_role vocabulary.
- F5 `EcosystemThumbnail.tsx` — captions now "Marine/Freshwater/Terrestrial ecosystem" (was "Terrestrial Forest" for every terrestrial network).
- F6 `Shell.tsx` — global search wired (loads unique match, library on multi-match, explicit no-match notice).
- F7 `AppState.tsx` — selected dataset persisted to localStorage (`fwg.selectedDatasetId`), validated on restore; test setup clears storage between tests.
- F8 `primitives.tsx` — HelpHint & IconButton ~44px touch targets via expanded ::after hit area.
- F9 `ImportDialog.tsx` — format-scoped validation (explicit `format` hint added to `importNetwork` in `dataValidation.ts`), ecosystem hint text, metadata maxLengths + unusual-URL/DOI warning, no forced navigation after import (App.tsx notice explains the dataset became active).
- F10 `Explore.tsx` — on <xl screens Simulation controls render above the inspector.
- F11 `Overview.tsx` — "New here? Pick a network → remove a species → read the impact." line.
- F12 visible "Illustrative teaching data — not field evidence" note next to the status badge in Explore/ScenarioAnalysis context bars.

## Notes for the resuming agent

- The vite preview process may orphan on Windows when its npm wrapper is killed;
  `netstat -ano | grep 4173` then `taskkill //PID <pid> //F` frees the port before restart.
- The in-app browser tabs die with the app; every QA user starts a fresh tab and clears
  localStorage anyway, so nothing is lost by the shutdown.
- Keep runs sequential; the model concurrency limit rejects parallel spawns (retry after ~60s).
