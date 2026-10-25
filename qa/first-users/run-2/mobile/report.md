# First-time mobile user report — FoodWebGuard (run-2, mobile)

Persona: first-time user on a small slow phone, 375x667 touch screen, touch-only.
Viewport was set to 375x667 and kept there. localStorage cleared before acting.
network/CPU throttling not available — not tested. Load-speed judgments below are approximate, based on observable waits (the app rendered quickly; I never saw a long blank screen).
Console/network capture not available — not tested.

## What I was trying to do
Pick any dataset, select a species, run a direct-removal scenario, and see the resulting metrics (nodes/links/link-loss numbers).

## Result: DONE
- Dataset picked: Terrestrial · TER-GRASS-A · Temperate grassland (via the "Loaded network" dropdown on the Experiment Studio)
- Species selected: Grasshopper (Primary consumer)
- Scenario run: Direct Removal ("Scenario: Direct on Grasshopper")
- Metrics seen: Nodes remaining 13/14 (92.9%) · Link loss 20.7% (-6 links) · Directly affected 4 · Secondary removals +0 · Food depleted 0 · Post-removal connectance 0.147

## Action log
1. Expected: open http://localhost:4173/ and see the app. Happened: landing "Ecosystem Overview" loaded immediately with a default pond network (FW-POND-A) and lots of overview cards. Screenshot 01-landing-375.png.
2. Expected: tap "Experiment Studio" in the hero to start a removal experiment. Happened: first tap attempt produced no navigation (no visible effect); page stayed on the overview. [friction F1]
3. Expected: tap "Experiment Studio" again. Happened: worked — landed on http://localhost:4173/#/experiment, "Deterministic Simulation Studio", network dropdown + stat cards + two big mode buttons. Screenshot 02-experiment-studio-375.png.
4. Expected: open the "Loaded network" dropdown and pick a different dataset. Happened: chose "Terrestrial · TER-GRASS-A · Temperate grassland"; stats updated instantly to 14 species / 29 links / connectance 0.159.
5. Expected: tap "Interactive Removal Studio" ("remove one species you choose"). Happened: an "Experiment Setup" section appeared with a species filter box, 14 species chips, propagation-rule cards (Direct Removal already ticked) and a disabled "Run Experiment" button. Screenshot 03-setup-species-selection-375.png.
6. Expected: tap the "Grasshopper" chip in the species list. Happened: page jumped/ scrolled during the tap and the chip moved out from under my finger — "None selected" stayed and Run Experiment stayed disabled. [friction F5]
7. Expected: tap "Grasshopper" again, on its new position. Happened: selected — readout changed to "Grasshopper" and "Run Experiment" enabled. Screenshot 04-species-list-375.png.
8. Expected: tap "Run Experiment" and see results. Happened: results appeared right away — "Scenario: Direct on Grasshopper", metric cards with nodes/links/link-loss. Screenshot 05-results-metrics-375.png. First success reached.

Actions taken: 8. Stopped at first success.

## Friction points
- F1 "I tapped the big button and nothing happened."
  URL: http://localhost:4173/ (overview). Expected: tap on "Experiment Studio" navigates. Actual: first tap produced no visible effect; second tap worked. Possibly an automation artifact (element was visible and in view). Severity: 2 (minor, uncertain attribution).
- F2 "It says the buttons are on the right, but on my phone they're underneath."
  URL: http://localhost:4173/. Expected: copy matches mobile layout. Actual: hero hint says "Start with the buttons on the right" — on 375px the buttons are stacked below the text. Severity: 1 (cosmetic). 01-landing-375.png
- F3 "The species chips are small for my thumb."
  URL: http://localhost:4173/#/experiment. Expected: ~44px tap targets. Actual: species chips measured 32px tall. Severity: 2 (minor). 04-species-list-375.png
- F4 "The species list scrolls inside its own little box, which is awkward when the page also scrolls."
  URL: http://localhost:4173/#/experiment. Expected: one scroll context. Actual: the 14-species list sits in a nested inner scroll box ~192px tall (512px of content) inside a page that also scrolls — easy to scroll the wrong thing on a phone. Severity: 2 (minor). 04-species-list-375.png
- F5 "The page moved while I was tapping a species."
  URL: http://localhost:4173/#/experiment. Expected: tap lands on the chip I aimed at. Actual: during the tap the page scrolled (~356px) and the chip was no longer under my finger; selection silently failed with no feedback. Possibly an automation artifact, but silent no-op on a missed tap is worth noting. Severity: 2 (minor, uncertain attribution).
- F6 (positive, for balance) "Most other controls felt fine": no horizontal scrolling anywhere, the metric cards and rule cards laid out cleanly at 375px, no sticky bar covered the Run button, no cut-off text found. Dropdown and Run button are 36px tall (just under the 44px guideline — borderline). Severity: 1 (cosmetic).

## Horizontal-overflow checks (scrollWidth vs clientWidth at 375px)
- Landing (http://localhost:4173/): 365 vs 365 — no sideways scroll.
- Experiment Studio (http://localhost:4173/#/experiment): 365 vs 365 — no sideways scroll.
- Results (http://localhost:4173/#/experiment): 365 vs 365 — no sideways scroll.

## Screenshots
- 01-landing-375.png — landing / Ecosystem Overview
- 02-experiment-studio-375.png — Experiment Studio with dataset dropdown
- 03-setup-species-selection-375.png — Experiment Setup: propagation rule cards
- 04-species-list-375.png — species selection list + selected chip
- 05-results-metrics-375.png — Direct-removal results on Grasshopper

Reached first success: yes. Actions taken: 8. Quit at: n/a (stopped at first success).
