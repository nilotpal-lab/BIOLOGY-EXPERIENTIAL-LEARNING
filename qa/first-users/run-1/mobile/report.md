# First-time mobile user report — FoodWebGuard (375 x 667)

Persona: first-time user on a small slow phone, touch only. Viewport held at 375 x 667 the whole run.
Throttling: network/CPU throttling not available — not tested. Load-speed judgments below are approximate (based on observable waits only).
Console/network capture not available — not tested.

## Action log

1. Opened http://localhost:4173/ — expected a home page; got the "Ecosystem Overview" landing page with a pond dataset (FW-POND-A) already summarized (12 species, 17 links) plus a big "Explore Workspace" button. Loaded quickly, no blank screen (approximate, no throttling available). Screenshot 01-landing-375.webp.
2. Tapped "Explore Workspace" — expected the main working area; landed on #/explore "Workspace" with a "Loaded network" dropdown, species list, graph, and a Simulation panel ("Run direct removal" disabled, saying "Select a species to enable simulation." — clear guidance). Screenshot 02-workspace-375.webp.
3. Picked dataset in the "Loaded network" dropdown — chose "Terrestrial · TER-GRASS-A · Temperate grassland"; the stats and species list refreshed to 14 species (Caterpillar, Clover, Grass, ... Hawk). Worked first try.
4. Tapped the "Grass" species row in the species list — expected it to become selected; the Simulation panel now showed "Selected species: Grass" and "Run direct removal" became enabled.
5. Tapped "Run direct removal" — expected results; the "Baseline versus scenario" panel appeared with full metrics: Nodes remaining 13 of 14 (-1 vs baseline), Links remaining 25 of 29 (-4 vs baseline), Link loss 13.8% (4/29), Connectance 0.160 (baseline 0.159), Consumers directly affected 4 (Grasshopper, Caterpillar, Ground beetle, Rabbit), Food-depleted 0, Secondary removals 0. FIRST SUCCESS. Screenshot 03-scenario-metrics-375.webp. Stopped here per rules.

## Friction points

1. "Those little (i) buttons next to each number are way too small for my thumb." — #/explore, metrics panel: the circular info-note buttons beside metric names render ~16-20px, well under a ~44px touch target. Expected tappable info; actual target looks hard to hit reliably. Severity 2 (minor). 03-scenario-metrics-375.webp
2. "After I picked my species I had to scroll a long way down past the graph and the inspector before I found the Run button." — #/explore: on a 375px screen the Simulation panel sits far below the species list (long vertical scroll). Not blocking, just distance. Severity 2 (minor). 02-workspace-375.webp
3. "The Run button was greyed out at first and I didn't know why until I read the small line under it." — #/explore: "Run direct removal" starts disabled; the explanation ("Select a species to enable simulation.") is small text. Mild, self-explaining once found. Severity 1 (cosmetic). 02-workspace-375.webp

No blank screens, no sideways scrolling, no overlapping or cut-off text, no stuck modals, nothing failed to load during my run.

## Horizontal-overflow checks (scrollWidth vs clientWidth)

- Landing (#/ ): 365 vs 365 — no sideways scroll
- Workspace (#/explore): 365 vs 365 — no sideways scroll
- Results/metrics (#/explore, post-run): 365 vs 365 — no sideways scroll

## Notes

- Dataset picking used a native dropdown (14 options) — worked cleanly.
- All primary buttons (Explore Workspace, species rows, Run direct removal) looked comfortably large in screenshots; only the (i) note buttons looked small.
- Load speed felt normal with no long blank states, but this is approximate since network/CPU throttling was unavailable.

Reached first success: yes. Actions taken: 5. Quit at: n/a.
