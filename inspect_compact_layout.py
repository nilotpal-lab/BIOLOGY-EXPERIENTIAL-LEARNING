import docx

doc = docx.Document('FoodWebGuard_Experiential_Learning_Report.docx')

print("=" * 70)
print("INSPECTION OF COMPACT REPORT STRUCTURE")
print("=" * 70)

page_num = 1
print(f"\n--- PAGE {page_num} (Cover Page) ---")

for i, p in enumerate(doc.paragraphs):
    has_break = any('<w:br w:type="page"' in r._r.xml for r in p.runs) or ('<w:pageBreakBefore' in p._p.xml)
    if has_break:
        page_num += 1
        print(f"\n--- PAGE {page_num} ---")
        
    txt = p.text.strip()
    is_img = any('<w:drawing' in r._r.xml for r in p.runs)
    is_h1 = p.runs and p.runs[0].font.size and p.runs[0].font.size.pt == 14.0 and p.runs[0].font.bold
    is_h2 = p.runs and p.runs[0].font.size and p.runs[0].font.size.pt == 11.5 and p.runs[0].font.bold
    
    if is_img:
        print(f"  [IMAGE] P{i:2d}")
    elif is_h1:
        print(f"  [H1] {txt}")
    elif is_h2:
        print(f"  [H2] {txt}")
    elif txt.startswith("Figure "):
        print(f"  [FIGURE CAPTION] {txt[:65]}...")
    elif txt.startswith("Table "):
        print(f"  [TABLE CAPTION] {txt[:65]}...")

print(f"\nTotal Hard Page Breaks: {page_num - 1}")
print(f"Estimated Total Pages: {page_num} (Maximum allowed: 15)")
