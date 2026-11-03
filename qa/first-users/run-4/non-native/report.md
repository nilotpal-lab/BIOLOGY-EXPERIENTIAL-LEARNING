# QA First-User Walkthrough — Persona "non-native"

- App: https://foodwebguard.vercel.app/
- Persona: English is my second language; I only follow what the UI literally says. I flag idioms, jargon, unlabeled icons, placeholder labels, abbreviations/symbols, and error messages that don't say how to fix things.
- Date: 2026-11-03
- Environment prep: opened the site in a fresh tab, cleared localStorage, reloaded. No datasets were deleted. Console capture was not available in this runtime, so evidence is from visible page state and screenshots only.

---

## 1. Walkthrough narrative (what I thought vs what it did)

### Screen 1 — Landing page (NN-01-landing.png)

I see "FoodWebGuard — INTERACTIVE ECOSYSTEM LABORATORY". I thought "laboratory" meant a science lab website with articles. It is actually the app name.

- **"Open Explorer"** — I thought this opens a file explorer (like Windows Explorer) or a web browser. It actually opened an interactive food-web diagram screen. The small hint "New here? Start with the green Open Explorer button — then try the Simulation Lab." saved me, otherwise I would not know where to go.
- **"Simulation Lab" / "Simulation Laboratory"** — I thought "Lab" here is a real laboratory. It is a section of the app where you pretend to remove animals.
- **"Remove species and observe cascading effects"** — "cascading effects" is hard for me. I guessed it means "one animal dies, others that depend on it also get hurt". There is no plain-language explanation next to the phrase.
- **"Cascade Timeline — Explore ecosystem collapse round by round"** — "collapse round by round" sounds like a game. I did not understand until later that a "round" is one step of the removal simulation.
- Icons on the feature cards (flask, clock, bar chart, arrows) have no text labels — only the card titles explain them. The small arrow icons (↗) in the card corners made me think each card is an external link.

### Screen 2 — Interactive Explorer (NN-03-explorer-pond.png, NN-05-lake-loaded.png)

After clicking Open Explorer, a food-web drawing appeared with animals connected by lines. A panel on the right opened by itself showing "Pond algae" — I never clicked it; I did not know why this species was already chosen. That confused me (nothing on screen said "selected automatically").

- **"Trophic Layout" / "Force Layout"** — two buttons, no explanation. I thought "Force Layout" is something about forcing my layout. It actually just rearranges the diagram (physics-style). "Trophic" I did not know at all; I guessed "feeding-level arrangement".
- **"Presentation view" with a gift/package icon** — I thought it gives a gift. Probably a mode for showing the screen to an audience. The icon does not match the words for me.
- **"Degree (Links): 2 (0 in · 2 out)"** — I thought "degree" is temperature. The "in/out" symbols (·) were hard. It means how many feeding connections the species has.
- **"Basal organism (no incoming food sources recorded in dataset)"** — "basal" is a science word I do not know. The parenthesis helped me guess "species at the bottom that eats nothing from the web".
- **"Trophic Level 1.0"** — I thought it is a game level ("Level 1").
- Legend words: **"Apex Predator, Tertiary/Secondary/Primary Consumer, Primary Producer, Detritus"** — many unknown words at once. "Detritus" I thought was a species name; it seems to mean dead waste material.
- **Dataset dropdown "FW-POND-A · Temperate pond"** — I thought "FW" is a typo. The codes (FW-, TER-, MAR-, RES-, VALIDATION-) are not explained anywhere. "Shallow-lake mesocosm (Pond1, heated + insecticide)" — "mesocosm" is a very hard scientific word with no explanation.

I changed the dropdown to **"FW-LAKE-B · Cold-water lake"** and the whole diagram changed to lake animals (Otter, Osprey, Pike, Perch, Smelt...). This worked and was easy to understand — the picture updated immediately (NN-05-lake-loaded.png).

### Screen 3 — Simulation Laboratory (NN-06-simulation.png, NN-07-simulation-scrolled.png)

I clicked "Simulation" in the left "WORKSPACE" sidebar. "Workspace" — I thought it saves my files; it is just the menu.

Surprise: **results were already on screen before I ran anything** — "Simulation Results — Smelt Removed". A species called "Smelt" was pre-selected in the dropdown and its removal already calculated. As a first-time user I did not run it, so I did not trust these numbers. I would prefer an empty state saying "choose a species and press Run".

- **"1. SELECT SIMULATION MODE — Direct Removal"** vs **"Direct Removal + Cascade"** — the card descriptions ("Remove only the selected species and observe immediate effects" / "...simulate cascading effects when consumers lose all food sources") were the clearest text in the whole app. I finally understood "cascade" = when an animal loses ALL its food, it dies too.
- **"3. SIMULATION SETTINGS — Show step-by-step animation / Animation speed Slow–Normal–Fast"** — understandable.
- **"Run Simulation →"** — clear, and after running, a second button **"Reset simulation"** appeared below it. I understood "reset = undo the removal".

### My run: Pike, Direct Removal + Cascade (NN-08-species-pike-selected.png, NN-09-cascade-mode.png, NN-10-run-simulation.png, NN-11-cascade-timeline.png, NN-12-round2-click.png)

1. In "2. SELECT A SPECIES" I chose **Pike** in the dropdown. The card below updated ("Pike, pike sp., Apex predator") and — unexpectedly — the results panel instantly changed to "Pike Removed" with numbers, before I pressed Run. Selecting a species and running a simulation feel merged; the "Run Simulation" button seems redundant, or the auto-numbers should be hidden until Run.
2. I clicked the **"Direct Removal + Cascade"** mode card. The results panel still showed the old numbers with no sign they were now outdated. I expected the panel to clear or update.
3. I clicked **"Run Simulation"**. A "Reset simulation" button appeared, the web graph faded most nodes, and the **Cascade Timeline** at the bottom filled with: "Initial State — 13 species · 20 links", "ROUND 1 — Pike removed, 1 affected", "ROUND 2 — Secondary cascade —", "ROUND 3 — Stabilized state — 1 total removed".

**First success:** the right-hand **"Simulation Results"** panel shows metrics: SPECIES REMOVED 1 (Direct), LINKS LOST 3 out of 20 (30.0%→ actually 15.0%), SECONDARY REMOVALS 0 (via cascade), TOTAL REMOVED 1 out of 13, plus an "Affected Species" list. The metrics appeared and updated. Success.

### Terms in the results that confused me (NN-10/NN-11)

- **"(Direct)" and "(via cascade)"** small text under the numbers — I understood only after reading the mode cards.
- **"Affected Species" list shows "O..." "P..." "Pi..."** — species names are cut to one letter + "...". I could not tell which animal is affected without going back to the diagram. Each row says "Lost food source" and **"↓ -1 link"** — the ↓ arrow symbol is never explained; I guessed "this animal lost one feeding connection".
- **"Round 2 / 1"** — after I clicked the "Round 2" card, the slider label said "Round 2 / 1". Round 2 out of 1?? I thought the app was broken. It seems to mean "viewing round 2, which is also the last round".
- **"ROUND 2 — Secondary cascade —"** — the dash "—" alone in the card. I thought it was a missing value/error. I think it means "nothing happened this round", but the UI never says so. A word like "None" would help.
- **"Stabilized state"** — I guessed "everything that will die has died". Not obvious.

---

## 2. Friction log

| # | Quote (what I'd say) | URL | Severity | What happened |
|---|---|---|---|---|
| 1 | "I clicked the green button twice and nothing happened" | https://foodwebguard.vercel.app/ | 2 | My first two clicks on "Open Explorer" produced no reaction; only a click exactly on the button center navigated to #/explore. No hover/pressed feedback was noticed. |
| 2 | "Why is Pond algae already open? I never picked it" | https://foodwebguard.vercel.app/#/explore | 2 | Explorer opens with a species inspector panel pre-opened (Pond algae, later Lake phytoplankton) with no explanation of why it is selected. |
| 3 | "FW-POND-A? RES-FW-A? Mesocosm? I don't know these words" | https://foodwebguard.vercel.app/#/explore | 2 | Dataset names use unexplained codes (FW-/TER-/MAR-/RES-/VALIDATION-) and hard jargon ("mesocosm", "ambient control") with no descriptions or help text. |
| 4 | "Trophic Layout, Force Layout — what do these do?" | https://foodwebguard.vercel.app/#/explore | 2 | Two layout buttons with scientific/technical names and no tooltip or explanation. |
| 5 | "Degree? 0 in · 2 out? Trophic Level 1.0? Basal organism?" | https://foodwebguard.vercel.app/#/explore | 2 | Inspector panel is full of unexplained metrics and symbols (·, in/out); no glossary or tooltips. |
| 6 | "Who is 'O...'? The name is missing" | https://foodwebguard.vercel.app/#/simulation | 2 | Affected Species list truncates names to one character ("O...", "P...", "Pi..."); I cannot identify which species lost a food source. |
| 7 | "The results changed by themselves — did I already run it?" | https://foodwebguard.vercel.app/#/simulation | 2 | Simulation results are auto-calculated for a pre-selected species (Smelt) on page open, and again immediately on changing the species dropdown, before pressing "Run Simulation". Button and auto-results feel contradictory. |
| 8 | "I changed the mode but the old numbers stayed" | https://foodwebguard.vercel.app/#/simulation | 2 | After switching mode to "Direct Removal + Cascade", the results panel keeps showing stale numbers with no "outdated" indication until Run is pressed again. |
| 9 | "Round 2 / 1 — how can round 2 be out of 1?" | https://foodwebguard.vercel.app/#/simulation | 2 | Timeline slider label reads "Round 2 / 1" after selecting the Round 2 card; confusing wording (should be e.g. "Round 2 of 3" or "last round"). |
| 10 | "'Secondary cascade —' — is that an error?" | https://foodwebguard.vercel.app/#/simulation | 1 | Empty rounds show a bare dash "—"; nothing says it means "no changes in this round". |
| 11 | "'↓ -1 link' — arrow meaning?" | https://foodwebguard.vercel.app/#/simulation | 1 | The ↓ symbol in the Affected Species rows is never explained (I guessed "lost one feeding connection"). |
| 12 | "e.g. Carp, Macrobrachium, Heron ..." | https://foodwebguard.vercel.app/#/explore | 1 | Search placeholder uses the abbreviation "e.g." and species I don't know ("Macrobrachium") — hard for non-native/science-beginner users. |
| 13 | "Cascading, trophic, connectance (C = L / S²)..." | https://foodwebguard.vercel.app/ | 1 | Landing-page science text uses many unexplained technical terms and a formula; fine for scientists, hard for me. |
| 14 | (tooling note, not app) clicks/scroll/screenshot commands timed out repeatedly | all pages | - | Synthetic locator clicks always timed out on this app (coordinate clicks worked); scroll/screenshot commands intermittently timed out (app remained working). Recorded for honesty; likely test-runtime issue, not app bug. |

Severity summary: 0 blockers, 0 majors-with-data-loss, 7 minor (2), 4 cosmetic (1), 1 tooling note. No visible error messages, blank screens, or spinners appeared at any point; every screen rendered fully.

---

## 3. Verdict

reached first success: yes
actions taken: 14
