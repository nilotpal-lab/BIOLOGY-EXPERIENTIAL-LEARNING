# UX Test Report — Persona: "Breaker" (run-2, first-time user)

App: FoodWebGuard — http://localhost:4173/
Date: 2026-10-25. Clean session (localStorage cleared) before starting.

## Action log (expected → happened)

1. Expected: landing page loads. Happened: overview loads with demo network FW-POND-A pre-selected, 12 species / 17 links visible. (01-landing.png)
2. Expected: clicking "Experiment Studio" in the top nav opens the studio. Happened: the click would not register (button never becomes clickable for automation; a pointer click on the hero CTA worked) — see friction #1. Landed on #/experiment.
3. Expected: "Interactive Removal Studio" opens a setup panel. Happened: it did — species list, propagation rules, disabled Run button with helper text "Select a target species above to enable Run Experiment." (02-experiment-studio.png)
4. Expected: selecting "Perch" enables Run. Happened: selection shown, Run enabled.
5. Expected: Run computes direct-removal metrics. Happened: FIRST SUCCESS — "Scenario: Direct on Perch", Nodes Remaining 11/12 (91.7%), Link Loss 29.4% (-5 links), Directly Affected 1, Connectance 0.109. (03-baseline-success.png)
6. Expected: junk in the species filter either filters or shows a hint. Happened: all junk accepted as literal text; list silently empties with NO "no species match" message (friction #5). Emoji/Arabic/O'Brien/script/SQL all render as text, page alive. (04-filter-junk-unicode.png)
7. Expected: 5000 characters might lag or freeze the app. Happened: accepted instantly, page stayed responsive, species list just empty.
8. Expected: double-click on a species might double-select or duplicate. Happened: clean single selection (Minnow replaced Perch), no duplicates.
9. Expected: double-clicking Run Experiment might create two result records. Happened: exactly one result panel ("Scenario: Direct on Minnow"), no duplicates, no errors.
10. Expected: refreshing right after Run loses the result. Happened: studio reset to its default sub-view, selection and result panel gone (friction #2) — BUT the Overview "Recent or current analysis" panel had persisted the Minnow scenario, so the work is recorded, not fully lost.
11. Expected: browser Back may break the SPA. Happened: #/overview → #/experiment → / all clean, page alive each time.
12. Expected: header search for "Ythan" finds the Ythan network. Happened: pressing Enter did nothing (friction #3); clicking the magnifier navigated to #/explore, loaded MAR-YTHAN-1, and showed a clear status message.
13. Expected: junk searches crash or hang. Happened: SQL/script/emoji/5000-char queries all return a helpful "No network matches …" message explaining what the search looks at. Script tag shown as text, not executed. (05-search-5000chars.png — the 5000-char echo has no length cap, cosmetic)
14. Expected: the Data Library import dialog rejects junk. Happened: filled every metadata field with junk (script tag, SQL, emoji, Arabic, O'Brien) — all accepted as text. Junk CSV in the paste boxes ("Validate and preview") → "Import blocked, 4 errors, 1 warning" with specific reasons and required columns (06-import-junk-validation.png). Import button stayed disabled. Excellent error copy that says HOW to fix it.
15. Expected: a structurally valid CSV of junk species names imports. Happened: validated "Ready to import" (roles normalized with warnings), imported on click; a rapid double-click did NOT create a duplicate dataset (14 → 15). Dataset name "<script>alert(1)</script> 😀🐍 شبكة غذائية O'Brien" rendered as literal text everywhere; no alert ever fired. (07-junk-dataset-imported.png)
16. Expected: second tab shares state. Happened: tab 2 opened on the junk network (shared localStorage); switching to FW-LAKE-B in tab 2 did not disturb tab 1's in-memory state; no corruption.
17. Expected: running the removal on the script-named species breaks rendering. Happened: "Scenario: Direct on <script>alert(1)</script>" shown as text, metrics computed normally (3/4 nodes).
18. Expected: "Remove imported dataset … from this browser" deletes my junk import. Happened: after one click the UI briefly dropped it, but the dataset REAPPEARED after refresh — still in the dropdown, in "15 datasets loaded", and in localStorage. Repeated removal attempts (with the second tab closed) never persisted. (08-junk-dataset-still-present.png) — friction #4. The junk dataset remains in this browser (next tester's localStorage.clear() will wipe it).

## Breakages / friction points

| # | What | URL | What I did | What the app did | Severity | Screenshot |
|---|------|-----|-----------|------------------|----------|------------|
| 1 | Several header/CTA buttons (nav "Experiment Studio", hero "Experiment Studio", "Submit search") are unclickable by Playwright's actionability check — they appear to never reach a stable state (perpetual animation), even though nothing covers them | http://localhost:4173/ and #/experiment | Tried to click the buttons | Pointer-coordinate clicks worked; likely a CSS animation keeps elements "unstable". Human impact probably small but it smells like constant re-render/animation | 2 | — |
| 2 | Experiment result + species selection lost on refresh | http://localhost:4173/#/experiment | Ran a removal, hit F5 | Studio reset to default sub-view; run result and selection gone. Mitigated: Overview "Recent or current analysis" persisted the run | 2 | — |
| 3 | Enter key does not submit the header search | http://localhost:4173/ | Typed "Ythan", pressed Enter | Nothing happened; only the magnifier button submits | 2 | — |
| 4 | "Remove imported dataset" does not persist — imported dataset cannot be deleted | http://localhost:4173/#/library | Imported a dataset, clicked Remove, reloaded | Dataset resurrected after refresh; storage still contains it after 3 removal attempts (also with second tab closed). Junk dataset is stuck in this browser | 3 | 08-junk-dataset-still-present.png |
| 5 | Species filter shows no empty-state message when nothing matches | http://localhost:4173/#/experiment | Filtered with junk / 5000 chars | Species list silently disappears, no "no species match" hint (contrast: header search does explain) | 1 | 04-filter-junk-unicode.png |
| 6 | Import dialog paste section is collapsed inside a <details> whose toggle is easy to miss; paste textareas are invisible to the a11y snapshot when collapsed | http://localhost:4173/#/library | Looked for the paste boxes | Had to find and open the details toggle manually; label click on the text did not toggle it | 1 | — |
| 7 | Dataset counter not updated in sync after removal attempts ("15 datasets loaded" while UI briefly showed the dataset gone) | http://localhost:4173/#/library | Clicked Remove | Counter stayed 15 regardless of transient UI state | 1 | 08-junk-dataset-still-present.png |

No crashes, no blank screens, no error boundaries, no stuck spinners, no duplicate records, no script execution, no data corruption of built-in datasets.

## Junk-input table

| Input | Field | App response |
|---|---|---|
| empty string | species filter | accepted (no-op) |
| 😀🐍 | species filter | accepted, renders as text, list empties silently |
| شبكة غذائية (Arabic) | species filter | accepted, renders correctly (RTL text fine) |
| O'Brien | species filter | accepted, literal rendering |
| <script>alert(1)</script> | species filter | accepted, literal text, no execution |
| '; DROP TABLE nodes; -- | species filter | accepted, literal text, no crash |
| 5000 × "A" | species filter | accepted, instant, page responsive |
| 😀🐍 + Arabic + O'Brien + script tag (combined) | Dataset name (import) | accepted; imported dataset name renders as literal text |
| '; DROP TABLE nodes; -- | Source citation (import) | accepted as text |
| Z'zz"zz \\ / ? * < > \| : | Origin / repository (import) | accepted as text |
| 😀://not-a-doi | Source URL or DOI (import) | accepted with warning METADATA_URL_UNUSUAL explaining expected formats (how to fix: yes) |
| CC-😀-4.0 <script>alert(2)</script> | Licence (import) | accepted as text, no execution |
| شبكة غذائية | Node unit (import) | accepted as text |
| <script>alert(3)</script> | Node CSV paste (import) | REJECTED: "Import blocked — 4 errors": MALFORMED_CSV, MISSING_COLUMNS (id, name / source, target), EMPTY_NETWORK; message states required columns (how to fix: yes); Import stays disabled |
| '; DROP TABLE nodes; -- | Link CSV paste (import) | REJECTED in same validation report |
| valid CSV with junk species names (emoji/Arabic/O'Brien/script) | Node + Link CSV paste | ACCEPTED after validation ("Ready to import", 0 errors, role-normalisation warnings) — imported successfully |
| '; DROP TABLE nodes; -- | header search | rejected gracefully: "No network matches …" + scope explanation |
| <script>alert(1)</script> | header search | rejected gracefully, literal text |
| 😀🐍 | header search | rejected gracefully |
| 5000 × "B" | header search | rejected gracefully, full 5000-char echo (no cap) |

## Console / network capture
Console/network capture not available — not tested. Runtime crashes were checked via page snapshots (none observed).

## Cleanup
Tried to remove the imported junk dataset via the library's Remove button three times (also after closing the second tab): removal never persisted; the dataset was still present in the dropdown, the dataset counter and localStorage at the end. The next tester's session-clear step will remove it.

Reached first success: yes. Actions taken: 58.
