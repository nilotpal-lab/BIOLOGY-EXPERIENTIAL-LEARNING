# UX Research Report — First-time user, English as second language

App: FoodWebGuard — Food-Web Disruption Analysis (http://localhost:4173/)
Persona: first-time user, English second language, follows only the literal UI text.
Date: 2026-10-25

## Action log (expectation before → what happened after)

1. Opened http://localhost:4173/. I expected a start page that tells me what to do. It opened the "Overview" dashboard of FoodWebGuard with many numbers and a sidebar "Current Network" showing a dataset "FW-POND-A · Temperate pond (Freshwater)" already loaded (12 Species, 17 Interactions). There was a friendly tip: "New here? Pick a network → remove a species → read the impact. Start with the green Experiment Studio button." I decided to follow this sentence exactly. The network was already picked by the app, so I continued with it. (01-overview-home.png)
2. I clicked the green "Experiment Studio" button in the page body (there is ALSO one with the same name in the top navigation — I had to look twice to choose). The page changed to "Experiment Studio" (address became #/experiment). (02-experiment-studio.png)
3. On the Experiment Studio page I saw two big buttons: "Systematic Sensitivity Scan" and "Interactive Removal Studio". Below them a plain explanation: "Interactive Studio = remove one species you choose." That is what I want, so I clicked "Interactive Removal Studio". The page grew a new section "Experiment Setup" with a species list and rules.
4. "Experiment Setup" showed "Select Target Species" (12 species buttons) and "Simulation Propagation Rule" with two rule buttons. "Direct Removal — Immediate link loss only" was already ticked/pressed, and the text said "The active rule is outlined and ticked", so I understood I must not change it for a direct removal. "Run Experiment" was grey with the text "Select a target species above to enable Run Experiment." — clear instruction what to do.
5. I clicked the species button "Perch" (marked "Apex predator"). The header changed from "None selected" to "Perch" and "Run Experiment" became active. Good, I saw the effect of my click.
6. I clicked "Run Experiment". The results panel appeared: "Scenario: Direct on Perch", "Nodes Remaining 11 / 12 (91.7%)", "Secondary Removals +0", "Link Loss 29.4% (-5 links)", "Directly Affected 1 (Lost ≥1 food source)", "Food Depleted 0", "Connectance 0.109 (Post-removal)". These are the numbers I was asked to find. Goal reached. (03-results-direct-removal.png)

## Friction points

| # | Quote (what confused me) | Where (URL) | UI said vs what I understood | Severity | Screenshot |
|---|---|---|---|---|---|
| F1 | "Trophic Levels" | http://localhost:4173/ (sidebar, repeated everywhere) | I did not know "trophic". Only a small caption on a stat card ("Feeding levels from producers (level 1) to top predators") saved me, but the sidebar itself never explains it. | 2 | 01-overview-home.png |
| F2 | "Basal / Producers (Level 1)" | http://localhost:4173/ | "Basal" is an unknown word, no explanation anywhere near it. I guessed "bottom of the food chain" only because of "Level 1". | 2 | 01-overview-home.png |
| F3 | "Leaf litter (detritus)" | #/experiment species list | "detritus" unknown word, never explained. I avoided selecting this species because I did not understand what it is. | 2 | 03-results-direct-removal.png |
| F4 | "Export CSV & view provenance" | http://localhost:4173/ Quick Actions | "provenance" is unknown to me. I did not open Data Library because I could not understand what I would see there. | 2 | 01-overview-home.png |
| F5 | "Simulate Removal — Single & multi-node cascades" | http://localhost:4173/ Quick Actions | "cascades" unknown at that moment. The word is explained ONLY later, on the Experiment page. On the home page it stopped me. | 2 | 01-overview-home.png |
| F6 | "RES-FW-A · Shallow-lake mesocosm" | network dropdown, all pages | "mesocosm" unknown word in the dataset list, not explained. I could not compare research datasets by name because two words were foreign to me. | 2 | 01-overview-home.png |
| F7 | "Connectance (L / S(S-1))" | http://localhost:4173/ Network Structure | The formula scared me, but a plain sentence follows: "Share of all possible feeding links that actually exist — higher = more connected (L = links, S = species)". Recoverable. | 1 | 01-overview-home.png |
| F8 | two buttons both named "Experiment Studio" | http://localhost:4173/ | Top navigation AND the green body button have the same name. The tip "Start with the green Experiment Studio button" helped only because exactly one of them is green. Without color I could not tell them apart. | 1 | 01-overview-home.png |
| F9 | "Explorer" vs "Explore Workspace" vs "Explorer Workspace" | nav (#/), home button, Experiment page button | Three almost-identical names for (maybe) the same place. I did not touch them; I was not sure which one goes where. | 2 | 02-experiment-studio.png |
| F10 | "Filter species to select..." / "Search loaded networks by name..." | #/experiment, top bar | Both search boxes show only placeholder text inside the box (no permanent label above). When I type, the label disappears. | 1 | 03-results-direct-removal.png |
| F11 | "Lost ≥1 food source" | #/experiment results | The symbol "≥" is not an English word; I read it slowly. "1 or more" would be easier for me. | 1 | 03-results-direct-removal.png |
| F12 | zoom icon buttons (magnifier/fit icons, no text) | graph panels on all pages | Icons without visible text, but each has a tooltip name like "Zoom in". Acceptable. | 1 | 01-overview-home.png |

Wrong turns caused by wording: none that broke my path. The wording problems above only slowed me (F3, F4, F5 made me avoid features), they did not send me to a wrong page.

Positive wording (helped me a lot, I follow text literally): "New here? Pick a network → remove a species → read the impact."; "Interactive Studio = remove one species you choose."; "Cascade = the effect spreads to consumers that depended on the removed species."; "Deterministic = the same inputs always produce exactly the same result."; "stochastic (random)"; "Select a target species above to enable Run Experiment."

Tooling artifacts (NOT app findings, no severity): several of my clicks (green Experiment Studio button, Interactive Removal Studio, Perch, one Run attempt) were not delivered by the automation runtime on the first try; a retry or direct element press worked. The buttons themselves work.

Console errors / failed network requests: not available — not tested.

## Jargon / idiom / icon / placeholder list

| Term | Where | Explained by the app? |
|---|---|---|
| trophic levels | sidebar, everywhere | partially — one caption on the home page, not where the sidebar uses it |
| basal | home page | no |
| detritus | species list | no |
| provenance | Data Library quick action | no |
| cascade(s) | home quick actions | yes, but only on the Experiment page ("the effect spreads to consumers that depended on the removed species") |
| mesocosm | network dropdown | no |
| connectance | stat cards | yes, plain sentence + L/S meaning on home page |
| deterministic | Experiment Studio | yes, tooltip + full sentence |
| stochastic | Experiment Studio | yes, "(random)" written next to it |
| propagation rule | Experiment Setup | yes, nearby sentence "How the removal spreads..." |
| apex predator | species list | not directly, but "top predators" caption nearby makes it guessable |
| L / S(S-1) | Network Structure | yes, decoded in the caption (L = links, S = species) |
| ≥ symbol | results panel | no |
| "Illustrative demo" badge | stat cards | yes, tooltip explains "simplified for software demonstration; not a verified empirical food-web dataset" |
| zoom/fit/reset icons | graph panels | tooltip names only (no visible text) |
| search/filter placeholders | top bar, Experiment Setup | placeholder-only, no permanent label |

Reached first success: yes. Actions taken: 6. Quit at: n/a.
