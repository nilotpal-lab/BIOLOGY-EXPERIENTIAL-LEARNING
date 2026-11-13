import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Compass,
  FileQuestion,
  FlaskConical,
  GitCompareArrows,
  Globe2,
  HelpCircle,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import type { RouteId } from './routes'

export interface FeatureGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (route: RouteId) => void
  onOpenImport?: () => void
}

type GuideTab = 'goals' | 'tutorial' | 'directory'

interface WindowInfo {
  id: RouteId
  title: string
  subtitle: string
  icon: ReactNode
  bg: string
  textColor: string
  whatItDoes: string
  whenToUse: string
  keyOutputs: string
  targetQuestion: string
  route: RouteId
}

const WINDOW_REGISTRY: WindowInfo[] = [
  {
    id: 'explore',
    title: 'Interactive Explorer',
    subtitle: 'Visual Food Web Topology',
    icon: <Network size={20} />,
    bg: 'bg-[#E8EDE0]',
    textColor: 'text-[#35563B]',
    whatItDoes:
      'Renders the complete ecological graph with real species illustrations, trophic tiers, and directed feeding interactions (resource → consumer).',
    whenToUse:
      'Use first when getting familiar with an ecosystem to inspect species diets, identify basal producers and apex predators, and view topological metrics.',
    keyOutputs:
      'Interactive Cytoscape network graph, species diet inspector, incoming/outgoing link counts, trophic level classifications.',
    targetQuestion: 'Who eats whom, and what is the architecture of this ecosystem?',
    route: 'explore',
  },
  {
    id: 'simulation',
    title: 'Simulation Laboratory',
    subtitle: 'Direct & Cascade Extinction Engine',
    icon: <FlaskConical size={20} />,
    bg: 'bg-[#FDEEEB]',
    textColor: 'text-[#D96B50]',
    whatItDoes:
      'Simulates the ecological disturbance of removing one or more species. Propagates secondary starvation cascades when non-basal consumers lose all recorded food resources.',
    whenToUse:
      'Use when testing a specific species loss hypothesis (e.g. "What happens if the Grey Heron or Atlantic Cod disappears?").',
    keyOutputs:
      'Direct vs. secondary extinctions, percentage link loss, before/after connectance comparison, and plain-English ecological explanations.',
    targetQuestion: 'If this species goes locally extinct, will other species collapse too?',
    route: 'simulation',
  },
  {
    id: 'timeline',
    title: 'Cascade Timeline',
    subtitle: 'Round-by-Round Extinction Tracker',
    icon: <Clock size={20} />,
    bg: 'bg-[#FEF9E7]',
    textColor: 'text-[#D8933B]',
    whatItDoes:
      'Breaks multi-step ecological collapses into discrete temporal rounds. Shows the precise order in which secondary species die off due to food web starvation.',
    whenToUse:
      'Use after running a simulation with secondary casualties to understand the causal chain and intermediate trophic stages.',
    keyOutputs:
      'Interactive round stepper, visual extinction progression bar, and per-round causal logs showing exactly which prey loss triggered each starvation.',
    targetQuestion: 'In what exact sequence does the ecosystem unravel following a disturbance?',
    route: 'timeline',
  },
  {
    id: 'experiment',
    title: 'Experiment Studio',
    subtitle: 'Automated Keystone Ranking & Dunne R50',
    icon: <BarChart3 size={20} />,
    bg: 'bg-[#EBF4FA]',
    textColor: 'text-[#4288B8]',
    whatItDoes:
      'Runs automated systematic sweeps across every single organism in the ecosystem. Evaluates network robustness ($R_{50}$) under Dunne et al. (2002) attack strategies.',
    whenToUse:
      'Use when you need to identify the most critical keystone species without manual guessing, or test whole-network resilience against targeted vs. random attacks.',
    keyOutputs:
      'All-species keystone sensitivity ranking table, Dunne connectance ($C = L / S^2$), 4-strategy extinction curves with 95% confidence intervals, and CSV data export.',
    targetQuestion: 'Which species are the most dangerous to lose, and how fragile is the whole network?',
    route: 'experiment',
  },
  {
    id: 'compare',
    title: 'Ecosystem Comparison',
    subtitle: 'Cross-Network Structural Benchmarks',
    icon: <GitCompareArrows size={20} />,
    bg: 'bg-[#F4EFF9]',
    textColor: 'text-[#865DAF]',
    whatItDoes:
      'Compares multiple ecological networks side-by-side across fundamental graph metrics: species richness, linkage density, directed connectance, and vulnerability distributions.',
    whenToUse:
      'Use to evaluate how different biomes (e.g. marine vs. freshwater vs. terrestrial) differ in topological stability and redundancy.',
    keyOutputs:
      'Comparative metric cards, normalized spider / bar distributions, and empirical cross-network benchmark tables.',
    targetQuestion: 'How does this ecosystem compare to other biomes in structural resilience?',
    route: 'compare',
  },
  {
    id: 'conservation',
    title: 'Conservation Atlas',
    subtitle: 'Biogeographical & Trophic Distributions',
    icon: <Globe2 size={20} />,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-[#00796B]',
    whatItDoes:
      'Organizes ecological networks by geographic location, biome type, and trophic pyramid structures.',
    whenToUse:
      'Use for macro-ecological research, understanding geographic coverage, and analyzing basal-to-top predator trophic ratios.',
    keyOutputs:
      'Ecosystem biome classification, geographic distribution cards, trophic level biomass/species breakdowns, and field study provenance.',
    targetQuestion: 'Where are these empirical ecosystems located, and what do their trophic pyramids look like?',
    route: 'conservation',
  },
  {
    id: 'library',
    title: 'Research Library',
    subtitle: 'Verified Literature & Benchmark Networks',
    icon: <BookOpenCheck size={20} />,
    bg: 'bg-[#EDF5E8]',
    textColor: 'text-[#35563B]',
    whatItDoes:
      'Houses the canonical library of 6 verified empirical ecological networks from peer-reviewed literature alongside illustrative tutorial demo networks.',
    whenToUse:
      'Use to switch between datasets, read academic citations, inspect sampling methodology, and export raw node/edge CSV files.',
    keyOutputs:
      'Dataset switcher, full academic references (authors, year, journal, DOI), sampling methodology notes, and CSV export actions.',
    targetQuestion: 'Where did this food web data come from, and how was it gathered in the field?',
    route: 'library',
  },
  {
    id: 'import',
    title: 'Dataset Import',
    subtitle: 'Custom CSV & JSON Web Builder',
    icon: <Upload size={20} />,
    bg: 'bg-[#FDF2E7]',
    textColor: 'text-[#D87D3B]',
    whatItDoes:
      'Validates and loads user-provided food web datasets formatted as CSV or JSON files. Checks for dangling links, duplicate edges, and schema compliance.',
    whenToUse:
      'Use when you want to analyze your own field data, class project food web, or custom ecological survey in FoodWebGuard.',
    keyOutputs:
      'Real-time schema validator, syntax error highlighter with line numbers, downloadable sample CSV templates, and 1-click network loader.',
    targetQuestion: 'How can I analyze my own custom ecological data in this platform?',
    route: 'import',
  },
  {
    id: 'methodology',
    title: 'Methodology & Validation',
    subtitle: 'Scientific Equations & Live Verification',
    icon: <ShieldCheck size={20} />,
    bg: 'bg-[#E8EFEA]',
    textColor: 'text-[#263D2D]',
    whatItDoes:
      'Documents the mathematical formulas, ecological assumptions (e.g. non-basal starvation rule), and runs live automated in-browser verification tests.',
    whenToUse:
      'Use when writing research papers, preparing engineering lab submissions, or verifying mathematical rigor.',
    keyOutputs:
      'Formal mathematical definitions ($C = L/S^2$, $R_{50}$, trophic levels), explicit ecological boundary conditions, and live passing test suite.',
    targetQuestion: 'What mathematical formulas and scientific rules govern the calculations?',
    route: 'methodology',
  },
]

interface UserGoal {
  goal: string
  description: string
  bestWindow: string
  route: RouteId
  badge: string
  icon: ReactNode
}

const USER_GOALS: UserGoal[] = [
  {
    goal: 'Visualize species feeding links and trophic levels',
    description: 'Inspect who eats whom with organism illustrations, node search, and diet breakdowns.',
    bestWindow: 'Interactive Explorer',
    route: 'explore',
    badge: 'Graph Visualization',
    icon: <Network size={18} className="text-[#35563B]" />,
  },
  {
    goal: 'Simulate species loss and observe secondary extinctions',
    description: 'Remove an apex predator or keystone species to see immediate and indirect cascade effects.',
    bestWindow: 'Simulation Laboratory',
    route: 'simulation',
    badge: 'Extinction Simulation',
    icon: <FlaskConical size={18} className="text-[#D96B50]" />,
  },
  {
    goal: 'Track domino collapses round-by-round',
    description: 'Watch the step-by-step sequence of species starvation after an initial removal.',
    bestWindow: 'Cascade Timeline',
    route: 'timeline',
    badge: 'Step-by-Step Cascades',
    icon: <Clock size={18} className="text-[#D8933B]" />,
  },
  {
    goal: 'Find the most dangerous keystone species & compute R50',
    description: 'Run automated all-species sensitivity analysis and Dunne et al. (2002) attack curves.',
    bestWindow: 'Experiment Studio',
    route: 'experiment',
    badge: 'Keystone Rankings & R50',
    icon: <BarChart3 size={18} className="text-[#4288B8]" />,
  },
  {
    goal: 'Compare resilience across different biomes',
    description: 'Analyze structural differences between marine, freshwater, and terrestrial ecosystems.',
    bestWindow: 'Ecosystem Comparison',
    route: 'compare',
    badge: 'Comparative Analytics',
    icon: <GitCompareArrows size={18} className="text-[#865DAF]" />,
  },
  {
    goal: 'Explore geographic biomes & trophic pyramids',
    description: 'Examine spatial biomes, basal-to-top predator ratios, and regional ecological profiles.',
    bestWindow: 'Conservation Atlas',
    route: 'conservation',
    badge: 'Spatial Ecology',
    icon: <Globe2 size={18} className="text-[#00796B]" />,
  },
  {
    goal: 'Browse verified research datasets & literature citations',
    description: 'Access 6 empirical food webs with full peer-reviewed papers and raw CSV downloads.',
    bestWindow: 'Research Library',
    route: 'library',
    badge: 'Peer-Reviewed Data',
    icon: <BookOpenCheck size={18} className="text-[#35563B]" />,
  },
  {
    goal: 'Upload my own CSV or JSON food web data',
    description: 'Validate custom ecological data against schema rules and load it into all analysis tools.',
    bestWindow: 'Dataset Import',
    route: 'import',
    badge: 'Custom Data',
    icon: <Upload size={18} className="text-[#D87D3B]" />,
  },
  {
    goal: 'Review mathematical formulas and run live verification',
    description: 'Inspect exact topological equations, boundary conditions, and passing in-browser test runner.',
    bestWindow: 'Methodology & Validation',
    route: 'methodology',
    badge: 'Formulas & Tests',
    icon: <ShieldCheck size={18} className="text-[#263D2D]" />,
  },
]

const TUTORIAL_STEPS = [
  {
    step: 'Step 1',
    title: 'Select an Ecosystem',
    window: 'Research Library',
    route: 'library' as RouteId,
    description:
      'Begin by choosing a network from the header dropdown or Research Library. We recommend starting with "Ythan Estuary" (Scottish coastal mudflat) or "Little Rock Lake" (Wisconsin freshwater lake) to see real empirical data with verified species names.',
    tip: 'Look for the "Research-Verified" badge to study empirical field surveys.',
  },
  {
    step: 'Step 2',
    title: 'Explore the Network Architecture',
    window: 'Interactive Explorer',
    route: 'explore' as RouteId,
    description:
      'Open the Explorer to visualize the ecological graph. Use the search bar to locate species (e.g. Heron or Carp), click any node to inspect what it feeds on and what consumes it, and filter by trophic tier (producers, herbivores, carnivores, apex predators).',
    tip: 'Nodes are color-coded by trophic role: green for producers, orange for herbivores, and purple for apex predators.',
  },
  {
    step: 'Step 3',
    title: 'Trigger an Extinction Disturbance',
    window: 'Simulation Laboratory',
    route: 'simulation' as RouteId,
    description:
      'In the Simulation Lab, choose a species to remove (e.g. an apex predator like Grey Heron, or a central consumer). Click "Run Removal" to simulate the disturbance. Watch the engine calculate both direct link loss and secondary starvation cascades.',
    tip: 'Basal producers never starve, but consumers without alternative prey will collapse.',
  },
  {
    step: 'Step 4',
    title: 'Examine Domino Collapse Rounds',
    window: 'Cascade Timeline',
    route: 'timeline' as RouteId,
    description:
      'Switch to Cascade Timeline to review how the collapse unfolded over successive rounds. Step through Round 1, Round 2, etc., to see the exact causal chain showing why each consumer starved when its specific prey disappeared.',
    tip: 'Use the step slider or playback buttons to study propagation dynamics.',
  },
  {
    step: 'Step 5',
    title: 'Rank Keystones & Test Network Robustness',
    window: 'Experiment Studio',
    route: 'experiment' as RouteId,
    description:
      'Run an automated sensitivity screening in Experiment Studio. The platform tests removing every species independently and ranks them by cascade severity. Next, open the "Network Robustness Lab" tab to compute the Dunne R50 collapse threshold under targeted vs. random attack.',
    tip: 'Export your results as publication-ready CSVs or print the formal Academic Report for project submission.',
  },
]

export function FeatureGuideModal({
  isOpen,
  onClose,
  onNavigate,
  onOpenImport,
}: FeatureGuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('goals')

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLaunch = (route: RouteId) => {
    onClose()
    if (route === 'import' && onOpenImport) {
      onOpenImport()
    } else {
      onNavigate(route)
    }
  }

  const modalElement = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#FCFBF7] text-[#202B27] border border-[#E5E6DC] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E6DC] bg-[#F7F6EF] px-5 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EDE0] text-[#35563B] shadow-2xs">
              <HelpCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#35563B]">
                  PLATFORM GUIDE & TUTORIAL
                </span>
                <span className="text-xs text-[#899B78]">·</span>
                <span className="text-[11px] text-[#68716B] font-medium hidden sm:inline">
                  Which window helps do what
                </span>
              </div>
              <h2
                id="feature-guide-title"
                className="text-lg sm:text-xl font-serif font-bold text-[#202B27] leading-tight"
              >
                FoodWebGuard Navigation & Feature Guide
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E6DC] bg-white text-[#68716B] hover:text-[#202B27] hover:bg-[#F0F2E9] transition-colors cursor-pointer shadow-2xs"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#E5E6DC] bg-white px-5 sm:px-6 gap-2 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`py-3 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'goals'
                ? 'border-[#35563B] text-[#35563B]'
                : 'border-transparent text-[#68716B] hover:text-[#202B27]'
            }`}
          >
            <FileQuestion size={15} />
            <span>Goal Finder ("I want to...")</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`py-3 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tutorial'
                ? 'border-[#35563B] text-[#35563B]'
                : 'border-transparent text-[#68716B] hover:text-[#202B27]'
            }`}
          >
            <Sparkles size={15} />
            <span>Step-by-Step Research Tutorial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`py-3 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'border-[#35563B] text-[#35563B]'
                : 'border-transparent text-[#68716B] hover:text-[#202B27]'
            }`}
          >
            <Layers size={15} />
            <span>Complete Window Directory (All 9)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: GOAL FINDER */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="bg-[#E8EDE0]/50 border border-[#899B78]/40 rounded-xl p-3.5 sm:p-4">
                <p className="text-xs text-[#263D2D] leading-relaxed">
                  <strong>Find your objective:</strong> Select what you want to accomplish below. Each option directs you to the precise window designed for that specific ecological analysis task.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {USER_GOALS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-[#E5E6DC] bg-white p-4 shadow-2xs hover:border-[#899B78] hover:shadow-xs transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F7F6EF] px-2 py-0.5 text-[10.5px] font-semibold text-[#35563B] border border-[#E5E6DC]">
                          {item.icon}
                          {item.badge}
                        </span>
                        <span className="text-[11px] font-mono text-[#899B78]">
                          {item.bestWindow}
                        </span>
                      </div>

                      <h4 className="text-sm font-serif font-bold text-[#202B27] leading-snug">
                        {item.goal}
                      </h4>

                      <p className="text-xs text-[#68716B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-[#E5E6DC]/70 flex items-center justify-between">
                      <span className="text-[11px] text-[#68716B]">
                        Target window: <strong className="text-[#202B27]">{item.bestWindow}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLaunch(item.route)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#35563B] hover:bg-[#263D2D] text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Open Window</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP TUTORIAL */}
          {activeTab === 'tutorial' && (
            <div className="space-y-5">
              <div className="bg-[#E8EDE0]/50 border border-[#899B78]/40 rounded-xl p-3.5 sm:p-4">
                <p className="text-xs text-[#263D2D] leading-relaxed">
                  <strong>Recommended Research Workflow:</strong> Follow this 5-step tutorial to conduct a complete topological vulnerability assessment on an empirical ecological network.
                </p>
              </div>

              <div className="space-y-4">
                {TUTORIAL_STEPS.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-[#E5E6DC] bg-white p-4 sm:p-5 shadow-2xs"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#35563B] text-white font-serif font-bold text-base shadow-2xs">
                      {idx + 1}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#35563B]">
                            {step.step}
                          </span>
                          <h4 className="text-base font-serif font-bold text-[#202B27]">
                            {step.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLaunch(step.route)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#35563B] bg-[#FCFBF7] hover:bg-[#35563B] hover:text-white text-[#35563B] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Launch {step.window}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <p className="text-xs sm:text-[13px] text-[#47524C] leading-relaxed">
                        {step.description}
                      </p>

                      <div className="rounded-lg bg-[#F7F6EF] border border-[#E5E6DC] p-2.5 flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-[#35563B] shrink-0 mt-0.5" />
                        <span className="text-[11.5px] text-[#68716B]">
                          <strong className="text-[#202B27]">Pro Tip:</strong> {step.tip}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE WINDOW DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="bg-[#E8EDE0]/50 border border-[#899B78]/40 rounded-xl p-3.5 sm:p-4">
                <p className="text-xs text-[#263D2D] leading-relaxed">
                  <strong>Full Feature Reference:</strong> Below is a comprehensive breakdown of all 9 windows in FoodWebGuard, detailing their computational role, inputs, and primary outputs.
                </p>
              </div>

              <div className="space-y-4">
                {WINDOW_REGISTRY.map((win) => (
                  <div
                    key={win.id}
                    className="rounded-xl border border-[#E5E6DC] bg-white p-4 sm:p-5 shadow-2xs space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E6DC] pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${win.bg} ${win.textColor}`}
                        >
                          {win.icon}
                        </div>
                        <div>
                          <h4 className="text-base font-serif font-bold text-[#202B27]">
                            {win.title}
                          </h4>
                          <p className="text-xs text-[#68716B]">{win.subtitle}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunch(win.route)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#35563B] hover:bg-[#263D2D] text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        <span>Launch Window</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#35563B]">
                          What it does
                        </span>
                        <p className="text-[#47524C] leading-relaxed">{win.whatItDoes}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#68716B]">
                          When to use it
                        </span>
                        <p className="text-[#47524C] leading-relaxed">{win.whenToUse}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#68716B]">
                          Key outputs
                        </span>
                        <p className="text-[#47524C] leading-relaxed">{win.keyOutputs}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#D96B50]">
                          Target research question
                        </span>
                        <p className="text-[#202B27] font-medium italic">"{win.targetQuestion}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#E5E6DC] bg-[#F7F6EF] px-5 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#68716B]">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Compass size={15} className="text-[#35563B] shrink-0" />
            <span>
              Tip: You can switch windows anytime using the top navigation bar or sidebar.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E5E6DC] bg-white hover:bg-[#F0F2E9] text-[#202B27] px-4 py-1.5 font-medium transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalElement, document.body)
}

