# QA First-User Walkthrough — "mobile" persona (375px touch phone)

- Site: https://foodwebguard.vercel.app/
- Persona: mobile user, 375x667 emulated touch viewport
- Date: 2026-11-04
- Rule compliance: no source code or qa/ files read; all interaction via visible page elements (clicks, keyboard on native select, scrolling); read-only DOM measurement only.

## Environment / limitations (stated up front)

- 375x667 viewport: **emulated, tested**.
- Slow-3G throttling: **not tested** (not available in this runtime).
- 4x CPU slowdown: **not tested** (not available in this runtime).
- Console/network capture: not available — nothing faked.
- Screenshot flakiness: several screenshots timed out on pages with continuously animating canvases (food-web graph, step-by-step simulation animation). Where a screenshot was impossible I fell back to read-only text observation. This is a test-tooling limitation, not an app defect, and is not counted as app friction.

## Walkthrough narrative

**Step 1 — Home page (01-initial-load.png, 02-home-mid.png).**
Expected: a clean landing page that fits 375px. Happened: yes — hero, "Open Explorer" CTA, stats cards all stack correctly, no sideways scrolling (scrollWidth 365 = clientWidth 365). I noticed the eyebrow line "REAL ECOSYSTEMS. REAL INSIGHTS." seems to have a stray period/glyph clipped at the right edge (cosmetic, uncertain). The hero CTA "Open Explorer" measured **173x36px** — a touch under the 44px minimum height. The hamburger icon is only **16x32px**.

**Step 2 — Tapping "Open Explorer" (04-explorer.png).**
Expected: the explorer opens. Happened: yes, navigated to `#/explore`. My first tap attempt with a text locator timed out; a coordinate tap worked. The app auto-loaded built-in dataset **FW-POND-A · Temperate pond** and opened a "Pond algae" species inspector panel.

**Step 3 — Explorer on mobile (no screenshot — capture timed out on the animated canvas; findings from read-only DOM measurement and 04/06).**
Expected: food-web canvas plus species list usable on a phone. Happened: the canvas views fine, but the **species-list rows render only ~17px wide** (clipped nearly off-canvas at 375px) — effectively untappable. Small controls everywhere: zoom in/out/fit **21–24px**, "Toggle node labels"/"Toggle link highlighting" **36x20px**. I tapped the panel's X ("Close inspector", 44x44 — good size) but on the next verified view the panel was **still open** (uncertain: the tap may have been eaten by a re-render).

**Step 4 — Finding the Simulation Lab (06-nav-menu.png).**
Expected: hamburger opens a menu. Happened: my first coordinate tap on the hamburger produced no visible menu; the second tap opened it. Menu items (Explore, Simulation, Cascade Timeline, …) are **168x30px** — under 44px tall, two columns squeezed into 375px. Tapping "Simulation" navigated to `#/simulation` (one locator tap timed out; coordinate tap worked).

**Step 5 — Simulation Laboratory (09-simulation-again.png; first arrival not captured — screenshot timed out, findings from read-only text/DOM).**
Expected: choose mode, choose species, run. Happened: the page is well structured — "1. SELECT SIMULATION MODE" cards are big (308px wide, 74–89px tall, excellent targets), "2. SELECT A SPECIES" is a native dropdown (308x35px). A default "example preview" result is shown before running. The mode cards pre-select "Direct Removal".

**Step 6 — Running my scenario.**
I selected **"Direct Removal + Cascade"** (tap confirmed by border highlight), then opened the species dropdown and picked **Perch** via keyboard (value verified). Scrolled to **Run Simulation** (308x44 — great target) and tapped it.

**Step 7 — First results, then a state reset (friction).**
Results appeared for "Perch Removed" with real metrics (LINKS LOST 5/17, 29.4%). I then tapped the tiny "Show step-by-step animation" switch (36x20px, no accessible name) and pressed Run again — my selections **reverted to the defaults** (Direct Removal + Backswimmer) and I got the generic "Example preview" instead of my scenario. Severity 3: a user's chosen scenario was silently discarded mid-flow.

**Step 8 — Recovering (09-simulation-again.png).**
Navigating away and back via the hamburger, I found "Perch" had survived in the dropdown (good) but the mode had reset to "Direct Removal". I re-selected "Direct Removal + Cascade" and pressed Run again.

**Step 9 — FIRST SUCCESS (10-simulation-results.png).**
The **Simulation Results** screen appeared with my scenario: "Perch Removed" badge, metric cards — SPECIES REMOVED **1** (Direct), LINKS LOST **5 out of 17 (29.4%)**, SECONDARY REMOVALS **0** (via cascade), TOTAL REMOVED **1 out of 12** — plus "Affected Species" (Heron — "Lost food source, -1 link") and a "Cascade Timeline" (Round 1/1: Perch removed → secondary cascade → stabilized state). Layout on 375px is clean: 2x2 metric cards, readable text, no sideways scrolling.

## Friction log

| # | Quote (one line) | URL | Severity | Measured tap size |
|---|------------------|-----|----------|-------------------|
| 1 | "Toggle navigation menu" hamburger — first tap showed no menu; target far too small | /#/explore | 2 minor (usability) | 16x32 px |
| 2 | "Open Explorer" hero CTA slightly under minimum height | / (home) | 1 cosmetic | 173x36 px |
| 3 | Header dataset dropdown ("FW-POND-… / Freshwater (UK)") — 12px font, ~17px tall control, very hard to tap/read on a phone | all pages | 3 major | 99x17 px, font 12px |
| 4 | Explore species-list rows clipped to slivers, effectively untappable | /#/explore | 3 major | 17x33 px each |
| 5 | Zoom in / Zoom out / Fit to canvas buttons minuscule | /#/explore | 2 minor | 21x21 / 24x21 px |
| 6 | "Toggle node labels" / "Toggle link highlighting" icon buttons | /#/explore | 2 minor | 36x20 px |
| 7 | Mobile menu items under minimum height, two columns crammed into 375px | all pages (menu) | 2 minor | 168x30 px |
| 8 | "Close inspector" X tap appeared not to close the panel (still open on next verified view; some uncertainty) | /#/explore | 3 major | 44x44 px (size OK; behavior suspect) |
| 9 | Animation toggle switch has no accessible label and is tiny | /#/simulation | 2 minor | 36x20 px |
| 10 | Scenario settings silently reverted to defaults (Direct Removal + Backswimmer "Example preview") after toggling a setting and pressing Run again | /#/simulation | 3 major | n/a |
| 11 | "Direct Effects (1)" / "Cascade Effects (0)" result tabs under minimum height | /#/simulation | 2 minor | 154x24 px |
| 12 | Cascade Timeline play / prev / next round buttons tiny | /#/simulation | 2 minor | 28x28 / 24x24 px |
| 13 | Stray period/glyph clipped at right edge of hero eyebrow line (uncertain) | / (home) | 1 cosmetic | n/a |

**Not found (persona checklist):** no blank loads; no sideways scrolling on any page visited (365/365 everywhere); no sticky bar covering a primary button (header is sticky but only ~64px); no hover-only interactions blocking touch; result metric text comfortably readable.

## Verdict

reached first success: yes
actions taken: 24
