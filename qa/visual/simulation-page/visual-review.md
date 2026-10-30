# Visual Review & Verification: Simulation Laboratory

## Phase 4: Simulation Laboratory (`#/simulation`)
- **Reference Image**: `04_Simulation_Page.png`
- **Implementation Status**: Complete and Verified
- **Verification Date**: 2026-10-30

### Design Compliance Checklist
1. **Header & Typography**:
   - Lora serif heading: `Simulation Laboratory`.
   - Clear scientific editorial description.
   - Right banner artwork with freshwater scenery softly fading into warm ivory (`#FCFBF7`).
2. **Left Simulation Controls Column**:
   - `1. Select Simulation Mode` with styled radio options for `Direct Removal` and `Direct Removal + Cascade`.
   - `2. Select a Species` dropdown selector with live organism preview card (icon, names, trophic role badge).
   - `3. Simulation Settings`: Step-by-step animation toggle switch, animation speed selector (Slow, Normal, Fast).
   - Primary `Run Simulation →` deep forest green action button (`#35563B`).
3. **Center Graph (Simulation View)**:
   - Header with mini trophic role legend including apex, tertiary, secondary, primary, producer, and dashed red `✕` removed badge.
   - Cytoscape canvas featuring removed node indicator and red highlighted feeding links.
   - Interactive zoom, pan, and layout toggle controls.
4. **Right Results & Affected Species Column**:
   - `Simulation Results` with `<Species> Removed` danger status badge.
   - 2x2 Quantitative Metrics grid:
     - Species Removed (Direct)
     - Links Lost (out of baseline & percentage)
     - Secondary Removals (via cascade)
     - Total Removed (out of baseline)
   - `Affected Species` accordion panel with `Direct Effects` and `Cascade Effects` tabs, organism icons, `Lost food source` / `Food depleted` badges, and link loss counters (`↓ -1 link`).
5. **Bottom Cascade Timeline**:
   - Play/pause scrubber with round indicator and step buttons.
   - Round progression stepper cards (Initial State, Round 1, Round 2, Round 3) with dynamic node removals and affected stats.
6. **Quality Assurance**:
   - Responsive verification: Desktop 1440x900 at 100% zoom and mobile 390x844.
   - All dynamic calculations verified from empirical food-web graph data.
