# First-time user report — impatient persona (run-1)

App: http://localhost:4173/ — FoodWebGuard
Session: clean localStorage, first visit.
Note: console/network capture not available in this browser — not tested.

## Action log

1. Expected: open the app and find how to run a scenario. Happened: landing "Overview" page with lots of intro cards, stats (12 species / 17 interactions), a "Current Network" dropdown already set to FW-POND-A, and a "Simulate Removal" quick action. I skimmed and went for the nav. (01-landing.png)
2. Expected: "Experiment Studio" in the top nav takes me to simulations. Happened: Experiment Studio page loaded with a "Loaded network" dropdown, "Interactive Removal Studio" and "Systematic Sensitivity Scan" buttons. (02-experiment-studio.png)
3. Expected: pick a dataset from the "Loaded network" dropdown. Happened: chose "Terrestrial · TER-GRASS-A · Temperate grassland"; stats updated to 14 species / 29 feeding links. Both the sidebar dropdown and the page one switched together.
4. Expected: "Interactive Removal Studio" is where I remove a species. Happened: species button list appeared plus "Direct Removal" / "Structural Cascade" rule buttons; "Run Experiment" was disabled. (03-removal-studio-setup.png)
5. Expected: clicking "Grasshopper" selects it. Happened: header changed from "None selected" to "Grasshopper" and "Run Experiment" became enabled.
6. Expected: make sure "Direct Removal" is the active rule (couldn't tell which was pre-selected, so I clicked it). Happened: no error, stayed on Direct Removal.
7. Expected: "Run Experiment" shows me numbers. Happened: results panel instantly showed "Scenario: Direct on Grasshopper" — Nodes Remaining 13/14 (92.9%), Secondary Removals +0, Link Loss 20.7% (-6 links), Directly Affected 4, Food Depleted 0, Connectance 0.147 post-removal. (04-direct-removal-results.png)

## Friction points

1. "ugh, too much reading before I can do anything."
   - URL: http://localhost:4173/ (hash route: none/overview)
   - Expected: an obvious "run a scenario" entry point. Actual: landing page is a wall of overview cards, methodology caveats and a graph before any action; the useful buttons ("Simulate Removal" / "Experiment Studio") are far down / small in nav.
   - Severity: 1 (cosmetic) — 01-landing.png
2. "which dropdown is the real one?"
   - URL: http://localhost:4173/#/experiment
   - Expected: one place to pick my dataset. Actual: two network pickers (sidebar "Current Network" + page "Loaded network"); I guessed the page one — it worked and synced, but for a second I hesitated.
   - Severity: 2 (minor) — 02-experiment-studio.png
3. "is Direct Removal already on? I can't tell."
   - URL: http://localhost:4173/#/experiment
   - Expected: a visible selected state on the rule buttons. Actual: neither "Direct Removal" nor "Structural Cascade" clearly showed as pre-selected, so I clicked Direct Removal just in case.
   - Severity: 1 (cosmetic) — 03-removal-studio-setup.png
4. "why is Run Experiment greyed out?" (micro-pause)
   - URL: http://localhost:4173/#/experiment
   - Expected: run button works. Actual: disabled until a species is picked; the explanation text sits in the results panel below, not next to the button.
   - Severity: 1 (cosmetic) — 03-removal-studio-setup.png

Reached first success: yes. Actions taken: 7. Quit at: n/a.
