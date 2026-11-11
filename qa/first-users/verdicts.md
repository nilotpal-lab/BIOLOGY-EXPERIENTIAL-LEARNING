# Independent judge verdicts — findings-run-1 (F1–F12) vs run-2 / run-3 evidence

Judge: independent reviewer, did not fix anything. Method: compared run-1 baseline screenshots
against run-2/run-3 screenshots and reports for the same screens; where screenshots were absent
or ambiguous (F6, F7, F4 residual) I verified the live final build at http://localhost:4173/
myself (browser session, selection restored to FW-POND-A afterwards). Weighed context per
CONTINUE-HERE.md §STATUS: the four run-2 severity claims ("Simulate Removal dead", "removed
import resurrects after refresh", "Enter does not submit search", "buttons never clickable")
are tooling artifacts / changed-by-design, not open app defects; breaker run-3 was QA-lead
executed (documented deviation) and is treated as corroborating, not primary, evidence.

## Verdict table

| Item | Users hit (run-1) | Verdict | Evidence (run-1 vs later) | Residual note |
|---|---|---|---|---|
| F1 | 3 (impatient, non-native, mobile) | FIXED | run-1\impatient\03-removal-studio-setup.webp (rule = border-tint only, no gloss) vs run-2\skeptic\07-experiment-setup.webp and run-2\non-native\05-species-selected.webp (rule card outlined + green tick + adjacent gloss "The active rule is outlined and ticked") | Disabled-Run reason "Select a target species above to enable Run Experiment" is quoted verbatim by 6 run-2/run-3 personas (impatient, non-native, mobile, breaker, skeptic); no later-run complaint about the selected state. |
| F2 | 2 (impatient, non-native) | FIXED | run-1\impatient\02-experiment-studio.webp + run-1\impatient\03-removal-studio-setup.webp (sidebar "Current Network" AND page dropdown "Freshwater · FW-POND-A…" side by side) vs run-2\impatient\04-removal-setup.webp and run-3\impatient\03-removal-studio-setup.webp (single sidebar picker; dataset shown as header text). Mobile single picker: run-2\mobile\03-setup-species-selection-375.webp | None — one picker per viewport on desktop and mobile. |
| F3 | 2 (skeptic, breaker) | FIXED | run-1\skeptic\08-after-removal.webp (instant delete, no confirm) vs run-3\skeptic\06-remove-confirm.webp (inline "Confirm remove" + "Cancel" with "This cannot be undone."); run-2\skeptic\06-remove-confirm.webp / 07-dataset-removed.webp; confirm no longer auto-expires (pass 2) — run-3\breaker\report.md step 13 (QA-lead session): confirm still present after a 10 s pause, removal persists after reload | None. |
| F4 | 2 (non-native ×8 terms, skeptic) | PARTIALLY FIXED | Glosses added: run-1\impatient\01-landing.webp ("Documented taxa", bare "Trophic Levels") vs run-2\impatient\01-landing.webp ("Documented species or groups", "Feeding levels from producers (level 1) to top predators"); deterministic/stochastic expanded sentence + Sensitivity/Interactive gloss in run-2\impatient\04-removal-setup.webp; Propagation-Rule gloss in run-2\non-native\05-species-selected.webp; import roles listed inline in run-3\skeptic\04-importdialog.webp ("trophic_role accepts: producer, basal-group, …") | Live check on final build: "Basal Nodes (In-degree = 0)" / "Top Nodes (Out-degree = 0)" still have NO plain-language gloss (matches run-2 non-native table "No"); mesocosm/detritus/provenance remain (already on leftover list, not counted). |
| F5 | 1 (non-native) | FIXED | run-1\impatient\03-removal-studio-setup.webp (TER-GRASS-A grassland loaded, sidebar caption "Terrestrial Forest") vs run-3\impatient\03-removal-studio-setup.webp (same grassland, caption "Terrestrial ecosystem"); also run-2\non-native\04-experiment-setup.webp and pond side "Freshwater ecosystem" (run-2\impatient\04) | None — captions now truthful and generic. |
| F6 | 1 (breaker) | FIXED | run-2\breaker\05-search-5000chars.webp and run-3\breaker\02-search-5000char-echo.webp (submit navigates to #/explore and shows explicit "No network matches … The global search looks at network names, ids, ecosystems and summaries…" banner; successful search loads MAR-YTHAN-1 with a notice) | Live check (mine): typing "Ythan" + Enter (DOM-dispatched, the reliable input path) navigated to #/explore with "Network loaded — Search 'Ythan' matched one network: MAR-YTHAN-1…". The run-2 "Enter does not submit" claim is a tooling artifact — reproducible only through the synthetic keyboard layer, disproven via real input path (disproven live, also by QA lead). Search input maxLength=120 present (pass 2). |
| F7 | 1 (breaker) | FIXED | No dedicated screenshot exists in any run. Live check (mine, final build): switched sidebar to "MAR-YTHAN-1 · Ythan Estuary food web (Scotland)", reloaded the page → combobox still shows MAR-YTHAN-1. Corroborated by run-2\breaker\report.md step 16 (fresh second tab restored the last-selected network) and run-3\breaker\report.md step 7 (QA-lead session: Ythan still active after refresh) | None. |
| F8 | 2 (mobile, non-native) | PARTIALLY FIXED | Metric "(i)" buttons: no undersized-tap complaint in run-2 or run-3 (run-2\mobile\report.md F6 "most other controls felt fine"); species chips reach 44px on the final build (run-3\mobile\report.md). Compared run-1\mobile\03-scenario-metrics-375.webp vs run-2\mobile\05-results-metrics-375.webp | Graph zoom controls are STILL icon-only — identical +/−/expand/reset icon row in run-1\impatient\04-direct-removal-results.webp and run-3\impatient\04-direct-removal-results.webp (FoodWebGraph.tsx untouched by both fix commits); tooltip-only labels still useless on touch. Mobile hero/Run 36 px is a known leftover; "Analyse all species" measured 32 px (run-3 mobile) — same class. |
| F9 | 2 (skeptic, breaker) — 4 sub-causes | FIXED | (a) format-scoped validation: run-2\breaker\06-import-junk-validation.webp shows per-file errors ("Node file: required column(s) missing: id, name" / "Link file: … source, target") with how-to-fix copy; run-3 skeptic pasted JSON after switching tabs and validated clean (no stale cross-format error). (b) run-1\skeptic\04-import-dialog.webp (Freshwater silently pre-selected) vs run-3\skeptic\04-importdialog.webp (hint: "Freshwater is pre-selected — change it if your network is terrestrial or marine."). (c) METADATA_URL_UNUSUAL warning in run-2\breaker\06 + maxLength caps verified (run-3 breaker step 10, QA-lead; my live check confirmed maxlength on fields/search). (d) no forced navigation: run-2 skeptic stayed on #/library after import; run-3 breaker step 12 "stayed on #/library (no navigation hijack)" | None of the four sub-causes resurfaced in run-3. |
| F10 | 1 (mobile) | FIXED | run-1\mobile\02-workspace-375.webp (graph section directly after the dataset card) + run-1\mobile\03-scenario-metrics-375.webp (Run panel far below) vs run-2\mobile\03-setup-species-selection-375.webp and run-2\mobile\05-results-metrics-375.webp (mode tabs → Experiment Setup with species/rule/Run; graph now last — run-3\mobile\03-direct-removal-results.webp) | "Results render below the fold with no auto-scroll" is the known leftover, not this finding (panel order itself is fixed). |
| F11 | 1 (impatient) | PARTIALLY FIXED | run-1\impatient\01-landing.webp (no guidance line) vs run-2\impatient\01-landing.webp ("New here? … Start with the buttons on the right.") and run-3\impatient\01-landing-overview.webp (pass-2 position-neutral "Start with the green Experiment Studio button."; mobile wording in run-3\mobile\01-home.webp) | Path prominence is solved (every skimmer persona in run-2/run-3 followed the tip to first success), but both run-2 and run-3 impatient still log "wall of text" (sev 1) — page density itself unchanged. |
| F12 | 1 (non-native) | FIXED | run-1\impatient\01-landing.webp ("Illustrative demo" badge, explainer hover-only) vs run-2\impatient\04-removal-setup.webp and run-2\mobile\03-setup-species-selection-375.webp (badge + always-visible "Illustrative teaching data — not field evidence"); run-3 skeptic additionally saw the full visible sentence "Illustrative demo data — simplified for software demonstration…" | None. |

## Needs-a-human items (declared out of engineering scope)

| Item | Verdict | Evidence |
|---|---|---|
| 1. "Research source verified" self-attested — suggested Methodology rewrite | NOT REACHED | No run-2/run-3 screenshot shows the suggested rewrite applied; the library's pre-existing three-step "How verification works" text is the same as run-1 (run-1\skeptic\07-imported-card.webp vs run-3\skeptic\03-datalibrary.webp). No fix commit touches this wording. |
| 2. No About / Terms / Privacy page | NOT REACHED | run-3\skeptic\report.md re-confirms "no Terms of Use / formal app-level licence page and no contact or author page"; nothing later shows the app addressing it. |

## New observations in run-2/run-3 that are app defects and NOT on the known-leftovers list

1. **"Lost ≥1 food source" caption uses a bare "≥" symbol** — flagged sev 1 by the non-native
   persona in BOTH run-2 (F8) and run-3 (F11); still visible on final-build result cards
   (run-2\non-native\06-results.webp, run-3\impatient\04-direct-removal-results.webp).
   "1 or more" wording would resolve it.
2. **Placeholder-only labels on both search boxes** (header search + species filter) — sev 1 in
   run-2 non-native F6 and run-3 non-native F10; unchanged on the final build.
3. **VALIDATION-… fixtures remain in the network picker on the final build.** Pass 2 added the
   tag "— validation fixture (internal test)" (visible in the picker today), but run-3 mobile
   (sev 2) and run-3 skeptic still flag them as confusing for a newcomer — labelling reduced but
   did not eliminate the complaint; removing/hiding them would.
4. **Minor, design-adjacent:** experiment result + species selection are not restored after a
   refresh (run-2 breaker, sev 2) — mitigated because the run is recorded under "Recent or
   current analysis" on the Overview; not disproven and not on the leftovers list, so recorded
   here for the final report to rank.

Also seen again in run-3 but already on the known-leftovers list (not counted): duplicate
"Import CSV or JSON" buttons on #/library, ~36 px hero/Run buttons on mobile, results below the
fold with no auto-scroll, Explorer/Workspace naming spread (plus the related duplicate
accessible name "Experiment Studio" on nav + hero), mesocosm/detritus/provenance vocabulary.

## Counts

- FIXED: 9 (F1, F2, F3, F5, F6, F7, F9, F10, F12)
- PARTIALLY FIXED: 3 (F4, F8, F11)
- NOT FIXED: 0
- NOT REACHED: 2 (the two needs-a-human items; all 12 engineering findings were revisited by later runs)

Live checks performed by the judge on http://localhost:4173/ (final build): F7 persistence across
reload; F6 Enter-submit + "Network loaded" notice + maxLength=120; F4 residual terms; fixture
labelling. Dataset selection restored to FW-POND-A afterwards; no app files edited.
