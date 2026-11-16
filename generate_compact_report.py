import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import re

def set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, fill_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def build_compact_report():
    doc = docx.Document()
    
    # 1. Page Setup: 0.85 in top/bottom, 0.90 in left/right -> Printable 6.70" x 9.30"
    for s in doc.sections:
        s.top_margin = Inches(0.85)
        s.bottom_margin = Inches(0.85)
        s.left_margin = Inches(0.90)
        s.right_margin = Inches(0.90)
        s.page_width = Inches(8.5)
        s.page_height = Inches(11.0)

    # Styling helpers
    def add_p(space_before=0, space_after=3, line_spacing=1.12, align=WD_ALIGN_PARAGRAPH.LEFT, keep_with_next=False, left_indent=0):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.keep_with_next = keep_with_next
        if left_indent > 0:
            p.paragraph_format.left_indent = Inches(left_indent)
        return p

    def add_run(p, text, font_name="Times New Roman", size=10.0, bold=False, italic=False, sup=False, sub=False, color=None):
        r = p.add_run(text)
        r.font.name = font_name
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.superscript = sup
        r.font.subscript = sub
        if color:
            r.font.color.rgb = color
        return r

    MATH_PATTERN = re.compile(r'(C\s*=\s*L\s*/\s*S\^2|k_in\^active\(c\)|k_in\^active|k_in|k_out|S_0|S\^2|R50|R_50)')

    def emit_math_formatted_text(p, text, font_name="Times New Roman", size=10.0, default_bold=False, default_italic=False, color=None):
        tokens = MATH_PATTERN.split(text)
        for tok in tokens:
            if not tok:
                continue
            if tok in ['R50', 'R_50']:
                add_run(p, "R", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "50", font_name=font_name, size=size, bold=default_bold, sub=True, color=color)
            elif tok == 'k_in^active(c)':
                add_run(p, "k", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "in", font_name=font_name, size=size, bold=default_bold, sub=True, color=color)
                add_run(p, "active", font_name=font_name, size=size, bold=default_bold, sup=True, color=color)
                add_run(p, "(c)", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
            elif tok == 'k_in^active':
                add_run(p, "k", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "in", font_name=font_name, size=size, bold=default_bold, sub=True, color=color)
                add_run(p, "active", font_name=font_name, size=size, bold=default_bold, sup=True, color=color)
            elif tok == 'k_in':
                add_run(p, "k", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "in", font_name=font_name, size=size, bold=default_bold, sub=True, color=color)
            elif tok == 'k_out':
                add_run(p, "k", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "out", font_name=font_name, size=size, bold=default_bold, sub=True, color=color)
            elif tok == 'S_0':
                add_run(p, "S", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "0", font_name=font_name, size=size, bold=default_bold, sub=True, color=color)
            elif tok == 'S^2':
                add_run(p, "S", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "2", font_name=font_name, size=size, bold=default_bold, sup=True, color=color)
            elif 'C' in tok and 'L' in tok and 'S^2' in tok:
                add_run(p, "C", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, " = ", font_name=font_name, size=size, bold=default_bold, color=color)
                add_run(p, "L", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, " / ", font_name=font_name, size=size, bold=default_bold, color=color)
                add_run(p, "S", font_name=font_name, size=size, bold=default_bold, italic=True, color=color)
                add_run(p, "2", font_name=font_name, size=size, bold=default_bold, sup=True, color=color)
            else:
                add_run(p, tok, font_name=font_name, size=size, bold=default_bold, italic=default_italic, color=color)

    def add_h1(text):
        p = add_p(space_before=10, space_after=4, keep_with_next=True)
        emit_math_formatted_text(p, text, font_name="Times New Roman", size=14.0, default_bold=True, color=RGBColor(0x1B, 0x36, 0x5D))
        return p

    def add_h2(text):
        p = add_p(space_before=7, space_after=2, keep_with_next=True)
        emit_math_formatted_text(p, text, font_name="Times New Roman", size=11.5, default_bold=True, color=RGBColor(0x22, 0x22, 0x22))
        return p

    def add_body(text, bold_prefix=None, space_after=3, left_indent=0):
        p = add_p(space_before=0, space_after=space_after, line_spacing=1.12, align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=left_indent)
        if bold_prefix:
            emit_math_formatted_text(p, bold_prefix, default_bold=True)
        emit_math_formatted_text(p, text)
        return p

    # Compact Figure helper: 5.0 inches wide (~3.1 in high) to allow 2 figures per page cleanly
    def add_figure_compact(image_path, fig_num, caption_title, caption_desc, img_width=5.10):
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Missing image file: {image_path}")
        p_img = add_p(space_before=3, space_after=1, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
        r_img = p_img.add_run()
        r_img.add_picture(image_path, width=Inches(img_width))
        
        p_cap = add_p(space_before=1, space_after=5, align=WD_ALIGN_PARAGRAPH.CENTER)
        add_run(p_cap, f"Figure {fig_num}: {caption_title}. ", size=9.0, bold=True, italic=True)
        emit_math_formatted_text(p_cap, caption_desc, size=9.0, default_italic=True)

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    banner_path = r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\extracted_sample_assets\image1.png"
    p_top = add_p(space_before=0, space_after=6, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    if os.path.exists(banner_path):
        p_top.add_run().add_picture(banner_path, width=Inches(4.60))

    p_dept = add_p(space_before=4, space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_dept, "B. Tech CSE - SE", font_name="Calibri", size=12.0, bold=True)

    p_subj = add_p(space_before=2, space_after=8, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_subj, "Biology", font_name="Calibri", size=12.0, bold=True)

    p_el = add_p(space_before=8, space_after=3, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_el, "EXPERIENTIAL LEARNING ON", font_name="Calibri", size=12.0, bold=True)

    p_topic = add_p(space_before=3, space_after=10, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_topic, "Topic: FoodWebGuard: Algorithmic Modeling of Trophic Network Cascades and Ecosystem Resilience Under In Silico Perturbation", font_name="Calibri", size=11.0, bold=True)

    p_sub = add_p(space_before=6, space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_sub, "Submitted to", font_name="Calibri", size=10.5, bold=True)

    p_prof = add_p(space_before=2, space_after=10, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_prof, "Dr. Rohini", font_name="Calibri", size=11.5, bold=True)

    p_by = add_p(space_before=6, space_after=4, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_by, "Submitted by", font_name="Calibri", size=10.5, bold=True)

    # Student Roster Table (Table 0)
    roster_data = [
        ("USN", "Name"),
        ("25BTRSN048", "Tejas V Iyer"),
        ("25BTRSN029", "Nilotpal Deb"),
        ("25BTRSN040", "Sanchit Kalantre"),
        ("25BTRSN044", "Sarvdeep Singh"),
        ("25BTRSN036", "Ramkrishna Saha"),
        ("25BTRSN009", "Chinmay Belge"),
    ]
    t0 = doc.add_table(rows=len(roster_data), cols=2)
    t0.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t0, "BBBBBB")
    for r_idx, (usn, name) in enumerate(roster_data):
        row = t0.rows[r_idx]
        for c_idx, val in enumerate([usn, name]):
            cell = row.cells[c_idx]
            cell.width = Inches(3.35)
            set_cell_margins(cell, top=50, bottom=50, left=100, right=100)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            add_run(p, val, font_name="Calibri", size=10.0, bold=(r_idx == 0))

    # Page Break to TOC
    doc.add_page_break()

    # =========================================================================
    # PAGE 2: TABLE OF CONTENTS (PURE ACADEMIC SECTIONS 1 - 6)
    # =========================================================================
    p_toc_head = add_p(space_before=10, space_after=8, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_toc_head, "Table of Contents", font_name="Times New Roman", size=15.0, bold=True, color=RGBColor(0x1B, 0x36, 0x5D))

    toc_data = [
        ("Sl.no.", "Title", "Page No."),
        ("1", "Introduction", "3-4"),
        ("2", "Objectives", "4-4"),
        ("3", "Research Methodology", "5-7"),
        ("4", "Results & Experimental Validation", "8-10"),
        ("5", "Conclusion & Engineering Implications", "11-11"),
        ("6", "References", "12-12"),
    ]
    t1 = doc.add_table(rows=len(toc_data), cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1, "BBBBBB")
    col_widths_t1 = [Inches(0.8), Inches(4.9), Inches(1.0)]
    for r_idx, (sl, tit, pg) in enumerate(toc_data):
        row = t1.rows[r_idx]
        for c_idx, val in enumerate([sl, tit, pg]):
            cell = row.cells[c_idx]
            cell.width = col_widths_t1[c_idx]
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
            add_run(p, val, font_name="Times New Roman", size=10.0, bold=(r_idx == 0 or c_idx == 0))

    # Page Break to Section 1
    doc.add_page_break()

    # =========================================================================
    # SECTION 1: INTRODUCTION
    # =========================================================================
    add_h1("1. INTRODUCTION")

    add_h2("1.1 Ecological Background & Biological Network Complexity")
    add_body(
        "A foundational challenge in contemporary systems biology and ecological conservation is understanding the cascading fragility of living ecosystems under anthropogenic disturbance and climatic shocks. Modern community ecology models ecosystems as complex directed dependency graphs, where species represent interacting nodes and directed edges formalize thermodynamic consumer-prey energetic pathways.",
        "The Ecological Fragility Dilemma: "
    )
    add_body(
        "Ecological communities are characterized by deep trophic hierarchies: primary autotrophs fix solar or chemical energy, herbivores graze on producers, carnivores feed on herbivores, and apex predators occupy the energetic apex. Paine's landmark 1966 intertidal exclusion study proved that removing a single top predator (Pisaster ochraceus) collapsed species diversity from 15 species down to a monoculture. Identifying such keystone species algorithmically prior to real-world collapse is a paramount goal of computational ecology.",
        "Trophic Architecture & Keystones: "
    )

    add_h2("1.2 Engineering Isomorphism & Network Reliability")
    add_body(
        "In computer science and systems engineering, critical infrastructure networks—such as high-voltage electrical power grids, distributed microservice DAGs, and internet routing backbones—must guarantee fault tolerance. When a critical substation trips, load redistribution can trigger a cascading regional blackout. The mathematical isomorphism between electrical blackout cascades and ecological secondary extinctions is exact: both are governed by non-linear percolation thresholds, connectivity degree distributions, and topological bottlenecks. FoodWebGuard bridges computational biology and systems engineering by providing an interactive in silico perturbation laboratory.",
        "Engineering Synergy & Isomorphism: "
    )

    add_h2("1.3 Computational Framework: Dunne et al. (2002) Percolation Theory")
    add_body(
        "Rather than relying on unmeasurable kinetic parameters required by dynamic differential equation models (Lotka-Volterra), FoodWebGuard builds upon the peer-reviewed topological framework of Dunne, Williams, and Martinez (2002, PNAS). Topological percolation isolates pure structural vulnerability from parameter noise, providing an objective mathematical baseline of ecosystem robustness under systematic node deletion sequences.",
        "Topological Percolation Framework: "
    )

    # FIGURE 1: Architectural Overview
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig1_overview.png",
        1,
        "Architectural Overview and System Navigation in FoodWebGuard",
        "The platform integrates interactive graph simulation, sensitivity analytics, cross-ecosystem benchmarks, and an empirical research repository into a unified, zero-install computational environment."
    )

    # =========================================================================
    # SECTION 2: OBJECTIVES
    # =========================================================================
    add_h1("2. OBJECTIVES")
    add_body(
        "The primary aim of this experiential project was to architect, build, and experimentally validate an interactive in silico perturbation platform—FoodWebGuard—to simulate, quantify, and explain ecological cascade failures across diverse empirical biomes.",
        "Primary Research Aim: "
    )
    add_body("The specific biological and computational objectives of the investigation are:")

    objs = [
        ("Objective 1 (Interactive Trophic Stratification): ", "Implement Cytoscape.js rendering to stratify species into discrete vertical trophic tiers (Basal Autotrophs, Consumers, Apex Predators) based on computed dietary breadth and predator burden."),
        ("Objective 2 (Deterministic Topological Extinction Engine): ", "Develop a real-time cascade propagation engine implementing the formal topological starvation rule: non-basal consumers undergo secondary extinction if and only if 100% of their prey items are eradicated."),
        ("Objective 3 (Temporal Explainability via Cascade Timeline): ", "Create a chronological step-by-step timeline interface allowing users to inspect and step through propagation rounds (t = 0, 1, 2, ...), isolating exact mechanistic extinction vectors."),
        ("Objective 4 (Whole-Network Automated Sensitivity Sweep): ", "Construct an automated worker executing N independent primary perturbation simulations across all species, ranking every organism by Keystone Criticality Index, Secondary Extinction Count, and Connectance Loss."),
        ("Objective 5 (Dunne 2002 Robustness Benchmarking & R50 Evaluation): ", "Formulate and plot empirical network robustness curves under Targeted Hub Attack (Strategy A) vs. Random Extinction (Strategy D) and compute the exact R50 percolation metric."),
        ("Objective 6 (Cross-Biome Comparative Empirical Analysis): ", "Benchmark directed connectance (C = L / S^2), link density, and cascade fragility across six diverse empirical ecosystems curated from Dryad repositories."),
        ("Objective 7 (Dynamic Data Intake Studio & Schema Repair): ", "Engineer an in-browser dual-slot CSV/JSON intake pipeline featuring real-time biological header validation, alias resolution, cycle tolerance, and automatic schema sanitization."),
        ("Objective 8 (Publication-Grade Academic PDF Report Generation): ", "Build an automated mathematical report modal compiling active ecosystem parameters, directed adjacency matrices, Jaccard trophic similarity matrices, and step-by-step audit logs into an unclipped PDF document."),
    ]
    for pfx, desc in objs:
        add_body(desc, bold_prefix=pfx, space_after=2, left_indent=0.2)

    # Page Break to Section 3
    doc.add_page_break()

    # =========================================================================
    # SECTION 3: RESEARCH METHODOLOGY
    # =========================================================================
    add_h1("3. RESEARCH METHODOLOGY")

    add_h2("3.1 Empirical Datasets Curation & Provenance")
    add_body(
        "To guarantee ecological realism, FoodWebGuard avoids synthetic toy networks. We curated and benchmarked six high-resolution empirical food webs spanning marine, freshwater, and terrestrial biomes from peer-reviewed literature and the Dryad Digital Repository.",
        "Multi-Biome Empirical Repository: "
    )

    # Table 1: Datasets
    p_t1_cap = add_p(space_before=3, space_after=2, keep_with_next=True)
    add_run(p_t1_cap, "Table 1: Curated Empirical Food Web Datasets Across Marine, Freshwater, and Terrestrial Biomes.", size=9.0, bold=True)

    datasets_data = [
        ("Dataset ID", "Biome", "Species", "Links", "Scientific Provenance & DOI"),
        ("tatoosh-island-intertidal", "Marine Intertidal", "110", "377", "Paine (1966) / Wootton et al. (2016) Dryad doi:10.5061/dryad.15hp4"),
        ("chesapeake-bay-mesohaline", "Marine Estuary", "33", "71", "Baird & Ulanowicz (1989) Ecol. Monogr. doi:10.2307/1942633"),
        ("lake-broad-shallow-subtropical", "Freshwater Lake", "36", "131", "Zhang et al. (2024) Dryad doi:10.5061/dryad.6hdr7sr5k"),
        ("bci-tropical-plant-insect", "Terrestrial Forest", "395", "406", "Gripenberg et al. (2019) Ecol. Lett. doi:10.1111/ele.13234"),
        ("palmyra-atoll-coral-reef", "Coral Reef", "79", "352", "Miller-ter Kuile et al. (2022) Dryad doi:10.5061/dryad.8pk0p2nqd"),
        ("carpinteria-salt-marsh", "Salt Marsh Estuary", "128", "1,399", "Lafferty et al. (2006) PNAS doi:10.1073/pnas.0604755103"),
    ]
    t2 = doc.add_table(rows=len(datasets_data), cols=5)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2, "BBBBBB")
    col_widths_t2 = [Inches(1.5), Inches(1.2), Inches(0.6), Inches(0.6), Inches(2.8)]
    for r_idx, row_data in enumerate(datasets_data):
        row = t2.rows[r_idx]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths_t2[c_idx]
            set_cell_margins(cell, top=45, bottom=45, left=60, right=60)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [2, 3] else WD_ALIGN_PARAGRAPH.LEFT
            add_run(p, val, font_name="Times New Roman", size=9.0 if r_idx == 0 else 8.5, bold=(r_idx == 0))

    # 3.2 Mathematical Formulations
    add_h2("3.2 Mathematical Formulations & Topological Metrics")
    add_body(
        "To rigorously quantify network architecture and vulnerability, our computational engine computes the following formal topological properties:",
        "Formal Network Metrics: "
    )

    # 1. Connectance
    p_m1 = add_p(space_before=2, space_after=1, left_indent=0.2, keep_with_next=True)
    add_run(p_m1, "1. Directed Connectance: ", bold=True)
    add_run(p_m1, "C", italic=True, bold=True)
    add_run(p_m1, " = ")
    add_run(p_m1, "L", italic=True)
    add_run(p_m1, " / ")
    add_run(p_m1, "S", italic=True)
    add_run(p_m1, "2", sup=True)
    add_run(p_m1, "   (where ")
    add_run(p_m1, "L", italic=True)
    add_run(p_m1, " is total active directed feeding links, and ")
    add_run(p_m1, "S", italic=True)
    add_run(p_m1, " is species richness; quantifies realized edge saturation).")

    # 2. Link Density
    p_m2 = add_p(space_before=1, space_after=1, left_indent=0.2, keep_with_next=True)
    add_run(p_m2, "2. Link Density: ", bold=True)
    add_run(p_m2, "D", italic=True, bold=True)
    add_run(p_m2, " = ")
    add_run(p_m2, "L", italic=True)
    add_run(p_m2, " / ")
    add_run(p_m2, "S", italic=True)
    add_run(p_m2, "   (mean number of feeding interactions per species across the ecosystem).")

    # 3. In-Degree and Out-Degree
    p_m3 = add_p(space_before=1, space_after=1, left_indent=0.2, keep_with_next=True)
    add_run(p_m3, "3. Degree Distributions: ", bold=True)
    add_run(p_m3, "k", italic=True)
    add_run(p_m3, "in", sub=True)
    add_run(p_m3, "(")
    add_run(p_m3, "i", italic=True)
    add_run(p_m3, ") = \u2211")
    add_run(p_m3, "j=1", sub=True)
    add_run(p_m3, "S", sup=True)
    add_run(p_m3, " ")
    add_run(p_m3, "A", bold=True)
    add_run(p_m3, "ji", sub=True)
    add_run(p_m3, " (prey breadth); ")
    add_run(p_m3, "k", italic=True)
    add_run(p_m3, "out", sub=True)
    add_run(p_m3, "(")
    add_run(p_m3, "i", italic=True)
    add_run(p_m3, ") = \u2211")
    add_run(p_m3, "j=1", sub=True)
    add_run(p_m3, "S", sup=True)
    add_run(p_m3, " ")
    add_run(p_m3, "A", bold=True)
    add_run(p_m3, "ij", sub=True)
    add_run(p_m3, " (predator burden), where ")
    add_run(p_m3, "A", bold=True)
    add_run(p_m3, " is the directed adjacency matrix.")

    # 4. Secondary Extinction Criterion
    p_m4 = add_p(space_before=1, space_after=1, left_indent=0.2, keep_with_next=True)
    add_run(p_m4, "4. Secondary Extinction Rule: ", bold=True)
    add_run(p_m4, "For consumer ")
    add_run(p_m4, "c", italic=True)
    add_run(p_m4, " \u2208 NonBasal, ")
    add_run(p_m4, "k", italic=True)
    add_run(p_m4, "in", sub=True)
    add_run(p_m4, "active", sup=True)
    add_run(p_m4, "(")
    add_run(p_m4, "c", italic=True)
    add_run(p_m4, ") = \u2211")
    add_run(p_m4, "p \u2208 SurvivingPrey", sub=True)
    add_run(p_m4, " ")
    add_run(p_m4, "A", bold=True)
    add_run(p_m4, "pc", sub=True)
    add_run(p_m4, ". If ")
    add_run(p_m4, "k", italic=True)
    add_run(p_m4, "in", sub=True)
    add_run(p_m4, "active", sup=True)
    add_run(p_m4, " = 0 \u27F9 consumer starves. If ")
    add_run(p_m4, "k", italic=True)
    add_run(p_m4, "in", sub=True)
    add_run(p_m4, "active", sup=True)
    add_run(p_m4, " \u2265 1 \u27F9 survives via prey switching.")

    # 5. Basal Exemption
    p_m5 = add_p(space_before=1, space_after=1, left_indent=0.2, keep_with_next=True)
    add_run(p_m5, "5. Basal Autotroph Exemption: ", bold=True)
    add_run(p_m5, "Primary producers have ")
    add_run(p_m5, "k", italic=True)
    add_run(p_m5, "in", sub=True)
    add_run(p_m5, " = 0 by biological definition (energy fixed from abiotic sources); strictly exempt from starvation.")

    # 6. Jaccard Similarity
    p_m6 = add_p(space_before=1, space_after=4, left_indent=0.2)
    add_run(p_m6, "6. Jaccard Trophic Similarity: ", bold=True)
    add_run(p_m6, "J", italic=True)
    add_run(p_m6, "(")
    add_run(p_m6, "u", italic=True)
    add_run(p_m6, ", ")
    add_run(p_m6, "v", italic=True)
    add_run(p_m6, ") = |Prey(")
    add_run(p_m6, "u", italic=True)
    add_run(p_m6, ") \u2229 Prey(")
    add_run(p_m6, "v", italic=True)
    add_run(p_m6, ")| / |Prey(")
    add_run(p_m6, "u", italic=True)
    add_run(p_m6, ") \u222A Prey(")
    add_run(p_m6, "v", italic=True)
    add_run(p_m6, ")|; quantifies niche overlap and dietary redundancy.")

    # Page Break for 2-IMAGE PAIR: Figure 2 & Figure 3 on same page!
    doc.add_page_break()

    # =========================================================================
    # SECTION 3 (CONT.): VISUAL SIMULATION ENGINE (FIGURE 2 & 3 PAIR)
    # =========================================================================
    add_h2("3.3 Visual Graph Stratification & Cascade Simulation Engine")
    add_body(
        "To render dense ecological dependency networks intelligible, FoodWebGuard stratifies species into vertical energetic tiers using Cytoscape.js (Figure 2). Basal autotrophs anchor the lowest tier, while apex predators occupy the summit. When an organism is deleted, our deterministic propagation engine executes secondary starvation waves, rendering starved consumers with glowing warning rings and tracking propagation across a chronological timeline (Figure 3).",
        "Interactive Simulation Laboratory: "
    )

    # FIGURE 2: Trophic Layout
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig2_explore_trophic.png",
        2,
        "Interactive Trophic Network Explorer",
        "Cytoscape.js arranges species into vertical energetic tiers (Basal Autotrophs at bottom to Apex Predators at top). Directed edges indicate biomass flow vectors. The Species Inspector drawer on the right displays local in-degree, out-degree, and ecological role."
    )

    # FIGURE 3: Cascade Simulation
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig3_cascade_simulation.png",
        3,
        "In Silico Extinction Cascade Simulation",
        "Perturbation of a basal producer triggers secondary starvation waves. Primary removed target is slashed in gray, while starved secondary consumers receive glowing red warning rings. The bottom Cascade Timeline tracks propagation across chronological stages."
    )

    # 3.4 Dunne Attack Sequences
    add_h2("3.4 Dunne et al. (2002) Attack Sequences & Robustness Formulation")
    add_body(
        "To assess ecosystem stability under systematic degradation, FoodWebGuard implements the Dunne et al. (2002) topological attack framework, executing three comparative removal sequences: Strategy A (Targeted Hub Attack / Max Degree First, k_in + k_out descending), Strategy D (Random Stochastic Extinction), and Strategy B (Basal Species First).",
        "Extinction Sequences: "
    )
    p_r50 = add_p(space_before=1, space_after=3, left_indent=0.2)
    add_run(p_r50, "The Robustness Metric (")
    add_run(p_r50, "R", italic=True)
    add_run(p_r50, "50", sub=True)
    add_run(p_r50, ") is defined as: ")
    add_run(p_r50, "R", italic=True, bold=True)
    add_run(p_r50, "50", sub=True, bold=True)
    add_run(p_r50, " = ")
    add_run(p_r50, "N", italic=True)
    add_run(p_r50, "removed", sub=True)
    add_run(p_r50, "(0.50 \u00B7 ")
    add_run(p_r50, "S", italic=True)
    add_run(p_r50, "0", sub=True)
    add_run(p_r50, ") / ")
    add_run(p_r50, "S", italic=True)
    add_run(p_r50, "0", sub=True)
    add_run(p_r50, ", measuring the fraction of primary removals needed to eliminate 50% of the initial species pool (")
    add_run(p_r50, "S", italic=True)
    add_run(p_r50, "0", sub=True)
    add_run(p_r50, ").")

    # Page Break to Section 4
    doc.add_page_break()

    # =========================================================================
    # SECTION 4: RESULTS & EXPERIMENTAL VALIDATION
    # =========================================================================
    add_h1("4. RESULTS & EXPERIMENTAL VALIDATION")

    add_h2("4.1 Extinction Cascade Dynamics Across Distinct Ecosystems")
    add_body(
        "Simulating topological perturbations across our six empirical ecosystems revealed stark contrasts in network vulnerability driven by connectance and degree heterogeneity. High-connectance webs exhibit resilience against random loss but collapse abruptly under targeted hub deletion.",
        "Comparative Topological Resilience: "
    )

    # Table 2: Comparative Network Topology
    p_t2_cap = add_p(space_before=3, space_after=2, keep_with_next=True)
    add_run(p_t2_cap, "Table 2: Comparative Network Topology and Dunne (2002) Robustness (", size=9.0, bold=True)
    add_run(p_t2_cap, "R", size=9.0, bold=True, italic=True)
    add_run(p_t2_cap, "50", size=9.0, bold=True, sub=True)
    add_run(p_t2_cap, ") Metrics Across Empirical Ecosystems.", size=9.0, bold=True)

    metrics_headers = [
        [("Dataset ID", False, False, False)],
        [("Nodes (", False, False, False), ("S", True, False, False), (")", False, False, False)],
        [("Links (", False, False, False), ("L", True, False, False), (")", False, False, False)],
        [("Connectance (", False, False, False), ("C", True, False, False), (")", False, False, False)],
        [("R", True, False, False), ("50", False, False, True), (" (Targeted)", False, False, False)],
        [("R", True, False, False), ("50", False, False, True), (" (Random)", False, False, False)],
    ]
    metrics_rows = [
        ("tatoosh-island-intertidal", "110", "377", "0.031", "0.28", "0.48"),
        ("chesapeake-bay-mesohaline", "33", "71", "0.065", "0.24", "0.45"),
        ("lake-broad-shallow-subtropical", "36", "131", "0.101", "0.33", "0.52"),
        ("bci-tropical-plant-insect", "395", "406", "0.002", "0.08", "0.39"),
        ("palmyra-atoll-coral-reef", "79", "352", "0.056", "0.26", "0.49"),
        ("carpinteria-salt-marsh", "128", "1,399", "0.085", "0.35", "0.54"),
    ]

    t3 = doc.add_table(rows=len(metrics_rows) + 1, cols=6)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3, "BBBBBB")
    col_widths_t3 = [Inches(1.6), Inches(0.9), Inches(0.9), Inches(1.1), Inches(1.1), Inches(1.1)]
    
    # Header row
    hdr_row = t3.rows[0]
    for c_idx, run_specs in enumerate(metrics_headers):
        cell = hdr_row.cells[c_idx]
        cell.width = col_widths_t3[c_idx]
        set_cell_margins(cell, top=45, bottom=45, left=50, right=50)
        set_cell_background(cell, "EAEAEA")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
        for txt, it, bd, sb in run_specs:
            add_run(p, txt, font_name="Times New Roman", size=9.0, bold=True, italic=it, sub=sb)

    # Body rows
    for r_idx, r_data in enumerate(metrics_rows):
        row = t3.rows[r_idx + 1]
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            cell.width = col_widths_t3[c_idx]
            set_cell_margins(cell, top=40, bottom=40, left=50, right=50)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            add_run(p, val, font_name="Times New Roman", size=8.5)

    # Page Break for 2-IMAGE PAIR: Figure 4 & Figure 5 on same page!
    doc.add_page_break()

    # =========================================================================
    # SECTION 4.2 & 4.3: EXPERIMENT STUDIO ANALYTICS (FIGURE 4 & 5 PAIR)
    # =========================================================================
    add_h2("4.2 Dunne Robustness Percolation Curves & Whole-Network Sensitivity Rankings")
    add_body(
        "Figure 4 displays the empirical robustness percolation curves generated in the Network Robustness Lab. Across all biomes, targeted hub attacks (Strategy A, red) cause abrupt non-linear collapse, whereas random loss (Strategy D, blue) demonstrates high buffering resilience. In Tatoosh Island, removing just 28% of hub taxa eliminates 50% of the community (R50 = 0.28). In parallel, Figure 5 demonstrates our automated whole-network sensitivity sweep, scoring and ranking every organism by Keystone Criticality Index.",
        "Macro-Level Stability Analytics: "
    )

    # FIGURE 4: Dunne Robustness
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig5_dunne_robustness.png",
        4,
        "Dunne et al. (2002) Network Robustness Lab",
        "Recharts plots cumulative species removals against surviving richness across Strategy A (Targeted Hub Attack, red) versus Strategy D (Random Extinction, blue). The calculated R50 metric provides an objective index of structural resilience."
    )

    # FIGURE 5: Sensitivity Ranking
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig4_sensitivity_ranking.png",
        5,
        "Whole-Network Sensitivity Scan in Experiment Studio",
        "An automated worker executes independent single-node removals across all species, ranking organisms by Keystone Criticality Index, Secondary Extinction Count, and Connectance Loss."
    )

    # Page Break for 2-IMAGE PAIR: Figure 6 & Figure 7 on same page!
    doc.add_page_break()

    # =========================================================================
    # SECTION 4.4 & 4.5: COMPARISON & DATA INTAKE (FIGURE 6 & 7 PAIR)
    # =========================================================================
    add_h2("4.3 Cross-Ecosystem Comparative Benchmarking & Custom Data Intake")
    add_body(
        "Figure 6 benchmarks Directed Connectance (C = L / S^2), link density, and cascade fragility across marine, freshwater, and forest ecosystems. Low-connectance biomes (e.g. tropical plant-insect webs, C ≈ 0.002) exhibit high fragility due to specialized mutualisms. Figure 7 illustrates the dynamic Data Intake Studio, validating external user-uploaded CSV callsets in real time with schema sanitization, cycle detection, and error badging.",
        "System Interoperability & Integration: "
    )

    # FIGURE 6: Comparison Dashboard
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig6_ecosystem_comparison.png",
        6,
        "Cross-Ecosystem Comparative Dashboard",
        "Multi-metric bar charts benchmark Directed Connectance, Link Density, and Cascade Fragility across marine, freshwater, and terrestrial biomes."
    )

    # FIGURE 7: Data Intake Studio
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig7_data_intake_import.png",
        7,
        "Data Intake Studio with Dual-Slot File Intake",
        "Dedicated upload slots for Species Nodes CSV and Feeding Links CSV provide real-time validation badges and schema checking before committing datasets to active application state."
    )

    # Page Break to Section 4.6 & Section 5
    doc.add_page_break()

    # =========================================================================
    # SECTION 4.6 & SECTION 5: REPORT MODAL & CONCLUSION
    # =========================================================================
    add_h2("4.4 Publication-Grade Academic Reporting & Simulation Audit Logs")
    add_body(
        "To satisfy the rigorous reproducibility standards of academic peer review, FoodWebGuard features an automated Academic Mathematical Report Modal (Figure 8). The module compiles KaTeX-rendered mathematical formulations, the full binary directed adjacency matrix, the Jaccard trophic overlap matrix, and a timestamped chronological cascade audit log. Users can export this report directly to unclipped, multi-page PDF documents.",
        "Reproducibility & Mathematical Export: "
    )

    # FIGURE 8: Academic Report Modal
    add_figure_compact(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig8_academic_report.png",
        8,
        "Academic Mathematical Report Modal",
        "Features publication-grade KaTeX mathematical formatting, directed adjacency matrices, Jaccard trophic similarity matrices, and step-by-step cascade audit logs with unclipped multi-page PDF generation."
    )

    add_h1("5. CONCLUSION & ENGINEERING IMPLICATIONS")

    add_h2("5.1 Synthesis of Scientific Contributions")
    add_body(
        "FoodWebGuard successfully bridges community ecology and rigorous software engineering. Formalizing food webs as directed dependency graphs and executing deterministic in silico cascades provides an intuitive, high-performance laboratory for analyzing ecosystem stability without parametric kinetic assumptions.",
        "Scientific Breakthrough: "
    )

    add_h2("5.2 Real-World Conservation & Systems Engineering Translation")
    add_body(
        "In wildlife conservation, prioritizing interventions based solely on species abundance often fails. Algorithmic keystone ranking empowers conservation planners to protect critical network hubs whose loss triggers catastrophic cascades. For systems engineers, ecological food webs illustrate evolutionary fault tolerance: millions of years of selection have engineered distributed, highly redundant networks capable of absorbing random shocks while remaining vulnerable to targeted hub failures—a principle directly applicable to cybersecurity, distributed microservices, and power grid reliability.",
        "Engineering Translation: "
    )

    add_h2("5.3 Experiential Learning Takeaways for Biology & Engineering Students")
    add_body(
        "• Biological Rigor over AI Slop: Computational models must be grounded in verified empirical data and formal mathematical theory (Pimm 1979, Dunne 2002), rather than ungrounded generative predictions.\n"
        "• Systems Engineering Synergies: Directed graphs, adjacency matrices, and percolation thresholds form a unified universal language spanning both biological ecosystems and distributed software architectures.\n"
        "• Explainability Matters: Interactive step-by-step timelines demystify non-linear emergent behaviors, turning abstract mathematical cascade equations into intuitive learning experiences.",
        "Key Educational Insights: "
    )

    # Page Break to References
    doc.add_page_break()

    # =========================================================================
    # SECTION 6: REFERENCES
    # =========================================================================
    add_h1("6. REFERENCES")
    refs = [
        "[1] Dunne, J.A., Williams, R.J., and Martinez, N.D. (2002). Network structure and biodiversity loss in food webs: robustness increases with connectance. Ecology Letters, 5(4), 558-567.",
        "[2] Pimm, S.L. (1979). The structure of food webs. Theoretical Population Biology, 16(2), 144-158.",
        "[3] Paine, R.T. (1966). Food web complexity and species diversity. The American Naturalist, 100(910), 65-75.",
        "[4] Wootton, J.T., Sander, E.L., and Allesina, S. (2016). Data from: What can indirect interactions tell us about food webs? Dryad Digital Repository. https://doi.org/10.5061/dryad.15hp4",
        "[5] Zhang, P., Zhang, H., and Xu, J. (2024). Multiple stressors simplify freshwater lake food webs: species loss, link reduction, and connectance decay. Dryad Digital Repository. https://doi.org/10.5061/dryad.6hdr7sr5k",
        "[6] Baird, D., and Ulanowicz, R.E. (1989). The seasonal dynamics of the Chesapeake Bay ecosystem. Ecological Monographs, 59(4), 329-364.",
        "[7] Gripenberg, S., et al. (2019). A highly-resolved food web for insect seed predators in a species-rich tropical forest. Ecology Letters, 22(10), 1638-1649.",
        "[8] Miller-ter Kuile, A., et al. (2022). Predator-prey interactions of terrestrial invertebrates on Palmyra Atoll. Dryad Digital Repository. https://doi.org/10.5061/dryad.8pk0p2nqd",
        "[9] Martinez, N.D., Hawkins, B.A., Dawah, H.A., and Feifarek, B.P. (1999). Effects of sampling effort on characterization of food-web structure. Ecology, 80(3), 1044-1055.",
        "[10] Allesina, S., and Bodini, A. (2004). Who dominates whom in the ecosystem? Energy flow bottlenecks and food web sensitivity. Journal of Theoretical Biology, 230(3), 351-358.",
    ]
    for r in refs:
        p = add_p(space_before=2, space_after=2, left_indent=0.25)
        add_run(p, r, size=9.0)

    output_path = r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Experiential_Learning_Report.docx"
    doc.save(output_path)
    print(f"Compact Master Experiential Learning Report successfully created at: {output_path}")

if __name__ == '__main__':
    build_compact_report()
