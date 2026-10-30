# Visual Review & Verification: Experiment Studio

## Phase 6: Experiment Studio (`#/experiment`)
- **Reference Image**: `06_Experiment_Studio_Page.png`
- **Implementation Status**: Complete and Verified
- **Verification Date**: 2026-10-31

### Design Compliance Checklist
1. **Header & Typography**:
   - Lora serif heading: `Experiment Studio`.
   - Scientific editorial description: `Analyse the effect of removing each species to identify key organisms and ecosystem vulnerabilities using multiple structural metrics.`
   - Freshwater wetland ecosystem landscape artwork softly fading into warm ivory (`#FCFBF7`).
2. **Top Controls Row**:
   - `1. Select Dataset`: Ecosystem dropdown with thumbnail and category label.
   - `2. Analysis Settings`: Styled button group (`Analyse All Species` / `Custom Selection`) and prominent deep forest green (`#35563B`) action button `Run Analysis`.
3. **5 Top Metric Cards**:
   - `Link Loss %` (blue link icon)
   - `Directly Affected Consumers` (rose user group icon)
   - `Secondary Removals` (amber fork icon)
   - `Cascade Removed %` (purple clock icon)
   - `Cascade Depth` (emerald layers icon)
   - Interactive selection state highlighting active metric with soft tint and border ring.
4. **Main Section (Left 8 Cols, Right 4 Cols)**:
   - **Left Column**:
     - `Species Rankings` table:
       - Dynamic species count badge.
       - Sort by dropdown selector.
       - Integrated search input and trophic role dropdown filter.
       - Columns: `#`, `Species` (with organism SVG artwork), `Link Loss %` (with progress bar), `Directly Affected`, `Secondary Removals`, `Cascade Removed %` (with progress bar), `Cascade Depth`.
       - Top critical species highlighted with soft coral tint (`#FEF2F2`).
       - Pagination footer with page numbers and navigation arrows.
     - `Ecosystem Vulnerability Summary`:
       - 4 metric tiles: Most influential species, Maximum species removed, Maximum link loss, and Maximum cascade depth.
   - **Right Column**:
     - `Top 5 Most Influential Species`: Horizontal bar chart featuring organism icons, names, colored bars in a warm coral-to-sage gradient, percentages, and bottom axis scale `Cascade Removed % ⓘ`.
     - `Metric Comparison`: Filter pills (`Link Loss %`, `Directly`, `Secondary`, `Cascade %`, `Depth`) with Recharts bar chart showing values across species.
     - `Key Insights`: Soft sage card (`#F7F8F4`) with lightbulb icon and dynamically derived ecological insights.
5. **Quality Assurance**:
   - 100% browser zoom desktop viewport (1440x900) verified.
   - Mobile responsive viewport (390x844) verified with clean vertical stacking and zero horizontal scroll.
   - All 133 unit/integration tests passing.
