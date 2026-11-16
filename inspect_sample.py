import docx

doc = docx.Document(r'C:\Users\nilot\.gemini\antigravity\brain\cd416fdd-604a-475b-bdc3-34e4d7700a4c\.user_uploaded\media_1794831134369_a1b4691c.docx')

fonts = set()
sizes = set()
for p in doc.paragraphs:
    for r in p.runs:
        if r.font.name: fonts.add(r.font.name)
        if r.font.size: sizes.add(r.font.size.pt)

print('Fonts found in runs:', fonts)
print('Sizes found in runs (pt):', sorted(list(sizes)))

print('--- First 35 paragraphs info ---')
for i in range(min(35, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    if p.text.strip():
        run_fonts = [r.font.name for r in p.runs if r.font.name]
        run_sizes = [r.font.size.pt for r in p.runs if r.font.size]
        run_bolds = [r.font.bold for r in p.runs if r.font.bold]
        print(f'P{i:2d} (align={p.alignment}): txt="{p.text[:50]}" fonts={run_fonts[:2]} sizes={run_sizes[:2]} bold={run_bolds[:2]}')

print('--- Tables info ---')
for idx, tbl in enumerate(doc.tables):
    print(f'Table {idx}: rows={len(tbl.rows)}, cols={len(tbl.columns)}')
    for r_idx, row in enumerate(tbl.rows[:3]):
        row_txt = [c.text.strip().replace('\n', ' ') for c in row.cells]
        print(f'  Row {r_idx}: {row_txt}')
