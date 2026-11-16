import docx
from docx.shared import Inches, Pt
import re

def run_strict_audit(doc_path):
    doc = docx.Document(doc_path)
    issues = []
    passes = []
    
    print("=" * 80)
    print("STRICT ACADEMIC & TECHNICAL AUDIT REPORT (COMPACT 10-PAGE SPECIFICATION)")
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
        if p.runs and p.runs[0].font.size and p.runs[0].font.size.pt in [14.0, 15.0] and p.runs[0].font.bold:
            h1_headings.append(txt)
            
    print(f"  TOC entries count: {len(toc_items)}")
    print(f"  H1 headings in document: {len(h1_headings)}")
    for sl, tit, pg in toc_items:
        matching = any(tit.lower() in h.lower() for h in h1_headings)
        if matching:
            passes.append(f"TOC entry '{sl}. {tit}' exists in document body")
        else:
            issues.append(("CRITICAL", "TOC Sync", f"TOC entry '{sl}. {tit}' (Page {pg}) is MISSING from document body!"))

    # -------------------------------------------------------------------------
    # 3. IMAGE POSITIONING, CAPTIONS & 2-IMAGE PAIRING
    # -------------------------------------------------------------------------
    print("\n[CHECK 3] IMAGE AUDIT: UNDER TOPIC, ALIGNMENT, EXTENTS, CAPTIONS, PAIRING")
    current_h1 = "PRE-H1"
    current_h2 = "PRE-H2"
    image_records = []
    
    for p_idx, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if p.runs and p.runs[0].font.size and p.runs[0].font.size.pt in [14.0, 15.0] and p.runs[0].font.bold:
            current_h1 = txt
            current_h2 = ""
        elif p.runs and p.runs[0].font.size and p.runs[0].font.size.pt in [11.5, 12.5] and p.runs[0].font.bold:
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
            continue # Banner
        print(f"  Figure {img['idx']}: P{img['p_idx']} under [{img['h1']} > {img['h2']}]")
        print(f"    Alignment: {img['align']}, keep_with_next: {img['keep_with_next']}")
        print(f"    Caption: \"{img['caption'][:65]}...\"")
        
        if img['align'] != docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER:
            issues.append(("MEDIUM", f"Figure {img['idx']}", f"Image paragraph alignment is {img['align']}, expected CENTER (1)"))
        else:
            passes.append(f"Figure {img['idx']} is centered")
            
        if not img['keep_with_next']:
            issues.append(("HIGH", f"Figure {img['idx']}", f"Image paragraph does NOT have keep_with_next=True"))
        else:
            passes.append(f"Figure {img['idx']} has keep_with_next=True")
            
        if not img['caption'].startswith(f"Figure {img['idx']}:"):
            issues.append(("HIGH", f"Figure {img['idx']}", f"Caption does not start with 'Figure {img['idx']}:'"))
        else:
            passes.append(f"Figure {img['idx']} caption correctly prefixed")
            
    # Verify pairing: Fig 2 & 3 in Sec 3; Fig 4 & 5 in Sec 4; Fig 6 & 7 in Sec 4
    if image_records[2]['h2'] == image_records[3]['h2']:
        passes.append("Figure 2 and Figure 3 share the same section subsection (Pair 1)")
    else:
        issues.append(("MEDIUM", "Image Pairing", "Figure 2 and Figure 3 are not under the same subsection"))
        
    if image_records[4]['h2'] == image_records[5]['h2']:
        passes.append("Figure 4 and Figure 5 share the same section subsection (Pair 2)")
    else:
        issues.append(("MEDIUM", "Image Pairing", "Figure 4 and Figure 5 are not under the same subsection"))
        
    if image_records[6]['h2'] == image_records[7]['h2']:
        passes.append("Figure 6 and Figure 7 share the same section subsection (Pair 3)")
    else:
        issues.append(("MEDIUM", "Image Pairing", "Figure 6 and Figure 7 are not under the same subsection"))

    # -------------------------------------------------------------------------
    # 4. MATHEMATICAL NOTATION & EQUATIONS
    # -------------------------------------------------------------------------
    print("\n[CHECK 4] MATHEMATICAL TYPOGRAPHY & VARIABLE AUDIT")
    raw_patterns = [
        (r'\bR50\b', "R50 missing subscript 50 (should be R_{50})"),
        (r'\bk_in\b', "k_in raw ASCII (should be k_{in})"),
        (r'\bk_out\b', "k_out raw ASCII (should be k_{out})"),
        (r'\bS_0\b', "S_0 raw ASCII (should be S_0)"),
        (r'\bS\^2\b', "S^2 raw ASCII (should be S^2 with superscript)"),
        (r'L\s*/\s*\(S\^2\)', "L / (S^2) raw ASCII (should be L / S^2)"),
    ]
    
    for p_idx, p in enumerate(doc.paragraphs):
        for pat, desc in raw_patterns:
            matches = re.findall(pat, p.text)
            if matches:
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
    t1 = doc.tables[1]
    t1_widths = [c.width.inches for c in t1.rows[0].cells]
    print(f"  Table 1 (TOC) widths: {[f'{w:.2f}in' for w in t1_widths]}")
    if abs(t1_widths[0] - t1_widths[1]) < 0.2:
        issues.append(("MEDIUM", "Table 1 (TOC)", f"TOC columns are equally spaced; Sl.no and Page No should be compact, Title wide"))
    else:
        passes.append("Table 1 (TOC) column proportions optimized")
        
    t2 = doc.tables[2]
    t2_widths = [c.width.inches for c in t2.rows[0].cells]
    print(f"  Table 2 (Datasets) widths: {[f'{w:.2f}in' for w in t2_widths]}")
    if t2_widths[4] < 2.3:
        issues.append(("LOW", "Table 2 (Datasets)", f"Provenance column width is {t2_widths[4]:.2f}in; should be at least 2.3in"))
    else:
        passes.append("Table 2 (Datasets) Provenance column width verified")

    # -------------------------------------------------------------------------
    # 6. HEADINGS ORPHAN CHECK (keep_with_next)
    # -------------------------------------------------------------------------
    print("\n[CHECK 6] HEADING ORPHAN CONTROLS")
    orphan_headings = []
    for p_idx, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if not txt: continue
        is_h = p.style.name.startswith('Heading') or (p.runs and p.runs[0].font.size and p.runs[0].font.size.pt in [14.0, 11.5] and p.runs[0].font.bold)
        if is_h and not p.paragraph_format.keep_with_next:
            orphan_headings.append((p_idx, txt[:40]))
            
    if orphan_headings:
        issues.append(("HIGH", "Orphan Control", f"{len(orphan_headings)} headings lack keep_with_next=True"))
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

    penalty = (crit_count * 15) + (high_count * 8) + (med_count * 3) + (low_count * 1)
    score = max(0, 100 - penalty)
    print("\n" + "=" * 80)
    print(f"STRICT AUDIT SCORE: {score}/100")
    print("=" * 80)

if __name__ == '__main__':
    doc_path = r'C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Experiential_Learning_Report.docx'
    run_strict_audit(doc_path)
