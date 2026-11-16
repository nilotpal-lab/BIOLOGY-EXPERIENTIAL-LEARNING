import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def add_callout(doc, text, title="PRO-TIP / DEFENSE NOTE", fill_hex="F7F9F5", border_hex="1B4328"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, fill_hex)
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_hex}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run_t = p.add_run(f"[{title}]\n")
    run_t.font.name = 'Times New Roman'
    run_t.font.bold = True
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(0x1B, 0x43, 0x28)
    
    run_b = p.add_run(text)
    run_b.font.name = 'Times New Roman'
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(0x2C, 0x3E, 0x50)
    doc.add_paragraph()

def build_full_report():
    doc = Document()
    
    # 1.0 inch margins to match sample
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)
        sec.page_width = Inches(8.5)
        sec.page_height = Inches(11.0)
        
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    
    base_dir = r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL"
    logo_path = os.path.join(base_dir, "extracted_sample_assets", "image1.png")
    fig_dir = os.path.join(base_dir, "report_figures")

    # =========================================================================
    # COVER PAGE (EXACT JAIN FORMATTING)
    # =========================================================================
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(14)
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(4.8))
    
    p_prog = doc.add_paragraph()
    p_prog.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_prog.paragraph_format.space_after = Pt(2)
    r = p_prog.add_run("B. Tech CSE - IoT")
    r.font.name = 'Calibri'
    r.font.size = Pt(18.5)
    
    p_bio = doc.add_paragraph()
    p_bio.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bio.paragraph_format.space_after = Pt(6)
    r = p_bio.add_run("Biology")
    r.font.name = 'Calibri'
    r.font.size = Pt(16.0)
    
    p_exp = doc.add_paragraph()
    p_exp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_exp.paragraph_format.space_after = Pt(14)
    r = p_exp.add_run("EXPERIENTIAL LEARNING ON")
    r.font.name = 'Calibri'
    r.font.size = Pt(18.0)
    r.font.bold = True
    
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_after = Pt(16)
    r = p_top.add_run("Topic: FoodWebGuard: Algorithmic Modeling of Trophic Network Cascades and Ecosystem Resilience Under In Silico Perturbation")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16.0)
    r.font.bold = True
    
    p_subto = doc.add_paragraph()
    p_subto.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subto.paragraph_format.space_after = Pt(2)
    r = p_subto.add_run("Submitted to")
    r.font.name = 'Calibri'
    r.font.size = Pt(16.0)
    r.font.bold = True
    
    p_prof = doc.add_paragraph()
    p_prof.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_prof.paragraph_format.space_after = Pt(20)
    r = p_prof.add_run("Dr. Rohini")
    r.font.name = 'Calibri'
    r.font.size = Pt(16.0)
    
    p_subby = doc.add_paragraph()
    p_subby.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_subby.paragraph_format.space_after = Pt(4)
    r = p_subby.add_run("Submitted by")
    r.font.name = 'Calibri'
    r.font.size = Pt(14.0)
    r.font.bold = True
    
    # Table 0: Student Roster
    tbl_roster = doc.add_table(rows=7, cols=2)
    tbl_roster.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_roster.autofit = False
    tbl_roster.columns[0].width = Inches(2.2)
    tbl_roster.columns[1].width = Inches(4.3)
    set_table_borders(tbl_roster, color="B0B0B0", sz="4", val="single")
    
    roster_rows = [
        ("USN", "Name"),
        ("25BTRCO001", "Tejas"),
        ("25BTRCO002", "Nilotpal"),
        ("25BTRCO003", "Sanchit"),
        ("25BTRCO004", "Nihal"),
        ("25BTRCO005", "Ram"),
        ("25BTRCO006", "Chinmay"),
    ]
    
    for r_idx, (usn, name) in enumerate(roster_rows):
        row = tbl_roster.rows[r_idx]
        for c_idx, val in enumerate([usn, name]):
            cell = row.cells[c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if r_idx == 0:
                r.font.bold = True
                
    doc.add_page_break()

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    p_toc_head = doc.add_paragraph()
    p_toc_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_head.paragraph_format.space_before = Pt(10)
    p_toc_head.paragraph_format.space_after = Pt(14)
    r = p_toc_head.add_run("Table of Contents")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16.0)
    r.font.bold = True
    
    tbl_toc = doc.add_table(rows=8, cols=3)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_toc.autofit = False
    tbl_toc.columns[0].width = Inches(1.0)
    tbl_toc.columns[1].width = Inches(4.3)
    tbl_toc.columns[2].width = Inches(1.2)
    set_table_borders(tbl_toc, color="B0B0B0", sz="4", val="single")
    
    toc_data = [
        ("Sl.no.", "Title", "Page No."),
        ("1", "Introduction", "1-5"),
        ("2", "Objectives", "6-6"),
        ("3", "Research Methodology", "7-12"),
        ("4", "Results & Experimental Validation", "13-19"),
        ("5", "Conclusion & Engineering Implications", "20-22"),
        ("6", "References", "23-25"),
        ("7", "Appendix: Oral Presentation Script & Defense", "26-33"),
    ]
    
    for r_idx, (sl, tit, pg) in enumerate(toc_data):
        row = tbl_toc.rows[r_idx]
        for c_idx, val in enumerate([sl, tit, pg]):
            cell = row.cells[c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            if r_idx == 0:
                set_cell_background(cell, "EAEAEA")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if r_idx == 0:
                r.font.bold = True
                
    doc.add_page_break()

    # Helper function for adding headings and paragraphs
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(15.0)
        r.font.bold = True
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12.5)
        r.font.bold = True
        return p

    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = 'Times New Roman'
            r_pre.font.size = Pt(10.5)
            r_pre.font.bold = True
        r_txt = p.add_run(text)
        r_txt.font.name = 'Times New Roman'
        r_txt.font.size = Pt(10.5)
        return p

    def add_figure(img_filename, caption_text):
        full_path = os.path.join(fig_dir, img_filename)
        if os.path.exists(full_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(10)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.paragraph_format.keep_with_next = True
            p_img.add_run().add_picture(full_path, width=Inches(6.2))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(12)
            r = p_cap.add_run(caption_text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            r.font.italic = True
            r.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # =========================================================================
    # 1. INTRODUCTION
    # =========================================================================
    add_h1("1. INTRODUCTION")
    add_h2("1.1 Ecological Background & Biological Network Complexity")
    add_body(
        "A foundational challenge in contemporary systems biology and ecological conservation is understanding the structural integrity and cascading fragility of living ecosystems under human-driven and climatic perturbations. Historically, ecological assessment was constrained by anecdotal species counts or phenomenological observations. However, modern community ecology models ecological communities as complex directed dependency graphs, where species represent interacting nodes and directed edges formalize energetic consumer-prey pathways.",
        "The Ecological Fragility Dilemma: "
    )
    add_body(
        "Biological food webs are not unconstrained random graphs; they are strictly governed by the Second Law of Thermodynamics and trophic stratification. Primary producers (photoautotrophs and chemoautotrophs, such as phytoplankton, macroalgae, and vascular plants) fix radiant solar energy or chemical substrates into living biomass. Herbivores, primary consumers, and planktivorous grazers extract this biomass, transferring a fraction of energy upward to intermediate predators, and ultimately to apex carnivores. Because each trophic step incurs metabolic heat dissipation (the Lindeman efficiency limit, ~10%), higher trophic levels depend fundamentally on the uninterrupted basal flux of the foundation tiers.",
        "Thermodynamic Vector of Energy Transfer: "
    )
    add_body(
        "Paine's landmark 1966 experimental intertidal exclusion demonstrated that biological networks possess non-linear sensitivity to specific 'keystone' nodes. The removal of a single high-connectivity or low-redundancy organism can initiate a catastrophic secondary extinction cascade—an avalanche of secondary starvations where dependent consumers lose 100% of their energetic input, triggering multi-tier trophic collapse throughout the ecosystem.",
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
        "A critical debate in computational biology centers on the trade-off between fully parameterized dynamic differential equations (such as Lotka-Volterra or bioenergetic consumer-resource models) versus structural topological models. Dynamic models require estimating dozens of unmeasured kinetic constants for every species—attack rates, handling times, assimilation efficiencies, carrying capacities, and metabolic scaling coefficients. In complex natural ecosystems with dozens or hundreds of taxa, 95% of these constants are unobservable, introducing severe parametric uncertainty and numerical instability. As demonstrated in the seminal work of Dunne, Williams, and Martinez (2002, Proceedings of the National Academy of Sciences), topological percolation models isolate pure structural network vulnerability from parameter guessing, providing an objective, mathematically reproducible baseline for ecosystem fragility.",
        "Topological Percolation vs. Dynamic Parametrization: "
    )

    add_figure(
        "fig1_overview.png",
        "Figure 1: Architectural Overview and System Navigation in FoodWebGuard. The platform integrates interactive graph simulation, sensitivity analytics, cross-ecosystem benchmarks, and an empirical research repository into a unified, zero-install computational environment."
    )

    # =========================================================================
    # 2. OBJECTIVES
    # =========================================================================
    add_h1("2. OBJECTIVES")
    add_body(
        "The overarching aim of this experiential research project was to architect, program, and rigorously benchmark an algorithmic ecosystem resilience platform capable of interactive in silico perturbation, topological cascade simulation, and comparative fragility evaluation across real-world empirical biomes.",
        "Primary Research Aim: "
    )
    add_body("The specific biological and computational objectives of the study were established as follows:")
    
    objectives = [
        ("Objective 1 (Interactive Trophic Stratification): ", "Design and implement a Cytoscape.js rendering engine with custom trophic tier layout algorithms that stratify organisms into horizontal energetic tiers (Basal Autotrophs, Herbivores, Intermediate Predators, Apex Carnivores) with directed links representing thermodynamic energy flow."),
        ("Objective 2 (Deterministic Topological Extinction Engine): ", "Develop a real-time cascade propagation engine that executes in silico species removals and enforces the strict mathematical criterion for secondary starvation (active in-degree = 0) while exempting abiotic basal autotrophs."),
        ("Objective 3 (Temporal Explainability via Cascade Timeline): ", "Create a chronological step-by-step timeline component that breaks down secondary extinction avalanches into discrete causal waves (t = 0 initial perturbation, t = 1 obligate herbivore starvation, t = 2 higher-order carnivore collapse)."),
        ("Objective 4 (Whole-Network Automated Sensitivity Sweep): ", "Construct an automated background calculation worker in the Experiment Studio that removes every single species independently in silico to rank organisms by their Keystone Criticality Index, Secondary Extinction Count, and Connectance Loss."),
        ("Objective 5 (Dunne 2002 Robustness Benchmarking & R50 Evaluation): ", "Formulate and plot empirical network robustness curves under three distinct topological attack vectors (Strategy A: Targeted Hub Attack / Max Degree First; Strategy D: Random Stochastic Extinction; Strategy B: Basal First) and compute the exact R50 percolation metric."),
        ("Objective 6 (Cross-Biome Comparative Empirical Analysis): ", "Benchmark and compare network topology, directed connectance, link density, and fragility metrics across six peer-reviewed empirical ecosystems curated from Dryad research repositories (Tatoosh Island Marine Intertidal, Ythan Estuary, BCI Tropical Forest, Palmyra Atoll Invertebrate Web, and Freshwater Lake Mesocosms)."),
        ("Objective 7 (Dynamic Data Intake Studio & Schema Repair): ", "Engineer a dual-slot in-browser CSV and JSON intake pipeline with client-side biological validation, automated role normalization, and error-prevention checks that allow researchers to upload and simulate custom field data with zero server reliance."),
        ("Objective 8 (Publication-Grade Academic PDF Report Generation): ", "Build an automated mathematical report generator that formats graph metrics, directed adjacency matrices, Jaccard trophic overlap coefficients, and step-by-step cascade audit logs into a clean, unclipped multi-page academic PDF."),
    ]
    for tag, desc in objectives:
        add_body(desc, bold_prefix=tag)

    # =========================================================================
    # 3. RESEARCH METHODOLOGY
    # =========================================================================
    doc.add_page_break()
    add_h1("3. RESEARCH METHODOLOGY")
    add_h2("3.1 Empirical Datasets Curation & Provenance")
    add_body(
        "A rigorous scientific principle of FoodWebGuard is that simulations must not rely on artificial toy networks. We curated six empirical food web datasets from published literature deposited in the Dryad Digital Repository and peer-reviewed journals, spanning marine, freshwater, and terrestrial biomes.",
        "Multi-Biome Empirical Repository: "
    )
    
    # Table 1: Curated Datasets
    tbl_ds = doc.add_table(rows=7, cols=5)
    tbl_ds.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_ds.autofit = False
    tbl_ds.columns[0].width = Inches(1.3)
    tbl_ds.columns[1].width = Inches(1.1)
    tbl_ds.columns[2].width = Inches(0.8)
    tbl_ds.columns[3].width = Inches(0.8)
    tbl_ds.columns[4].width = Inches(2.5)
    set_table_borders(tbl_ds, color="B0B0B0", sz="4", val="single")
    
    ds_headers = ["Dataset ID", "Biome", "Species", "Links", "Scientific Provenance & DOI"]
    for i, h in enumerate(ds_headers):
        cell = tbl_ds.cell(0, i)
        set_cell_background(cell, "EAEAEA")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.font.bold = True
        
    ds_rows = [
        ("MAR-TATOOSH-1", "Marine", "110", "869", "Wootton et al. (2016). Dryad doi:10.5061/dryad.39jv1"),
        ("MAR-YTHAN-1", "Estuary", "87", "373", "Jacob et al. (2005). Ythan Estuary mudflat food web"),
        ("RES-FW-A", "Freshwater", "11", "18", "Zhang et al. (2024). Heated pond mesocosm. Dryad doi:10.5061/dryad.866t1g1zj"),
        ("RES-FW-B", "Freshwater", "14", "39", "Zhang et al. (2024). Ambient pond mesocosm. Dryad doi:10.5061/dryad.866t1g1zj"),
        ("RES-TER-C", "Terrestrial", "395", "322", "Gripenberg et al. (2019). BCI insect seed-predators. Dryad doi:10.5061/dryad.230j5ch"),
        ("RES-TER-D", "Terrestrial", "57", "98", "Miller-ter Kuile et al. (2022). Palmyra Atoll. Dryad doi:10.25349/D9M038"),
    ]
    for r_idx, row_vals in enumerate(ds_rows, start=1):
        for c_idx, val in enumerate(row_vals):
            cell = tbl_ds.cell(r_idx, c_idx)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.0)
            if c_idx == 0:
                r.font.bold = True

    add_body("Table 1: Curated Empirical Food Web Datasets Across Marine, Freshwater, and Terrestrial Biomes.")
    
    add_h2("3.2 Mathematical Formulations & Topological Metrics")
    add_body(
        "To rigorously quantify network architecture and vulnerability, our computational engine computes the following formal topological properties:",
        "Topological Metric Definitions: "
    )
    
    add_body(
        "1. Directed Connectance (C):\n"
        "   C = L / (S^2)\n"
        "   where L is the total count of active directed feeding links, and S is total species count.\n\n"
        "2. Link Density (D):\n"
        "   D = L / S\n\n"
        "3. In-Degree (k_in) and Out-Degree (k_out):\n"
        "   k_in(i) = SUM over j of A[j, i]  (number of prey items consumed by species i)\n"
        "   k_out(i) = SUM over j of A[i, j]  (number of predators that consume species i)\n\n"
        "4. Secondary Extinction Criterion (Topological Starvation Rule):\n"
        "   For any consumer c in NonBasalSpecies, its active in-degree after primary perturbation P is:\n"
        "   k_in^active(c) = SUM over p in (SurvivingPrey) of A[p, c]\n"
        "   If k_in^active(c) == 0, consumer c starves and undergoes secondary extinction.\n"
        "   If k_in^active(c) >= 1, consumer c survives via prey switching.\n\n"
        "5. Basal Autotroph Exemption Rule:\n"
        "   Basal autotrophs (phytoplankton, macrophytes, detritus) have k_in = 0 by definition because they utilize solar or abiotic chemical energy; they are never marked as starved.\n\n"
        "6. Jaccard Trophic Similarity Coefficient:\n"
        "   J(u, v) = |Prey(u) INTERSECT Prey(v)| / |Prey(u) UNION Prey(v)|"
    )

    add_h2("3.3 Dunne et al. (2002) Attack Strategies & Robustness Formulation")
    add_body(
        "To assess ecosystem stability under systematic degradation, FoodWebGuard implements the Dunne et al. (2002) topological attack framework, executing three comparative removal sequences:\n"
        "• Strategy A (Targeted Hub Attack / Max Degree First): Primary removals occur in descending order of total connectivity (k_in + k_out). This models targeted overharvesting or selective exploitation of keystone species.\n"
        "• Strategy D (Random Stochastic Extinction): Primary removals occur in uniformly random order. This models diffuse background mortality or environmental stochasticity.\n"
        "• Strategy B (Basal Species First): Primary removals occur from the bottom of the food web upward, modeling severe habitat loss, acidification, or bottom-up pesticide poisoning.\n\n"
        "The Robustness Metric (R50) is formally defined as the cumulative fraction of primary species removals required to trigger a total loss of 50% of the initial species pool (S_0). An R50 of 0.40 indicates high structural resilience, whereas an R50 below 0.15 denotes acute vulnerability to collapse.",
        "Extinction Sequences & R50 Formulation: "
    )

    add_figure(
        "fig2_explore_trophic.png",
        "Figure 2: Interactive Trophic Network Explorer. Cytoscape.js arranges species into vertical energetic tiers (Basal Autotrophs at bottom to Apex Predators at top). Directed edges indicate biomass flow vectors. The Species Inspector drawer on the right displays local in-degree, out-degree, and ecological role."
    )

    add_figure(
        "fig3_cascade_simulation.png",
        "Figure 3: In Silico Extinction Cascade Simulation. Perturbation of a basal producer triggers secondary starvation waves. Primary removed target is slashed in gray, while starved secondary consumers receive glowing red warning rings. The bottom Cascade Timeline tracks propagation across chronological stages."
    )

    # =========================================================================
    # 4. RESULTS & EXPERIMENTAL VALIDATION
    # =========================================================================
    doc.add_page_break()
    add_h1("4. RESULTS & EXPERIMENTAL VALIDATION")
    add_h2("4.1 Extinction Cascade Dynamics Across Distinct Ecosystems")
    add_body(
        "By simulating topological perturbations across our six empirical ecosystems, we observed stark differences in secondary cascade susceptibility determined by directed connectance and dietary overlap.",
        "Comparative Topological Resilience: "
    )
    
    # Table 2: Benchmark Results
    tbl_res = doc.add_table(rows=7, cols=6)
    tbl_res.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_res.autofit = False
    tbl_res.columns[0].width = Inches(1.3)
    tbl_res.columns[1].width = Inches(0.8)
    tbl_res.columns[2].width = Inches(0.8)
    tbl_res.columns[3].width = Inches(1.0)
    tbl_res.columns[4].width = Inches(1.2)
    tbl_res.columns[5].width = Inches(1.4)
    set_table_borders(tbl_res, color="B0B0B0", sz="4", val="single")
    
    res_headers = ["Dataset ID", "Nodes (S)", "Links (L)", "Connectance (C)", "R50 (Targeted)", "R50 (Random)"]
    for i, h in enumerate(res_headers):
        cell = tbl_res.cell(0, i)
        set_cell_background(cell, "EAEAEA")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.font.bold = True
        
    res_rows = [
        ("MAR-TATOOSH-1", "110", "869", "0.072", "0.28", "0.48"),
        ("MAR-YTHAN-1", "87", "373", "0.049", "0.22", "0.44"),
        ("RES-FW-A", "11", "18", "0.149", "0.18", "0.36"),
        ("RES-FW-B", "14", "39", "0.199", "0.24", "0.42"),
        ("RES-TER-C", "395", "322", "0.002", "0.04", "0.21"),
        ("RES-TER-D", "57", "98", "0.030", "0.19", "0.39"),
    ]
    for r_idx, row_vals in enumerate(res_rows, start=1):
        for c_idx, val in enumerate(row_vals):
            cell = tbl_res.cell(r_idx, c_idx)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.0)
            if c_idx == 0:
                r.font.bold = True

    add_body("Table 2: Comparative Network Topology and Dunne (2002) Robustness (R50) Metrics Across Empirical Ecosystems.")

    add_h2("4.2 Dunne (2002) Robustness Evaluation & Percolation Curves")
    add_body(
        "Figure 4 portrays the empirical extinction curves generated in the Network Robustness Lab. Across all evaluated ecosystems, the targeted hub attack curve (Strategy A, red) demonstrates acute non-linear collapse compared to random loss (Strategy D, blue). In Tatoosh Island (S=110), removing the top 28% most-connected hub taxa precipitates a 50% collapse of total community richness, whereas under random loss, the ecosystem tolerates up to 48% removals before reaching the R50 threshold.",
        "Hub Vulnerability vs. Random Resilience: "
    )

    add_figure(
        "fig5_dunne_robustness.png",
        "Figure 4: Dunne et al. (2002) Network Robustness Lab. Recharts plots cumulative species removals against surviving richness across Strategy A (Targeted Hub Attack, red) versus Strategy D (Random Extinction, blue). The calculated R50 metric provides an objective index of structural resilience."
    )

    add_h2("4.3 Whole-Network Sensitivity Analysis & Keystone Species Ranking")
    add_body(
        "The automated sensitivity scan in the Experiment Studio perturbates every node in the active food web to rank taxa by their system-wide impact. In marine mudflat networks, predatory birds and benthic microalgae emerge with high keystone criticality: while microalgae sustain extensive herbivorous grazers, top piscivores govern trophic balance.",
        "System-Wide Sensitivity Scanning: "
    )

    add_figure(
        "fig4_sensitivity_ranking.png",
        "Figure 5: Whole-Network Sensitivity Scan in Experiment Studio. An automated worker executes independent single-node removals across all species, ranking organisms by Keystone Criticality Index, Secondary Extinction Count, and Connectance Loss."
    )

    add_figure(
        "fig6_ecosystem_comparison.png",
        "Figure 6: Cross-Ecosystem Comparative Dashboard. Multi-metric bar charts benchmark Directed Connectance, Link Density, and Cascade Fragility across marine, freshwater, and terrestrial biomes."
    )

    add_h2("4.4 Data Intake Studio & Chesapeake Estuary Case Study")
    add_body(
        "To confirm the system's extensibility beyond built-in datasets, we validated a custom 14-species, 26-link Chesapeake Estuarine Marsh Food Web through the Data Intake Studio. The dual-slot CSV pipeline parsed Species Nodes (id, name, trophic_role, scientific_name, icon_key) and Feeding Links (source, target, relationship) with 0 errors and 0 warnings, immediately rendering the active network on canvas.",
        "Live Ingestion Verification: "
    )

    add_figure(
        "fig7_data_intake_import.png",
        "Figure 7: Data Intake Studio with Dual-Slot File Intake. Dedicated upload slots for Species Nodes CSV and Feeding Links CSV provide real-time validation badges and schema checking before committing datasets to active application state."
    )

    add_figure(
        "fig8_academic_report.png",
        "Figure 8: Academic Mathematical Report Modal. Features publication-grade KaTeX mathematical formatting, directed adjacency matrices, Jaccard trophic similarity matrices, and step-by-step cascade audit logs with unclipped multi-page PDF generation."
    )

    # =========================================================================
    # 5. CONCLUSION & ENGINEERING IMPLICATIONS
    # =========================================================================
    doc.add_page_break()
    add_h1("5. CONCLUSION & ENGINEERING IMPLICATIONS")
    add_h2("5.1 Synthesis of Scientific Contributions")
    add_body(
        "This experiential learning project successfully establishes that biological network resilience can be modeled, quantified, and benchmarked using rigorous computational graph engineering. By synthesizing Dunne et al. (2002) percolation theory with Cytoscape.js rendering, in-browser mathematical report generation, and robust schema intake, FoodWebGuard bridges high-level systems engineering with ecological biology.",
        "Bridging Systems Engineering and Conservation: "
    )

    add_h2("5.2 Real-World Conservation & Systems Engineering Translation")
    add_body(
        "1. Keystone-Targeted Conservation Triage: Traditional conservation allocates resources based on charismatic megafauna or direct commercial value. FoodWebGuard enables conservation biologists to identify 'cryptic keystone' species—organisms with modest biomass but high topological centrality whose loss triggers multi-tier cascading extinctions.\n\n"
        "2. Infrastructure Resilience Analogy: The algorithmic principles of dietary redundancy buffering food webs against cascades directly inform fault-tolerant microservice architectures, power distribution grids, and logistics supply chains, proving that ecological principles offer valuable blueprints for resilient systems engineering.",
        "Translational Impact: "
    )

    add_h2("5.3 Experiential Learning Takeaways for Biology & Engineering Students")
    add_body(
        "• Biological Rigor over AI Slop: Computational models cannot treat biology as an abstract black box; they must respect fundamental thermodynamic constraints, Lindeman efficiency, and trophic roles.\n"
        "• Architectural Robustness: Developing 164 automated unit tests and 30 end-to-end browser acceptance workflows demonstrated the engineering discipline required to ensure calculation fidelity.\n"
        "• Explainability Matters: Non-expert stakeholders require temporal explainability (such as our Cascade Timeline) rather than unexplainable numerical scores.",
        "Key Educational Insights: "
    )

    # =========================================================================
    # 6. REFERENCES
    # =========================================================================
    doc.add_page_break()
    add_h1("6. REFERENCES")
    
    refs = [
        "[1] Dunne, J.A., Williams, R.J., and Martinez, N.D. (2002). Network structure and biodiversity loss in food webs: robustness increases with connectance. Proceedings of the National Academy of Sciences 99(20), 12917-12922. https://doi.org/10.1073/pnas.192407699",
        "[2] Pimm, S.L. (1979). The structure of food webs. Theoretical Population Biology 16(2), 144-158.",
        "[3] Paine, R.T. (1966). Food web complexity and species diversity. The American Naturalist 100(910), 65-75.",
        "[4] Wootton, J.T., Sander, E.L., and Allesina, S. (2016). Data from: What can interaction webs tell us about species roles? Dryad Digital Repository. https://doi.org/10.5061/dryad.39jv1",
        "[5] Zhang, P., Zhang, H., and Xu, J. (2024). Multiple stressors simplify freshwater food webs. Dryad Digital Repository. https://doi.org/10.5061/dryad.866t1g1zj",
        "[6] Baird, D., and Ulanowicz, R.E. (1989). The seasonal dynamics of the Chesapeake Bay ecosystem. Ecological Monographs 59(4), 329-364.",
        "[7] Gripenberg, S., et al. (2019). A highly-resolved food web for insect seed predators in a species-rich tropical forest. Dryad Digital Repository. https://doi.org/10.5061/dryad.230j5ch",
        "[8] Miller-ter Kuile, A., et al. (2022). Predator-prey interactions of terrestrial invertebrates are determined by predator body size and species identity. Dryad Digital Repository. https://doi.org/10.25349/D9M038",
        "[9] Martinez, N.D., Hawkins, B.A., Dawah, H.A., and Feifarek, B.P. (1999). Effects of sampling effort on characterization of food-web structure. Ecology 80(3), 1044-1055.",
        "[10] Allesina, S., and Bodini, A. (2004). Who dominates whom in the ecosystem? Energy flow bottlenecks and trophic dominance. Journal of Theoretical Biology 230(3), 351-358.",
    ]
    for r_txt in refs:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.space_before = Pt(0)
        p_r.paragraph_format.space_after = Pt(4)
        p_r.paragraph_format.line_spacing = 1.15
        r = p_r.add_run(r_txt)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)

    # =========================================================================
    # 7. APPENDIX: LIVE ORAL SCRIPT & PROFESSOR DEFENSE MASTER GUIDE
    # =========================================================================
    doc.add_page_break()
    add_h1("7. APPENDIX: LIVE ORAL SCRIPT & PROFESSOR DEFENSE")
    add_body(
        "This appendix contains the verbatim speaking script divided across all 6 presenters, accompanied by exact on-screen visual click instructions and a battle-tested defense guide against critical evaluation questions.",
        "Presentation Handbook: "
    )
    
    speakers = [
        ("Speaker 1: Tejas", "Overview & Engineering Analogy", "Home / Overview (/#overview)",
         "1. Start on Overview page showing hero header.\n2. Scroll through feature cards.\n3. Highlight engineering network analogy.\n4. Click 'Explore & Simulate' on left sidebar and pass to Nilotpal.",
         "\"Respected Professor and dear colleagues, good morning. Today, our team presents FoodWebGuard — an algorithmic ecosystem resilience platform developed for our Biology for Engineers experiential learning project.\n\n"
         "Why should engineering students study food webs? In software and electrical engineering, we study electrical power grids and microservice dependency trees to prevent single-point-of-failure blackouts. Biological food webs are directed energy-transfer networks. If a keystone node is removed, it triggers a non-linear topological cascade of secondary starvations throughout the ecosystem.\n\n"
         "Unlike static visualization tools, FoodWebGuard is an in silico perturbation laboratory combining Dunne (2002) percolation theory with high-performance graph computing to simulate secondary extinction waves in real time. Nilotpal will now demonstrate our interactive graph engine.\""),
         
        ("Speaker 2: Nilotpal", "Graph Architecture & Trophic Tiers", "Explore & Simulate (/#explore)",
         "1. Click 'Trophic Layout' button on toolbar.\n2. Click 'Force Layout' briefly, then snap back to 'Trophic Layout'.\n3. Click on a species node (e.g. Platichthys flesus or Mytilus).\n4. Point out Species Inspector drawer (in-degree, out-degree, role).",
         "\"Thank you, Tejas. We are now inside our primary simulation workspace, powered by Cytoscape.js.\n\n"
         "When I click 'Trophic Layout', our layout algorithm stratifies organisms into vertical energetic tiers: Basal Autotrophs at the bottom tier, Primary and Secondary Consumers in the middle, and Apex Predators at the top. Notice link arrows point from prey to predator, representing the thermodynamic vector of biomass and energy flow.\n\n"
         "Inspecting a node reveals its local topological signature: in-degree (prey items consumed), out-degree (predators consuming it), and verified trophic role. Sanchit will now demonstrate what happens when a node is removed.\""),
         
        ("Speaker 3: Sanchit", "Extinction Cascade Simulation & Timeline", "Explore & Simulate (/#explore)",
         "1. Select a basal producer.\n2. Click 'Run Simulation'.\n3. Point out primary slashed target and glowing red secondary extinction rings.\n4. Open Cascade Timeline to step through t = 0, 1, 2.\n5. Click 'Reset Simulation' to demonstrate zero-leakage state restoration.",
         "\"Thank you, Nilotpal. Here we see the core computational engine of FoodWebGuard: Mathematical Cascade Propagation.\n\n"
         "How is secondary extinction mathematically defined? A consumer species starves if and only if 100% of its documented prey items are eradicated (k_in^active = 0). If at least one prey survives, it switches diet. Watch: when I remove this producer, the primary target is slashed in gray, and dependent consumers receive red warning rings.\n\n"
         "Our Cascade Timeline provides temporal explainability: Step 0 is primary removal, Step 1 is primary starvation, and Step 2 is tertiary collapse. Notice the canvas remains clean and unobstructed. Clicking 'Reset Simulation' instantly restores the baseline. Nihal will now show our macro-level sensitivity analytics.\""),
         
        ("Speaker 4: Nihal", "Sensitivity Sweep & Dunne Robustness (R50)", "Experiment Studio (/#experiment)",
         "1. Navigate to Experiment Studio.\n2. Point to Rankings Table (keystone criticality scores).\n3. Switch to 'Network Robustness Lab (Dunne 2002)' tab.\n4. Compare Targeted Hub Attack (red) vs. Random Extinction (blue) curves.\n5. Highlight the R50 metric badge.",
         "\"Thank you, Sanchit. In individual simulations, we test species one by one. But an environmental engineer needs macro-level predictive analytics. In our Experiment Studio, an automated worker removes every species independently in silico, ranking organisms by Keystone Criticality Score and secondary extinction damage.\n\n"
         "Switching to the Dunne (2002) Robustness Lab, this chart plots cumulative removals against surviving richness across two attack vectors: Strategy A (Targeted Hub Attack, red curve) causes steep, catastrophic collapse, while Strategy D (Random Extinctions, blue curve) reveals community resilience. Right here, the R50 metric quantifies the exact percentage of species loss required to trigger a 50% community collapse. Ram will now show how this robustness changes across biomes.\""),
         
        ("Speaker 5: Ram", "Cross-Ecosystem Benchmarks & Empirical Data", "Comparison (/#compare) & Library (/#library)",
         "1. Navigate to Comparison page.\n2. Point to multi-bar charts comparing Directed Connectance (C = L / S^2).\n3. Compare Tatoosh Island (marine, C = 0.072) vs. BCI Tropical Forest (terrestrial, C = 0.002).\n4. Open Data Library to show Dryad repository citations and DOIs.",
         "\"Thank you, Nihal. FoodWebGuard does not rely on synthetic toy networks; we benchmark real empirical ecosystems curated from the Dryad repository.\n\n"
         "On this Ecosystem Comparison dashboard, notice the relationship between Directed Connectance (C = L / S^2) and resilience: in high-connectance marine systems like Tatoosh Island (C ≈ 0.072), dietary redundancy buffers against cascades. In contrast, in our 395-species BCI Tropical Forest web, highly specialized plant-insect interactions yield a low connectance (C ≈ 0.002), making specialized branches vulnerable to co-extinction. Every dataset in our Research Library features complete peer-reviewed DOIs and raw adjacency matrices. Chinmay will now demonstrate custom data intake.\""),
         
        ("Speaker 6: Chinmay", "Data Intake Studio & Academic Report", "Explore Page (/#explore)",
         "1. Click 'Import Dataset' toolbar button.\n2. Point out dedicated slots for Species Nodes CSV and Feeding Links CSV.\n3. Click 'Load Example into Form' -> 'Validate and preview' (0 errors, 0 warnings).\n4. Click 'Import dataset' -> show Chesapeake Estuary rendering on canvas.\n5. Open Academic Report modal -> show KaTeX formulas and adjacency matrix -> click 'Save / Print PDF'.\n6. Click 'Remove Custom' toolbar button to show clean state reset.",
         "\"Thank you, Ram. A complete engineering system must accept external field data. Our Data Intake Studio provides dedicated slots with real-time biological validation.\n\n"
         "When I load our 14-species Chesapeake Estuary dataset and click 'Validate and preview', the validator confirms 0 errors and 0 warnings. When imported, it renders instantly on canvas. Perturbing Phytoplankton triggers immediate secondary starvation through copepods and oysters.\n\n"
         "Finally, our Academic Report outputs formal KaTeX mathematical equations, directed adjacency matrices, Jaccard overlap matrices, and a cascade audit log. Clicking 'Save / Print PDF' formats this into an unclipped 3-page document. Clicking 'Remove Custom' cleanly restores our baseline ecosystem. FoodWebGuard proves that computational network engineering and conservation can unite seamlessly. Thank you!\""),
    ]
    
    for spk_name, topic, loc, acts, script in speakers:
        add_h2(f"{spk_name} — {topic}")
        add_body(f"Screen Location: {loc}\nTarget Duration: 2-2.5 Minutes")
        add_body(acts, bold_prefix="Live Action Instructions:\n")
        add_body(script, bold_prefix="Verbatim Spoken Script:\n")
        doc.add_paragraph() # Spacing

    add_h2("Dr. Rohini Q&A Defense Master Sheet")
    qa_pairs = [
        ("Question 1: 'Why did you choose food webs? What does an engineer have to do with biology?'",
         "Answer: 'Professor, biological food webs are directed networks governed by thermodynamic energy constraints and dependency rules. In computer science and systems engineering, the exact same mathematical percolation models govern electrical power grid blackouts, microservice dependency cascades, and logistics bottlenecks. Studying ecological networks trains engineers in topological resilience and fault-tolerant system design.'"),
        ("Question 2: 'Isn't this project too small / trivial / just a toy UI?'",
         "Answer: 'With respect, Professor, this is an enterprise-grade computational platform backed by 164 automated unit tests in Vitest, 30 headless Chrome browser acceptance tests via Chrome DevTools Protocol with zero console errors, 6 peer-reviewed Dryad datasets with verified DOIs, client-side matrix computations, and the Dunne (2002) percolation model.'"),
        ("Question 3: 'How is this different from Gephi, Cytoscape Desktop, or Python NetworkX?'",
         "Answer: 'Gephi and Cytoscape Desktop are static visualizers that cannot run step-by-step extinction cascade simulations or compute Dunne R50 robustness curves. NetworkX is a headless Python library with no interactive graphical interface. FoodWebGuard integrates visualization, perturbation simulation, timeline explainability, and PDF report generation into a single web application.'"),
        ("Question 4: 'What EXACT formulas calculate secondary extinction?'",
         "Answer: '1. Connectance: C = L / S^2. 2. Link Density: D = L / S. 3. Starvation: A consumer c starves if and only if its active in-degree becomes zero: k_in^active(c) = SUM over surviving prey of A[p, c] = 0. If k_in >= 1, it switches diet and survives. 4. Basal Exemption: Basal producers have k_in = 0 by definition and are exempt from starvation. 5. Robustness (R50): fraction of primary removals needed to trigger 50% cumulative species loss.'"),
        ("Question 5: 'Why not use dynamic Lotka-Volterra differential equations?'",
         "Answer: 'Lotka-Volterra models require guessing dozens of unmeasured kinetic parameters (handling times, attack rates, carrying capacities), introducing parameter uncertainty. Topological models (Pimm 1979, Dunne 2002, Allesina 2004) isolate pure structural vulnerability from parameter noise, providing the recognized baseline in network ecology.'"),
        ("Question 6: 'Are cannibalistic self-links included?'",
         "Answer: 'Cannibalistic self-links (i -> i) are included in raw topological metrics if recorded by authors, but strictly excluded from the active in-degree calculation during cascade simulations to prevent an organism from surviving indefinitely on itself.'"),
    ]
    for q, a in qa_pairs:
        add_body(a, bold_prefix=f"{q}\n")
        doc.add_paragraph()

    output_path = os.path.join(base_dir, "FoodWebGuard_Experiential_Learning_Report.docx")
    doc.save(output_path)
    print(f"Master Experiential Learning Report successfully created at: {output_path}")

if __name__ == "__main__":
    build_full_report()
