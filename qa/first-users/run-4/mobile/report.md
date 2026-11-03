# QA First-User Walkthrough — persona "mobile" (375px touch phone)

- App: https://foodwebguard.vercel.app/
- Date: 2026-11-03
- Viewport: 375x667 (emulated in-browser).
- Environment note: localStorage cleared + reload before walkthrough ("Environment preparation is complete").
- NOT TESTED (runtime limitation, not faked): Slow-3G network throttling and 4x CPU slowdown are NOT available in this browser runtime — both conditions marked **not tested**. The 375px viewport IS emulated. Console/network capture also not available; observations are visual/DOM-read only.

---

## 1. Walkthrough narrative (expected vs happened)

**Step 1 — Landing page** (`01-initial-load.png`)
- Expected: a normal mobile landing page that fits 375px.
- Happened: loaded cleanly. Header, hero, two CTAs, stats grid all readable, no sideways scroll visible here. Good first impression.

**Step 2 — Tap "Open Explorer"** (`02-open-explorer.png`)
- Expected: navigate to the explorer and see an overview of the food web.
- Happened: navigated to `#/explore`, BUT a "Pond algae" species detail modal was already open, covering the screen. I never tapped any species. Also noted the dataset chip "FW-POND-A · Temperate pond" pushes the hamburger menu to x=415 — outside the 375px viewport.
- Measured: "Open Explorer" button = 173x36 px (height under 44px minimum).

**Step 3 — Close the unexpected modal** (`03-explorer-page.png`)
- Expected: tap the X once, modal closes.
- Happened: first tap on "Close inspector" (28x28 px — well under 44px) did not close it, and the modal shifted ~12px between taps (layout jump). Second tap closed it. Afterwards I could see the Explorer toolbar (Species list / Inspector / Presentation view), layout toggles, zoom 54%, the web graph and legend. Measured: Zoom in/out 21x21, Fit to canvas 24x21, label/highlight toggles 36x20 — all tiny for fingers.

**Step 4 — Open Species list and pick a species** (`04-species-list.png`, `05-species-selected.png`)
- Expected: a list of species; tapping one selects it.
- Happened: list opened ("Interactive food web — 12 of 12 nodes", search + role filter + 12 species). Tapped "Heron (Apex predator)"; the row highlighted. Row measured 273x33 px (under 44px).

**Step 5 — Open Inspector** (`06-inspector.png`)
- Expected: see the selected species' details.
- Happened: the Heron detail panel opened BUT the species list card stayed open on top of it — two stacked overlapping panels on a 375px screen; I had to find and tap the list's own X (22x22 px) to see the inspector. Measured: "Inspector" toolbar button 91x25 px. The Habitat value "Freshwater (Lakes/R…" is truncated at the right edge.

**Step 6 — Find the simulation controls** (`07-inspector-scrolled.png`, `08-simulation-section.png`)
- Expected: a clearly labelled "remove species / simulate" action.
- Happened: scrolling revealed "Select this species for simulation" (Heron already shown as SELECTED SPECIES) and a "DIRECT SIMULATION" card with two radio modes ("Direct removal" pre-selected, "Direct removal + cascade") and a green "Run direct removal" button, plus a reassuring note that scenarios never delete baseline data. Scrolling was painful — every scroll gesture lagged/needed retries.

**Step 7 — Run the removal** (`09-run-removal.png`, `10-after-run.png`)
- Expected: tap Run, results appear near the button (spinner, banner, anything).
- Happened: button (178x36 px) tapped — screen unchanged. Nothing indicated the run happened. I tapped it a second time (real-user behavior) and started hunting. A DOM text scan (read-only) proved the run HAD produced metrics: "SECONDARY REMOVALS 0", "SECONDARY REMOVALS AS % OF BASELINE NODES 0.0%", "Links removed by the initial removal: Minnow → Heron, Perch → Heron", "CASCADE DEPTH 0" — but these were buried far below the Export section, some even rendered only in `sr-only` (screen-reader-only) markup.

**Step 8 — Hunt for the results** (`11-results-metrics.png`, `12-results-visible.png`, `13-scrolled-right.png`)
- Expected: scroll down, see results.
- Happened: after the Export card the panel scroll bottomed out. The page itself cannot scroll vertically (document scrollHeight = 668 = viewport; `main` is `overflow:hidden`, 603px tall) while the results block sits at y=674–950 — visually clipped/unreachable in the normal flow. The page also reports scrollWidth 447 vs 375 (72px sideways overflow) but horizontal scroll didn't move the view; at one point the whole app shifted left, cutting panel text to "eron" / "opic Level".

**Step 9 — Metrics tab = first success** (`14-metrics-tab.png`, `15-metrics-scrolled.png`)
- Expected: a Metrics tab should show species-level numbers.
- Happened: the Heron panel's "Metrics" tab shows "Incoming Degree (Prey) 2", "Outgoing Degree (Predators) 0", "Total Degree 2", and **"Trophic Status: Removed in scenario"** — clear visual confirmation the removal scenario ran and its result is recorded. Goal reached.

---

## 2. Friction log

| # | Quote (as user) | URL | Severity | What happened (with measured sizes) |
|---|---|---|---|---|
| F1 | "Why is a species popup already open? I just got here." | https://foodwebguard.vercel.app/#/explore | 2 | Right after tapping "Open Explorer", a "Pond algae" inspector modal was open with no action from me. Expected an overview. |
| F2 | "The X is so tiny and it didn't even close on the first tap." | https://foodwebguard.vercel.app/#/explore | 3 | Modal close button "Close inspector" measures 28x28 px (< 44px). First tap failed to close; modal also shifted ~12px between taps (layout jump). Needed 2 taps. |
| F3 | "Where did the menu button go? It's off the side of my screen." | https://foodwebguard.vercel.app/#/explore | 3 | Header dataset chip pushes the hamburger ("Toggle navigation menu") to x=415, i.e. 40px outside the 375px viewport. Page scrollWidth 447 vs innerWidth 375 → 72px sideways overflow; horizontal scrolling doesn't recover it cleanly. |
| F4 | "I tapped Run — did anything happen?" | https://foodwebguard.vercel.app/#/explore | 3 | "Run direct removal" (178x36 px) gave no feedback: no spinner, banner, or scroll-to-results. Had to tap twice and hunt manually. |
| F5 | "The results exist but I literally cannot scroll to them." | https://foodwebguard.vercel.app/#/explore | 3 | Results metrics (SECONDARY REMOVALS, CASCADE DEPTH, links removed) render at y=674–950 while the document can't scroll vertically (scrollHeight 668, main overflow:hidden) and part of the block is `sr-only` markup. Results are effectively invisible in the normal flow on 375px; only the species "Metrics" tab reveals the outcome ("Trophic Status: Removed in scenario"). |
| F6 | "Every list row and toolbar button is smaller than my fingertip." | https://foodwebguard.vercel.app/#/explore | 2 | Sub-44px tap targets measured: "Open Explorer" 173x36; species rows 273x33; "Inspector" tab 91x25; Zoom in/out 21x21; Fit to canvas 24x21; label/highlight toggles 36x20; "Close species panel" X 22x22. |
| F7 | "Two cards stacked on top of each other — which one am I in?" | https://foodwebguard.vercel.app/#/explore | 2 | Tapping "Inspector" while the species list was open stacked the Heron panel underneath the list card; the list doesn't auto-close and covers the content. |
| F8 | "The app slid sideways and now the words are cut off." | https://foodwebguard.vercel.app/#/explore | 2 | After a horizontal scroll attempt, the whole app stayed offset — panel text clipped to "eron" / "opic Level"; scroll position stuck (window.scrollX 0 but visually shifted; required scroll-back). |
| F9 | "The habitat text just runs off the card." | https://foodwebguard.vercel.app/#/explore | 1 | "Habitat: Freshwater (Lakes/R…" truncated at right edge of the inspector card. |
| F10 | "Nothing moved at all when I tapped Run the first time." | https://foodwebguard.vercel.app/#/explore | 1 | No visual state change, spinner or confirmation after the first Run tap; also slight modal layout jump noted in F2. |

Environment quirks (not app bugs, not counted): cua scroll gestures repeatedly timed out (30s) though they partially applied; one screenshot needed 2 retries after surface timeouts.

---

## 3. Verdict

First success was reached: built-in dataset FW-POND-A loaded, species "Heron" selected, "Run direct removal" executed, and results confirmed via the species Metrics tab ("Trophic Status: Removed in scenario") plus DOM-verified metrics (secondary removals 0, cascade depth 0, 2 links removed). However, discovering the results required a second Run tap, extensive scrolling, and a detour to the Metrics tab — the primary results area is clipped/unreachable on a 375px viewport.

reached first success: yes
actions taken: 21
