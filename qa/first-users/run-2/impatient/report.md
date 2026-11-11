# UX Session Report — impatient first-time user, run-2

App: FoodWebGuard (http://localhost:4173/) · Persona: impatient (skim, ~10s per screen, quit on first hard block)

## Action log

1. Expected: landing page shows me where to start. Happened: lots of text, but a "New here? Pick a network → remove a species → read the impact" hint and a "Simulate Removal" quick action stood out. (01-landing.webp)
2. Expected: clicking "Simulate Removal" takes me to the removal tool. Happened: clicked it (and retried once) — no navigation, nothing changed. (02-click-does-nothing.webp)
3. Expected: "Experiment Studio" in the top nav gets me to the same place. Happened: worked instantly, landed on #/experiment. (03-experiment-studio.webp)
4. Expected: the studio lets me remove a species. Happened: saw two big buttons; clicked "Interactive Removal Studio" and a species picker appeared, with "Direct Removal" already selected and "Run Experiment" greyed out ("Select a target species above"). (04-removal-setup.webp)
5. Expected: clicking "Perch" selects it. Happened: header changed from "None selected" to "Perch", "Run Experiment" became enabled.
6. Expected: "Run Experiment" shows me numbers. Happened: instant results — "Scenario: Direct on Perch": Nodes Remaining 11/12 (91.7%), Secondary Removals +0, Link Loss 29.4% (-5 links), Directly Affected 1, Food Depleted 0, Connectance 0.109. That's my goal done. (05-results-perch.webp)
7. Expected: switching the sidebar "Current Network" dropdown to "TER-GRASS-A · Temperate grassland" loads a new dataset. Happened: species list refreshed to grassland species, my selection and results were reset. (expected, fine)
8. Expected: pick "Field mouse", hit "Run Experiment", get numbers again. Happened: "Scenario: Direct on Field mouse": Nodes Remaining 13/14 (92.9%), Link Loss 13.8% (-4 links), Directly Affected 3, Connectance 0.160. Done. (06-results-fieldmouse.webp)

## Friction points

1. "ugh, did that click even register?" — URL http://localhost:4173/# (root). Expected: "Simulate Removal" quick-action button navigates to the removal tool. Actual: two clicks, zero visible response. Severity: 3 (major; recovered via top nav). Screenshot: 02-click-does-nothing.webp. (Caveat for the team: my clicks were injected programmatically; a plain mouse click may work — but it consistently failed while other buttons on the same page worked.)
2. "whoa, that's a wall of text" — URL http://localhost:4173/# (root). Expected: quick orientation. Actual: the overview crams hero, stats, graph, rankings, methodology and caveats into one endless page; only the small "New here?" line pointed the way. Severity: 1 (cosmetic/density). Screenshot: 01-landing.webp.
3. "wait, where did my result go?" — URL http://localhost:4173/#/experiment. Expected: switching dataset keeps my previous result somewhere. Actual: changing the network dropdown wiped the species selection and the previous run's metrics. Severity: 1 (minor; re-running takes two clicks). Screenshot: 06-results-fieldmouse.webp.

Positive notes: "Direct Removal" was pre-selected as the propagation rule; Run Experiment clearly explained why it was disabled; results appeared instantly with plain numbers (nodes, links, %).

Console/network capture not available — not tested.

Reached first success: yes. Actions taken: 8. Quit at: n/a.
