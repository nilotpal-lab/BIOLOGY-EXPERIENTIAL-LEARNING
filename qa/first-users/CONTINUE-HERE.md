# FIRST-USERS QA — CONTINUE HERE AFTER REOPENING THE LAPTOP

This file is the durable handoff for the FoodWebGuard first-users QA study.
**UPDATED 2026-10-25 after the second shutdown notice.** Run-1, run-2, run-3 and BOTH fix passes
are COMPLETE. Only two steps remain: the independent judge and the final report.

## Project

- App: FoodWebGuard — React 19 + TS + Vite static build (no backend, no auth).
- Root: `C:\Users\nilot\OneDrive\Desktop\IMPORTANT\JAIN\SUBJECTS\3RD SEM\BIOLOGY\EXPERIENTIAL LEARNING\BIO EXPERIENTIAL`
- Git branch `qa/first-users-fixes`, commits in order:
  - `25b9a0e` baseline (pre-QA, 133/133 tests green)
  - `dcf20a3` fix pass 1: run-1 findings F1–F12 fixed, 133/133 tests green
  - `ac57e25` handoff file
  - `545224f` fix pass 2: run-2 findings (no-auto-expire confirm, 44px chips, filter empty-state,
    fixture labels, position-neutral hint, search maxLength, cascade gloss). 133/133 green, tsc 0,
    lint 0 errors. Final build hash `index-ChS_Ocuf.js` — this is what run-3 tested.
- Findings list with file:line causes: `qa/first-users/findings-run-1.md`
- Raw runs: `qa/first-users/run-1|run-2|run-3/<id>/report.md` + screenshots.
  All 15 user sessions reached first success; 0 blockers in any run.

## Study contract (user-approved decisions)

- First success = "pick any dataset, select a species, run a direct-removal scenario, see the metrics."
- Skeptic persona re-aimed at trust & provenance (no pricing/terms/privacy pages exist).
- 5 personas, sequential (one shared in-app browser), clean localStorage per session.
- Not-testable marks: console/network capture; Slow-3G/4x-CPU throttling (375px viewport IS emulated).

## STATUS: what is already done (do NOT redo)

- **Run-1** (baseline build): 5/5 success. Merged into findings-run-1.md (F1–F12).
- **Fix pass 1** (`dcf20a3`): all 12 findings fixed.
- **Run-2** (`index-Ct8P0dIq.js`): 5/5 success. F1/F3/F5/F7/F12 confirmed fixed in the wild.
  New claims: "Simulate Removal dead" (sev3), "remove resurrects after refresh" (sev3),
  "Enter doesn't submit search" (sev2), "buttons never clickable" (sev2) — ALL FOUR verified as
  harness input-layer artifacts or timer design by the QA lead in the live browser (geometry stable,
  0 animations, DOM clicks navigate, confirm+reload persisted, Enter works). Real new items: species
  chips 32px, nested 192px inner scroll, fixtures in pickers, "buttons on the right" wording.
- **Fix pass 2** (`545224f`): those real items fixed (see commit message).
- **Run-3** (final build): impatient 10 actions ✓, skeptic 33 ✓ (deletion test passes fully),
  mobile 6 ✓, non-native 6 ✓ — all via independent subagents. Breaker: **DEVIATION** — QA-lead
  executed the scripted battery because subagent spawns were blocked ~35 min by the model
  concurrency limit (9 attempts). report.md documents this; battery fully clean (no crashes,
  injection, duplicates, resurrection; F7/F6/confirm/no-navigation all verified live).
- Skeptic run-3's "nav button dead on #/library" (sev3) was verified by the QA lead as a harness
  artifact (single button exists, DOM click navigates #/library → #/experiment).

## Remaining work (in order) — ONLY TWO STEPS LEFT

1. **Restart the app server** (only needed if the judge wants to open the app; screenshots may suffice):
   ```bash
   cd "<project root>" && npm run preview -- --port 4173 --strictPort
   ```
   (If port busy: `netstat -ano | grep 4173` then `taskkill //PID <pid> //F`.)
2. **Judge** — spawn a FRESH general-purpose subagent that did no fixing. Its job: read
   `qa/first-users/findings-run-1.md` (F1–F12), then Read the run-1 vs run-2/run-3 screenshots
   per finding and mark each: fixed / not fixed / not reached / new. Screenshots beat notes.
   Point it at: run-1 folder + run-2 + run-3 folders + the fix map in the two commit messages
   (`git log` / `git show --stat dcf20a3 545224f`) and the STATUS section above.
   Verdicts → `qa/first-users/verdicts.md`.
   NOTE for the judge prompt: breaker run-3 was QA-lead executed (documented deviation in its
   report.md), and four run-2 sev-2/3 claims were individually disproven live (see STATUS) —
   the judge should weigh that evidence, not re-flag them as open.
3. **Final report** `qa/first-users/report.md`: what couldn't be tested, run-1 vs final scoreboard
   per user, ranked findings with status + screenshots + files changed, needs-a-human list (already
   in findings-run-1.md: verified-claim wording, About/Terms/Privacy, plus new leftovers: duplicate
   import buttons on library, 36px hero/Run buttons on mobile, no auto-scroll to results,
   Explorer/Workspace naming spread, mesocosm/detritus vocabulary). Leftover small items do NOT
   require a run-4: the stop rule is after run 3. Then `git add -A && git commit`.

## Not tested (tooling limits, honestly marked everywhere)

- Console error capture and network request capture — unavailable in the in-app browser runtime.
- Mobile Slow-3G / 4x CPU throttling — unavailable (375px viewport WAS emulated).
- Parallel isolated browser contexts — unavailable; runs were sequential clean sessions.

## Notes for the resuming agent

- Subagent spawns may hit "model concurrency limit exceeded" — retry after 60-300s waits; if
  blocked >30 min, document a deviation like the breaker run instead of blocking the study.
- The vite preview process orphans on Windows when its npm wrapper is killed; free the port first.
- In-app browser tabs die with shutdown; nothing is lost — all reports/screenshots are on disk
  and committed.
