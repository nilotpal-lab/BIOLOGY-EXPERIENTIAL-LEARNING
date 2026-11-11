# First-time user report — impatient persona (run 3)

App: FoodWebGuard — http://localhost:4173/
Persona: impatient first-time user. Skims, clicks the first button that looks like progress, ~10 seconds per screen, bounces fast.

## Action log

1. Expected: open the app and see what it is. Happened: landing "Overview" page loaded at http://localhost:4173/ — big headline "Understand food-web vulnerability", a green "Experiment Studio" button, and a tip saying "New here? Pick a network → remove a species → read the impact. Start with the green Experiment Studio button." Good, that's my path. [01-landing-overview.webp]
2. Expected: clicking the green "Experiment Studio" button takes me to the experiment tool. Happened: my first two click attempts were not delivered by the automation runtime (tooling artifact — the button itself works; see friction log). Switched to a direct programmatic click.
3. Expected: land in the experiment area. Happened: URL changed to http://localhost:4173/#/experiment — "Experiment Studio" page with stat cards (14 species / 29 links after I switched dataset), two big buttons: "Systematic Sensitivity Scan" and "Interactive Removal Studio", and a one-line explainer: "Interactive Studio = remove one species you choose." That's the one I want. [02-experiment-studio.webp]
4. Expected: pick a dataset from the "Current Network" dropdown in the left sidebar. Happened: switched from FW-POND-A to "TER-GRASS-A · Temperate grassland (Terrestrial)" — sidebar immediately updated to 14 species / 29 interactions.
5. Expected: "Interactive Removal Studio" opens the one-species removal tool. Happened: click not delivered again (tooling artifact), direct click worked — an "Experiment Setup" panel expanded on the same page (URL unchanged): a grid of 14 species buttons, a propagation rule toggle with "Direct Removal" already selected, and a disabled "Run Experiment" button that clearly says "Select a target species above to enable Run Experiment." Fine, no mystery. [03-removal-studio-setup.webp]
6. Expected: clicking "Grasshopper" selects it as the target. Happened: click not delivered (tooling artifact), direct click worked — header changed from "None selected" to "Grasshopper" and "Run Experiment" became enabled.
7. Expected: "Run Experiment" shows me impact numbers. Happened: click not delivered (tooling artifact), direct click worked — a "Simulation Results & Preview" section appeared with "Scenario: Direct on Grasshopper": Nodes Remaining 13 / 14 (92.9%), Secondary Removals +0, Link Loss 20.7% (-6 links), Directly Affected 4 (lost ≥1 food source), Food Depleted 0, post-removal Connectance 0.147, plus an updated network graph and an "Export PDF Report" button. That is exactly what I came for. [04-direct-removal-results.webp]

## Friction points

1. "The page is a wall of text — where's the button?" — http://localhost:4173/ (Overview). Expected: quick visual entry point. Actual: several long interpretive paragraphs before/around the action area; the small "New here?" tip line was the only thing that saved me. Severity: 1 (cosmetic). [01-landing-overview.webp]
2. "I clicked the button — did anything happen? Where did the panel go?" — http://localhost:4173/#/experiment. Expected: clicking "Interactive Removal Studio" visibly takes me to the setup. Actual: it silently expands an "Experiment Setup" section lower on the same long page with no URL change; I had to hunt/scroll for it. (I could not verify whether any auto-scroll exists — I scrolled manually before observing.) Severity: 2 (minor). [03-removal-studio-setup.webp]
3. "Results are way down the page too." — http://localhost:4173/#/experiment. Expected: after "Run Experiment" the numbers jump out at me. Actual: metrics render in a section below the setup; I scrolled manually to see them, so the same visibility concern applies. Severity: 2 (minor, unverified auto-scroll). [04-direct-removal-results.webp]

Tooling artifacts (NOT app findings, no severity): five click deliveries failed silently (hero Experiment Studio twice, nav Experiment Studio once, Interactive Removal Studio once, Grasshopper once, Run Experiment once handled inline) — in each case the same button worked via a direct programmatic click, matching the known automation-delivery issue. Duplicate accessible name "Experiment Studio" on the nav button and the hero button also made my first locator ambiguous — a real user would not notice this.

Console/network capture not available — not tested.

Reached first success: yes. Actions taken: 10. Quit at: n/a.
