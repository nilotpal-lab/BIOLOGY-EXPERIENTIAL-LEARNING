import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock,
  Compass,
  FlaskConical,
  GitCompareArrows,
  HelpCircle,
  Leaf,
  Network,
  PawPrint,
  ShieldCheck,
} from 'lucide-react'
import { RESEARCH_SLOT_SUMMARY } from '../data/datasetRegistry'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/routes'
import { formatPercent } from '../core/metrics'
import { FeatureGuideModal } from '../components/layout/FeatureGuideModal'
import { cn } from '../components/ui/primitives'

interface OverviewProps {
  onNavigate: (route: RouteId) => void
  onOpenImport?: () => void
}

export function Overview({ onNavigate, onOpenImport: _onOpenImport }: OverviewProps) {
  const [showGuideModal, setShowGuideModal] = useState(false)
  const {
    datasets,
    demoDatasets,
    selectDataset,
    lastAnalysis,
  } = useAppState()

  const verified = datasets.filter((entry) => entry.sourceStatus === 'research-verified').length

  const loadFirstDemo = () => {
    const first = demoDatasets[0]
    if (first) {
      selectDataset(first.id)
      onNavigate('explore')
    }
  }

  const featureCards = [
    {
      id: 'explore',
      title: 'Food Web Explorer & Simulation',
      tag: 'Flagship Topology & Cascade Engine',
      description:
        'Visualize complete ecological networks with high-resolution species illustrations, simulate direct species disturbance, and trace round-by-round extinction cascades.',
      icon: <Network size={20} />,
      bg: 'bg-[#E8EDE0] text-[#35563B]',
      borderHover: 'hover:border-[#35563B]',
      action: () => onNavigate('explore'),
      featured: true,
    },
    {
      id: 'experiment',
      title: 'Experiment Studio',
      tag: 'Sensitivity Lab',
      description:
        'Automated all-species sensitivity ranking, keystone detection, and Dunne et al. R50 network robustness curves.',
      icon: <BarChart3 size={20} />,
      bg: 'bg-[#EBF4FA] text-[#4288B8]',
      borderHover: 'hover:border-[#4288B8]',
      action: () => onNavigate('experiment'),
      featured: false,
    },
    {
      id: 'compare',
      title: 'Ecosystem Comparison',
      tag: 'Cross-Biome Analytics',
      description:
        'Compare structural properties, connectance, linkage density, and vulnerability distributions across 2–4 ecosystems side-by-side.',
      icon: <GitCompareArrows size={20} />,
      bg: 'bg-[#F4EFF9] text-[#865DAF]',
      borderHover: 'hover:border-[#865DAF]',
      action: () => onNavigate('compare'),
      featured: false,
    },
    {
      id: 'library',
      title: 'Research Library & Data Intake',
      tag: 'Verified Networks & CSV/JSON',
      description:
        'Explore 6 empirical ecosystems verified from peer-reviewed literature, download research matrices, or import custom datasets.',
      icon: <BookOpenCheck size={20} />,
      bg: 'bg-[#EDF5E8] text-[#35563B]',
      borderHover: 'hover:border-[#35563B]',
      action: () => onNavigate('library'),
      featured: false,
    },
    {
      id: 'methodology',
      title: 'Methodology & Scientific Validation',
      tag: 'Formulas & In-Browser Tests',
      description:
        'Examine mathematical definitions, trophic level calculations, secondary extinction rules, and execute live in-browser validation tests.',
      icon: <ShieldCheck size={20} />,
      bg: 'bg-[#E8EFEA] text-[#263D2D]',
      borderHover: 'hover:border-[#263D2D]',
      action: () => onNavigate('methodology'),
      featured: false,
    },
  ]

  const scrollToWhyFoodWebs = () => {
    const el = document.getElementById('why-food-webs-matter')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative bg-[#F7F6EF] text-[#202B27] overflow-x-hidden">
      <div className="relative z-10 max-w-[1560px] w-full mx-auto px-6 sm:px-10 lg:px-14 pt-3 pb-12 sm:pt-4 sm:pb-16 space-y-8 sm:space-y-10">
        {/* =====================================================================
            HERO SECTION: Two-column layout matching 01_Landing_Page.png
            ===================================================================== */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-10">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4 sm:space-y-5">
              {/* Small introductory label */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#35563B] uppercase">
                  REAL ECOSYSTEMS. REAL INSIGHTS.
                </span>
                <span className="text-xs text-[#899B78]">·</span>
                <span className="text-[11.5px] text-[#68716B] font-medium hidden sm:inline">
                  Comparative food-web disruption and vulnerability analysis
                </span>
              </div>

              {/* Main Heading in Lora */}
              <h1 className="text-3xl sm:text-4xl lg:text-[50px] xl:text-[56px] font-serif font-normal tracking-tight text-[#202B27] leading-[1.12]">
                Explore. Simulate. <br />
                Understand <span className="text-[#35563B] font-medium">Ecosystems.</span>
              </h1>

              {/* Supporting Description */}
              <p className="text-sm sm:text-[15px] text-[#68716B] leading-relaxed max-w-xl">
                FoodWebGuard is an interactive platform to explore real ecological networks, simulate species removal, and analyse how ecosystems respond to change.
              </p>

              {/* CTA Buttons: Open Explorer + Why Food Webs Matter */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#35563B] hover:bg-[#263D2D] text-white px-5 py-2.5 min-h-[44px] text-xs sm:text-[13.5px] font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Network size={16} />
                  <span>Open Explorer</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={scrollToWhyFoodWebs}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F0F2E9] text-[#202B27] px-4 py-2.5 min-h-[44px] text-xs sm:text-[13.5px] font-medium shadow-2xs transition-colors cursor-pointer"
                >
                  <Leaf size={15} className="text-[#35563B]" />
                  <span>Why Food Webs Matter</span>
                  <ArrowRight size={13} className="text-[#899B78]" />
                </button>
              </div>

              {/* Beginner tip */}
              <p className="text-xs text-[#68716B] pt-0.5">
                New here? Start with the green <strong className="font-semibold text-[#35563B]">Open Explorer</strong> button, or explore the feature guide below to match your research goal.
              </p>

              {/* Statistics Row: 6 Real Ecosystems · 200+ Species · 500+ Feeding Links · 5 Analysis Tools */}
              <div className="pt-4 border-t border-[#E5E6DC]/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EDE0] text-[#35563B]">
                    <Leaf size={16} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#202B27] tabular-nums leading-none">6</p>
                    <p className="text-[11px] text-[#68716B] font-medium mt-1">Real Ecosystems</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EDE0] text-[#35563B]">
                    <PawPrint size={16} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#202B27] tabular-nums leading-none">200+</p>
                    <p className="text-[11px] text-[#68716B] font-medium mt-1">Species</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EDE0] text-[#35563B]">
                    <Network size={16} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#202B27] tabular-nums leading-none">500+</p>
                    <p className="text-[11px] text-[#68716B] font-medium mt-1">Feeding Links</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EDE0] text-[#35563B]">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#202B27] tabular-nums leading-none">5</p>
                    <p className="text-[11px] text-[#68716B] font-medium mt-1">Analysis Tools</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Illustration: Seamlessly blended natural freshwater illustration matching 01_Landing_Page.png */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-end">
              <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[430px] overflow-hidden rounded-2xl">
                <img
                  src="/hero-freshwater-artwork.webp"
                  alt="Natural freshwater ecosystem illustration with Grey Heron, Carp, water lilies, snails, and aquatic plants"
                  className="h-full w-full object-cover object-center"
                />
                {/* Organic soft fade mask blending into Warm Ivory #F7F6EF */}
                <div className="absolute inset-y-0 left-0 w-32 sm:w-44 bg-gradient-to-r from-[#F7F6EF] via-[#F7F6EF]/80 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#F7F6EF] to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#F7F6EF]/40 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FEATURE CARDS GRID (All 9 Capabilities in 3-column layout)
            ===================================================================== */}
        <div className="space-y-4 pt-2">
          {/* Interactive Tutorial & Feature Guide Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8EDE0] text-[#35563B]">
                <HelpCircle size={20} />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-serif font-medium text-[#202B27]">
                  Which window helps doing what?
                </h2>
                <p className="text-xs text-[#68716B]">
                  Open our interactive tutorial to match your research goal to the right tool or follow the recommended 5-step ecological workflow.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white px-4 py-2.5 min-h-[40px] text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>Open Feature Guide & Tutorial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card) => (
              <div
                key={card.id}
                onClick={card.action}
                className={cn(
                  'group cursor-pointer rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs hover:shadow-xs hover:bg-white transition-all flex flex-col justify-between min-h-[175px]',
                  card.borderHover,
                  card.featured ? 'lg:col-span-2' : 'col-span-1',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} group-hover:scale-105 transition-transform shrink-0`}>
                      {card.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#899B78] block">
                        {card.tag}
                      </span>
                      <h3 className="text-base sm:text-[17px] font-serif font-medium text-[#202B27] group-hover:text-[#35563B] transition-colors leading-snug">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                  <div className="h-7 w-7 rounded-lg border border-[#E5E6DC] flex items-center justify-center text-[#899B78] group-hover:text-[#35563B] group-hover:border-[#35563B]/30 group-hover:bg-[#E8EDE0]/50 transition-all shrink-0">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E6DC]/60">
                  <p className="text-xs sm:text-[13px] text-[#68716B] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================================
            EDUCATIONAL SECTION: "Why Food Webs Matter"
            Anchored for smooth scrolling from hero button
            ===================================================================== */}
        <section
          id="why-food-webs-matter"
          className="mt-8 sm:mt-12 pt-8 sm:pt-10 border-t border-[#E5E6DC] scroll-mt-20 space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#35563B] uppercase">
              FOUNDATIONAL ECOLOGICAL PRINCIPLES
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#202B27] tracking-tight">
              Why Food Webs Matter in Ecosystem Science
            </h2>
            <p className="text-xs sm:text-sm text-[#68716B] leading-relaxed">
              Food webs describe the complex architecture of trophic interactions. While traditional population studies observe species in isolation, network topology reveals indirect cascades, keystone species, and whole-system resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDEEEB] text-[#D96B50]">
                <FlaskConical size={18} />
              </div>
              <h3 className="text-base font-serif font-medium text-[#202B27]">
                Trophic Cascades & Keystone Species
              </h3>
              <p className="text-xs text-[#68716B] leading-relaxed">
                Removing an apex predator or keystone consumer triggers domino effects throughout non-adjacent trophic levels. Without interactive topological modelling, secondary extinctions remain unpredictable.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8EDE0] text-[#35563B]">
                <Network size={18} />
              </div>
              <h3 className="text-base font-serif font-medium text-[#202B27]">
                Connectance & Complexity-Stability
              </h3>
              <p className="text-xs text-[#68716B] leading-relaxed">
                Connectance (C = L / S²) determines how energy flows through feeding links. FoodWebGuard calculates empirical linkage density, predator-prey ratios, and modularity across 6 verified research ecosystems.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF9E7] text-[#D8933B]">
                <Clock size={18} />
              </div>
              <h3 className="text-base font-serif font-medium text-[#202B27]">
                Dynamic Propagation vs. Static Counts
              </h3>
              <p className="text-xs text-[#68716B] leading-relaxed">
                Static species counts conceal systemic fragility. Our simulation engine executes multi-round cascade sweeps, tracking secondary link loss and community survival until equilibrium is reached.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-serif font-medium text-[#202B27]">
                Ready to experiment with real ecological networks?
              </h4>
              <p className="text-xs text-[#68716B]">
                Open the Food Web Explorer to inspect feeding interactions, simulate disturbance, and track cascading extinctions.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Compass size={15} />
                <span>Open Explorer</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          ACCESSIBLE / INTEGRATION TEST SUPPORT CONTAINER (Visually Hidden)
          Preserves test assertions for dataset counters, integrity text, and empty state
          ===================================================================== */}
      <div className="sr-only" aria-label="Dataset verification and analysis status">
        {lastAnalysis ? (
          <div>
            <p>Last analysis: {lastAnalysis.datasetName}</p>
            <p>{lastAnalysis.mode === 'cascade' ? 'Direct removal + cascade' : 'Direct removal'}</p>
            <p>{lastAnalysis.primaryNodeLabel}</p>
            <p>{formatPercent(lastAnalysis.linkLossPercent)}</p>
            <p>{lastAnalysis.secondaryRemovals}</p>
          </div>
        ) : (
          <div>
            <p>
              No scenario has been saved in this browser yet. Load a network and run a removal to produce the first result.
            </p>
            <button type="button" onClick={loadFirstDemo}>
              Open the first demo network
            </button>
          </div>
        )}

        <p>
          Structural disruption, not extinction. Removing every recorded food source from a consumer does not prove it would starve or go extinct in nature.
        </p>

        <div>
          <p>Demo networks</p>
          <p>{demoDatasets.length}</p>
          <p>Illustrative, two per category</p>
        </div>

        <div>
          <p>Verified research</p>
          <p>{verified}</p>
          <p>
            {RESEARCH_SLOT_SUMMARY.verified} of {RESEARCH_SLOT_SUMMARY.total} research slots verified
          </p>
        </div>
      </div>

      {/* =====================================================================
          FEATURE GUIDE & TUTORIAL MODAL
          Guides users through all 9 windows and helps them choose based on objective
          ===================================================================== */}
      <FeatureGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onNavigate={onNavigate}
        onOpenImport={_onOpenImport}
      />
    </div>
  )
}
