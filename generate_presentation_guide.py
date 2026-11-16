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

def add_callout(doc, text, title="PRO-TIP / DEFENSE NOTE", fill_hex="F4F6F0", border_hex="2D5A27"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, fill_hex)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    # Left border only
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
    run_t.font.bold = True
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(0x1E, 0x4D, 0x2B)
    
    run_b = p.add_run(text)
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(0x2C, 0x3E, 0x50)
    doc.add_paragraph() # Spacing

def build_document():
    doc = Document()
    
    # Set standard margins (0.75 in)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    
    # ==========================================
    # COVER / HEADER
    # ==========================================
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(4)
    p_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("FoodWebGuard: Computational Ecosystem Resilience & Extinction Cascade Platform")
    r_title.font.name = 'Georgia'
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1B, 0x43, 0x28) # Deep Forest Green
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    p_sub.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Biology for Engineers (Experiential Learning Project) · Jain (Deemed-to-be University)\nComplete 6-Speaker Live Presentation Script & Professor Defense Master Guide")
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)
    
    # Team Roster Table
    tbl_roster = doc.add_table(rows=7, cols=3)
    tbl_roster.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_roster.columns[0].width = Inches(1.3)
    tbl_roster.columns[1].width = Inches(2.2)
    tbl_roster.columns[2].width = Inches(3.0)
    
    headers = ["Speaker Position", "Team Member", "Assigned Topic & Screen Module"]
    for i, h in enumerate(headers):
        cell = tbl_roster.cell(0, i)
        set_cell_background(cell, "1B4328")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        
    roster_data = [
        ("Speaker 1", "Tejas", "Project Overview, Biological Motivation & Engineering Isomorphism"),
        ("Speaker 2", "Nilotpal", "Graph Architecture, Topological Tiers & Interactive Cytoscape Inspection"),
        ("Speaker 3", "Sanchit", "Extinction Cascade Simulation Engine, Multi-Step Waves & Timeline"),
        ("Speaker 4", "Nihal", "Sensitivity Analysis, Dunne (2002) Robustness (R50) & Attack Strategies"),
        ("Speaker 5", "Ram", "Cross-Ecosystem Benchmarks & Empirical Dryad Research Datasets"),
        ("Speaker 6", "Chinmay", "Data Intake Studio (Live CSV/JSON Import) & Academic PDF Report"),
    ]
    
    for row_idx, (pos, name, topic) in enumerate(roster_data, start=1):
        bg = "F7F9F5" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([pos, name, topic]):
            cell = tbl_roster.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(10)
            if col_idx == 1:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x1B, 0x43, 0x28)
                
    doc.add_paragraph() # Spacing
    
    add_callout(
        doc,
        "HOW TO USE THIS SCRIPT:\n"
        "• Each speaker has an exact screen setup, exact click instructions, and word-for-word spoken lines.\n"
        "• Action cues are marked in bold brackets like [CLICK: Trophic Layout] or [HOVER: Species Node].\n"
        "• Speak clearly, maintain eye contact with the professor, and perform the live clicks exactly as scripted.\n"
        "• The dev server is live at: http://localhost:5173/ (Press F11 for full-screen mode).",
        title="INSTRUCTIONS FOR ALL 6 PRESENTERS",
        fill_hex="EBF3EA",
        border_hex="1B4328"
    )
    
    # ==========================================
    # SECTION 1: SPEAKER-BY-SPEAKER DETAILED SCRIPTS
    # ==========================================
    doc.add_heading("PART 1: Step-by-Step Live Presentation Script", level=1)
    
    # ----------------------------------------------------
    # SPEAKER 1: TEJAS
    # ----------------------------------------------------
    h2 = doc.add_heading("Speaker 1: Tejas — Introduction, Biological Motivation & Engineering Bridge", level=2)
    h2.paragraph_format.space_before = Pt(12)
    
    p = doc.add_paragraph()
    p.add_run("Screen Location: ").bold = True
    p.add_run("Home / Overview Page (")
    p.add_run("http://localhost:5173/#overview").italic = True
    p.add_run(")\n")
    p.add_run("Target Duration: ").bold = True
    p.add_run("2 Minutes\n")
    p.add_run("Core Mission: ").bold = True
    p.add_run("Hook the professor immediately. Establish why an engineering student is studying ecological food webs, frame food webs as complex dependency networks, and state the core problem of cascading failure.")
    
    p_step = doc.add_paragraph()
    p_step.add_run("Live Visual Steps (What to do on screen):\n").bold = True
    p_step.add_run("1. Start on the Overview page showing the hero header: 'Explore. Simulate. Understand Ecosystems.'\n"
                   "2. Scroll smoothly down to the 4 workflow cards: Network Explorer, Experiment Studio, Cross-Ecosystem Insights, and Data Library.\n"
                   "3. Hover over the metric counters showing verified research networks (Tatoosh Island, Ythan Estuary, etc.).\n"
                   "4. Transition: Click 'Explore & Simulate' on the left navigation sidebar and pass to Nilotpal.")
    
    doc.add_heading("Verbatim Spoken Script for Tejas:", level=3)
    p_speech = doc.add_paragraph()
    p_speech.paragraph_format.line_spacing = 1.15
    p_speech.add_run(
        "\"Respected Professor and dear colleagues, good morning.\n\n"
        "Today, our team presents FoodWebGuard — an algorithmic ecosystem resilience and extinction cascade platform developed for our Biology for Engineers experiential learning project.\n\n"
        "[GESTURE TO SCREEN: Overview Page]\n"
        "At first glance, one might ask: Why should engineering students study marine intertidal zones, freshwater ponds, and tropical food webs? \n\n"
        "The answer lies in Network Architecture and System Reliability. In software and electrical engineering, we analyze electrical grids, distributed microservice architectures, and packet routing networks to prevent single-point-of-failure blackouts. \n\n"
        "In nature, biological food webs are directed energy-transfer networks. Primary producers convert solar energy into biomass, which flows upward through herbivores, intermediate predators, and apex predators. If a keystone node is removed—whether through climate disruption, chemical contamination, or overharvesting—the loss does not stay isolated. It triggers a non-linear topological cascade of secondary starvations throughout the ecosystem.\n\n"
        "[SCROLL TO FEATURE MODULES]\n"
        "To model this rigorously, we built FoodWebGuard. Unlike static visualization packages, our platform is a deterministic in silico perturbation laboratory. It combines topological percolation theory from Dunne et al. (2002) with high-performance graph computing to simulate, quantify, and benchmark secondary extinction waves in real-time.\n\n"
        "[CLICK: Left Sidebar -> 'Explore & Simulate']\n"
        "I will now invite Nilotpal to demonstrate the interactive graph engine and structural hierarchy of these networks.\""
    )
    
    # ----------------------------------------------------
    # SPEAKER 2: NILOTPAL
    # ----------------------------------------------------
    h2 = doc.add_heading("Speaker 2: Nilotpal — Graph Topology, Trophic Stratification & Inspection", level=2)
    h2.paragraph_format.space_before = Pt(14)
    
    p = doc.add_paragraph()
    p.add_run("Screen Location: ").bold = True
    p.add_run("Explore & Simulate Page (")
    p.add_run("http://localhost:5173/#explore").italic = True
    p.add_run(")\n")
    p.add_run("Target Duration: ").bold = True
    p.add_run("2 Minutes\n")
    p.add_run("Core Mission: ").bold = True
    p.add_run("Explain how Cytoscape.js renders the food web, explain the directionality of links (Prey -> Predator), show the difference between Force layout and Trophic Tiers, and inspect a specific organism.")
    
    p_step = doc.add_paragraph()
    p_step.add_run("Live Visual Steps (What to do on screen):\n").bold = True
    p_step.add_run("1. Ensure dataset is set to Tatoosh Island (or Freshwater Pond) via the top selector.\n"
                   "2. Click the 'Trophic Layout' button in the toolbar — show how nodes snap into horizontal trophic tiers.\n"
                   "3. Click 'Force Layout' briefly to show dynamic organic clustering, then click back to 'Trophic Layout'.\n"
                   "4. Click on an intermediate consumer organism (e.g., 'Thais' snail or 'Platichthys flesus' flounder).\n"
                   "5. Point out the right-hand Species Inspector drawer showing In-degree, Out-degree, and Trophic Role.\n"
                   "6. Transition: Hand over to Sanchit to execute the extinction perturbation.")
    
    doc.add_heading("Verbatim Spoken Script for Nilotpal:", level=3)
    p_speech = doc.add_paragraph()
    p_speech.paragraph_format.line_spacing = 1.15
    p_speech.add_run(
        "\"Thank you, Tejas.\n\n"
        "[ACTION: Point to Graph Canvas]\n"
        "We are now inside the primary simulation workspace. This interactive canvas is powered by Cytoscape.js, customized specifically for directed trophic graphs.\n\n"
        "[CLICK: 'Trophic Layout' Button]\n"
        "In ecological graph theory, spatial organization is paramount. When I click 'Trophic Layout', our custom layout algorithm stratifies the species into vertical trophic tiers:\n"
        "• At the bottom tier, we have Basal Autotrophs: phytoplankton, macroalgae, and detrital resources that fix energy.\n"
        "• In the middle tiers, we have Primary and Secondary Consumers: zooplankton, mollusks, crustaceans, and forage fish.\n"
        "• At the top tier, we have Apex Predators: raptors, large marine piscivores, and wading birds.\n\n"
        "[HOVER OVER A DIRECTED ARROW]\n"
        "Notice the link directionality. Following standard ecological conventions, our directed edges point from the prey organism to the predator organism. This represents the thermodynamic vector of biomass and energy flow (source = food, target = consumer).\n\n"
        "[CLICK ON A SPECIES NODE: e.g. Platichthys flesus or Mytilus]\n"
        "When I inspect a specific node, the Species Inspector panel reveals its local topological signature:\n"
        "• In-degree (k_in): The number of active prey resources this organism consumes.\n"
        "• Out-degree (k_out): The number of higher-order predators that prey upon this organism.\n"
        "• Trophic Role: Verified against biological literature.\n\n"
        "Now, what happens if one of these critical nodes disappears from the ecosystem? Sanchit will now demonstrate our real-time cascade simulation engine.\""
    )
    
    # ----------------------------------------------------
    # SPEAKER 3: SANCHIT
    # ----------------------------------------------------
    h2 = doc.add_heading("Speaker 3: Sanchit — Extinction Cascade Engine, Secondary Loss & Timeline", level=2)
    h2.paragraph_format.space_before = Pt(14)
    
    p = doc.add_paragraph()
    p.add_run("Screen Location: ").bold = True
    p.add_run("Explore & Simulate Page (")
    p.add_run("http://localhost:5173/#explore").italic = True
    p.add_run(")\n")
    p.add_run("Target Duration: ").bold = True
    p.add_run("2.5 Minutes\n")
    p.add_run("Core Mission: ").bold = True
    p.add_run("Explain the exact mathematical criterion for secondary extinction (in-degree active = 0). Run a live species removal, show the cascade warning rings on the canvas, walk through the Cascade Timeline step-by-step, and show that the canvas remains clean and unobstructed.")
    
    p_step = doc.add_paragraph()
    p_step.add_run("Live Visual Steps (What to do on screen):\n").bold = True
    p_step.add_run("1. Select a basal producer or keystone species (e.g., Phytoplankton or Macrophytes).\n"
                   "2. Ensure simulation mode is set to 'Cascade (Secondary extinctions enabled)'.\n"
                   "3. Click the green 'Run Simulation' button.\n"
                   "4. Observe: The directly removed species turns gray/striped. Secondary starved species get glowing red warning rings.\n"
                   "5. Point to the top status bar: Notice the summary (e.g., '-1 primary, -4 secondary, connectance change').\n"
                   "6. Click on the 'Cascade Timeline' component at the bottom of the canvas: Step through Step 0 (Removal), Step 1 (Primary Starvation), and Step 2 (Tertiary Collapse).\n"
                   "7. Point out: The view is completely clean—no ugly popups blocking the graph canvas!\n"
                   "8. Click 'Reset Simulation' to show clean zero-leakage state restoration, then hand over to Nihal.")
    
    doc.add_heading("Verbatim Spoken Script for Sanchit:", level=3)
    p_speech = doc.add_paragraph()
    p_speech.paragraph_format.line_spacing = 1.15
    p_speech.add_run(
        "\"Thank you, Nilotpal.\n\n"
        "Now we arrive at the core computational engine of FoodWebGuard: Mathematical Cascade Propagation.\n\n"
        "[EXPLAIN FORMULA / LOGIC CLEARLY]\n"
        "How do we scientifically define a secondary extinction? \n"
        "In our engine, we implement the strict topological starvation rule established in the ecological literature. A consumer species survives if and only if its active in-degree is greater than or equal to 1. That is, as long as it has at least one surviving prey item, it can switch its diet. However, if 100% of its documented prey items are eradicated, its active in-degree drops to zero (k_in^active = 0). At that moment, the organism starves and undergoes secondary extinction.\n\n"
        "[ACTION: SELECT A BASAL PRODUCER -> CLICK 'Run Simulation']\n"
        "Watch what happens when I remove this basal producer:\n"
        "• Instantly, the graph calculates the perturbation.\n"
        "• The initial target is marked with a gray slash.\n"
        "• Notice these red glowing nodes? These organisms were never touched directly! They died because their sole food resources collapsed beneath them.\n\n"
        "[ACTION: CLICK ON CASCADE TIMELINE]\n"
        "To provide full temporal explainability for biological research, our platform features this Cascade Timeline:\n"
        "• Step t = 0: Initial primary removal of the producer.\n"
        "• Step t = 1: First-wave obligate herbivores lose their sole food source and starve.\n"
        "• Step t = 2: Higher-order carnivores that preyed exclusively on those herbivores now collapse.\n\n"
        "[HIGHLIGHT CLEAN UI DESIGN]\n"
        "Notice that our simulation feedback is completely unobtrusive: the metric chips remain at the top, leaving the graph fully interactive for the researcher, without any cluttered dialogs obscuring the nodes.\n\n"
        "[CLICK: 'Reset Simulation']\n"
        "With one click, our state machine restores the baseline network with zero state contamination. But what if we want to know which species in the entire ecosystem is the most dangerous to lose? Nihal will now show our Experiment Studio.\""
    )
    
    # ----------------------------------------------------
    # SPEAKER 4: NIHAL
    # ----------------------------------------------------
    h2 = doc.add_heading("Speaker 4: Nihal — Whole-Network Sensitivity & Dunne (2002) Robustness (R50)", level=2)
    h2.paragraph_format.space_before = Pt(14)
    
    p = doc.add_paragraph()
    p.add_run("Screen Location: ").bold = True
    p.add_run("Experiment Studio Page (")
    p.add_run("http://localhost:5173/#experiment").italic = True
    p.add_run(")\n")
    p.add_run("Target Duration: ").bold = True
    p.add_run("2.5 Minutes\n")
    p.add_run("Core Mission: ").bold = True
    p.add_run("Demonstrate whole-network sensitivity scanning (ranking every species by keystone impact). Then switch to the Network Robustness Lab tab and explain the Dunne et al. (2002) R50 percolation curves under targeted vs. random attacks.")
    
    p_step = doc.add_paragraph()
    p_step.add_run("Live Visual Steps (What to do on screen):\n").bold = True
    p_step.add_run("1. Click 'Experiment Studio' in the left navigation sidebar.\n"
                   "2. Point to the Sensitivity Ranking Table: Show how all species are ranked by Cascade Depth, Secondary Extinctions, and Keystone Index.\n"
                   "3. Type a query into the search box or filter by 'producer' / 'apex-predator'.\n"
                   "4. Click on the second tab: 'Network Robustness Lab (Dunne 2002)'.\n"
                   "5. Point to the Recharts Extinction Curve: Compare Strategy A (Max Degree First / Hub Attack) vs. Strategy D (Random Extinctions).\n"
                   "6. Highlight the R50 metric badge on screen (e.g., R50 = 0.38).\n"
                   "7. Transition: Hand over to Ram for cross-ecosystem comparative benchmarks.")
    
    doc.add_heading("Verbatim Spoken Script for Nihal:", level=3)
    p_speech = doc.add_paragraph()
    p_speech.paragraph_format.line_spacing = 1.15
    p_speech.add_run(
        "\"Thank you, Sanchit.\n\n"
        "[CLICK: 'Experiment Studio' in Navigation]\n"
        "In individual simulations, we test species one by one. But an environmental engineer or policy planner needs macro-level predictive analytics. That is what our Experiment Studio provides.\n\n"
        "[POINT TO RANKINGS TABLE]\n"
        "Here, our background calculation worker executes an automated sensitivity scan: it removes every single species independently in silico and quantifies the system-wide damage. \n"
        "We rank every organism by its Keystone Criticality Score, secondary extinction count, and link loss. A species with modest biomass can actually possess immense topological centrality. Losing it causes catastrophic collapse, while removing a high-biomass generalist might cause negligible harm.\n\n"
        "[CLICK TAB: 'Network Robustness Lab (Dunne 2002)']\n"
        "Now, let us examine our most advanced theoretical module: The Network Robustness Lab, implementing the seminal Dunne, Williams, and Martinez (2002) percolation model.\n\n"
        "[POINT TO EXTINCTION CURVES ON CHART]\n"
        "This interactive chart plots cumulative species removal on the X-axis against surviving species on the Y-axis across three distinct attack vectors:\n"
        "1. Strategy A (Red Curve) — Targeted Hub Attack: Removing species in descending order of total degree (most connected first). Notice the steep, catastrophic collapse! This mirrors targeted habitat loss or overfishing of keystone predators.\n"
        "2. Strategy D (Blue Curve) — Random Extinction: Removing species uniformly at random. Notice how much flatter and more resilient the curve is!\n\n"
        "[POINT TO R50 BADGE]\n"
        "Right here is the R50 Robustness Metric. Mathematically, R50 represents the fraction of species that must be removed before 50% of the entire ecosystem collapses. An R50 of 0.42 means the system can absorb up to 42% random loss before structural collapse. \n\n"
        "Ram will now demonstrate how this robustness changes across different real-world biomes.\""
    )
    
    # ----------------------------------------------------
    # SPEAKER 5: RAM
    # ----------------------------------------------------
    h2 = doc.add_heading("Speaker 5: Ram — Cross-Ecosystem Benchmarks & Empirical Research Datasets", level=2)
    h2.paragraph_format.space_before = Pt(14)
    
    p = doc.add_paragraph()
    p.add_run("Screen Location: ").bold = True
    p.add_run("Comparison Page (")
    p.add_run("http://localhost:5173/#compare").italic = True
    p.add_run(") & Data Library (")
    p.add_run("http://localhost:5173/#library").italic = True
    p.add_run(")\n")
    p.add_run("Target Duration: ").bold = True
    p.add_run("2 Minutes\n")
    p.add_run("Core Mission: ").bold = True
    p.add_run("Showcase the 6 real-world empirical research datasets loaded from Dryad repositories with official DOIs. Explain the relationship between directed connectance (C = L / S^2) and ecosystem stability.")
    
    p_step = doc.add_paragraph()
    p_step.add_run("Live Visual Steps (What to do on screen):\n").bold = True
    p_step.add_run("1. Click 'Comparison' on the left navigation sidebar.\n"
                   "2. Point to the comparative multi-bar charts showing Connectance, Link Density, and Cascade Fragility across ecosystems.\n"
                   "3. Compare Tatoosh Island (Marine intertidal, S=110, C=0.072) vs. BCI Tropical Forest (Terrestrial, S=395, C=0.002).\n"
                   "4. Click 'Data Library' on the navigation sidebar.\n"
                   "5. Scroll through the verified cards showing provenance citations, DOIs, node units, and Dryad repository links.\n"
                   "6. Transition: Hand over to Chinmay for the live custom dataset import and PDF report generation.")
    
    doc.add_heading("Verbatim Spoken Script for Ram:", level=3)
    p_speech = doc.add_paragraph()
    p_speech.paragraph_format.line_spacing = 1.15
    p_speech.add_run(
        "\"Thank you, Nihal.\n\n"
        "[CLICK: 'Comparison' in Navigation]\n"
        "One of the strongest scientific pillars of FoodWebGuard is that we do not rely on synthetic toy networks. We benchmark real, peer-reviewed empirical ecosystems.\n\n"
        "[POINT TO COMPARISON CHARTS]\n"
        "On this Ecosystem Comparison dashboard, we analyze how network topology dictates ecological resilience across biomes:\n"
        "• Look at Directed Connectance, calculated as C = L / S^2, where L is total feeding links and S is species count.\n"
        "• In high-connectance marine systems like Tatoosh Island (C ≈ 0.072), species have high dietary redundancy. If one prey species is removed, predators switch to alternative prey, buffering the system.\n"
        "• In contrast, look at our 395-species Barro Colorado Island Tropical Forest network. Because insect seed-predators are highly specialized to specific host plants, directed connectance is much lower (C ≈ 0.002). Specialized links make individual branches extremely vulnerable to co-extinction cascades!\n\n"
        "[CLICK: 'Data Library' in Navigation]\n"
        "If we open the Research Library, you can inspect the rigorous scientific provenance of every dataset:\n"
        "• We feature shallow-lake mesocosms from Zhang et al. (2024, Dryad doi:10.5061/dryad.866t1g1zj),\n"
        "• The Tatoosh intertidal web from Wootton et al. (2016, Dryad doi:10.5061/dryad.39jv1),\n"
        "• And terrestrial invertebrate food webs from Palmyra Atoll.\n\n"
        "Every single dataset contains complete DOI citations, license terms, and raw adjacency matrices. \n\n"
        "Now, Chinmay will show the most exciting engineering capability: our live Data Intake Studio and Academic PDF generator.\""
    )
    
    # ----------------------------------------------------
    # SPEAKER 6: CHINMAY
    # ----------------------------------------------------
    h2 = doc.add_heading("Speaker 6: Chinmay — Live Data Intake Studio (Import & Removal) & Academic PDF Report", level=2)
    h2.paragraph_format.space_before = Pt(14)
    
    p = doc.add_paragraph()
    p.add_run("Screen Location: ").bold = True
    p.add_run("Explore Page (")
    p.add_run("http://localhost:5173/#explore").italic = True
    p.add_run(") -> Import Dialog & Academic Report Modal\n")
    p.add_run("Target Duration: ").bold = True
    p.add_run("2.5 Minutes\n")
    p.add_run("Core Mission: ").bold = True
    p.add_run("Execute a live custom dataset import in front of the professor. Show the dual upload slots with dynamic feedback. Load the Chesapeake Estuary food web (14 nodes, 26 links). Run a simulation on it. Open the Academic Report modal, explain the mathematical breakdown, show the clean multi-page print preview, and show 1-click dataset removal.")
    
    p_step = doc.add_paragraph()
    p_step.add_run("Live Visual Steps (What to do on screen):\n").bold = True
    p_step.add_run("1. Return to 'Explore & Simulate' page.\n"
                   "2. Click the green 'Import Dataset' button on the top toolbar.\n"
                   "3. Point out the two clean upload slots: '1. Species Nodes CSV' and '2. Feeding Links CSV' (Notice: 'No file chosen' neutral state).\n"
                   "4. Click 'Load Example into Form' (or select sample-nodes-estuary.csv and sample-links-estuary.csv).\n"
                   "5. Click 'Validate and preview' -> Show the validation report: 0 errors, 0 warnings, 14 nodes, 26 links, Ready to import!\n"
                   "6. Click 'Import dataset'.\n"
                   "7. Watch: The Chesapeake Estuarine Marsh Food Web immediately renders on screen!\n"
                   "8. Remove 'Phytoplankton' and click 'Run Simulation' -> Show the immediate secondary starvation cascade.\n"
                   "9. Click 'Academic Report' in the top status bar -> Scroll through the publication-grade mathematical analysis (Adjacency Matrix, Jaccard overlap, Cascade log).\n"
                   "10. Click 'Save / Print PDF' -> Show the 3-page unclipped layout.\n"
                   "11. Close the modal, click the red 'Remove Custom' button on the toolbar to show clean state reset, and deliver the concluding sentence.")
    
    doc.add_heading("Verbatim Spoken Script for Chinmay:", level=3)
    p_speech = doc.add_paragraph()
    p_speech.paragraph_format.line_spacing = 1.15
    p_speech.add_run(
        "\"Thank you, Ram.\n\n"
        "[CLICK: 'Import Dataset' Button in Toolbar]\n"
        "A truly robust engineering platform must not be locked to hardcoded fixtures. It must empower researchers to import and validate their own custom field data. That is our Data Intake Studio.\n\n"
        "[POINT TO DUAL SLOTS ON DIALOG]\n"
        "Notice the clean, error-preventing interface:\n"
        "• A food web in CSV format mathematically requires two distinct tables: Species Nodes (who the organisms are) and Feeding Links (who eats whom).\n"
        "• Our interface provides dedicated upload slots with real-time biological validation.\n\n"
        "[CLICK: 'Load Example into Form' -> CLICK 'Validate and preview']\n"
        "When I load our Chesapeake Estuarine Marsh Food Web and click 'Validate and preview', our in-browser validator checks graph integrity:\n"
        "• It verifies that no links reference non-existent species,\n"
        "• Verifies trophic roles,\n"
        "• Excludes invalid self-loops, and checks DOI formatting.\n"
        "As you can see: 0 errors, 0 warnings, 14 species, and 26 feeding links verified!\n\n"
        "[CLICK: 'Import dataset']\n"
        "Instantly, the custom Chesapeake Bay network is injected into state and rendered on our canvas!\n\n"
        "[SELECT: 'Phytoplankton' -> CLICK 'Run Simulation']\n"
        "When we perturb Phytoplankton, the secondary starvation propagates through copepods, oysters, and menhaden in real time.\n\n"
        "[CLICK: 'Academic Report' Button in Status Bar]\n"
        "Finally, for publication and classroom assessment, our platform generates this Academic Report:\n"
        "• It outputs formal mathematical notations with KaTeX rendering,\n"
        "• Full directed adjacency matrices,\n"
        "• Trophic Jaccard similarity coefficients,\n"
        "• And a chronological cascade log.\n"
        "When we click 'Save / Print PDF', our responsive print stylesheet unrolls the modal into a clean, multi-page document ready for submission.\n\n"
        "[CLOSE MODAL -> CLICK: Red 'Remove Custom' Button]\n"
        "And when our analysis is complete, clicking 'Remove Custom' instantly clears the imported network and restores our baseline ecosystem.\n\n"
        "FoodWebGuard proves that computational network engineering and biological conservation can unite into an intuitive, mathematically rigorous platform. Thank you, and we welcome your questions!\""
    )
    
    # ==========================================
    # SECTION 2: PROFESSOR DEFENSE & Q&A BATTLE PLAN
    # ==========================================
    doc.add_page_break()
    doc.add_heading("PART 2: Professor Defense & Tough Question Battle Plan", level=1)
    
    p_intro = doc.add_paragraph()
    p_intro.add_run(
        "This section is your ultimate shield. Evaluators often challenge student projects with tough questions: "
        "'Why did you choose this?', 'How is this different from Gephi or NetworkX?', 'Isn't this too small or trivial?', "
        "or questions on exact formulas. Below are bulletproof, scientifically backed answers. Memorize these key points."
    )
    p_intro.paragraph_format.space_after = Pt(10)
    
    qa_list = [
        (
            "QUESTION 1: \"Why did you choose this topic? Why should computer/engineering students care about food webs?\"",
            "TEJAS / ALL",
            "\"Professor, ecological food webs are directed networks governed by thermodynamic energy constraints and structural dependency rules. In computer science and electrical engineering, the exact same mathematical percolation models govern:\n"
            "1. Power grid cascading failures (where losing one high-voltage substation overloads adjacent nodes).\n"
            "2. Distributed microservice dependencies (where failure of an authentication service cascades down to all dependent microservices).\n"
            "3. Supply chain bottleneck vulnerabilities.\n\n"
            "By modeling ecosystems, we bridge biological network theory with systems reliability engineering. Furthermore, with biodiversity loss reaching crisis levels, developing quantitative computational tools to identify keystone vulnerability is an urgent real-world application of engineering principles.\""
        ),
        (
            "QUESTION 2: \"Isn't this project too small / trivial / just a toy UI? What is the actual engineering depth?\"",
            "SANCHIT / NIHAL",
            "\"With utmost respect, Professor, this is an enterprise-grade computational platform, not a toy UI:\n"
            "1. Algorithmic Rigor: We implemented the Dunne et al. (2002) percolation model, whole-network sensitivity scanning, and recursive BFS topological starvation algorithms.\n"
            "2. Engineering Verification: Our codebase is backed by 164 automated unit tests in Vitest covering edge cases, matrix operations, and floating-point connectance assertions.\n"
            "3. Real Browser Acceptance: We automated 30 headless Chrome browser workflows using Chrome DevTools Protocol (CDP) testing layout shifts, hash-based routing, and zero-console-error execution.\n"
            "4. Empirical Datasets: We do not use mock data; we curated 6 real Dryad repository datasets with peer-reviewed DOIs (ranging up to 395 species and 869 links).\n"
            "5. Client-Side Performance: All graph layout computations, sensitivity sweeps, and multi-page PDF generation run 100% client-side in the browser engine without backend latency.\""
        ),
        (
            "QUESTION 3: \"How is this different from existing tools like Gephi, Cytoscape Desktop, or Python NetworkX?\"",
            "NILOTPAL / CHINMAY",
            "\"Professor, general-purpose graph libraries and desktop packages cannot perform domain-specific ecological cascade experiments:\n"
            "• Gephi and Cytoscape Desktop are static graph visualizers. They do not have an interactive, step-by-step secondary extinction cascade engine, nor do they model trophic starvation or Dunne R50 robustness curves.\n"
            "• Python NetworkX is a headless code library without an interactive visual interface; it cannot be used for live classroom simulation, non-coder policy evaluation, or dynamic web presentation.\n"
            "• FoodWebGuard uniquely integrates graph visualization, real-time perturbation simulation, temporal timeline explainability, automated sensitivity ranking, and publication-grade PDF reporting into a unified, zero-install web application.\""
        ),
        (
            "QUESTION 4: \"What EXACT formulas are used to calculate extinction and metrics?\"",
            "SANCHIT / RAM",
            "\"Professor, our calculations strictly follow peer-reviewed ecological mathematics:\n\n"
            "1. Directed Connectance (C):\n"
            "   C = L / (S^2)\n"
            "   where L is the total count of active directed feeding links, and S is total species count.\n\n"
            "2. Link Density (D):\n"
            "   D = L / S\n\n"
            "3. Secondary Extinction Criterion (Topological Starvation):\n"
            "   For any non-basal consumer c, its active in-degree is:\n"
            "   k_in^active(c) = SUM over all surviving prey p of A[p, c]\n"
            "   If k_in^active(c) == 0, consumer c starves and undergoes secondary extinction.\n"
            "   If k_in^active(c) >= 1, consumer c survives via prey switching.\n\n"
            "4. Basal Exemption Rule:\n"
            "   Basal autotrophs (plants, algae) have k_in = 0 by definition because they utilize abiotic solar energy; they are never marked as starved.\n\n"
            "5. Network Robustness Metric (R50):\n"
            "   R50 = (Number of primary removals to cause 50% cumulative species loss) / S_0\n"
            "   where S_0 is the initial baseline species count.\""
        ),
        (
            "QUESTION 5: \"Why did you use a purely topological model instead of dynamic Lotka-Volterra differential equations?\"",
            "RAM / TEJAS",
            "\"That is an excellent theoretical question, Professor.\n"
            "Dynamic differential equation models (such as Lotka-Volterra or bioenergetic consumer-resource models) require empirical parameterization for every species: attack rates, handling times, metabolic losses, carrying capacities, and assimilation efficiencies.\n"
            "For complex empirical food webs with dozens or hundreds of species, 95% of these kinetic parameters are unknown and must be guessed, introducing enormous parameter uncertainty.\n\n"
            "As established by Pimm (1979), Dunne et al. (2002), and Allesina & Bodini (2004), topological models isolate pure structural network vulnerability from parameter guessing. They provide the fundamental topological baseline for extinction susceptibility without introducing uncalibrated numerical artifacts.\""
        ),
        (
            "QUESTION 6: \"Are cannibalistic self-links included in your calculations?\"",
            "CHINMAY / SANCHIT",
            "\"Yes, Professor, we handle cannibalistic self-loops explicitly:\n"
            "• In raw network metrics, if the original research dataset documented cannibalism (A[i, i] = 1), it is preserved in the adjacency matrix and connectance calculations.\n"
            "• However, in our secondary cascade propagation engine, self-links are strictly excluded from the active in-degree calculation (k_in^active). This prevents the unphysical mathematical artifact where a species feeds on itself and survives as an immortal perpetual-motion organism after all its actual food is gone.\""
        ),
        (
            "QUESTION 7: \"What happens if empirical food webs have sampling bias or unrecorded links?\"",
            "RAM / NIHAL",
            "\"Professor, sampling bias is an acknowledged reality in ecological field surveys. Our platform combats this in two ways:\n"
            "1. In our Data Intake Studio, we enforce biological integrity validation and flag low-evidence interactions with our repair pipeline.\n"
            "2. In our Experiment Studio, our Whole-Network Sensitivity Scan analyzes how sensitive the network is to every single node removal. If an ecosystem exhibits high connectance and dietary redundancy, it is mathematically robust against unobserved link variations.\""
        ),
    ]
    
    for q_title, owner, answer in qa_list:
        h3 = doc.add_heading(q_title, level=2)
        h3.paragraph_format.space_before = Pt(12)
        h3.paragraph_format.space_after = Pt(2)
        
        p_o = doc.add_paragraph()
        r_o = p_o.add_run(f"Recommended Lead Responder: {owner}")
        r_o.font.bold = True
        r_o.font.color.rgb = RGBColor(0x1B, 0x43, 0x28)
        p_o.paragraph_format.space_after = Pt(4)
        
        p_a = doc.add_paragraph()
        p_a.paragraph_format.line_spacing = 1.15
        p_a.add_run(answer)
        
        add_callout(
            doc,
            "Key Delivery Tip: Maintain calm confidence. Do not be defensive. Acknowledge her question with 'That is a critical point, Professor,' then deliver the mathematical / literature-backed fact.",
            title="EVALUATOR PSYCHOLOGY TIP",
            fill_hex="FFF9E6",
            border_hex="D4A017"
        )
    
    # ==========================================
    # SECTION 3: EMERGENCY BACKUP & CHECKLIST
    # ==========================================
    doc.add_page_break()
    doc.add_heading("PART 3: Emergency Checklist & Live Presentation Tips", level=1)
    
    chk_p = doc.add_paragraph()
    chk_p.add_run(
        "Before stepping into the presentation room, verify these exact checklist items:\n\n"
        "☑ 1. Dev Server Running: Ensure 'npm run dev' is running on http://localhost:5173/ in the background.\n"
        "☑ 2. Full-Screen Mode: Press F11 in Google Chrome to remove browser tabs and address bar for a sleek desktop app appearance.\n"
        "☑ 3. Zoom Level: Ensure browser zoom is at 100% (Ctrl + 0).\n"
        "☑ 4. Reset Baseline: If you practiced beforehand, click 'Reset simulation' so the network starts fresh with 0 removed nodes.\n"
        "☑ 5. Backup Sample Files: The files sample-nodes-estuary.csv and sample-links-estuary.csv are stored in the sample-datasets/ folder and also auto-loaded in 1 click via 'Load Example into Form'.\n"
        "☑ 6. PDF Print Demonstration: In the Academic Report modal, clicking 'Save / Print PDF' will open Chrome's print preview showing all 3 unclipped pages.\n\n"
        "Team Motto: Confident, Crisp, and Scientifically Rigorous!"
    )
    
    output_path = r"C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL\FoodWebGuard_Presentation_Master_Script.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_document()
