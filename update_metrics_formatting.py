import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def format_topological_metrics(doc_path):
    doc = docx.Document(doc_path)
    
    # Locate target paragraph
    target_idx = None
    for i, p in enumerate(doc.paragraphs):
        if 'Topological Metric Definitions' in p.text:
            target_idx = i
            break
            
    if target_idx is None:
        raise ValueError("Could not find 'Topological Metric Definitions' paragraph")
        
    print(f"Found 'Topological Metric Definitions' at paragraph index {target_idx}")
    
    # Paragraph after target_idx is the unformatted block
    p_content = doc.paragraphs[target_idx + 1]
    print(f"Replacing content starting with: {p_content.text[:60]}...")
    
    # Helper to create a new formatted paragraph before p_content
    def add_p(before_p, space_before=2, space_after=4, left_indent=0):
        new_p = before_p.insert_paragraph_before()
        new_p.paragraph_format.space_before = Pt(space_before)
        new_p.paragraph_format.space_after = Pt(space_after)
        new_p.paragraph_format.line_spacing = 1.15
        if left_indent > 0:
            new_p.paragraph_format.left_indent = Inches(left_indent)
        return new_p

    def add_run(p, text, bold=False, italic=False, sup=False, sub=False, size=10.5, color=None):
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.superscript = sup
        r.font.subscript = sub
        if color:
            r.font.color.rgb = color
        return r

    # 1. Directed Connectance (C)
    p_h1 = add_p(p_content, space_before=6, space_after=2)
    add_run(p_h1, "1. Directed Connectance (", bold=True)
    add_run(p_h1, "C", bold=True, italic=True)
    add_run(p_h1, "):", bold=True)
    
    p_f1 = add_p(p_content, space_before=2, space_after=3, left_indent=0.25)
    add_run(p_f1, "C", italic=True, bold=True)
    add_run(p_f1, " = ")
    add_run(p_f1, "L", italic=True)
    add_run(p_f1, " / ")
    add_run(p_f1, "S", italic=True)
    add_run(p_f1, "2", sup=True, bold=True)
    
    p_d1 = add_p(p_content, space_before=1, space_after=6, left_indent=0.25)
    add_run(p_d1, "where ")
    add_run(p_d1, "L", italic=True)
    add_run(p_d1, " is the total number of documented active directed feeding links, and ")
    add_run(p_d1, "S", italic=True)
    add_run(p_d1, " represents total species richness (node count). The denominator ")
    add_run(p_d1, "S", italic=True)
    add_run(p_d1, "2", sup=True)
    add_run(p_d1, " denotes the theoretical maximum number of directed links in a network of size ")
    add_run(p_d1, "S", italic=True)
    add_run(p_d1, " (including potential cannibalistic self-loops). Directed connectance measures overall linkage density and dietary complexity.")

    # 2. Link Density (D)
    p_h2 = add_p(p_content, space_before=6, space_after=2)
    add_run(p_h2, "2. Link Density (", bold=True)
    add_run(p_h2, "D", bold=True, italic=True)
    add_run(p_h2, "):", bold=True)
    
    p_f2 = add_p(p_content, space_before=2, space_after=3, left_indent=0.25)
    add_run(p_f2, "D", italic=True, bold=True)
    add_run(p_f2, " = ")
    add_run(p_f2, "L", italic=True)
    add_run(p_f2, " / ")
    add_run(p_f2, "S", italic=True)
    
    p_d2 = add_p(p_content, space_before=1, space_after=6, left_indent=0.25)
    add_run(p_d2, "representing the mean number of feeding interactions per species across the ecosystem, independent of squared network scale.")

    # 3. In-Degree (k_in) and Out-Degree (k_out)
    p_h3 = add_p(p_content, space_before=6, space_after=2)
    add_run(p_h3, "3. In-Degree (", bold=True)
    add_run(p_h3, "k", bold=True, italic=True)
    add_run(p_h3, "in", bold=True, sub=True)
    add_run(p_h3, ") and Out-Degree (", bold=True)
    add_run(p_h3, "k", bold=True, italic=True)
    add_run(p_h3, "out", bold=True, sub=True)
    add_run(p_h3, "):", bold=True)
    
    p_f3a = add_p(p_content, space_before=2, space_after=2, left_indent=0.25)
    add_run(p_f3a, "k", italic=True, bold=True)
    add_run(p_f3a, "in", sub=True, bold=True)
    add_run(p_f3a, "(")
    add_run(p_f3a, "i", italic=True)
    add_run(p_f3a, ") = \u2211")
    add_run(p_f3a, "j=1", sub=True)
    add_run(p_f3a, "S", sup=True)
    add_run(p_f3a, " A", bold=True)
    add_run(p_f3a, "ji", sub=True)
    add_run(p_f3a, "   (Dietary Breadth: number of prey taxa consumed by species ")
    add_run(p_f3a, "i", italic=True)
    add_run(p_f3a, ")")
    
    p_f3b = add_p(p_content, space_before=2, space_after=3, left_indent=0.25)
    add_run(p_f3b, "k", italic=True, bold=True)
    add_run(p_f3b, "out", sub=True, bold=True)
    add_run(p_f3b, "(")
    add_run(p_f3b, "i", italic=True)
    add_run(p_f3b, ") = \u2211")
    add_run(p_f3b, "j=1", sub=True)
    add_run(p_f3b, "S", sup=True)
    add_run(p_f3b, " A", bold=True)
    add_run(p_f3b, "ij", sub=True)
    add_run(p_f3b, "   (Predator Burden: number of consumer taxa supported by species ")
    add_run(p_f3b, "i", italic=True)
    add_run(p_f3b, ")")
    
    p_d3 = add_p(p_content, space_before=1, space_after=6, left_indent=0.25)
    add_run(p_d3, "where ")
    add_run(p_d3, "A", bold=True)
    add_run(p_d3, " denotes the binary directed adjacency matrix of the food web, with ")
    add_run(p_d3, "A", bold=True)
    add_run(p_d3, "ji", sub=True)
    add_run(p_d3, " = 1 if organism ")
    add_run(p_d3, "j", italic=True)
    add_run(p_d3, " is consumed by organism ")
    add_run(p_d3, "i", italic=True)
    add_run(p_d3, ", and 0 otherwise.")

    # 4. Secondary Extinction Criterion
    p_h4 = add_p(p_content, space_before=6, space_after=2)
    add_run(p_h4, "4. Secondary Extinction Criterion (Topological Starvation Rule):", bold=True)
    
    p_f4a = add_p(p_content, space_before=2, space_after=2, left_indent=0.25)
    add_run(p_f4a, "For any consumer ")
    add_run(p_f4a, "c", italic=True)
    add_run(p_f4a, " \u2208 NonBasalSpecies, its active in-degree following a perturbation sequence ")
    add_run(p_f4a, "P", italic=True)
    add_run(p_f4a, " is formulated as:")
    
    p_f4b = add_p(p_content, space_before=2, space_after=3, left_indent=0.4)
    add_run(p_f4b, "k", italic=True, bold=True)
    add_run(p_f4b, "in", sub=True, bold=True)
    add_run(p_f4b, "active", sup=True, bold=True)
    add_run(p_f4b, "(")
    add_run(p_f4b, "c", italic=True)
    add_run(p_f4b, ") = \u2211")
    add_run(p_f4b, "p \u2208 SurvivingPrey", sub=True)
    add_run(p_f4b, " A", bold=True)
    add_run(p_f4b, "pc", sub=True)
    
    p_f4c = add_p(p_content, space_before=2, space_after=2, left_indent=0.25)
    add_run(p_f4c, "• Secondary Extinction: ", bold=True)
    add_run(p_f4c, "If ")
    add_run(p_f4c, "k", italic=True)
    add_run(p_f4c, "in", sub=True)
    add_run(p_f4c, "active", sup=True)
    add_run(p_f4c, "(")
    add_run(p_f4c, "c", italic=True)
    add_run(p_f4c, ") = 0 \u27F9 Consumer ")
    add_run(p_f4c, "c", italic=True)
    add_run(p_f4c, " loses 100% of its energetic prey base and starves.")
    
    p_f4d = add_p(p_content, space_before=2, space_after=6, left_indent=0.25)
    add_run(p_f4d, "• Consumer Survival: ", bold=True)
    add_run(p_f4d, "If ")
    add_run(p_f4d, "k", italic=True)
    add_run(p_f4d, "in", sub=True)
    add_run(p_f4d, "active", sup=True)
    add_run(p_f4d, "(")
    add_run(p_f4d, "c", italic=True)
    add_run(p_f4d, ") \u2265 1 \u27F9 Consumer ")
    add_run(p_f4d, "c", italic=True)
    add_run(p_f4d, " survives through dietary prey switching.")

    # 5. Basal Autotroph Exemption Rule
    p_h5 = add_p(p_content, space_before=6, space_after=2)
    add_run(p_h5, "5. Basal Autotroph Exemption Rule:", bold=True)
    
    p_d5 = add_p(p_content, space_before=2, space_after=6, left_indent=0.25)
    add_run(p_d5, "Basal autotrophs (phytoplankton, benthic microalgae, macrophytes, detritus) have ")
    add_run(p_d5, "k", italic=True)
    add_run(p_d5, "in", sub=True)
    add_run(p_d5, " = 0 by biological definition, as their metabolic energy is fixed abiotically via solar radiation or biogeochemical nutrient cycling. Basal taxa are strictly exempt from starvation cascades and are only removed via direct perturbation.")

    # 6. Jaccard Trophic Similarity Coefficient
    p_h6 = add_p(p_content, space_before=6, space_after=2)
    add_run(p_h6, "6. Jaccard Trophic Similarity Coefficient (", bold=True)
    add_run(p_h6, "J", bold=True, italic=True)
    add_run(p_h6, "):", bold=True)
    
    p_f6 = add_p(p_content, space_before=2, space_after=3, left_indent=0.25)
    add_run(p_f6, "J", italic=True, bold=True)
    add_run(p_f6, "(")
    add_run(p_f6, "u", italic=True)
    add_run(p_f6, ", ")
    add_run(p_f6, "v", italic=True)
    add_run(p_f6, ") = |Prey(")
    add_run(p_f6, "u", italic=True)
    add_run(p_f6, ") \u2229 Prey(")
    add_run(p_f6, "v", italic=True)
    add_run(p_f6, ")| / |Prey(")
    add_run(p_f6, "u", italic=True)
    add_run(p_f6, ") \u222A Prey(")
    add_run(p_f6, "v", italic=True)
    add_run(p_f6, ")|")
    
    p_d6 = add_p(p_content, space_before=1, space_after=8, left_indent=0.25)
    add_run(p_d6, "where \u2229 denotes intersection (shared prey resources) and \u222A denotes union (total collective prey resources) between consumers ")
    add_run(p_d6, "u", italic=True)
    add_run(p_d6, " and ")
    add_run(p_d6, "v", italic=True)
    add_run(p_d6, ". A Jaccard trophic similarity approaching 1.0 indicates complete dietary niche redundancy, whereas values near 0.0 denote specialized, non-overlapping trophic niches.")

    # Now remove the old unformatted paragraph p_content
    p_content._element.getparent().remove(p_content._element)
    print("Successfully replaced unformatted paragraph with formatted academic mathematics!")
    
    doc.save(doc_path)
    print(f"Saved updated document to: {doc_path}")

if __name__ == '__main__':
    doc_path = r'C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Experiential_Learning_Report.docx'
    format_topological_metrics(doc_path)
