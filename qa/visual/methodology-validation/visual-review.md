# Visual Review & Verification: Methodology & Validation

## Methodology & Validation (`#/methodology`)
- **Reference**: Features Page Reference Card 8 (`02_Features_Page.png` / `media_1793370498859_ed9523d9.jpg`)
- **Implementation Status**: Complete and Verified
- **Verification Date**: 2026-10-31

### Design Compliance Checklist
1. **Header & Typography**:
   - Lora serif heading: `Methodology & Validation`.
   - Scientific editorial description: `Understand the mathematical models, formulas, ecological assumptions and live automated validation checks governing FoodWebGuard.`
   - Nature banner artwork seamlessly blended into warm ivory background (`#FCFBF7`).
2. **Mathematical Models & Formulation Cards**:
   - **Population Update Formulation (Lotka-Volterra Discrete Trophic Dynamics)**:
     - Clear typographic display: $N_i(t+1) = N_i(t) + r_i N_i(t)(1 - N_i(t)/K_i) - \sum_j \alpha_{ij} N_i(t) N_j(t)$.
     - Detailed parameter glossary: $r_i$ (intrinsic growth), $K_i$ (carrying capacity), $\alpha_{ij}$ (predation coefficient).
   - **Food Web Connectance ($C$)**:
     - Equation: $C = L / [N(N-1)]$.
     - Explicit mathematical boundaries and zero-division guards ($N \ge 2$).
   - **Structural Link Loss Percentage**:
     - Equation: $\text{Link Loss \%} = 100 \times (L_0 - L_s) / L_0$.
   - **Secondary Extirpation Criterion (Topological Cascade Rule)**:
     - Clear structural rule: consumer is removed if and only if all recorded baseline incoming food resources are severed.
3. **Live In-Browser Automated Test Suite**:
   - 70+ deterministic empirical and mathematical assertions executed live inside the client browser.
   - Synchronous initial execution on mount with real-time progress indicators.
   - Filter and search bar to inspect individual test groups (Fixture validation, Chain validation, Scenario simulation, Rankings).
   - Passing/failing status pill badges with expected vs actual values.
4. **Ecological Assumptions & Edge-Case Coverage**:
   - Comprehensive documentation of model assumptions, discrete time-step approximations, and data boundaries.
   - 25+ real-world edge-case scenario guarantees (isolated nodes, cyclic loops, food-depleted consumers, zero-link baselines).
5. **Quality Assurance**:
   - 100% browser zoom desktop viewport (1440x900) verified.
   - Mobile responsive viewport (390x844) verified with clean vertical stacking.
   - 133/133 Vitest tests and 29/29 browser acceptance tests passing.
