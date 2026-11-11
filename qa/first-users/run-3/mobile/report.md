# First-time mobile user report — FoodWebGuard (run-3, mobile 375x667)

Persona: first-time user on a small phone (375x667 touch screen, touch-only).
Note: network/CPU throttling not available — not tested. Console error / failed-request capture: not available — not tested.

## Action log

1. Opened http://localhost:4173/ (clean session). Expected: app loads. Happened: home "Ecosystem Overview" loaded with a clear onboarding line ("New here? Pick a network → remove a species → read the impact. Start with the green Experiment Studio button."). Screenshot 01-home.webp.
2. Tapped the green "Experiment Studio" button in the hero. Expected: go to the experiment screen. Happened: my first two automated taps timed out (they targeted a hidden duplicate of the button in the collapsed nav — tooling artifact, the control itself works); a direct tap on the visible button navigated to http://localhost:4173/#/experiment.
3. Read the Experiment Studio header. Expected: a way to pick a dataset. Happened: "Loaded network" dropdown with 14 networks (6 demo, 6 research, 2 validation fixtures), stats panel showed FW-POND-A: 12 species / 17 links.
4. Picked "Marine · MAR-COAST-A · Coastal shelf" from the dropdown. Expected: network loads. Happened: stats updated instantly to 13 species / 22 links / connectance 0.141, breadcrumb changed to MAR-COAST-A.
5. Tapped "Interactive Removal Studio" ("remove one species you choose"). Expected: a setup panel. Happened: "Experiment Setup" appeared with a 13-species list, a propagation rule selector where "Direct Removal — Immediate link loss only" was already selected by default, and a disabled "Run Experiment" button with the helpful caption "Select a target species above to enable Run Experiment."
6. Scrolled down and tapped "Zooplankton". Expected: species selected. Happened: selection shown, "Run Experiment" became enabled.
7. Scrolled down and tapped "Run Experiment". Expected: results. Happened: "Simulation Results & Preview" showed "Scenario: Direct on Zooplankton" with metrics: Nodes Remaining 12/13 (92.3%), Secondary Removals +0, Link Loss 18.2% (−4 links), Directly Affected 3, Food Depleted 1, Connectance 0.136 post-removal. Screenshot 03-direct-removal-results.webp. FIRST SUCCESS.
8. Checked the page top again and closed the tab.

## Friction points

1. "First two taps on 'Experiment Studio' did nothing" — http://localhost:4173/#/ (home). Expected tap goes to experiment screen; actual: my taps resolved to an invisible 0x0 duplicate button in the collapsed mobile nav (only the coordinate tap on the visible button worked). Tooling artifact — no severity (the visible control works fine for a finger).
2. "Tap targets are under thumb size" — #/experiment (and home hero). Expected ≥44px touch targets; actual: hero buttons "Explore Workspace"/"Experiment Studio" 36px tall, "Analyse all species" 32px, "Run Experiment" 36px, ranking metric tabs 36px (species list buttons were a good 44px). Severity 2. (01-home.webp, 03-direct-removal-results.webp)
3. "After Run Experiment, nothing visibly changed until I scrolled" — http://localhost:4173/#/experiment. Expected: results appear in view after tapping Run; actual: results rendered below the fold, page stayed scrolled where it was, I had to swipe down myself to find the metrics. Severity 2. (03-direct-removal-results.webp)
4. "Dropdown shows internal test fixtures" — #/experiment, "Loaded network" select. Expected: only real datasets for a first-time user; actual: options like "VALIDATION-FOODWEB-6 (manual test network) — validation fixture (internal test)" are listed next to real networks. Confusing for a newcomer. Severity 2.
5. "Page felt busy / capture would not settle" — #/experiment screens containing the animated network canvas: repeated screenshot-surface timeouts (5 of 7 attempts) and one 30s swipe-command timeout. I could not verify visual smoothness, so this is only a suspicion of constant repainting (jank/battery on a slow phone). Console/network capture not available — not tested. Severity 1.

## Horizontal overflow checks (scrollWidth vs clientWidth)

- Home http://localhost:4173/#/: 365 vs 365 — no horizontal overflow.
- Experiment Studio http://localhost:4173/#/experiment (setup): 365 vs 365 — no horizontal overflow.
- Experiment Studio results (after run): 365 vs 365 — no horizontal overflow.

## Screenshots

- 01-home.webp — home / Ecosystem Overview.
- 03-direct-removal-results.webp — direct-removal results (Scenario: Direct on Zooplankton).
- 02 (Experiment Studio initial state) could not be captured — screenshot surface timed out repeatedly (see friction point 5).

Reached first success: yes. Actions taken: 6. Quit at: n/a.
