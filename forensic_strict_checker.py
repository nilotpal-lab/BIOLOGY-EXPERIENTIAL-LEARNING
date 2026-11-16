import docx
from docx.shared import Inches, Pt
import re

def run_strict_audit(doc_path):
    doc = docx.Document(doc_path)
    issues = []
    passes = []
    
    print("=" * 80)
    print("STRICT ACADEMIC & TECHNICAL AUDIT REPORT")
    print(f"Target Document: {doc_path}")
    print("=" * 80)
    
    # -------------------------------------------------------------------------
    # 1. COVER PAGE & ROSTER AUDIT
    # -------------------------------------------------------------------------
    print("\n[CHECK 1] COVER PAGE & STUDENT ROSTER VERIFICATION")
    cover_text = "\n".join([p.text for p in doc.paragraphs[:10]])
    if "B. Tech CSE - SE" in cover_text:
        passes.append("Cover Page branch correctly designated as 'B. Tech CSE - SE'")
    else:
        issues.append(("HIGH", "Cover Page", "Branch designation is not 'B. Tech CSE - SE'"))
        
    t0 = doc.tables[0]
    roster = [(r.cells[0].text.strip(), r.cells[1].text.strip()) for r in t0.rows[1:]]
    expected_usns = ['25BTRSN048', '25BTRSN029', '25BTRSN040', '25BTRSN044', '25BTRSN036', '25BTRSN009']
    actual_usns = [u for u, n in roster]
    if actual_usns == expected_usns:
        passes.append(f"Student roster matches official USNs: {actual_usns}")
    else:
        issues.append(("CRITICAL", "Roster", f"Roster USNs mismatch: expected {expected_usns}, got {actual_usns}"))
        
    # -------------------------------------------------------------------------
    # 2. TABLE OF CONTENTS SYNCHRONIZATION
    # -------------------------------------------------------------------------
    print("\n[CHECK 2] TABLE OF CONTENTS vs DOCUMENT BODY SYNCHRONIZATION")
    toc_tbl = doc.tables[1]
    toc_items = [(r.cells[0].text.strip(), r.cells[1].text.strip(), r.cells[2].text.strip()) for r in toc_tbl.rows[1:]]
    
    # Find all H1 headings in body
    h1_headings = []
    for p in doc.paragraphs:
        txt = p.text.strip()
        if p.runs and p.runs[0].font.size and p.runs[0].font.size.pt == 15.0:
            h1_headings.append(txt)
            
    print(f"  TOC entries count: {len(toc_items)}")
    print(f"  H1 headings in document: {len(h1_headings)}")
    for sl, tit, pg in toc_items:
        # Check if matching H1 exists
        matching = any(tit.lower() in h.lower() for h in h1_headings)
        if matching:
            passes.append(f"TOC entry '{sl}. {tit}' exists in document body")
        else:
            issues.append(("CRITICAL", "TOC Sync", f"TOC entry '{sl}. {tit}' (Page {pg}) is MISSING from document body!"))

    # -------------------------------------------------------------------------
    # 3. IMAGE POSITIONING, CAPTIONS & TOPIC RELEVANCE
    # -------------------------------------------------------------------------
    print("\n[CHECK 3] IMAGE AUDIT: UNDER TOPIC, ALIGNMENT, EXTENTS, CAPTIONS")
    current_h1 = "PRE-H1"
    current_h2 = "PRE-H2"
    image_records = []
    
    for p_idx, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if p.runs and p.runs[0].font.size and p.runs[0].font.size.pt == 15.0:
            current_h1 = txt
            current_h2 = ""
        elif p.runs and p.runs[0].font.size and p.runs[0].font.size.pt == 12.5:
            current_h2 = txt
            
        has_draw = any('<w:drawing' in r._r.xml for r in p.runs)
        if has_draw:
            cap_p = doc.paragraphs[p_idx + 1] if p_idx + 1 < len(doc.paragraphs) else None
            cap_txt = cap_p.text.strip() if cap_p else ""
            image_records.append({
                'idx': len(image_records),
                'p_idx': p_idx,
                'h1': current_h1,
                'h2': current_h2,
                'align': p.alignment,
                'keep_with_next': p.paragraph_format.keep_with_next,
                'caption': cap_txt
            })
            
    for img in image_records:
        if img['idx'] == 0:
            # Banner
            continue
        print(f"  Figure {img['idx']}: P{img['p_idx']} under [{img['h1']} > {img['h2']}]")
        print(f"    Alignment: {img['align']}, keep_with_next: {img['keep_with_next']}")
        print(f"    Caption: \"{img['caption'][:70]}...\"")
        
        # Check alignment
        if img['align'] != docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER:
            issues.append(("MEDIUM", f"Figure {img['idx']}", f"Image paragraph alignment is {img['align']}, expected CENTER (1)"))
        else:
            passes.append(f"Figure {img['idx']} is centered")
            
        # Check keep_with_next
        if not img['keep_with_next']:
            issues.append(("HIGH", f"Figure {img['idx']}", f"Image paragraph does NOT have keep_with_next=True (risk of separating from caption)"))
        else:
            passes.append(f"Figure {img['idx']} has keep_with_next=True")
            
        # Check caption prefix
        if not img['caption'].startswith(f"Figure {img['idx']}:"):
            issues.append(("HIGH", f"Figure {img['idx']}", f"Caption does not start with 'Figure {img['idx']}:' (got: {img['caption'][:30]})"))
        else:
            passes.append(f"Figure {img['idx']} caption correctly prefixed")
            
    # Check topic relevance
    # Figure 2 is Trophic Explorer, currently under 3.3 Dunne Attack Strategies
    # Figure 6 is Cross-Ecosystem Comparative Dashboard, currently under 4.3 Sensitivity Analysis
    # Figure 8 is Academic Mathematical Report Modal, currently under 4.4 Data Intake Studio
    fig_topic_checks = [
        (1, "Figure 1", "Architecture", "1. INTRODUCTION", ["1.3", "1.4", "Architecture", "System Navigation"]),
        (2, "Figure 2", "Trophic Explorer", "3. RESEARCH METHODOLOGY", ["3.2", "Trophic", "Topological", "Stratification", "Cytoscape"]),
        (3, "Figure 3", "Extinction Cascade", "3. RESEARCH METHODOLOGY", ["3.3", "Attack Strategies", "Cascade", "Simulation"]),
        (4, "Figure 4", "Dunne Robustness", "4. RESULTS & EXPERIMENTAL VALIDATION", ["4.2", "Robustness", "Percolation"]),
        (5, "Figure 5", "Sensitivity Ranking", "4. RESULTS & EXPERIMENTAL VALIDATION", ["4.3", "Sensitivity", "Keystone"]),
        (6, "Figure 6", "Comparison Dashboard", "4. RESULTS & EXPERIMENTAL VALIDATION", ["Cross-Ecosystem", "Comparison", "Comparative", "Biome"]),
        (7, "Figure 7", "Data Intake Studio", "4. RESULTS & EXPERIMENTAL VALIDATION", ["Data Intake", "Import", "CSV"]),
        (8, "Figure 8", "Academic Report Modal", "4. RESULTS & EXPERIMENTAL VALIDATION", ["Academic", "Report", "Mathematical", "KaTeX"])
    ]
    
    for f_idx, f_name, f_type, exp_h1, exp_h2_keywords in fig_topic_checks:
        rec = image_records[f_idx]
        if exp_h1 not in rec['h1']:
            issues.append(("HIGH", f_name, f"Expected H1 '{exp_h1}', but placed under '{rec['h1']}'"))
        h2_match = any(kw.lower() in rec['h2'].lower() for kw in exp_h2_keywords)
        if not h2_match:
            issues.append(("MEDIUM", f_name, f"Placed under H2 '{rec['h2']}', which does not match topic keywords {exp_h2_keywords}"))
        else:
            passes.append(f"{f_name} topic alignment verified under {rec['h2']}")

    # -------------------------------------------------------------------------
    # 4. MATHEMATICAL NOTATION & EQUATIONS
    # -------------------------------------------------------------------------
    print("\n[CHECK 4] MATHEMATICAL TYPOGRAPHY & VARIABLE AUDIT")
    # Scan for raw unformatted variables
    raw_patterns = [
        (r'\bR50\b', "R50 missing subscript 50 (should be R_{50})"),
        (r'\bk_in\b', "k_in raw ASCII (should be k_{in})"),
        (r'\bk_out\b', "k_out raw ASCII (should be k_{out})"),
        (r'\bS_0\b', "S_0 raw ASCII (should be S_0)"),
        (r'\bS\^2\b', "S^2 raw ASCII (should be S^2 with superscript)"),
        (r'L\s*/\s*\(S\^2\)', "L / (S^2) raw ASCII (should be L / S^2)"),
    ]
    
    for p_idx, p in enumerate(doc.paragraphs):
        # Skip if paragraph is inside TOC or code
        for pat, desc in raw_patterns:
            matches = re.findall(pat, p.text)
            if matches:
                # Check runs to see if subscript/superscript is actually applied
                # If matches is R50, check if 50 is subscript
                if pat == r'\bR50\b':
                    has_sub = any(r.font.subscript for r in p.runs if '50' in r.text)
                    if not has_sub:
                        issues.append(("MEDIUM", f"Math in P{p_idx}", f"{desc} in: \"{p.text[:65]}...\""))
                elif pat in [r'\bk_in\b', r'\bk_out\b', r'\bS_0\b', r'\bS\^2\b']:
                    issues.append(("MEDIUM", f"Math in P{p_idx}", f"{desc} in: \"{p.text[:65]}...\""))
                    
    # Check tables for raw math
    for t_idx, tbl in enumerate(doc.tables):
        for r_idx, row in enumerate(tbl.rows):
            for c_idx, cell in enumerate(row.cells):
                for pat, desc in raw_patterns:
                    matches = re.findall(pat, cell.text)
                    if matches:
                        has_sub = any(r.font.subscript for r in cell.paragraphs[0].runs if '50' in r.text)
                        if not has_sub and pat == r'\bR50\b':
                            issues.append(("MEDIUM", f"Table {t_idx} R{r_idx}C{c_idx}", f"{desc} in cell: \"{cell.text}\""))

    # -------------------------------------------------------------------------
    # 5. TABLE FORMATTING & PROPORTIONS
    # -------------------------------------------------------------------------
    print("\n[CHECK 5] TABLE GEOMETRY & STYLING AUDIT")
    # Table 1: TOC column widths
    t1 = doc.tables[1]
    t1_widths = [c.width.inches for c in t1.rows[0].cells]
    print(f"  Table 1 (TOC) widths: {[f'{w:.2f}in' for w in t1_widths]}")
    if abs(t1_widths[0] - t1_widths[1]) < 0.2:
        issues.append(("MEDIUM", "Table 1 (TOC)", f"TOC columns are equally spaced ({t1_widths[0]:.2f}in each); Sl.no and Page No should be compact, Title wide"))
    else:
        passes.append("Table 1 (TOC) column proportions optimized")
        
    # Table 2: Benchmark datasets
    t2 = doc.tables[2]
    t2_widths = [c.width.inches for c in t2.rows[0].cells]
    print(f"  Table 2 (Datasets) widths: {[f'{w:.2f}in' for w in t2_widths]}")
    if t2_widths[4] < 2.0:
        issues.append(("LOW", "Table 2 (Datasets)", f"Provenance column width is {t2_widths[4]:.2f}in; should be at least 2.3in to prevent DOI line wrapping"))
        
    # Table 3: Metrics table
    t3 = doc.tables[3]
    t3_widths = [c.width.inches for c in t3.rows[0].cells]
    print(f"  Table 3 (Comparative) widths: {[f'{w:.2f}in' for w in t3_widths]}")

    # -------------------------------------------------------------------------
    # 6. HEADINGS ORPHAN CHECK (keep_with_next)
    # -------------------------------------------------------------------------
    print("\n[CHECK 6] HEADING ORPHAN CONTROLS")
    orphan_headings = []
    for p_idx, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if not txt: continue
        is_h = p.style.name.startswith('Heading') or (p.runs and p.runs[0].font.size and p.runs[0].font.size.pt in [15.0, 12.5])
        if is_h and not p.paragraph_format.keep_with_next:
            orphan_headings.append((p_idx, txt[:40]))
            
    if orphan_headings:
        issues.append(("HIGH", "Orphan Control", f"{len(orphan_headings)} headings lack keep_with_next=True: {[h[1] for h in orphan_headings[:5]]}"))
    else:
        passes.append("All headings have keep_with_next=True")

    # -------------------------------------------------------------------------
    # SUMMARY & RATING
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("AUDIT FINDINGS SUMMARY")
    print("=" * 80)
    print(f"TOTAL CHECKS PASSED: {len(passes)}")
    print(f"TOTAL ISSUES FLAGGED: {len(issues)}")
    
    crit_count = sum(1 for sev, _, _ in issues if sev == "CRITICAL")
    high_count = sum(1 for sev, _, _ in issues if sev == "HIGH")
    med_count = sum(1 for sev, _, _ in issues if sev == "MEDIUM")
    low_count = sum(1 for sev, _, _ in issues if sev == "LOW")
    
    print(f"  CRITICAL: {crit_count}")
    print(f"  HIGH    : {high_count}")
    print(f"  MEDIUM  : {med_count}")
    print(f"  LOW     : {low_count}")
    
    for sev, loc, desc in issues:
        print(f"  [{sev:8s}] {loc:25s}: {desc}")

    # Compute strict score out of 100
    # Base 100. CRITICAL -15, HIGH -8, MEDIUM -3, LOW -1
    penalty = (crit_count * 15) + (high_count * 8) + (med_count * 3) + (low_count * 1)
    score = max(0, 100 - penalty)
    print("\n" + "=" * 80)
    print(f"STRICT AUDIT SCORE: {score}/100")
    print("=" * 80)

if __name__ == '__main__':
    doc_path = r'C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Experiential_Learning_Report.docx'
    run_strict_audit(doc_path)
