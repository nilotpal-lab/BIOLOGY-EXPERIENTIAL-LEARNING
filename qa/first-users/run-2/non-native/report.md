# UX Study Report — First-time user, English is my second language

App: FoodWebGuard, http://localhost:4173/
My goal: pick a dataset, select a species, run a direct-removal scenario, see the metrics.
Note: console/network capture not available — not tested.

## Action log (what I expected before / what happened after)

1. Expected: the page says "New here? Pick a network → remove a species → read the impact", so first I pick from the box called "Current Network". Happened: I chose "TER-GRASS-A · Temperate grassland (Terrestrial)"; the side numbers changed to 14 Species / 29 Interactions, so picking worked. (01-landing.webp)
2. Expected: the button "Simulate Removal" (subtitle "Single & multi-node cascades") takes me to the removal screen. Happened: my first two clicks did nothing — the button is very far down a very long page and I had to scroll with Page Down / Page Up several times before a click on the exact button spot worked; the page changed to "Experiment Studio" (http://localhost:4173/#/experiment). (02-quick-actions-not-responding.webp, 03-experiment-studio.webp)
3. Expected: the line "Interactive Studio = remove one species you choose" matches my goal, so I click "Interactive Removal Studio". Happened: a setup panel opened below with 14 species buttons and a "Simulation Propagation Rule" where "Direct Removal — Immediate link loss only" was already ticked. (04-experiment-setup.webp)
4. Expected: clicking a species name selects it. Happened: I clicked "Grasshopper"; "Run Experiment" changed from grey (disabled) to blue (enabled). The small hint "Select a target species above to enable Run Experiment" told me exactly what was missing before — very helpful. (05-species-selected.webp)
5. Expected: "Run Experiment" computes the removal and shows numbers. Happened: results appeared: "Scenario: Direct on Grasshopper", Nodes Remaining 13/14 (92.9%), Secondary Removals +0, Link Loss 20.7% (-6 links), Directly Affected 4, Food Depleted 0, Connectance 0.147 (post-removal). Goal reached. (06-results.webp)

## Friction points

- F1 "Pick a network" / "Current Network" (sidebar + hint text, http://localhost:4173/#). What it said: "network". What I understood: network means internet/computers to me; I guessed from the pond/grassland options that it means "one ecosystem dataset", but the word itself was never explained. Severity 2. 01-landing.webp
- F2 Quick Actions "Simulate Removal — Single & multi-node cascades" (Overview page). Quote: "what is 'cascade'? I am not sure." No explanation at the button; I found a plain explanation only later on the Experiment page. Severity 2. 02-quick-actions-not-responding.webp
- F3 "Simulate Removal" button needed 3 attempts: it sits at the bottom of a very long page full of long English paragraphs, and my clicks only registered after scrolling and aiming carefully. Quote: "I clicked it two times and nothing happened." Severity 3. 02-quick-actions-not-responding.webp
- F4 Hint says "Start with the buttons on the right" but the buttons on the right are "Explore Workspace" / "Experiment Studio"; the shortcut matching the instruction ("Simulate Removal") is somewhere else, lower. Quote: "which buttons? the removal one is not on the right." Severity 2. 01-landing.webp
- F5 The network list contains internal-looking items: "VALIDATION-FOODWEB-6 (manual test network)", "VALIDATION-CHAIN-4 (multi-round cascade chain)". Quote: "is this for me or for the developers?" Severity 2. 01-landing.webp
- F6 Species filter box has only a placeholder "Filter species to select..." — no permanent label; when I type, the text disappears and I can forget what the box is for. Severity 1. 04-experiment-setup.webp
- F7 Dataset names use scientific words with no plain note in the list: "mesocosm", "intertidal (middle zone)", "seed-predator web", "detritus". Quote: "meso-what?" Severity 1. 01-landing.webp
- F8 Results captions use the symbol "≥" ("Lost ≥1 food source"). Quote: "I think it means 'at least one' but I am not sure." Severity 1. 06-results.webp
- F9 Zoom buttons are icons without visible text (only hover names). Severity 1. 06-results.webp

## Good things (helped me a lot)

- "Sensitivity Scan = test every species... · Interactive Studio = remove one species you choose." — one plain line, I chose correctly because of it.
- Disabled "Run Experiment" + "Select a target species above to enable Run Experiment" — tells me HOW to fix it.
- "Deterministic = the same inputs always produce exactly the same result..." and "No stochastic (random) population assumptions" — jargon immediately translated.
- Result cards each have a small caption ("Post-removal", "Lost 100% food", "-6 links").

## Jargon / idiom / unlabeled-icon / placeholder-only list

| Term | Where | Explained by app? |
|---|---|---|
| network | landing hint, sidebar dropdown | No (only guessable from options) |
| cascade(s) | Quick Actions, metric tabs | Not at the button; yes later on Experiment page |
| trophic levels | stat cards | Yes ("Feeding levels from producers (level 1) to top predators") |
| connectance L / S(S-1) | stats | Yes (words given next to formula) |
| in-degree / out-degree / basal nodes | Network Structure Summary | No |
| deterministic / stochastic | Experiment Studio | Yes (tooltip + "(random)") |
| propagation rule | Experiment Setup | Yes ("How the removal spreads...") |
| Direct Removal / Structural Cascade | rule buttons | Yes (short subtitles) |
| nodes | stat "Species (nodes)" | Yes (synonym shown) |
| apex predator, omnivore, decomposer, producer, primary/secondary consumer | species chips, overview | No |
| mesocosm, intertidal, detritus, insecticide | dataset names | No |
| provenance | "Data Library — Export CSV & view provenance" | No |
| "buttons on the right" (idiom-like instruction) | landing hint | Partly (buttons exist but don't match the task) |
| zoom in/out icons | graph toolbar | No visible text (hover name only) |
| "Filter species to select..." | species filter | Placeholder-only label |
| ≥ symbol | result captions | No |

## Final line

Reached first success: yes. Actions taken: 5 (plus 3 scroll/retry attempts on the "Simulate Removal" button). Quit at: n/a.
