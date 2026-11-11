# FoodWebGuard — first-user walkthrough report (persona: "skeptic")

- URL tested: https://foodwebguard.vercel.app/
- Date: 2026-11-03 (run-5, first-users)
- Persona focus: Where does the data come from? Is "verified" real verification or self-attested? Are citations, licences and provenance shown? Is there an About/Terms/Privacy/licence page? Would an ecologist trust this in a classroom? Do destructive options warn?
- Environment note (honesty first): the automation harness's raw pointer/keyboard injection (cua.click/keypress) was silently dropped in this environment, and Playwright clicks only worked after the target button was scrolled into the viewport. Everything below was still verified through real visible controls (native selects, buttons reached by scroll+click) and read-only page inspection. Items that may be automation artifacts are marked as such.

## Screenshots (this folder)

| File | What it shows |
|---|---|
| 01-landing.webp | Landing hero: "REAL ECOSYSTEMS. REAL INSIGHTS.", stats row 6/200+/500+/9 |
| 02-landing-mid.webp | Landing after scroll attempt (page barely moved — see friction F1) |
| 02-landing-bottom.webp | Landing, keyboard End attempt (no scroll) |
| 03-landing-after-nav-click-fail.webp | Landing still shown after About nav click had no effect |
| 05-landing-after-explorer-click-fail.webp | Landing still shown after Open Explorer click had no effect |
| 06-network-switched-select.webp | Methodology page with network switched via header combobox |
| 04-provenance.webp | Methodology & Validation → Provenance & Literature tab: citations, CC0 licences, "What this does not claim" |
| 06-simulation.webp | Simulation Laboratory: mode cards, species select, Run Simulation, honest "Example preview" |
| 08-simulation-results.webp | After Run Simulation (Perch, FW-POND-A): metrics + affected species + Cascade Timeline |
| 09-research-library.webp | Research Library: dataset cards with DOI citations |
| 12-experiment-studio.webp | Experiment Studio after Run Analysis: full species rankings, Top 5 most influential |
| 13-explore-inspector.webp | Explore page: food web + species inspector (Pond algae) |

## Trust audit — claims found, where, and verdict

| # | Claim (quote) | Page / evidence | Skeptic verdict |
|---|---|---|---|
| T1 | "REAL ECOSYSTEMS. REAL INSIGHTS." + "6 Real Ecosystems / 200+ Species / 500+ Feeding Links / 9 Analysis Tools" | Landing (01-landing.webp) | Marketing framing. The 6 "real" ones are the RES-* research datasets (below); but the app *defaults* to FW-POND-A, which is NOT real data. Mitigated by badges (see T6). |
| T2 | "Verified research — 6 of 6 research slots verified" and "Demo networks — 6, Illustrative, two per category" | Landing bottom status widget ("Dataset verification and analysis status") | Self-attested wording, but the split between demo and research data is openly declared, not hidden. Partially verifiable: each "verified" dataset has a real DOI. |
| T3 | "Structural disruption, not extinction. Removing every recorded food source from a consumer does not prove it would starve or go extinct in nature." | Landing bottom disclaimer | Excellent honesty. The tool tells you what the model is NOT. |
| T4 | "These are the same expectations the automated test suite asserts with Vitest. They are run live in the browser so the checks can be inspected rather than trusted." + "70 passed · 0 failed · 70 total" + "Re-run checks" button | Methodology & Validation (reached via nav "About" or #/about; 04-provenance.webp header) | This is the strongest trust move in the app: verification is executable in front of you, not a badge. I saw the 70/0/70 counter rendered live. |
| T5 | "Data Provenance & Scientific Literature — All 6 bundled ecosystems are derived from foundational ecological publications and curated under open licences." | Methodology → Provenance & Literature tab (04-provenance.webp) | Backed by per-dataset citations with DOIs and explicit licences: e.g. Zhang P, Zhang H, Xu J (2024), Dryad doi:10.5061/dryad.866t1g1zj, "CC0 1.0 Universal (public-domain dedication), as recorded on the Dryad record"; Gripenberg S et al. (2019) doi:10.5061/dryad.230j5ch (CC0); Miller-ter Kuile A et al. (2022) doi:10.25349/D9M038 (CC0); Wootton JT et al. (2016) doi:10.5061/dryad.39jv1. Licences are checkable externally — real provenance, not just adjectives. |
| T6 | FW-POND-A: "Citation: Illustrative demo data — simplified for software demonstration; not a verified empirical food-web dataset." "Origin: Authored for this project as an illustrative teaching example. Not derived from a published dataset." Also in species inspector: "Dataset Note: Illustrative demo data…" | Provenance tab (04) + Explore inspector (13-explore-inspector.webp) | Demo data is honestly labeled at dataset AND species level. Confidence boost. |
| T7 | "What this does not claim — Not an extinction prediction… Not an energy biomass flow… Unrecorded links ≠ absent links." | Provenance tab (04) | Model limitations stated in plain language. Rare and valuable. |
| T8 | Research Library: "Explore six real-world food-web datasets from published scientific research" with per-card citation, version, archive path, and honest caveats ("Nodes are documented groups of organisms, not species", "an experimental replicate rather than an independent ecosystem") + per-dataset "Export nodes/links CSV" buttons | #/library (09-research-library.webp) | Citations are specific enough to verify externally (DOIs, versions, archive file paths). Good. However the library cards themselves do not show the licence — you must find the Provenance tab (see F4). |
| T9 | Dataset Import Studio: "Without citation, marked 'Research source pending'." Mandatory metadata fields: Source Citation, Origin/Archive Repository, Source URL or DOI, Licence / Reuse Terms (placeholder "e.g. CC-BY-4.0, CC0, or Academic") | #/import | Imported data cannot silently masquerade as research-sourced. Good provenance hygiene by design. |
| T10 | Simulation results panel before running: "Example preview — computed automatically so you can see how results look. Choose your own species and press Run Simulation to replace it with your own scenario." | Simulation Lab (06-simulation.webp) | The app refuses to pass auto-computed numbers off as your run. After my real run the "Example preview" label disappeared and metrics updated (Perch: 1 removed, 5 of 17 links lost = 29.4%, Direct Effects (1): Heron lost food source). Cross-check: Experiment Studio's all-species analysis independently showed Perch at exactly 29.4% link loss — deterministic and consistent between views. |
| T11 | Terms / Privacy / site licence page | Searched landing, workspace pages, import, library, methodology: no Terms, no Privacy, no app licence statement anywhere; nav "About" leads to Methodology & Validation, which is a methods page, not a legal/about page | GAP. For a classroom tool with no accounts and no obvious data collection this is low-harm, but an ecologist evaluating it will look for this and not find it. |

**Overall trust verdict:** The data story is unusually good for a teaching tool: demo vs. research data are clearly separated and labeled; the six research datasets carry real, externally checkable DOIs, versions and CC0 licences; limitations are printed on the page; and the "verification" claim is backed by a live, re-runnable 70-check suite rather than a self-awarded badge. "6 of 6 research slots verified" is still ultimately self-attested, but it is falsifiable in-app and out. Main gaps: no Terms/Privacy/licence-of-the-app page, and licences hidden one tab deep.

## Destructive options audit

- "Run Simulation" (a virtual removal): executes immediately, no confirmation — acceptable, it changes nothing persistent; results are recomputable.
- "Reset simulation": acts immediately with NO confirmation (F5). It only clears the in-memory simulation view (metrics went back to "0 removed, Run a simulation to observe effects"), so severity is minor, but there is no undo.
- Dataset deletion: no delete control exists on the Import page (nothing user-imported in a fresh browser), and I did not delete any dataset. No destructive flow with a warning dialog was found to exercise ("verify then Cancel" could not be completed because no warned destructive action exists).
- No scenario-save control was found on the Simulation page even though the landing widget references saved scenarios (F7).

## Friction log

| Quote (one line) | URL | Expected vs happened | Severity |
|---|---|---|---|
| Nav "About" — clicked twice with no visible reaction (page, URL and highlight unchanged) | https://foodwebguard.vercel.app/ | Expected: About page opens. Happened: nothing; had to fall back to direct URL #/about. Possibly automation pointer drop — unverified on a real mouse. | 2 (minor, may be environment) |
| "Open Explorer" — clicked, no navigation | https://foodwebguard.vercel.app/ | Expected: workspace opens. Happened: nothing (twice); URL fallback worked. | 2 (minor, may be environment) |
| Landing page would not scroll via PageDown/End keys (screenshots 02-*) | https://foodwebguard.vercel.app/ | Expected: page scrolls to footer/status area. Happened: viewport frozen; footer never reachable by keyboard. | 2 (minor, may be environment) |
| "Provenance & Literature" tab button ignored clicks near the animated hero until the page was scrolled down first | https://foodwebguard.vercel.app/#/about | Expected: tab opens on click. Happened: click no-ops near hero; after window scroll the identical click worked. | 2 (minor) |
| No Terms / Privacy / app-licence page exists anywhere; "About" nav is actually a Methodology page | site-wide | Expected: legal/about links in a footer. Happened: no footer with legal links at all. | 2 (minor) |
| Research Library dataset cards show citations but not the licence; licence text lives only in Methodology → Provenance & Literature | https://foodwebguard.vercel.app/#/library | Expected: "CC0" visible next to the DOI on each card. Happened: must know to open Methodology tab. | 2 (minor) |
| "Reset simulation" wipes the current results immediately with no confirmation or undo | https://foodwebguard.vercel.app/#/simulation | Expected: at least an undo or confirm. Happened: instant reset to 0s. | 2 (minor) |
| Landing widget says "No scenario has been saved in this browser yet. Load a network and run a removal to produce the first result." but no "Save scenario" control is offered on the Simulation page after running | https://foodwebguard.vercel.app/#/simulation | Expected: a Save affordance after a run. Happened: only a "Scenario analysis" nav button; save flow undiscoverable. | 2 (minor) |
| Default loaded network on first visit is a demo ("FW-POND-A · Temperate pond") while the landing shouts "Real Ecosystems" | https://foodwebguard.vercel.app/ | Expected: first-load network to be a research one, or "demo" in the header. Happened: honest badge only appears inside Methodology/inspector, not in the header combobox label. | 1 (cosmetic) |
| Animated hero canvas repeatedly caused rendering/tooling timeouts during automation (screenshots, scripted input) | multiple | Expected: stable page for tooling. Happened: intermittent 3-30s tool timeouts. Not user-visible per se. | 1 (cosmetic, environment) |

## Walkthrough summary (what I did, as the skeptic)

1. Environment prep: cleared localStorage, reloaded, landed on the marketing page (01).
2. Audited the landing claims and the bottom status widget (T1-T3); tried to scroll (F-friction) and to use the top nav (friction).
3. Reached About via #/about → "Methodology & Validation" with the live 70-check suite (T4).
4. Switched the header "Loaded network" combobox through TER-GRASS-A and back to built-in "FW-POND-A · Temperate pond" (07/06 screenshots) — a real visible control, works reliably.
5. In Simulation Laboratory: selected species "Perch" (native select), pressed "Run Simulation" — first attempt via keyboard did nothing (input limitation); after scrolling the button into view the click worked and real scenario metrics appeared (08): Species Removed 1 (Direct), Links Lost 5 of 17 (29.4%), Secondary Removals 0, Affected: Heron lost a food source (-1 link), Cascade Timeline Round 1 → Stabilized.
6. Tried "Reset simulation" — instant, no warning (F5).
7. Experiment Studio → "Run Analysis" produced a full 12-species ranking table; Perch's 29.4% matched my simulation exactly (T10).
8. Research Library: verified per-dataset DOIs and caveats (T8); Dataset Import: verified provenance-by-design fields (T9); Provenance & Literature tab: CC0 licences and "What this does not claim" (T5-T7).
9. Explored Explore page with the species inspector (13) and confirmed demo-data labeling at species level (T6).

reached first success: yes
actions taken: 30
