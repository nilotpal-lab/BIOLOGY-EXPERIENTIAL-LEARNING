# First-time user report (non-native English speaker)

App: FoodWebGuard — http://localhost:4173/
Persona: English is my second language. I read slowly and follow only what the screen literally says.
Goal given to me: pick a dataset, select a species, run a direct-removal scenario, and see the resulting metrics.

Note: console/network capture not available in my browser tool — not tested.

## Action log

1. Opened http://localhost:4173/ — Expected: see what this app is. Happened: a page "Ecosystem Overview" for something called "FoodWebGuard". A network "FW-POND-A · Temperate pond (Freshwater)" was ALREADY chosen for me in a small box called "Current Network". I did not need to pick; it was pre-picked.
2. Clicked "Experiment Studio" in the top navigation — Expected: a studio is where you do work, so experiments happen here. Happened: page changed to #/experiment with "Interactive Removal Studio", "Systematic Sensitivity Scan", and "Analyse all species".
3. In the "Loaded network" dropdown I chose "Terrestrial · TER-GRASS-A · Temperate grassland" — Expected: the app now uses the grassland dataset. Happened: the counters updated to 14 Species / 29 Feeding links. But the small left panel changed its title to "Terrestrial Forest" — I chose grassland, not forest, so I was not sure my choice worked correctly.
4. Clicked "Interactive Removal Studio" — Expected: this is where I remove a species. Happened: a panel opened with species buttons (Grass, Clover, Grasshopper...), a "Simulation Propagation Rule" with two options ("Direct Removal — Immediate link loss only" and "Structural Cascade — Consumers losing 100% food"), and a grey (disabled) "Run Experiment" button.
5. Clicked the "Grasshopper" button — Expected: Grasshopper becomes my selected species. Happened: text changed from "None selected" to "Grasshopper" and "Run Experiment" became active. The grey button had no explanation next to it, so before this I was not 100% sure why it was grey.
6. Clicked "Direct Removal — Immediate link loss only" — Expected: make sure the direct rule (not cascade) is on. Happened: the button became marked active. Before clicking, I could NOT tell which rule was already selected — neither looked highlighted to me, so I clicked anyway to be safe.
7. Clicked "Run Experiment" — Expected: some result appears. Happened: SUCCESS. A results panel appeared: "Scenario: Direct on Grasshopper", Nodes Remaining 13 / 14 (92.9%), Secondary Removals +0, Link Loss 20.7% (-6 links), Directly Affected 4 (Lost ≥1 food source), Food Depleted 0, Connectance 0.147 (Post-removal), plus a network picture and an "Export PDF Report" button.

## Friction points

1. "Trophic Levels" (left panel) and "Apex / Intermediate / Basal" — quote: "what is trophic? I am not sure." UI said "Trophic Levels 5"; I understood it as some kind of feeding level only because the Overview page had a subtext "Species concentration across the energy hierarchy". Severity 2. 01-landing.webp. http://localhost:4173/
2. "Connectance (L / S(S-1)) 0.129" — quote: "a formula, but no words — is bigger better?" I understood "how connected", but L, S and the math were not explained in plain words. Severity 2. 01-landing.webp.
3. Two different dropdowns for what looks like the same thing: left panel "Current Network" and page "Loaded network" — quote: "which one is the real one?" I was afraid they would disagree; they stayed in sync, but nothing told me they are connected. Severity 2. 02-experiment-studio.webp. http://localhost:4173/#/experiment
4. Left panel label said "Terrestrial Forest" after I chose "Temperate grassland" — quote: "I chose grass, it says forest — did my choice fail?" I continued only because the species list clearly showed grassland species. Wrong label, wrong trust. Severity 2. 02-experiment-studio.webp.
5. "Deterministic Simulation Studio" / "No stochastic population assumptions" — quote: "deterministic? stochastic? these words I do not know." No plain explanation on the page. I ignored the sentence. Severity 2. 02-experiment-studio.webp.
6. "Systematic Sensitivity Scan" — quote: "sensitivity of what? scan how?" No explanation; I avoided this button completely. Severity 2. 02-experiment-studio.webp.
7. "Simulation Propagation Rule" — quote: "propagation is a technical word; and which option is already chosen?" Before clicking, neither option looked selected to me, so I did not know the default. The two option buttons themselves ("Immediate link loss only") were clear. Severity 2. 03-direct-removal-results.webp.
8. Dataset codes "FW-POND-A", "TER-GRASS-A", "RES-FW-A", "VALIDATION-CHAIN-4" and words "mesocosm", "Barro Colorado Island" in the dropdown — quote: "codes and science words with no expansion." I picked by the plain English part only. Severity 1. 02-experiment-studio.webp.
9. "Illustrative demo" small chip — meaning hidden (appears only as hover text). I saw the words but not what they promise. Severity 1. 02-experiment-studio.webp.
10. "Run Experiment" grey at first with no reason next to it (the explanation "Select a species..." sits in a different panel below). Severity 1. 03-direct-removal-results.webp.
11. "Documented taxa" on the Overview — "taxa" not explained. Severity 1. 01-landing.webp.
12. "Link loss = 100 x (L0 - Ls) / L0" — math formula jargon; thankfully the plain question "how much of the recorded network disappears?" was next to it. Severity 1.
13. Zoom/reset buttons on the network picture are icon-only (no visible text label). Severity 1. 03-direct-removal-results.webp.

What the app DID explain well for me (worth keeping): the "How to read these results" and "What these outputs are — and are not" sections translate metrics into plain questions ("who lost a food source?", "how far did the rule travel?") and plainly warn that removal is not extinction. The result tiles also had small subtexts ("Lost ≥1 food source", "-6 links") that I could read slowly and understand.

## Jargon / idiom / icon / placeholder log

| Term / item | Where | Explained by app? |
|---|---|---|
| trophic level | sidebar, overview | Partly (only via a subtext on Overview) |
| connectance, L/S(S-1) | overview, experiment | No (formula only) |
| deterministic, stochastic | experiment page | No |
| propagation (rule) | experiment page | No (options themselves are plain) |
| sensitivity scan | experiment button | No |
| taxa | overview stat | No |
| mesocosm | dataset names | No |
| provenance | Quick Action "Data Library" | No |
| biome(s) | "Compare Biomes" | No |
| detritus | species "Leaf litter (detritus)" | No |
| in-degree / out-degree | "Basal Nodes (In-degree = 0)" | No |
| apex predator, basal, producer | trophic chart | No, but common enough for me |
| cascade | tabs, rule option | YES — plain-language section explains it |
| dataset codes (FW-POND-A etc.) | dropdowns | No |
| "≥" symbol | result tile subtext | Not in words, but I guessed correctly |
| icon-only zoom/reset buttons | network graph | Accessible names exist but no visible label |
| placeholder "Search species, network or keyword..." | search box | Placeholder-only label (disappears on typing); I never used it |

## Wrong turns

- No destructive wrong turn. My only hesitation: I clicked "Direct Removal" even when it may already have been the default, because the selected state was not clear to me. I also almost stopped at the "Terrestrial Forest" label thinking my dataset choice failed (I checked the species list to confirm grassland species were shown).

Reached first success: yes. Actions taken: 7. Quit at: n/a.
