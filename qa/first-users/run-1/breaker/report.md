# UX Test Report — Persona: "Breaker" (first-time user)

App: FoodWebGuard — Food-Web Disruption Analysis (http://localhost:4173/)
Date: 2026-10-24. Console/network capture not available — not tested (runtime crashes judged via blank snapshots / on-screen error text only; none occurred).

## Numbered action log (what I expected → what happened)

1. Opened the app fresh (cleared browser storage, reloaded) → landing on Overview loaded fine, FW-POND-A pond dataset active by default. [01-landing.webp]
2. Expected: switching "Current Network" dropdown to TER-GRASS-A changes the loaded dataset → it did; stats updated to 14 species / 29 interactions.
3. Expected: "Experiment Studio" nav button opens the studio → it did (`#/experiment`).
4. Expected: "Interactive Removal Studio" button opens species selection → it did (species chips, Direct Removal / Structural Cascade rules, disabled "Run Experiment").
5. Selected species "Snake" + rule "Direct Removal" → "Run Experiment" became enabled.
6. Clicked "Run Experiment" (first attempt timed out in my automation layer; a direct click worked) → results appeared: 13/14 nodes remaining, +0 secondary removals, 10.3% link loss (-3 links), 1 directly affected, 0 food depleted, connectance 0.167. BASELINE SUCCESS. [02-baseline-success.webp]
7. Pasted `<script>alert(1)</script>` into the species filter → accepted as literal text, 0 species matched, nothing executed, no crash.
8. Pasted `'; DROP TABLE nodes; --` into species filter → accepted, 0 matches.
9. Pasted `😀🐍 شبكة غذائية` into species filter → accepted, 0 matches.
10. Pasted `O'Brien` into species filter → accepted, 0 matches.
11. Pasted empty string into species filter → value did not change (box kept previous text); could not clear it that way.
12. Header search: typed `<script>alert(1)</script>`, clicked Submit → NOTHING happened: no navigation, no dropdown, no error message.
13. Header search: typed real term "Snake", pressed Enter → again NOTHING. Search appears to be a no-op from this route.
14. Re-ran an experiment, then hit Refresh immediately after clicking Run → page survived; the chosen network RESET from TER-GRASS-A back to FW-POND-A (lost input), but the last run was safely stored and shown on Overview ("Recent or current analysis").
15. Ran Perch removal, hit browser Back immediately after clicking Run → Back went to `#/overview`, run still completed and was saved (Perch, 29.4% link loss). No corruption.
16. Double-clicked species chip "Minnow" → selected once, no toggle-off/duplicate.
17. Double-clicked "Run Experiment" → one result set ("Direct on Minnow"), no duplicates, no stuck spinner.
18. Opened a SECOND TAB on the app → opened fine, started on default FW-POND-A.
19. In tab 2 switched network to MAR-COAST-A and ran a "Direct on Bacteria" removal → worked; tab 1 kept its own FW-POND-A state (no cross-tab corruption); the shared "last analysis" record now shows tab 2's run.
20. Opened Data Library, clicked "Import CSV or JSON" → dialog opened with file/paste import, metadata fields, Validate and preview. [03-import-dialog.webp]
21. Junk-filled every import metadata field (script tag, SQL string, emoji+Arabic, O'Brien, 5000 chars) → ALL accepted as plain text, no validation, no max length.
22. Pasted pure junk into the node/link CSV paste boxes and validated → REJECTED "Import blocked, 4 errors" with a precise report (missing id/name columns, malformed CSV, empty network) that states exactly how to fix it and confirms the loaded dataset is untouched.
23. Pasted a semi-valid CSV smuggling `<script>alert(1)</script>`, `O'Brien 😀🐍`, `شبكة غذائية` as species names plus a self-link, a dangling endpoint (n999) and a duplicate link → 1 blocking error (unknown endpoint, excludable), self-link excluded, duplicate deduped, role normalised — all itemised in a cleaning report.
24. Ticked "Repair supported issues", re-validated, clicked "Import dataset" → junk dataset imported locally, dialog closed, app navigated to Explorer with it loaded. All junk names render as inert literal text (no alert dialog ever fired); emoji/Arabic/O'Brien render correctly. [04-imported-junk-dataset.webp]
25. Switched import to JSON tab, pasted `<script>alert(1)</script>这不是JSON شبكة` → REJECTED "MALFORMED_JSON … Unexpected token '<'".
26. Pasted empty string into JSON paste box → REJECTED "EMPTY_FILE", but the message says "Both a node CSV file and a link CSV file are required" (wrong wording for the JSON tab).
27. Clicked Cancel in the import dialog → dialog closed cleanly.
28. Clicked "Remove imported dataset … from this browser" → dataset deleted instantly, NO confirmation dialog; storage cleared, sidebar option gone; after reload nothing junk remains. Removal worked.
29. Double-clicked "Analyse all species" sensitivity scan → completed once, rankings rendered, no duplicate computation visible, no stuck spinner.

## Breakages / friction points

1. "Search species, network or keyword" does nothing — http://localhost:4173/#/experiment (any route) — typed junk AND a real species name, clicked Submit and pressed Enter; no results, no navigation, no error, no empty-state. Severity 2 (minor). No screenshot (nothing changes on screen).
2. Dataset selection lost on refresh — http://localhost:4173/#/experiment — hit Refresh right after running a scenario; the network I had chosen (TER-GRASS-A) silently reset to the default FW-POND-A. My last analysis survived, so it is an annoyance, not lost work. Severity 2 (minor).
3. "Remove imported dataset" has no confirmation — http://localhost:4173/#/library — one accidental click permanently deletes a user-imported dataset (no undo). Severity 2 (minor).
4. Import dialog EMPTY_FILE message names CSV files while on the JSON tab — http://localhost:4173/#/library — pasted empty content in the JSON tab; error reads "Both a node CSV file and a link CSV file are required." Confusing wording, though it correctly blocks. Severity 1 (cosmetic).
5. Import metadata fields accept anything — http://localhost:4173/#/library — "Source URL or DOI" happily stores "O'Brien" (no format hint on failure) and "Licence" accepted 5,000 characters. Severity 1 (cosmetic).
6. Species filter could not be cleared by pasting an empty string (value stayed); also my automation's synthetic clicks on this app's buttons frequently timed out while real dispatched clicks worked — elementFromPoint showed no overlay, so this is probably a test-harness/render-churn artifact, but a real user may see flicker. Severity 1 (cosmetic / uncertain).

Nothing I tried crashed the app, executed injected script, corrupted data, created duplicate records, or left a stuck spinner.

## Junk-input table

| Input | Field | App response |
|---|---|---|
| `<script>alert(1)</script>` | Species filter (Experiment Studio) | Accepted as literal text; 0 matches; never executed |
| `'; DROP TABLE nodes; --` | Species filter | Accepted; 0 matches; no error |
| `😀🐍 شبكة غذائية` | Species filter | Accepted; 0 matches; renders fine |
| `O'Brien` | Species filter | Accepted; 0 matches |
| empty string | Species filter | Rejected/ignored — box kept previous value |
| `<script>alert(1)</script>` | Header global search + Submit | Accepted in box; submit = no visible effect at all |
| `Snake` (real term) | Header global search + Enter | No visible effect at all |
| `<script>alert(1)</script>` | Import → Dataset name | Accepted; stored; rendered as inert text everywhere |
| `'; DROP TABLE nodes; --` | Import → Source citation | Accepted as text |
| `😀🐍 شبكة غذائية` | Import → Origin / repository | Accepted; renders correctly |
| `O'Brien` | Import → Source URL or DOI | Accepted (no URL/DOI validation) |
| 5,000 characters | Import → Licence | Accepted (no max length) |
| `😀🐍` | Import → Node unit | Accepted |
| `'; DROP TABLE nodes; --` | Import → CSV node paste | Rejected: MISSING_COLUMNS (id, name) + MALFORMED_CSV + EMPTY_NETWORK, with exact fix instructions |
| `😀🐍 شبكة غذائية` | Import → CSV link paste | Rejected: MALFORMED_CSV (delimiter auto-detect failed) |
| Valid CSV with script/emoji/Arabic/O'Brien names + self-link + dangling endpoint + duplicate link | Import → CSV paste | Accepted after repair: blocking error for dangling endpoint (excludable), self-link excluded, duplicate deduped, all reported |
| `<script>alert(1)</script>这不是JSON شبكة` | Import → JSON paste | Rejected: MALFORMED_JSON with parser detail |
| empty string | Import → JSON paste | Rejected: EMPTY_FILE (message text wrongly mentions CSV files) |

Cleanup: the junk dataset I imported ("USER-MVMOA44Q") was removed via the library's Remove button; verified gone from the network list and browser storage after reload.

Reached first success: yes. Actions taken: 36.
