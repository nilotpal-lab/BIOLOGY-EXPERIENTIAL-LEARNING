# Visual Review & Verification: Dataset Import

## Dataset Import (`#/import`)
- **Reference**: Features Page Reference Card 7 (`02_Features_Page.webp` / `media_1793370498859_ed9523d9.jpg`)
- **Implementation Status**: Complete and Verified
- **Verification Date**: 2026-10-31

### Design Compliance Checklist
1. **Header & Typography**:
   - Lora serif heading: `Dataset Import Studio`.
   - Scientific editorial description: `Import custom food webs using your own CSV or JSON files. Review the required schemas below, download starter templates, or load an example dataset with one click.`
   - Nature banner artwork seamlessly blended into warm ivory background (`#FCFBF7`).
2. **Prominent Example Data Format Guide**:
   - Interactive format switcher tabs: `1. Feeding Links (Link CSV)`, `2. Species Nodes (Node CSV)`, and `3. JSON Network Schema`.
   - Clear tabular representation showing required column names, data types, and ecological interpretation.
   - Dual ecological and graph formatting support: `predator,prey` (standard intuitive ecological format matching Features Page card) as well as `source,target` (directed food-to-consumer graph format).
   - One-click copy buttons (`Copy CSV Text`, `Copy JSON`) and download starter templates (`Download Link CSV Template`, `Download Node CSV Template`, `Download JSON Template`).
3. **Upload & In-Browser Validation Flow**:
   - Step 1: Format toggle (`CSV Files` vs `JSON Single Network File`).
   - Clean drag-and-drop file zone with dashed borders, file format indicators, and clear capacity limits (up to 2,000 nodes / 20,000 edges).
   - Direct text-paste accordion with syntax-highlighted editor areas for quick testing and small datasets.
   - Metadata attribution fields (Dataset Name, Ecosystem Category, Publication Citation, Origin Institution, Source URL/DOI, License).
   - In-browser integrity engine checking for undefined endpoints, self-loops, duplicate links, and missing trophic roles.
   - One-click "Load Sample Dataset into Form" button for instant preview and validation testing.
4. **Validation Preview & Safe Committal**:
   - Non-destructive execution: current workspace is never replaced until explicit user confirmation after validation passes.
   - Automatic issue repair options (e.g. drop self-loops, keep first duplicate edge).
   - Live acceptance summary showing accepted node count and link count before loading into the Interactive Explorer.
5. **Quality Assurance**:
   - 100% browser zoom desktop viewport (1440x900) verified.
   - Mobile responsive viewport (390x844) verified with clean vertical stacking.
   - 133/133 Vitest tests and 29/29 browser acceptance tests passing.
