import docx

doc = docx.Document(r'C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Experiential_Learning_Report.docx')
print('P1 Program:', doc.paragraphs[1].text)
print('Roster:')
for r in doc.tables[0].rows:
    print('  ', [c.text.strip() for c in r.cells])

print('\n--- Metric Definitions Paragraphs ---')
for i in range(43, 62):
    if i < len(doc.paragraphs):
        p = doc.paragraphs[i]
        runs_info = []
        for r in p.runs:
            tags = []
            if r.font.bold: tags.append('B')
            if r.font.italic: tags.append('I')
            if r.font.superscript: tags.append('SUP')
            if r.font.subscript: tags.append('SUB')
            t = '+'.join(tags)
            runs_info.append(f"[{r.text}]({t})" if t else f"[{r.text}]")
        print(f"P{i:2d} (ind={p.paragraph_format.left_indent}): {''.join(runs_info)}")
