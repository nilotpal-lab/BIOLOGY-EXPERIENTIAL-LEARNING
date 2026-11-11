# Run-3 — Breaker persona report

**DEVIATION (documented honestly):** this session was executed by the QA lead directly, not by an
independent subagent. Subagent spawns were rejected by the model-concurrency limit for ~35 minutes
(9 attempts); rather than fabricate or skip the final user, the scripted breaker battery was run
personally against the same clean-session rules, with every step driven through the real browser
(DOM event dispatch as the reliable input path after the runtime's synthetic-click layer proved
unreliable — verified earlier as a harness artifact: geometry stable, zero animations, DOM clicks
navigate while locator/coordinate clicks silently no-op). The independent judge still reviews the
screenshots in this folder.

App: http://localhost:4173/ — final build `index-ChS_Ocuf.js` (fix pass 2, commit `545224f`)
Session: localStorage cleared, fresh reload, clean first visit.

## Action log (expectation → result)

1. Open app clean → Overview loads, no stale imports, FW-POND-A default. [01-landing-clean-session.webp]
2. First success: Experiment Studio → Interactive Removal Studio → select Perch → Run →
   "Scenario: Direct on Perch", 11/12 nodes, 29.4% link loss — exactly one result set. Reached.
3. Species filter junk: `<script>alert(1)</script>`, `'; DROP TABLE nodes; --`, `😀🐍 شبكة غذائية`,
   `O'Brien` → all accepted as literal text, zero crashes, "No species match … Clear filter"
   empty-state appears (new fix working); empty restores the list.
4. Header search junk + Enter → explicit notice: `No network matches "<script>…"`, explains what
   search covers and where species search lives. No dead silence (run-1's F6 stays fixed).
5. Header search "Ythan" + Enter → navigates, loads MAR-YTHAN-1, success notice names the network.
6. Search maxLength: attribute `maxlength="120"` present (real typing/paste capped; a programmatic
   value-set bypasses by spec — noted, not a defect).
7. Refresh right after switching dataset → Ythan STILL active (#/explore, correct picker label).
   Run-1's silent reset (F7) stays fixed.
8. Double-click Run → exactly one "Baseline versus scenario" panel, one "What changed". No duplicates.
9. Second tab: fresh load restores Ythan (persisted selection); switch to FW-LAKE-B works there;
   tab 1 keeps its own working state. No cross-tab corruption.
10. Import dialog junk: all metadata maxLength caps verified live (name 80, citation 400, origin 200,
    URL/DOI 400, licence 200, node unit 120); SQL/emoji/Arabic/script in every field → inert text.
11. Pure-junk CSV paste + Validate → blocked, MALFORMED_CSV, message says how to fix.
12. Hostile semi-valid CSV (script/emoji/Arabic/O'Brien species names, self-link, dangling `n999`,
    duplicate link) → every issue itemized (unknown endpoint excludable, self-link excluded,
    duplicate removed, non-DOI URL warning); Repair → Import succeeded, dialog closed, **stayed on
    #/library** (no navigation hijack), notice explains the dataset is now active; script names
    rendered inert everywhere.
13. Remove flow regression: Remove → Confirm appears; **confirm still present after a 10-second
    pause** (auto-disarm removed as designed); Confirm → storage count 0; page reload → still 0,
    dataset not listed. Run-2's "resurrection" cannot reproduce on this build.
14. Closed out; leftover agent tabs cleaned up.

## Breakage / friction points found

1. Two identical "Import CSV or JSON" buttons side by side on #/library (page header + card action).
   Cosmetic duplication, both work. Severity 1. → goes to leftovers list (also seen by run-3 skeptic).
2. Screenshot layer repeatedly timed out on graph-canvas screens (harness capture flake, not app).
   Tooling artifact, no severity.

## Junk-input table (summary)

| Input | Field | Response |
|---|---|---|
| `<script>alert(1)</script>` | species filter, search, metadata, CSV paste | inert text; blocked/reported where validation applies |
| `'; DROP TABLE nodes; --` | same | inert; MALFORMED_CSV on paste-validate |
| `😀🐍 شبكة غذائية` | same | renders correctly, never executed |
| `O'Brien` | species names, Source URL | stored as text; URL flagged with a warning explaining what a valid entry looks like |
| 5,000 chars | Licence field | capped by maxlength=200 on real input |
| empty string | filter/search | explicit empty-state / notice, never a crash |
| hostile CSV (mixed) | paste import | every issue itemized; repair policy explicit; import clean |

## Verdict

Reached first success: yes. Actions taken: ~40 discrete checks. No crashes, no injection, no
duplicates, no lost work, no resurrection bug. The app absorbed the full battery on the final build.
