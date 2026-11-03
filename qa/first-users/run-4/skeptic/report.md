# FoodWebGuard — first-user walkthrough report (persona: "skeptic")

- URL tested: https://foodwebguard.vercel.app/
- Date: 2026-11-03
- Browser: ZCode embedded browser, viewport 1366x850, localStorage cleared before walkthrough
- Persona goal: load a food-web dataset, select a species, run a removal scenario, see results — while auditing every trust claim.

---

## 1. Trust audit

Every trust/provenance claim I encountered, in the order I met it. Verdicts are my judgement as a skeptical ecologist/teacher.

### 1.1 Marketing home page (`#/`, screenshots 01, 02, 03)

| Claim | Where | Verdict |
|---|---|---|
| "REAL ECOSYSTEMS. REAL INSIGHTS." | Hero, 01-home-top.png | Marketing; backed later by actual DOI-cited datasets on the Provenance tab. Partly supported. |
| Stats: "6 Real Ecosystems / 200+ Species / 500+ Feeding Links / 9 Analysis Tools" | 01-home-top.png | Checkable and true in-app: the dataset selector lists 10 networks (6 research + 2 illustrative + 2 validation); 395+57+110+87+14+11 nodes ≫ 200; links ≈ 322+98+869+373+39+18+17 ≫ 500. Supported. |
| "Research Library — Explore 6 real-world ecosystems from scientific literature" | 02-home-footer.png | Supported — each dataset has a citation (09, 10). |
| "Methodology & Validation — Formulas, assumptions and live validation tests" | 02-home-footer.png | Supported — live self-test suite exists (04). |
| "…across 6 verified research ecosystems" | 02-home-footer.png | "Verified" = curator self-attestation, but defined and evidenced (see 1.4). |
| **No footer, no Terms / Privacy / Licence links anywhere** | whole site | **Gap.** There is no About page, no Terms, no Privacy policy, no contact. The nav "About" button silently routes to the Methodology page (`#/methodology`, 08-about.png). For a classroom tool this is the biggest trust gap — I could not find who made this or under what terms. |

### 1.2 Methodology & Validation page (`#/methodology`, screenshots 04, 05, 05b)

| Claim | Where | Verdict |
|---|---|---|
| "SCIENTIFIC FOUNDATIONS & PROVENANCE" banner; "These are the same expectations the automated test suite asserts with Vitest. They are run live in the browser so the checks can be inspected rather than trusted." | 04-methodology-top.png | This is the single most trust-building sentence in the app: it explicitly asks NOT to be trusted. |
| "70 passed · 0 failed · 70 total" with a "Re-run checks" button | 04, 05 | Counter exists, but clicking "Re-run checks" produced **no visible feedback** on two attempts (no spinner, no change, no timestamp) — I cannot confirm the checks actually re-ran. Severity 2. |
| Formula transparency: discrete Lotka-Volterra `N(t+1) = N + rN(1-N/K) − ΣαNN`, Connectance `C = L/(N(N−1))`, Link Loss %, Secondary Extirpation Criterion `Extinction(v) ⇔ deg⁺(v)=0` | 04 | Real formulas with guards ("Never divided by zero", "guard applies for N < 2"). Genuinely transparent. |
| "Active Metric Verification (Zooplankton) … Standard Benchmark: Link Loss 17.6% (3 of 17), Direct Affected 2, Secondary 0, Cascade Depth 0" | 04 | **I reproduced this exact result myself** by running the same removal in the Simulation Lab (23-results-metrics.png: "3 out of 17 (17.6%)", Direct Effects 2, Secondary 0). The benchmark is reproducible by a user. Strongly supported. |

### 1.3 Data Provenance & Scientific Literature (`#/methodology` → "Provenance & Literature" tab, screenshot 06)

| Claim | Where | Verdict |
|---|---|---|
| Default dataset FW-POND-A labelled "Illustrative demo — simplified for software demonstration; not a verified empirical food-web dataset"; "Origin: Authored for this project… Not derived from a published dataset"; "Licence: Project-authored illustrative content." | 06-provenance-literature.png | Honest self-labelling of the demo data. Excellent. |
| "Research source verified: provenance and cleaning checks verified by curator." | 06 | **Self-attested by the curator** — it is not an external certification. But the app defines exactly what the badge means and shows per-dataset evidence (see 1.4), which is more than most tools do. Trust with caution: appropriate for teaching, not for research claims. |
| "What this does not claim: Not an extinction prediction / Not an energy biomass flow / Unrecorded links ≠ absent links" | 06 | Explicit limitations box. This is exactly the honesty a skeptic wants. |

### 1.4 Scientific Curation & Provenance Tracker (`#/library`, bottom section, screenshots 18, 19, 20, 21)

| Claim | Where | Verdict |
|---|---|---|
| "a slot is only marked 'Research source verified' when its source, conversion, citation and reuse terms have all been checked. No provenance is invented anywhere in this application." | 19-curation-status.png | Definition is clear and falsifiable. |
| Status chips: "6 verified · 6 sourced · 0 source pending" | 19 | Consistent with the 6 datasets shown. |
| Per-dataset "Verification record and sources" (RES-FW-A example): source files committed verbatim (Dryad doi:10.5061/dryad.866t1g1zj, Pond1/WI1); node/link counts "re-derived from those tables by the test suite: 11 nodes, 18 unique links"; link direction "confirmed from the archive README"; citation recorded; "Reuse terms confirmed on the Dryad record: CC0 1.0"; outbound link to the Dryad deposit | 21 (record content read from the page's own expandable row) | Detailed, specific, externally checkable (real DOIs, real licence terms). Still curator self-attestation — there is no third-party audit — but it is the checkable kind. |
| All 6 datasets carry full citations + CC0 licence statements (Zhang 2024; Gripenberg 2019; Miller-ter Kuile 2022; Wootton 2016; Cirtwill 2019) | 06, 09 | Supported and verifiable via DOI. |
| Download tab: CSV export of species dictionary and feeding links ("Export complete data matrices…") | 10-library-download-tab.png | Data portability — lets me check the data myself. Good. |

### 1.5 Dataset Import modal ("Data Intake Studio", screenshots 12, 13)

| Claim | Where | Verdict |
|---|---|---|
| "Files are parsed and validated strictly in this browser. Nothing is uploaded to any remote server." | 12-dataset-import.png | Consistent with a client-side app; nothing observed contradicting it (no accounts, no network-visible writes). |
| Citation field optional: "Without a citation, marked 'Research source pending'." | 13 (form text) | Confirms the "Research source verified/pending" system is metadata-driven and importer-supplied — i.e. self-attested by design, but honestly labelled. |

### 1.6 Deletion / destructive actions

- I searched every page I visited for remove/delete/trash controls. **There is no in-app dataset deletion at all** — bundled datasets are read-only and imported datasets expose no visible delete UI. Nothing destructive to accidentally click: good for classrooms, though it also means a user cannot remove their own imported data from within the app (only browser-level localStorage clearing would).
- The only reset-type controls are "Reset simulation" (clears the current scenario, non-destructive) and the import form's "Clear". Neither warns, but neither destroys data, so no warning is needed.
- Per instruction I did not delete anything; nothing needed cancelling because no destructive dialog exists.

### 1.7 Overall trust verdict

Would I use it in a classroom? **Yes, with the demo/teaching framing the app itself declares.** The app unusually tells me *not* to trust it ("inspected rather than trusted"), shows its formulas, publishes reproducible benchmarks (which I reproduced exactly), cites real DOI-verified sources with CC0 terms, and honestly flags its demo dataset as non-empirical. The weak points: "Research source verified" is curator self-attestation (no external audit), there is **no About/Terms/Privacy/licence page and no identifiable author or organisation**, and no footer at all.

---

## 2. Friction log

| # | Quote (what I'd say) | URL | Severity | What happened |
|---|---|---|---|---|
| 1 | "Where are the Terms, Privacy or the company behind this? …there's no footer at all?" | https://foodwebguard.vercel.app/ | 3 (major, trust gap) | Home page has no footer and the whole app has no About/Terms/Privacy/licence page; nothing identifies who runs it. |
| 2 | "I clicked 'About' and got… formulas?" | /#/methodology | 2 (minor) | The marketing nav "About" button silently routes to the Methodology page; there is no actual About page. |
| 3 | "A Backswimmer was already 'removed' — I never ran anything." | /#/simulation | 2 (minor) | On first open, Simulation Lab showed a completed run ("Backswimmer Removed", 2 links lost) left over from a previous session's state (shared browser profile/localStorage). For a shared classroom computer this is confusing; there was no "previous run" banner. |
| 4 | "I clicked 'Re-run checks' and… nothing seems to happen." | /#/methodology | 2 (minor) | Two clicks of "Re-run checks" produced no spinner, no timestamp, no visible change — can't confirm the 70 checks re-ran. |
| 5 | "Why won't the page scroll?" (tooling-assisted note: mouse-wheel and PageDown often did nothing until I clicked a blank area first) | several pages | 2 (minor) | Scroll containers need a click first; keyboard scrolling silently fails on some pages. Possibly a keyboard-accessibility issue, not just automation. |
| 6 | "I clicked 'Dataset Import' and nothing happened." | /#/simulation | 2 (minor) | Clicking the sidebar "Dataset Import" item opened the import modal the first time (from the Library page) but did nothing on two later attempts from the Simulation page. |
| 7 | "The verification details won't open when I click them." | /#/library | 2 (minor) | "Verification record and sources" expanders did not visibly open after two clicks (content exists in the page and is verifiable, but the interaction failed for me twice). |
| 8 | "Where's the confirmation that my checks ran… where IS anything?" | /#/methodology | 1 (cosmetic) | The validation status chip shows "70 passed · 0 failed" but never shows *when* it last ran. |
| 9 | "OK, results are here — but the panel is cut off at the top of my screen." | /#/simulation | 1 (cosmetic) | With a completed run, the "Simulation Results" header sits above the fold at 1366x850; I had to scroll to see "Links Lost". |

No blockers (severity 4) encountered. No visible error text, blank areas, or stuck spinners anywhere.

---

## 3. Task outcome

Path to first success: home → Explore (dataset FW-POND-A already loaded; selected "Pond algae", inspector showed trophic level/degree/feeding relationships, 14-explore.png) → Simulation Lab → mode "Direct Removal + Cascade" → species "Zooplankton" → Run Simulation → results appeared: "Zooplankton Removed — Species Removed 1 (Direct), Links Lost 3 of 17 (17.6%), Secondary Removals 0, Total Removed 1 of 12", Affected Species: Tadpole & Minnow each "Lost food source ↓ -1 link", Cascade Timeline Round 1 → Round 3 "Stabilized state, 1 total removed" (22-run-simulation.png, 23-results-metrics.png). The metrics exactly reproduce the Methodology page's "Standard Benchmark" for the same scenario.

Screenshots: 01–24 in this folder (NN-slug.png naming).

reached first success: yes
actions taken: 31
