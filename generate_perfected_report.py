import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import re

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
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

def build_perfected_report():
    doc = docx.Document()
    
    # 1. Page Setup: 1.0 inch all around, standard Letter
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        s.page_width = Inches(8.5)
        s.page_height = Inches(11.0)

    # Styling helpers
    def add_p(before=None, space_before=0, space_after=4, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT, keep_with_next=False, left_indent=0):
        if before:
            p = before.insert_paragraph_before()
        else:
            p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.keep_with_next = keep_with_next
        if left_indent > 0:
            p.paragraph_format.left_indent = Inches(left_indent)
        return p

    def add_run(p, text, font_name="Times New Roman", size=10.5, bold=False, italic=False, sup=False, sub=False, color=None):
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

    def emit_math_formatted_text(p, text, font_name="Times New Roman", size=10.5, default_bold=False, default_italic=False, color=None):
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
        p = add_p(space_before=14, space_after=6, keep_with_next=True)
        emit_math_formatted_text(p, text, font_name="Times New Roman", size=15.0, default_bold=True, color=RGBColor(0x1B, 0x36, 0x5D))
        return p

    def add_h2(text):
        p = add_p(space_before=10, space_after=4, keep_with_next=True)
        emit_math_formatted_text(p, text, font_name="Times New Roman", size=12.5, default_bold=True, color=RGBColor(0x22, 0x22, 0x22))
        return p

    def add_body(text, bold_prefix=None, space_after=5, left_indent=0):
        p = add_p(space_before=0, space_after=space_after, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=left_indent)
        if bold_prefix:
            emit_math_formatted_text(p, bold_prefix, default_bold=True)
        emit_math_formatted_text(p, text)
        return p

    def add_figure(image_path, fig_num, caption_title, caption_desc):
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Missing image file: {image_path}")
        p_img = add_p(space_before=8, space_after=3, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
        r_img = p_img.add_run()
        r_img.add_picture(image_path, width=Inches(6.20))
        
        p_cap = add_p(space_before=2, space_after=10, align=WD_ALIGN_PARAGRAPH.CENTER)
        add_run(p_cap, f"Figure {fig_num}: {caption_title}. ", size=9.5, bold=True, italic=True)
        emit_math_formatted_text(p_cap, caption_desc, size=9.5, default_italic=True)

    # -------------------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------------------
    banner_path = r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\extracted_sample_assets\image1.png"
    p_top = add_p(space_before=0, space_after=8, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    if os.path.exists(banner_path):
        p_top.add_run().add_picture(banner_path, width=Inches(4.80))

    p_dept = add_p(space_before=6, space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_dept, "B. Tech CSE - SE", font_name="Calibri", size=12.0, bold=True)

    p_subj = add_p(space_before=2, space_after=10, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_subj, "Biology", font_name="Calibri", size=12.0, bold=True)

    p_el = add_p(space_before=10, space_after=4, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_el, "EXPERIENTIAL LEARNING ON", font_name="Calibri", size=12.5, bold=True)

    p_topic = add_p(space_before=4, space_after=14, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_topic, "Topic: FoodWebGuard: Algorithmic Modeling of Trophic Network Cascades and Ecosystem Resilience Under In Silico Perturbation", font_name="Calibri", size=11.5, bold=True)

    p_sub = add_p(space_before=8, space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_sub, "Submitted to", font_name="Calibri", size=11.0, bold=True)

    p_prof = add_p(space_before=2, space_after=14, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_prof, "Dr. Rohini", font_name="Calibri", size=11.5, bold=True)

    p_by = add_p(space_before=8, space_after=6, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_by, "Submitted by", font_name="Calibri", size=11.0, bold=True)

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
            cell.width = Inches(3.25)
            set_cell_margins(cell, top=70, bottom=70, left=120, right=120)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            add_run(p, val, font_name="Calibri", size=10.5, bold=(r_idx == 0))

    # Page Break to TOC
    doc.add_page_break()

    # -------------------------------------------------------------------------
    # TABLE OF CONTENTS
    # -------------------------------------------------------------------------
    p_toc_head = add_p(space_before=14, space_after=10, align=WD_ALIGN_PARAGRAPH.CENTER, keep_with_next=True)
    add_run(p_toc_head, "Table of Contents", font_name="Times New Roman", size=16.0, bold=True, color=RGBColor(0x1B, 0x36, 0x5D))

    toc_data = [
        ("Sl.no.", "Title", "Page No."),
        ("1", "Introduction", "1-5"),
        ("2", "Objectives", "6-6"),
        ("3", "Research Methodology", "7-13"),
        ("4", "Results & Experimental Validation", "14-22"),
        ("5", "Conclusion & Engineering Implications", "23-25"),
        ("6", "References", "26-27"),
        ("7", "Appendix: Live Oral Script & Professor Defense", "28-35"),
    ]
    t1 = doc.add_table(rows=len(toc_data), cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1, "BBBBBB")
    col_widths_t1 = [Inches(0.8), Inches(4.7), Inches(1.0)]
    for r_idx, (sl, tit, pg) in enumerate(toc_data):
        row = t1.rows[r_idx]
        for c_idx, val in enumerate([sl, tit, pg]):
            cell = row.cells[c_idx]
            cell.width = col_widths_t1[c_idx]
            set_cell_margins(cell, top=65, bottom=65, left=100, right=100)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
            add_run(p, val, font_name="Times New Roman", size=10.5, bold=(r_idx == 0 or c_idx == 0))

    # Page Break to Section 1
    doc.add_page_break()

    # -------------------------------------------------------------------------
    # 1. INTRODUCTION
    # -------------------------------------------------------------------------
    add_h1("1. INTRODUCTION")

    add_h2("1.1 Ecological Background & Biological Network Complexity")
    add_body(
        "A foundational challenge in contemporary systems biology and ecological conservation is understanding the structural integrity and cascading fragility of living ecosystems under human-driven and climatic perturbations. Historically, ecological assessment was constrained by anecdotal species counts or phenomenological observations. However, modern community ecology models ecological communities as complex directed dependency graphs, where species represent interacting nodes and directed edges formalize energetic consumer-prey pathways.",
        "The Ecological Fragility Dilemma: "
    )
    add_body(
        "Ecological communities are characterized by deep trophic hierarchies: primary producers (autotrophs such as phytoplankton and vascular plants) fix radiant solar energy or abiotic inorganic chemicals. Primary consumers (herbivores) feed upon producers, secondary consumers (carnivores) feed upon herbivores, and apex predators sit at the energetic summit. In nature, these pathways do not form simple isolated chains, but rather highly interconnected, anastomosing food webs. A disturbance introduced at a single node—such as the overharvesting of a keystone carnivore or the habitat destruction of a primary producer—can propagate non-linearly across the entire graph.",
        "Trophic Architecture & Energy Flow: "
    )
    add_body(
        "Paine's landmark 1966 experimental intertidal exclusion demonstrated that removing a single top predator (the starfish Pisaster ochraceus) from rocky intertidal communities caused the collapse of species diversity from 15 species down to a single dominating mussel monoculture. Such disproportionately impactful organisms are termed keystone species. Modern computational ecology seeks to identify these keystones algorithmically before real-world catastrophic collapse occurs.",
        "The Keystone Vulnerability Principle: "
    )

    add_h2("1.2 Engineering Isomorphism & Network Reliability")
    add_body(
        "In computer science, electrical engineering, and systems reliability analysis, engineers model infrastructure networks—such as high-voltage electrical power grids, distributed microservice DAGs (Directed Acyclic Graphs), packet-routing topologies, and telecommunication backbones—to guarantee fault tolerance. When a primary high-load transformer substation trips, the sudden load reallocation can cascade down adjacent transmission lines, causing a regional blackout. The mathematical isomorphism between electrical power grid failure cascades and ecological food web secondary starvations is profound: both systems are governed by non-linear percolation thresholds, connectivity degree distributions, and topological bottlenecks.",
        "Isomorphism to Distributed Systems and Power Grids: "
    )
    add_body(
        "Despite this profound systems synergy, biological software has historically lagged behind industrial engineering tools. General-purpose graph visualization suites such as Gephi or Cytoscape Desktop are essentially static visualizers; they lack interactive, step-by-step extinction cascade perturbation simulators, dynamic trophic tier stratification, and automated sensitivity scanning. Headless programming libraries such as Python NetworkX provide algorithmic primitives but lack an interactive interface accessible to interdisciplinary biologists, non-coder policymakers, and classroom students. FoodWebGuard bridges this divide by delivering a client-side, zero-install computational laboratory that unifies rigorous topological percolation mechanics with intuitive visual explainability.",
        "Shortcomings of Traditional Visualization Tools: "
    )

    add_h2("1.3 Computational Framework: Dunne et al. (2002) Percolation Theory")
    add_body(
        "A critical debate in computational biology centers on the trade-off between fully parameterized dynamic differential equations (such as Lotka-Volterra or bioenergetic consumer-resource models) versus structural topological models. Dynamic models require estimating dozens of unmeasured kinetic constants for every species—attack rates, handling times, assimilation efficiencies, carrying capacities, and metabolic scaling coefficients. In complex natural ecosystems with dozens or hundreds of taxa, 95% of these constants are unobservable, introducing severe parametric uncertainty and numerical instability. As demonstrated in the seminal work of Dunne, Williams, and Martinez (2002, PNAS), topological network models isolate pure structural vulnerability from parameter noise, providing an objective, mathematically rigorous baseline of food web robustness under systematic species loss.",
        "Topological Percolation vs. Dynamic Parametrization: "
    )

    # FIGURE 1
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig1_overview.png",
        1,
        "Architectural Overview and System Navigation in FoodWebGuard",
        "The platform integrates interactive graph simulation, sensitivity analytics, cross-ecosystem benchmarks, and an empirical research repository into a unified, zero-install computational environment."
    )

    # -------------------------------------------------------------------------
    # 2. OBJECTIVES
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_h1("2. OBJECTIVES")
    add_body(
        "The overarching aim of this experiential research project was to architect, prototype, and experimentally validate an interactive, client-side in silico perturbation engine—named FoodWebGuard—to simulate, quantify, and explain ecological cascade failures and network resilience across diverse empirical biomes.",
        "Primary Research Aim: "
    )
    add_body("The specific biological and computational objectives of the study were established as follows:")

    objs = [
        ("Objective 1 (Interactive Trophic Stratification): ", "Design and implement a Cytoscape.js rendering engine capable of automatically stratifying species into discrete vertical trophic tiers (Basal Autotrophs, Intermediate Consumers, Apex Predators) based on computed dietary breadth and predator burden."),
        ("Objective 2 (Deterministic Topological Extinction Engine): ", "Develop a real-time cascade propagation engine implementing the formal topological starvation rule: a non-basal consumer undergoes secondary extinction if and only if 100% of its documented prey items are eradicated."),
        ("Objective 3 (Temporal Explainability via Cascade Timeline): ", "Create a chronological step-by-step timeline interface allowing users to pause, inspect, and step through cascade waves (t = 0, 1, 2, ...), identifying the precise mechanistic pathway through which an initial perturbation destabilizes higher trophic levels."),
        ("Objective 4 (Whole-Network Automated Sensitivity Sweep): ", "Construct an automated background calculation engine that executes N independent primary perturbation simulations across all N species in a web, ranking every organism by Keystone Criticality Index, Secondary Extinction Count, and Connectance Loss."),
        ("Objective 5 (Dunne 2002 Robustness Benchmarking & R50 Evaluation): ", "Formulate and plot empirical network robustness curves under three distinct topological attack vectors (Strategy A: Targeted Hub Attack / Max Degree First; Strategy D: Random Stochastic Extinction; Strategy B: Basal First) and compute the exact R50 percolation metric."),
        ("Objective 6 (Cross-Biome Comparative Empirical Analysis): ", "Benchmark and compare network topology, directed connectance (C = L / S^2), link density, and cascade fragility across six diverse empirical ecosystems curated from peer-reviewed Dryad repositories."),
        ("Objective 7 (Dynamic Data Intake Studio & Schema Repair): ", "Engineer a dual-slot in-browser CSV and JSON intake pipeline featuring real-time biological header validation, alias resolution, cycle tolerance, and automatic schema sanitization."),
        ("Objective 8 (Publication-Grade Academic PDF Report Generation): ", "Build an automated mathematical report modal that compiles active ecosystem parameters, directed adjacency matrices, Jaccard trophic similarity matrices, and step-by-step audit logs into a clean, unclipped PDF document."),
    ]
    for pfx, desc in objs:
        add_body(desc, bold_prefix=pfx, space_after=3, left_indent=0.2)

    # -------------------------------------------------------------------------
    # 3. RESEARCH METHODOLOGY
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_h1("3. RESEARCH METHODOLOGY")

    add_h2("3.1 Empirical Datasets Curation & Provenance")
    add_body(
        "A rigorous scientific principle of FoodWebGuard is that simulations must reflect empirical ecological reality rather than synthetic random graphs. We curated, standardized, and benchmarked six high-resolution empirical food webs spanning marine, freshwater, and terrestrial biomes from peer-reviewed literature and the Dryad Digital Repository.",
        "Multi-Biome Empirical Repository: "
    )

    # Caption Table 1
    p_t1_cap = add_p(space_before=4, space_after=3, keep_with_next=True)
    add_run(p_t1_cap, "Table 1: Curated Empirical Food Web Datasets Across Marine, Freshwater, and Terrestrial Biomes.", size=9.5, bold=True)

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
    col_widths_t2 = [Inches(1.4), Inches(1.2), Inches(0.7), Inches(0.7), Inches(2.5)]
    for r_idx, row_data in enumerate(datasets_data):
        row = t2.rows[r_idx]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths_t2[c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [2, 3] else WD_ALIGN_PARAGRAPH.LEFT
            add_run(p, val, font_name="Times New Roman", size=9.5 if r_idx == 0 else 9.0, bold=(r_idx == 0))

    # 3.2 Mathematical Formulations
    add_h2("3.2 Mathematical Formulations & Topological Metrics")
    add_body(
        "To rigorously quantify network architecture and vulnerability, our computational engine computes the following formal topological properties:",
        "Topological Metric Definitions: "
    )

    # Metric 1: Connectance
    p_m1_t = add_p(space_before=4, space_after=1, left_indent=0.25, keep_with_next=True)
    add_run(p_m1_t, "1. Directed Connectance (", bold=True)
    add_run(p_m1_t, "C", bold=True, italic=True)
    add_run(p_m1_t, "):", bold=True)

    p_m1_f = add_p(space_before=1, space_after=2, left_indent=0.5, keep_with_next=True)
    add_run(p_m1_f, "C", italic=True, bold=True)
    add_run(p_m1_f, " = ")
    add_run(p_m1_f, "L", italic=True)
    add_run(p_m1_f, " / ")
    add_run(p_m1_f, "S", italic=True)
    add_run(p_m1_f, "2", sup=True)

    p_m1_d = add_p(space_before=1, space_after=4, left_indent=0.25)
    add_run(p_m1_d, "where ")
    add_run(p_m1_d, "L", italic=True)
    add_run(p_m1_d, " is the total number of documented active directed feeding links, and ")
    add_run(p_m1_d, "S", italic=True)
    add_run(p_m1_d, " represents total species richness. Directed connectance quantifies the realized fraction of all theoretically possible binary directed feeding interactions (")
    add_run(p_m1_d, "S", italic=True)
    add_run(p_m1_d, "2", sup=True)
    add_run(p_m1_d, ").")

    # Metric 2: Link Density
    p_m2_t = add_p(space_before=4, space_after=1, left_indent=0.25, keep_with_next=True)
    add_run(p_m2_t, "2. Link Density (", bold=True)
    add_run(p_m2_t, "D", bold=True, italic=True)
    add_run(p_m2_t, "):", bold=True)

    p_m2_f = add_p(space_before=1, space_after=2, left_indent=0.5, keep_with_next=True)
    add_run(p_m2_f, "D", italic=True, bold=True)
    add_run(p_m2_f, " = ")
    add_run(p_m2_f, "L", italic=True)
    add_run(p_m2_f, " / ")
    add_run(p_m2_f, "S", italic=True)

    p_m2_d = add_p(space_before=1, space_after=4, left_indent=0.25)
    add_run(p_m2_d, "representing the mean number of feeding interactions per species across the ecosystem, independent of quadratic scaling.")

    # Metric 3: In-Degree and Out-Degree
    p_m3_t = add_p(space_before=4, space_after=1, left_indent=0.25, keep_with_next=True)
    add_run(p_m3_t, "3. In-Degree (", bold=True)
    add_run(p_m3_t, "k", bold=True, italic=True)
    add_run(p_m3_t, "in", bold=True, sub=True)
    add_run(p_m3_t, ") and Out-Degree (", bold=True)
    add_run(p_m3_t, "k", bold=True, italic=True)
    add_run(p_m3_t, "out", bold=True, sub=True)
    add_run(p_m3_t, "):", bold=True)

    p_m3_f1 = add_p(space_before=1, space_after=1, left_indent=0.5, keep_with_next=True)
    add_run(p_m3_f1, "k", italic=True, bold=True)
    add_run(p_m3_f1, "in", sub=True, bold=True)
    add_run(p_m3_f1, "(")
    add_run(p_m3_f1, "i", italic=True)
    add_run(p_m3_f1, ") = \u2211")
    add_run(p_m3_f1, "j=1", sub=True)
    add_run(p_m3_f1, "S", sup=True)
    add_run(p_m3_f1, " ")
    add_run(p_m3_f1, "A", bold=True)
    add_run(p_m3_f1, "ji", sub=True)
    add_run(p_m3_f1, "   (Dietary Breadth: number of prey taxa consumed by species ")
    add_run(p_m3_f1, "i", italic=True)
    add_run(p_m3_f1, ")")

    p_m3_f2 = add_p(space_before=1, space_after=2, left_indent=0.5, keep_with_next=True)
    add_run(p_m3_f2, "k", italic=True, bold=True)
    add_run(p_m3_f2, "out", sub=True, bold=True)
    add_run(p_m3_f2, "(")
    add_run(p_m3_f2, "i", italic=True)
    add_run(p_m3_f2, ") = \u2211")
    add_run(p_m3_f2, "j=1", sub=True)
    add_run(p_m3_f2, "S", sup=True)
    add_run(p_m3_f2, " ")
    add_run(p_m3_f2, "A", bold=True)
    add_run(p_m3_f2, "ij", sub=True)
    add_run(p_m3_f2, "   (Predator Burden: number of consumer taxa supported by species ")
    add_run(p_m3_f2, "i", italic=True)
    add_run(p_m3_f2, ")")

    p_m3_d = add_p(space_before=1, space_after=4, left_indent=0.25)
    add_run(p_m3_d, "where ")
    add_run(p_m3_d, "A", bold=True)
    add_run(p_m3_d, " denotes the binary directed adjacency matrix of the food web, with ")
    add_run(p_m3_d, "A", bold=True)
    add_run(p_m3_d, "ji", sub=True)
    add_run(p_m3_d, " = 1 if organism ")
    add_run(p_m3_d, "j", italic=True)
    add_run(p_m3_d, " is consumed by organism ")
    add_run(p_m3_d, "i", italic=True)
    add_run(p_m3_d, " (energy flow vector from prey ")
    add_run(p_m3_d, "j", italic=True)
    add_run(p_m3_d, " \u2192 predator ")
    add_run(p_m3_d, "i", italic=True)
    add_run(p_m3_d, ").")

    # Metric 4: Secondary Extinction Criterion
    p_m4_t = add_p(space_before=4, space_after=1, left_indent=0.25, keep_with_next=True)
    add_run(p_m4_t, "4. Secondary Extinction Criterion (Topological Starvation Rule):", bold=True)

    p_m4_desc1 = add_p(space_before=1, space_after=2, left_indent=0.25, keep_with_next=True)
    add_run(p_m4_desc1, "For any consumer ")
    add_run(p_m4_desc1, "c", italic=True)
    add_run(p_m4_desc1, " \u2208 NonBasalSpecies, its active in-degree following a perturbation sequence ")
    add_run(p_m4_desc1, "P", italic=True)
    add_run(p_m4_desc1, " is formally defined as:")

    p_m4_f = add_p(space_before=1, space_after=2, left_indent=0.5, keep_with_next=True)
    add_run(p_m4_f, "k", italic=True, bold=True)
    add_run(p_m4_f, "in", sub=True, bold=True)
    add_run(p_m4_f, "active", sup=True, bold=True)
    add_run(p_m4_f, "(")
    add_run(p_m4_f, "c", italic=True)
    add_run(p_m4_f, ") = \u2211")
    add_run(p_m4_f, "p \u2208 SurvivingPrey", sub=True)
    add_run(p_m4_f, " ")
    add_run(p_m4_f, "A", bold=True)
    add_run(p_m4_f, "pc", sub=True)

    p_m4_rule1 = add_p(space_before=1, space_after=1, left_indent=0.5, keep_with_next=True)
    add_run(p_m4_rule1, "\u2022 Secondary Extinction: ", bold=True)
    add_run(p_m4_rule1, "If ")
    add_run(p_m4_rule1, "k", italic=True)
    add_run(p_m4_rule1, "in", sub=True)
    add_run(p_m4_rule1, "active", sup=True)
    add_run(p_m4_rule1, "(")
    add_run(p_m4_rule1, "c", italic=True)
    add_run(p_m4_rule1, ") = 0 \u27F9 Consumer ")
    add_run(p_m4_rule1, "c", italic=True)
    add_run(p_m4_rule1, " loses 100% of its energetic prey base and starves.")

    p_m4_rule2 = add_p(space_before=1, space_after=4, left_indent=0.5)
    add_run(p_m4_rule2, "\u2022 Consumer Survival: ", bold=True)
    add_run(p_m4_rule2, "If ")
    add_run(p_m4_rule2, "k", italic=True)
    add_run(p_m4_rule2, "in", sub=True)
    add_run(p_m4_rule2, "active", sup=True)
    add_run(p_m4_rule2, "(")
    add_run(p_m4_rule2, "c", italic=True)
    add_run(p_m4_rule2, ") \u2265 1 \u27F9 Consumer ")
    add_run(p_m4_rule2, "c", italic=True)
    add_run(p_m4_rule2, " survives through dietary prey switching.")

    # Metric 5: Basal Autotroph Exemption
    p_m5_t = add_p(space_before=4, space_after=1, left_indent=0.25, keep_with_next=True)
    add_run(p_m5_t, "5. Basal Autotroph Exemption Rule:", bold=True)

    p_m5_d = add_p(space_before=1, space_after=4, left_indent=0.25)
    add_run(p_m5_d, "Basal autotrophs (phytoplankton, benthic microalgae, macrophytes, detritus) have ")
    add_run(p_m5_d, "k", italic=True)
    add_run(p_m5_d, "in", sub=True)
    add_run(p_m5_d, " = 0 by biological definition because they utilize solar or abiotic chemical energy; they are strictly exempt from starvation rules.")

    # Metric 6: Jaccard Trophic Similarity
    p_m6_t = add_p(space_before=4, space_after=1, left_indent=0.25, keep_with_next=True)
    add_run(p_m6_t, "6. Jaccard Trophic Similarity Coefficient (", bold=True)
    add_run(p_m6_t, "J", bold=True, italic=True)
    add_run(p_m6_t, "):", bold=True)

    p_m6_f = add_p(space_before=1, space_after=2, left_indent=0.5, keep_with_next=True)
    add_run(p_m6_f, "J", italic=True, bold=True)
    add_run(p_m6_f, "(")
    add_run(p_m6_f, "u", italic=True)
    add_run(p_m6_f, ", ")
    add_run(p_m6_f, "v", italic=True)
    add_run(p_m6_f, ") = |Prey(")
    add_run(p_m6_f, "u", italic=True)
    add_run(p_m6_f, ") \u2229 Prey(")
    add_run(p_m6_f, "v", italic=True)
    add_run(p_m6_f, ")| / |Prey(")
    add_run(p_m6_f, "u", italic=True)
    add_run(p_m6_f, ") \u222A Prey(")
    add_run(p_m6_f, "v", italic=True)
    add_run(p_m6_f, ")|")

    p_m6_d = add_p(space_before=1, space_after=8, left_indent=0.25)
    add_run(p_m6_d, "where \u2229 denotes intersection (shared prey resources) and \u222A denotes union (total collective prey resources) between consumers ")
    add_run(p_m6_d, "u", italic=True)
    add_run(p_m6_d, " and ")
    add_run(p_m6_d, "v", italic=True)
    add_run(p_m6_d, ". A Jaccard trophic similarity approaching 1.0 indicates complete dietary niche redundancy, whereas values near 0.0 denote specialized, non-overlapping trophic niches.")

    # 3.3 Interactive Trophic Stratification & Visualization Engine
    add_h2("3.3 Interactive Trophic Stratification & Network Visualization Engine")
    add_body(
        "To render complex food webs intelligible, FoodWebGuard integrates a specialized Cytoscape.js canvas layout that stratifies species into vertical energetic tiers. Unlike unconstrained force-directed algorithms that produce unreadable 'hairballs', our trophic layout positions basal autotrophs at the base tier, intermediate invertebrate and vertebrate consumers across central tiers, and apex predators at the energetic summit. Directed curved edges trace biomass flow from prey upward to predator.",
        "Visual Trophic Stratification: "
    )
    add_body(
        "Selecting any node opens the real-time Species Inspector panel, rendering local in-degree, out-degree, dietary breadth, verified trophic role, and educational context without obstructing the main network canvas.",
        "Local Node Inspection: "
    )

    # FIGURE 2
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig2_explore_trophic.png",
        2,
        "Interactive Trophic Network Explorer",
        "Cytoscape.js arranges species into vertical energetic tiers (Basal Autotrophs at bottom to Apex Predators at top). Directed edges indicate biomass flow vectors. The Species Inspector drawer on the right displays local in-degree, out-degree, and ecological role."
    )

    # 3.4 In Silico Extinction Cascade Mechanics & Starvation Criteria
    add_h2("3.4 In Silico Extinction Cascade Mechanics & Starvation Criteria")
    add_body(
        "When an organism is targeted for removal, the simulation engine executes a multi-round topological cascade. In Round 0, the target species is excised from the active network, and all its incident edges are severed. In subsequent rounds (t = 1, 2, ...), the engine scans all remaining consumers. Any consumer whose active in-degree drops to zero (k_in^active = 0) is flagged as starved and removed. This process repeats recursively until a stable topological equilibrium is reached.",
        "Cascade Propagation Engine: "
    )
    add_body(
        "To maximize explainability for students and researchers, the interface features a chronological Cascade Timeline bar at the bottom of the viewport. Users can scrub or step through individual propagation rounds, observing how an initial primary deletion triggers subsequent secondary extinctions across distinct trophic compartments.",
        "Temporal Explainability: "
    )

    # FIGURE 3
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig3_cascade_simulation.png",
        3,
        "In Silico Extinction Cascade Simulation",
        "Perturbation of a basal producer triggers secondary starvation waves. Primary removed target is slashed in gray, while starved secondary consumers receive glowing red warning rings. The bottom Cascade Timeline tracks propagation across chronological stages."
    )

    # 3.5 Dunne et al. (2002) Attack Sequences & Robustness Formulation
    add_h2("3.5 Dunne et al. (2002) Attack Sequences & Robustness Formulation")
    add_body(
        "To assess ecosystem stability under systematic degradation, FoodWebGuard implements the Dunne et al. (2002) topological attack framework, executing three comparative removal sequences:",
        "Extinction Sequences & R50 Formulation: "
    )

    add_body("Primary removals occur in descending order of total connectivity (k_in + k_out). This models targeted overharvesting or selective exploitation of keystone species.", bold_prefix="\u2022 Strategy A (Targeted Hub Attack / Max Degree First): ", left_indent=0.25)
    add_body("Primary removals occur in uniformly random order. This models diffuse background mortality or environmental stochasticity.", bold_prefix="\u2022 Strategy D (Random Stochastic Extinction): ", left_indent=0.25)
    add_body("Primary removals occur from the bottom of the food web upward, modeling severe habitat loss, acidification, or bottom-up pesticide poisoning.", bold_prefix="\u2022 Strategy B (Basal Species First): ", left_indent=0.25)

    add_body("The Robustness Metric (R50) is formally defined as the cumulative fraction of primary species removals required to trigger a total loss of 50% of the initial species pool (S_0):")

    p_r50_eqn = add_p(space_before=1, space_after=3, left_indent=0.5, keep_with_next=True)
    add_run(p_r50_eqn, "R", italic=True, bold=True)
    add_run(p_r50_eqn, "50", sub=True, bold=True)
    add_run(p_r50_eqn, " = ")
    add_run(p_r50_eqn, "N", italic=True)
    add_run(p_r50_eqn, "removed", sub=True)
    add_run(p_r50_eqn, "(0.50 \u00B7 ")
    add_run(p_r50_eqn, "S", italic=True)
    add_run(p_r50_eqn, "0", sub=True)
    add_run(p_r50_eqn, ") / ")
    add_run(p_r50_eqn, "S", italic=True)
    add_run(p_r50_eqn, "0", sub=True)

    add_body("An R50 of 0.40 indicates high structural resilience, whereas an R50 below 0.15 denotes acute vulnerability to collapse.")

    # -------------------------------------------------------------------------
    # 4. RESULTS & EXPERIMENTAL VALIDATION
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_h1("4. RESULTS & EXPERIMENTAL VALIDATION")

    add_h2("4.1 Extinction Cascade Dynamics Across Distinct Ecosystems")
    add_body(
        "By simulating topological perturbations across our six empirical ecosystems, we observed stark contrasts in network vulnerability driven by connectance and degree heterogeneity. High-connectance webs exhibit remarkable resistance to random perturbations due to trophic redundancy, but collapse abruptly when highly connected keystone hubs are removed.",
        "Comparative Topological Resilience: "
    )

    # Caption Table 2
    p_t2_cap = add_p(space_before=4, space_after=3, keep_with_next=True)
    add_run(p_t2_cap, "Table 2: Comparative Network Topology and Dunne (2002) Robustness (", size=9.5, bold=True)
    add_run(p_t2_cap, "R", size=9.5, bold=True, italic=True)
    add_run(p_t2_cap, "50", size=9.5, bold=True, sub=True)
    add_run(p_t2_cap, ") Metrics Across Empirical Ecosystems.", size=9.5, bold=True)

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
    col_widths_t3 = [Inches(1.5), Inches(0.9), Inches(0.9), Inches(1.1), Inches(1.05), Inches(1.05)]
    
    # Header row
    hdr_row = t3.rows[0]
    for c_idx, run_specs in enumerate(metrics_headers):
        cell = hdr_row.cells[c_idx]
        cell.width = col_widths_t3[c_idx]
        set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
        set_cell_background(cell, "EAEAEA")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
        for txt, it, bd, sb in run_specs:
            add_run(p, txt, font_name="Times New Roman", size=9.5, bold=True, italic=it, sub=sb)

    # Body rows
    for r_idx, r_data in enumerate(metrics_rows):
        row = t3.rows[r_idx + 1]
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            cell.width = col_widths_t3[c_idx]
            set_cell_margins(cell, top=55, bottom=55, left=60, right=60)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            add_run(p, val, font_name="Times New Roman", size=9.0)

    # 4.2 Dunne Robustness Evaluation
    add_h2("4.2 Dunne (2002) Robustness Evaluation & Percolation Curves")
    add_body(
        "Figure 4 portrays the empirical extinction curves generated in the Network Robustness Lab. Across all evaluated ecosystems, the targeted hub attack curve (Strategy A, red) demonstrates acute non-linear collapse compared to random loss (Strategy D, blue). In Tatoosh Island (S = 110), removing the top 28% most-connected hub taxa precipitates a 50% collapse of total community richness, whereas under random loss, the ecosystem tolerates up to 48% removals before reaching the R50 threshold.",
        "Hub Vulnerability vs. Random Resilience: "
    )

    # FIGURE 4
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig5_dunne_robustness.png",
        4,
        "Dunne et al. (2002) Network Robustness Lab",
        "Recharts plots cumulative species removals against surviving richness across Strategy A (Targeted Hub Attack, red) versus Strategy D (Random Extinction, blue). The calculated R50 metric provides an objective index of structural resilience."
    )

    # 4.3 Whole-Network Sensitivity Analysis & Keystone Species Ranking
    add_h2("4.3 Whole-Network Sensitivity Analysis & Keystone Species Ranking")
    add_body(
        "The automated sensitivity scan in the Experiment Studio perturbates every species independently, compiling an ecosystem-wide ranking table. Species are scored based on Secondary Extinctions Triggered, Fractional Richness Loss, and Connectance Degradation. In the Chesapeake Bay web, benthic microalgae and predatory blue crabs (Callinectes sapidus) emerge as the highest-ranked keystone nodes.",
        "System-Wide Sensitivity Scanning: "
    )

    # FIGURE 5
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig4_sensitivity_ranking.png",
        5,
        "Whole-Network Sensitivity Scan in Experiment Studio",
        "An automated worker executes independent single-node removals across all species, ranking organisms by Keystone Criticality Index, Secondary Extinction Count, and Connectance Loss."
    )

    # 4.4 Cross-Ecosystem Comparative Benchmarking & Biome Resilience
    add_h2("4.4 Cross-Ecosystem Comparative Benchmarking & Biome Resilience")
    add_body(
        "To explore macro-ecological patterns across distinct biomes, FoodWebGuard provides a cross-ecosystem comparative dashboard. Comparing marine intertidal, estuarine, freshwater lake, tropical forest, and coral reef ecosystems demonstrates that Directed Connectance (C = L / S^2) strongly governs cascade resistance. Low-connectance biomes (e.g. tropical plant-insect webs) exhibit extreme vulnerability to localized perturbations due to narrow dietary specialization, whereas highly connected marine webs display substantial buffering capacity.",
        "Comparative Biome Architecture: "
    )

    # FIGURE 6
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig6_ecosystem_comparison.png",
        6,
        "Cross-Ecosystem Comparative Dashboard",
        "Multi-metric bar charts benchmark Directed Connectance, Link Density, and Cascade Fragility across marine, freshwater, and terrestrial biomes."
    )

    # 4.5 Dynamic Data Intake Studio & Schema Validation
    add_h2("4.5 Dynamic Data Intake Studio & Schema Validation")
    add_body(
        "To confirm the system's extensibility beyond built-in datasets, we validated the dynamic Data Intake Studio using a real-world 14-species Chesapeake Estuary CSV callset. The dual-slot ingestion pipeline validates species nodes and directed feeding links in real time, executing automated schema verification, synonym normalization, and biological cycle checks before committing the dataset to client-side state.",
        "Live Ingestion Verification: "
    )

    # FIGURE 7
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig7_data_intake_import.png",
        7,
        "Data Intake Studio with Dual-Slot File Intake",
        "Dedicated upload slots for Species Nodes CSV and Feeding Links CSV provide real-time validation badges and schema checking before committing datasets to active application state."
    )

    # 4.6 Publication-Grade Academic Reporting & Simulation Audit Logs
    add_h2("4.6 Publication-Grade Academic Reporting & Simulation Audit Logs")
    add_body(
        "To satisfy the rigorous reproducibility standards of academic peer review, FoodWebGuard features an automated Academic Mathematical Report Modal. The module compiles KaTeX-rendered mathematical formulations, the full binary directed adjacency matrix, the Jaccard trophic overlap matrix, and a timestamped chronological cascade audit log. Users can export this report directly to unclipped, multi-page PDF documents.",
        "Reproducibility & Mathematical Export: "
    )

    # FIGURE 8
    add_figure(
        r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\report_figures\fig8_academic_report.png",
        8,
        "Academic Mathematical Report Modal",
        "Features publication-grade KaTeX mathematical formatting, directed adjacency matrices, Jaccard trophic similarity matrices, and step-by-step cascade audit logs with unclipped multi-page PDF generation."
    )

    # -------------------------------------------------------------------------
    # 5. CONCLUSION & ENGINEERING IMPLICATIONS
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_h1("5. CONCLUSION & ENGINEERING IMPLICATIONS")

    add_h2("5.1 Synthesis of Scientific Contributions")
    add_body(
        "FoodWebGuard successfully bridges the divide between theoretical community ecology and rigorous software engineering. By formalizing ecological food webs as directed dependency graphs and executing deterministic in silico extinction cascades, the platform provides an intuitive, high-performance computational laboratory for analyzing ecosystem stability without parametric kinetic assumptions.",
        "Scientific Breakthrough: "
    )

    add_h2("5.2 Real-World Conservation & Systems Engineering Translation")
    add_body(
        "In wildlife conservation, prioritizing interventions based solely on species abundance or public charisma often leads to sub-optimal outcomes. Algorithmic keystone ranking empowers conservation planners to protect critical network hubs whose loss would precipitate widespread cascading extinctions. For systems engineers, ecological food webs provide masterclasses in evolutionary fault tolerance: millions of years of natural selection have engineered distributed, highly redundant networks capable of absorbing random shocks while remaining vulnerable to targeted hub failures—a principle directly applicable to cybersecurity, distributed microservices, and power grid reliability.",
        "Engineering Translation: "
    )

    add_h2("5.3 Experiential Learning Takeaways for Biology & Engineering Students")
    add_body(
        "• Biological Rigor over AI Slop: Computational models must be grounded in verified empirical data and formal mathematical theory (Pimm 1979, Dunne 2002), rather than ungrounded generative predictions.\n"
        "• Systems Engineering Synergies: Directed graphs, adjacency matrices, and percolation thresholds form a unified universal language spanning both biological ecosystems and distributed software architectures.\n"
        "• Explainability Matters: Interactive step-by-step timelines demystify non-linear emergent behaviors, turning abstract mathematical cascade equations into intuitive learning experiences.",
        "Key Educational Insights: "
    )

    # -------------------------------------------------------------------------
    # 6. REFERENCES
    # -------------------------------------------------------------------------
    doc.add_page_break()
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
        p = add_p(space_before=2, space_after=3, left_indent=0.3)
        add_run(p, r, size=9.5)

    # -------------------------------------------------------------------------
    # 7. APPENDIX: LIVE ORAL SCRIPT & PROFESSOR DEFENSE MASTER GUIDE
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_h1("7. Appendix: Live Oral Script & Professor Defense")
    add_body(
        "This appendix contains the verbatim speaking script divided across all 6 presenters, accompanied by exact on-screen visual click instructions and a battle-tested defense guide against critical evaluation questions.",
        "Presentation Handbook: "
    )

    speakers = [
        ("Speaker 1: Tejas V Iyer", "Overview & Engineering Analogy", "Home / Overview (/#overview)",
         "1. Start on Overview page showing hero header.\n2. Scroll through feature cards.\n3. Highlight engineering network analogy.\n4. Click 'Explore & Simulate' on left sidebar and pass to Nilotpal.",
         "\"Respected Professor and dear colleagues, good morning. Today, our team presents FoodWebGuard — an algorithmic ecosystem resilience platform developed for our Biology for Engineers experiential learning project.\n\n"
         "Why should engineering students study food webs? In software and electrical engineering, we study electrical power grids and microservice dependency trees to prevent single-point-of-failure blackouts. Biological food webs are directed energy-transfer networks. If a keystone node is removed, it triggers a non-linear topological cascade of secondary starvations throughout the ecosystem.\n\n"
         "Unlike static visualization tools, FoodWebGuard is an in silico perturbation laboratory combining Dunne (2002) percolation theory with high-performance graph computing to simulate secondary extinction waves in real time. Nilotpal will now demonstrate our interactive graph engine.\""),

        ("Speaker 2: Nilotpal Deb", "Graph Architecture & Trophic Tiers", "Explore & Simulate (/#explore)",
         "1. Click 'Trophic Layout' button on toolbar.\n2. Click 'Force Layout' briefly, then snap back to 'Trophic Layout'.\n3. Click on a species node (e.g. Platichthys flesus or Mytilus).\n4. Point out Species Inspector drawer (in-degree, out-degree, role).",
         "\"Thank you, Tejas. We are now inside our primary simulation workspace, powered by Cytoscape.js.\n\n"
         "When I click 'Trophic Layout', our layout algorithm stratifies organisms into vertical energetic tiers: Basal Autotrophs at the bottom tier, Primary and Secondary Consumers in the middle, and Apex Predators at the top. Notice link arrows point from prey to predator, representing the thermodynamic vector of biomass and energy flow.\n\n"
         "Inspecting a node reveals its local topological signature: in-degree (prey items consumed), out-degree (predators consuming it), and verified trophic role. Sanchit will now demonstrate what happens when a node is removed.\""),

        ("Speaker 3: Sanchit Kalantre", "Extinction Cascade Simulation & Timeline", "Explore & Simulate (/#explore)",
         "1. Select a basal producer.\n2. Click 'Run cascade scenario'.\n3. Point out primary slashed target and glowing red secondary extinction rings.\n4. Open Cascade Timeline to step through t = 0, 1, 2.\n5. Click 'Reset simulation' to demonstrate zero-leakage state restoration.",
         "\"Thank you, Nilotpal. Here we see the core computational engine of FoodWebGuard: Mathematical Cascade Propagation.\n\n"
         "How is secondary extinction mathematically defined? A consumer species starves if and only if 100% of its documented prey items are eradicated (k_in^active = 0). If at least one prey survives, it switches diet. Watch: when I remove this producer, the primary target is slashed in gray, and dependent consumers receive red warning rings.\n\n"
         "Our Cascade Timeline provides temporal explainability: Step 0 is primary removal, Step 1 is primary starvation, and Step 2 is tertiary collapse. Notice the canvas remains clean and unobstructed. Clicking 'Reset simulation' instantly restores the baseline. Sarvdeep will now show our macro-level sensitivity analytics.\""),

        ("Speaker 4: Sarvdeep Singh", "Sensitivity Sweep & Dunne Robustness (R50)", "Experiment Studio (/#experiment)",
         "1. Navigate to Experiment Studio.\n2. Point to Rankings Table (keystone criticality scores).\n3. Switch to 'Network Robustness Lab (Dunne 2002)' tab.\n4. Compare Targeted Hub Attack (red) vs. Random Extinction (blue) curves.\n5. Highlight the R50 metric badge.",
         "\"Thank you, Sanchit. In individual simulations, we test species one by one. But an environmental engineer needs macro-level predictive analytics. In our Experiment Studio, an automated worker removes each species in independent runs, ranking every organism by Keystone Criticality Index, secondary extinction count, and connectance loss.\n\n"
         "Under the Dunne (2002) Robustness Lab, we execute systematic attack strategies: Strategy A removes top-degree hubs first, while Strategy D removes species randomly. Notice how sharply the targeted curve collapses: removing just 28% of hub taxa in Tatoosh Island triggers a 50% community collapse (R50 = 0.28), whereas random loss tolerates 48% removals. Ramkrishna will now present our cross-ecosystem comparative findings.\""),

        ("Speaker 5: Ramkrishna Saha", "Cross-Ecosystem Benchmarks & Empirical Data", "Comparison (/#compare) & Library (/#library)",
         "1. Navigate to Comparison page.\n2. Point to multi-bar charts (Connectance, Link Density, Robustness).\n3. Contrast Tatoosh Island (high connectance) with BCI Tropical Forest (specialized plant-insect).\n4. Switch to Research Library (/#library) -> show Dryad DOIs.",
         "\"Thank you, Sarvdeep. FoodWebGuard does not rely on synthetic toy networks; we benchmark real empirical ecosystems curated from the Dryad repository.\n\n"
         "On this Ecosystem Comparison dashboard, notice the relationship between Directed Connectance (C = L / S^2) and resilience: in high-connectance marine systems like Tatoosh Island (C ≈ 0.072), dietary redundancy buffers against cascades. In contrast, in our 395-species BCI Tropical Forest web, highly specialized plant-insect interactions yield a low connectance (C ≈ 0.002), making specialized branches vulnerable to co-extinction. Every dataset in our Research Library features complete peer-reviewed DOIs and raw adjacency matrices. Chinmay will now demonstrate custom data intake.\""),

        ("Speaker 6: Chinmay Belge", "Data Intake Studio & Academic Report", "Explore Page (/#explore)",
         "1. Click 'Import Dataset' toolbar button.\n2. Point out dedicated slots for Species Nodes CSV and Feeding Links CSV.\n3. Click 'Load Example into Form' -> 'Validate and preview' (0 errors, 0 warnings).\n4. Click 'Import dataset' -> show Chesapeake Estuary rendering on canvas.\n5. Open Academic Report modal -> show KaTeX formulas and adjacency matrix -> click 'Save / Print PDF'.\n6. Click 'Remove Custom' toolbar button to show clean state reset.",
         "\"Thank you, Ramkrishna. A complete engineering system must accept external field data. Our Data Intake Studio provides dedicated slots with real-time biological validation.\n\n"
         "When I load our 14-species Chesapeake Estuary dataset and click 'Validate and preview', the validator confirms 0 errors and 0 warnings. When imported, it renders instantly on canvas. Perturbing Phytoplankton triggers immediate secondary starvation through copepods and oysters.\n\n"
         "Finally, our Academic Report outputs formal KaTeX mathematical equations, directed adjacency matrices, Jaccard overlap matrices, and a cascade audit log. Clicking 'Save / Print PDF' formats this into an unclipped 3-page document. Clicking 'Remove Custom' cleanly restores our baseline ecosystem. FoodWebGuard proves that computational network engineering and conservation can unite seamlessly. Thank you!\""),
    ]

    for spk_name, topic, loc, acts, script in speakers:
        add_h2(f"{spk_name} — {topic}")
        add_body(f"Screen Location: {loc}\nTarget Duration: 2-2.5 Minutes")
        add_body(acts, bold_prefix="Live Action Instructions:\n")
        add_body(script, bold_prefix="Verbatim Spoken Script:\n")
        doc.add_paragraph()

    add_h2("Dr. Rohini Q&A Defense Master Sheet")
    qa_pairs = [
        ("Question 1: 'Why did you choose food webs? What does an engineer have to do with biology?'",
         "Answer: 'Professor, biological food webs are directed networks governed by thermodynamic energy constraints and dependency rules. In computer science and systems engineering, the exact same mathematical percolation models govern electrical power grid blackouts, microservice dependency cascades, and logistics bottlenecks. Studying ecological networks trains engineers in topological resilience and fault-tolerant system design.'"),
        ("Question 2: 'Isn't this project too small / trivial / just a toy UI?'",
         "Answer: 'With respect, Professor, this is an enterprise-grade computational platform backed by 164 automated unit tests in Vitest, 30 headless Chrome browser acceptance tests via Chrome DevTools Protocol with zero console errors, 6 peer-reviewed Dryad datasets with verified DOIs, client-side matrix computations, and the Dunne (2002) percolation model.'"),
        ("Question 3: 'How is this different from Gephi, Cytoscape Desktop, or Python NetworkX?'",
         "Answer: 'Gephi and Cytoscape Desktop are static visualizers that cannot run step-by-step extinction cascade simulations or compute Dunne R50 robustness curves. NetworkX is a headless Python library with no interactive graphical interface. FoodWebGuard integrates visualization, perturbation simulation, timeline explainability, and PDF report generation into a single web application.'"),
        ("Question 4: 'What EXACT formulas calculate secondary extinction?'",
         "Answer: '1. Connectance: C = L / S^2. 2. Link Density: D = L / S. 3. Starvation: A consumer c starves if and only if its active in-degree becomes zero: k_in^active(c) = 0. If k_in >= 1, it switches diet and survives. 4. Basal Exemption: Basal producers have k_in = 0 by definition and are exempt from starvation. 5. Robustness (R50): fraction of primary removals needed to trigger 50% cumulative species loss.'"),
        ("Question 5: 'Why not use dynamic Lotka-Volterra differential equations?'",
         "Answer: 'Lotka-Volterra models require guessing dozens of unmeasured kinetic parameters (handling times, attack rates, carrying capacities), introducing parameter uncertainty. Topological models (Pimm 1979, Dunne 2002, Allesina 2004) isolate pure structural vulnerability from parameter noise, providing the recognized baseline in network ecology.'"),
        ("Question 6: 'Are cannibalistic self-links included?'",
         "Answer: 'Cannibalistic self-links (i -> i) are included in raw topological metrics if recorded by authors, but strictly excluded from the active in-degree calculation during cascade simulations to prevent an organism from surviving indefinitely on itself.'"),
    ]
    for q, a in qa_pairs:
        add_body(a, bold_prefix=f"{q}\n")
        doc.add_paragraph()

    output_path = r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Experiential_Learning_Report.docx"
    doc.save(output_path)
    print(f"Master Experiential Learning Report successfully created at: {output_path}")

if __name__ == '__main__':
    build_perfected_report()
