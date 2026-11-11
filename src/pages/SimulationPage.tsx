import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  HelpCircle,
  Info,
  Leaf,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, useRef } from 'react'
import { FoodWebGraph } from '../components/graph/FoodWebGraph'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { Button, SelectInput, cn } from '../components/ui/primitives'
import { computeBaselineMetrics, formatPercent } from '../core/metrics'
import { runScenario } from '../core/scenarios'
import { TROPHIC_ROLE_LABEL } from '../core/types'
import { useAppState } from '../state/AppState'
import {
  generatePlainEnglishStory,
  getEducationalPresets,
  getSpeciesVulnerabilityDetail,
  PLAIN_METRIC_GUIDE,
  type EducationalPreset,
} from '../core/plainEnglishExplanations'
import type { RouteId } from '../components/layout/routes'

export interface SimulationPageProps {
  onNavigate?: (route: RouteId) => void
}

export function SimulationPage({ onNavigate: _onNavigate }: SimulationPageProps = {}) {
  const {
    dataset,
    graph,
    selectedNodeId,
    selectNode,
    mode,
    setMode,
    runSelectedScenario,
    resetScenario,
    result,
  } = useAppState()

  const [showAnimation, setShowAnimation] = useState(true)
  const [animSpeed, setAnimSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineStep, setTimelineStep] = useState<number>(0)
  const [affectedTab, setAffectedTab] = useState<'direct' | 'cascade'>('direct')
  const [affectedCollapsed, setAffectedCollapsed] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null)
  const [activeHelpMetric, setActiveHelpMetric] = useState<string | null>(null)

  const [userReset, setUserReset] = useState(false)
  // Results panel anchor: on narrow viewports the results render below the fold,
  // so the run action scrolls them into view (desktop columns are side by side).
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const scrollToResultsOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    }
  }

  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  // Default to carp or first consumer if none selected
  useEffect(() => {
    if (!selectedNodeId && graph && graph.nodes.length > 0) {
      const defaultNode =
        graph.nodes.find(
          (n) =>
            n.name.toLowerCase().includes('carp') ||
            n.id.toLowerCase().includes('carp') ||
            n.trophicRole === 'secondary-consumer' ||
            n.trophicRole === 'omnivore',
        ) || graph.nodes[0]
      if (defaultNode) {
        selectNode(defaultNode.id)
      }
    }
  }, [graph, selectedNodeId, selectNode])

  const selectedNode = useMemo(
    () => (graph && selectedNodeId ? graph.nodeById.get(selectedNodeId) ?? null : null),
    [graph, selectedNodeId],
  )

  const activeResult = useMemo(() => {
    if (userReset) return null
    if (result) return result
    if (graph && selectedNode && dataset) {
      try {
        return runScenario(graph, dataset.name, selectedNode.id, mode)
      } catch {
        return null
      }
    }
    return null
  }, [result, graph, selectedNode, dataset, mode, userReset])

  // True while the results card shows the auto-computed example scenario
  // (before the user has run anything). Three QA users read this pre-loaded
  // result as "stale data from a previous session", so it is labelled.
  const [hasUserResult, setHasUserResult] = useState(false)
  const isAutoPreview = !result && !hasUserResult && !userReset && activeResult !== null

  // Educational Presets for beginner 1-click exploration
  const educationalPresets = useMemo(
    () => (graph ? getEducationalPresets(graph) : []),
    [graph],
  )

  // Plain-English story generated dynamically from computed results
  const plainStory = useMemo(() => {
    if (!graph || !baseline || !activeResult) return null
    return generatePlainEnglishStory(graph, baseline, activeResult)
  }, [graph, baseline, activeResult])

  // Apply educational preset
  const handleApplyPreset = (preset: EducationalPreset) => {
    setUserReset(false)
    setHasUserResult(true)
    selectNode(preset.speciesId)
    setMode(preset.mode)
    window.setTimeout(() => {
      runSelectedScenario()
      scrollToResultsOnMobile()
    }, 40)
  }

  // When activeResult updates, set timeline step to final round
  useEffect(() => {
    if (activeResult && activeResult.mode === 'cascade' && activeResult.rounds.length > 0) {
      setTimelineStep(activeResult.rounds.length)
    } else if (activeResult) {
      setTimelineStep(1)
    } else {
      setTimelineStep(0)
    }
    setIsPlaying(false)
  }, [activeResult])

  // Playback timer for timeline
  useEffect(() => {
    if (!isPlaying || !activeResult || activeResult.mode !== 'cascade' || activeResult.rounds.length === 0) return

    const delay = animSpeed === 'slow' ? 2200 : animSpeed === 'fast' ? 800 : 1400
    const timer = setInterval(() => {
      setTimelineStep((curr) => {
        if (curr >= activeResult.rounds.length) {
          setIsPlaying(false)
          return curr
        }
        return curr + 1
      })
    }, delay)

    return () => clearInterval(timer)
  }, [isPlaying, activeResult, animSpeed])

  // Calculate nodes currently removed based on timeline scrubber
  const activeRemovedIds = useMemo(() => {
    if (!activeResult) return []
    if (activeResult.mode !== 'cascade' || activeResult.rounds.length === 0) {
      return activeResult.removedNodeIds
    }
    if (timelineStep === 0) return []
    if (timelineStep === 1) return [activeResult.primaryNodeId]
    const roundIdx = timelineStep - 1
    const includedRounds = activeResult.rounds.slice(0, roundIdx)
    const secondaryIds = includedRounds.flatMap((r) => r.removals.map((rem) => rem.nodeId))
    return [activeResult.primaryNodeId, ...secondaryIds]
  }, [activeResult, timelineStep])

  // Available species list for selector
  const availableSpecies = useMemo(() => {
    if (!graph) return []
    return graph.nodes
  }, [graph])

  // Directly affected consumers list
  const directlyAffectedList = useMemo(() => {
    if (!activeResult || !graph) return []
    return activeResult.scenario.directlyAffectedConsumerIds.map((id) => {
      const node = graph.nodeById.get(id)
      const isDepleted = activeResult.scenario.foodDepletedConsumerIds.includes(id)
      const lostLinks = graph.edges.filter(
        (e) => e.source === activeResult.primaryNodeId && e.target === id,
      ).length
      return {
        id,
        name: node?.name ?? id,
        scientificName: node?.scientificName,
        iconKey: node?.iconKey,
        isDepleted,
        lostLinks: Math.max(1, lostLinks),
      }
    })
  }, [activeResult, graph])

  // Secondary cascade removals list
  const cascadeRemovalsList = useMemo(() => {
    if (!activeResult || activeResult.mode !== 'cascade' || !graph) return []
    return activeResult.rounds.flatMap((r) =>
      r.removals.map((rem) => {
        const node = graph.nodeById.get(rem.nodeId)
        return {
          id: rem.nodeId,
          name: node?.name ?? rem.nodeId,
          scientificName: node?.scientificName,
          iconKey: node?.iconKey,
          round: r.round,
          reason: rem.reason,
        }
      }),
    )
  }, [activeResult, graph])

  const totalRounds = activeResult && activeResult.mode === 'cascade' ? Math.max(1, activeResult.rounds.length) : 1

  // Real-time round explanation for current timeline step
  const currentRoundStory = useMemo(() => {
    if (!activeResult) return 'Load a network and select a species to begin simulation.'
    if (timelineStep === 0) {
      return `Initial Baseline: Natural ecosystem with all ${baseline?.nodeCount ?? 0} species and ${baseline?.linkCount ?? 0} feeding relationships intact.`
    }
    if (timelineStep === 1) {
      return `Round 1 (Direct Impact): "${activeResult.primaryNodeLabel}" was removed. ${activeResult.directlyRemovedLinks.length} feeding link(s) severed. ${directlyAffectedList.length} consumer species lost a food item.`
    }
    if (activeResult.mode === 'cascade' && activeResult.rounds[timelineStep - 2]) {
      const currentRound = activeResult.rounds[timelineStep - 2]
      const starvedNames = currentRound.removals.map((r) => r.label).join(', ')
      return `Round ${currentRound.round + 1} (Starvation Wave): ${starvedNames} lost 100% of their recorded food sources and starved.`
    }
    return `Stabilized Equilibrium: Cascade concluded. Surviving species have viable food sources remaining.`
  }, [activeResult, timelineStep, baseline, directlyAffectedList])

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-[1780px] mx-auto pb-6">
      {/* =====================================================================
          PAGE HEADER / BANNER WITH NEWCOMER ONBOARDING
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text & Quick Presets */}
          <div className="lg:col-span-8 p-4 sm:p-5 lg:p-5 space-y-2 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-normal text-[#202B27] tracking-tight">
                Simulation Laboratory
              </h1>
              <span className="rounded-full bg-[#E8EDE0] border border-[#35563B]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#35563B]">
                Interactive Eco-Modeler
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[#68716B] max-w-2xl leading-relaxed">
              Remove species and observe how the ecosystem responds. Test whether surviving creatures can adapt using backup foods, or whether the disruption triggers a chain-reaction extinction cascade.
            </p>

            {/* Quick Action Presets & Guide Toggle */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#35563B] bg-[#35563B]/10 px-2.5 py-1 text-xs font-semibold text-[#35563B] hover:bg-[#35563B]/20 transition-colors cursor-pointer"
              >
                <BookOpen size={13} />
                <span>{showGuide ? 'Hide Beginner Guide' : '🎓 How This Simulation Works'}</span>
                {showGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <span className="text-[11px] font-bold text-[#899B78] uppercase tracking-wider hidden sm:inline ml-1">
                Try Examples:
              </span>

              {educationalPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.description}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E6DC] bg-white px-2 py-1 text-xs font-medium text-[#202B27] hover:border-[#35563B] hover:bg-[#F7F6EF] transition-all shadow-2xs cursor-pointer"
                >
                  <Sparkles size={12} className="text-[#C06918]" />
                  <span>{preset.title}</span>
                  <span className="text-[10px] text-[#68716B] font-mono">({preset.speciesName})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Banner Ecosystem Art on Right softly fading to Warm Ivory */}
          <div className="lg:col-span-4 relative h-28 sm:h-32 lg:h-full min-h-[100px] w-full overflow-hidden">
            <img
              src="/hero-ecosystem.webp"
              alt="Freshwater ecosystem scenery"
              className="h-full w-full object-cover object-[70%_20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/60 to-transparent" />
          </div>
        </div>

        {/* ===================================================================
            EXPANDABLE BEGINNER GUIDE: "How This Works in 30 Seconds"
            =================================================================== */}
        {showGuide && (
          <div className="border-t border-[#E5E6DC] bg-[#F7F6EF] p-4 sm:p-5 animate-in fade-in duration-200">
            <div className="max-w-4xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-[#C06918]" />
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#202B27]">
                    Beginner's Guide to Food Web Simulations
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="text-xs text-[#68716B] hover:text-[#202B27] underline cursor-pointer"
                >
                  Close guide ✕
                </button>
              </div>

              {/* 3 Step Loop */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-[#E5E6DC] bg-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#35563B] text-white text-[11px] font-bold">1</span>
                    <span className="text-xs font-bold text-[#202B27]">Pick an Organism</span>
                  </div>
                  <p className="text-[11px] text-[#68716B] leading-relaxed">
                    Choose any species in the network. Imagine it vanished due to overharvesting, disease outbreak, or environmental change.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[#E5E6DC] bg-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#35563B] text-white text-[11px] font-bold">2</span>
                    <span className="text-xs font-bold text-[#202B27]">Choose the Mode</span>
                  </div>
                  <p className="text-[11px] text-[#68716B] leading-relaxed">
                    <strong className="text-[#202B27]">Direct:</strong> Measures broken feeding links immediately. <br />
                    <strong className="text-[#202B27]">Cascade:</strong> Simulates starvation dominoes when species lose 100% of their food.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[#E5E6DC] bg-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#35563B] text-white text-[11px] font-bold">3</span>
                    <span className="text-xs font-bold text-[#202B27]">Read the Story</span>
                  </div>
                  <p className="text-[11px] text-[#68716B] leading-relaxed">
                    Did surviving creatures have alternative meals (<strong className="text-[#35563B]">dietary redundancy</strong>), or did specialists starve? The Plain-English story explains why!
                  </p>
                </div>
              </div>

              {/* Plain English Comparison Table */}
              <div className="rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] p-3 text-xs space-y-2">
                <p className="font-bold text-[#202B27] flex items-center gap-1.5">
                  <Info size={14} className="text-[#35563B]" />
                  <span>Key Concepts in Plain English:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#68716B]">
                  <div>
                    <strong className="text-[#202B27]">What is a "Feeding Link"?</strong> In food webs, each arrow represents energy moving from food to consumer (who eats whom). Losing a link means a predator lost one of its food options.
                  </div>
                  <div>
                    <strong className="text-[#202B27]">Why are Secondary Removals sometimes 0?</strong> Because nature has redundancy! If a bird eats 3 kinds of fish and you remove 1, the bird does not starve — it simply eats the other 2.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MAIN 3-COLUMN WORKSPACE: Controls | Simulation View | Results
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* -------------------------------------------------------------------
            COLUMN 1 (Left 3 cols): SIMULATION CONTROLS
            1. Select Simulation Mode
            2. Select a Species
            3. Simulation Settings & Action Button
            ------------------------------------------------------------------- */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-4">
          {/* 1. Select Simulation Mode */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
                1. Select Simulation Mode
              </p>
            </div>

            <div className="space-y-2">
              {/* Option A: Direct Removal */}
              <button
                type="button"
                onClick={() => {
                  setUserReset(false)
                  setMode('direct')
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                  mode === 'direct'
                    ? 'border-[#35563B] bg-[#E8EDE0]/90 shadow-2xs ring-1 ring-[#35563B]'
                    : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5',
                    mode === 'direct' ? 'bg-[#35563B] text-white' : 'bg-[#F0F2E9] text-[#68716B]',
                  )}
                >
                  <Leaf size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#202B27]">Direct Removal</p>
                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[#FCFBF7] border border-[#E5E6DC] text-[#68716B]">
                      1 Step
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68716B] leading-snug mt-1">
                    Removes only the selected species and cuts its feeding links. Surviving animals stay alive.
                  </p>
                </div>
              </button>

              {/* Option B: Direct Removal + Cascade */}
              <button
                type="button"
                onClick={() => {
                  setUserReset(false)
                  setMode('cascade')
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                  mode === 'cascade'
                    ? 'border-[#35563B] bg-[#E8EDE0]/90 shadow-2xs ring-1 ring-[#35563B]'
                    : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5',
                    mode === 'cascade' ? 'bg-[#35563B] text-white' : 'bg-[#F0F2E9] text-[#68716B]',
                  )}
                >
                  <Network size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#202B27]">Direct Removal + Cascade</p>
                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[#FEF4E8] border border-[#F1B36F]/40 text-[#C06918]">
                      Chain Reaction
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68716B] leading-snug mt-1">
                    Simulates starvation dominoes! Any surviving consumer that loses 100% of its food starves in successive rounds.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Select a Species */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
              2. Select a Species
            </p>

            {/* Dropdown Species Selector */}
            <div className="relative">
              <SelectInput
                aria-label="Select species for simulation"
                value={selectedNodeId ?? ''}
                onChange={(e) => {
                  setUserReset(false)
                  selectNode(e.target.value)
                }}
                className="w-full text-xs font-semibold text-[#202B27] rounded-xl border border-[#E5E6DC] bg-white py-2 pl-3 pr-8 shadow-2xs cursor-pointer"
              >
                {availableSpecies.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} {n.scientificName ? `(${n.scientificName})` : ''}
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* Species Preview Card */}
            {selectedNode && (
              <div className="rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3 flex items-center gap-3">
                <SpeciesIcon
                  iconKey={selectedNode.iconKey}
                  size={46}
                  className="rounded-lg bg-white border border-[#E5E6DC] p-1 shrink-0"
                  label={selectedNode.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#202B27] truncate">{selectedNode.name}</p>
                  <p className="text-[10.5px] italic text-[#68716B] truncate">
                    {selectedNode.scientificName || `${selectedNode.name.toLowerCase()} sp.`}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-block text-[9.5px] font-semibold bg-[#FEF4E8] text-[#C06918] px-2 py-0.2 rounded-full border border-[#F1B36F]/40">
                      {TROPHIC_ROLE_LABEL[selectedNode.trophicRole] || 'Consumer'}
                    </span>
                    {graph && (
                      <span className="text-[9.5px] text-[#68716B]">
                        {(graph.foodSourcesOf.get(selectedNode.id) ?? []).length} food sources · {(graph.consumersOf.get(selectedNode.id) ?? []).length} predators
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Simulation Settings & Action Button */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
              3. Simulation Settings
            </p>

            {/* Step-by-step animation toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#202B27] font-medium">Show step-by-step animation</span>
              <button
                type="button"
                onClick={() => setShowAnimation((prev) => !prev)}
                className={cn(
                  'h-5 w-9 rounded-full transition-colors relative p-0.5 cursor-pointer',
                  showAnimation ? 'bg-[#35563B]' : 'bg-[#E5E6DC]',
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-full bg-white transition-transform',
                    showAnimation ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Animation speed slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#68716B]">
                <span>Animation speed</span>
                <span className="capitalize font-semibold text-[#202B27]">{animSpeed}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#899B78] pt-1 gap-1">
                <button
                  type="button"
                  onClick={() => setAnimSpeed('slow')}
                  className={cn(
                    'px-3 py-1 min-h-[32px] min-w-[44px] flex items-center justify-center rounded cursor-pointer transition-colors',
                    animSpeed === 'slow' ? 'bg-[#35563B] text-white font-bold' : 'hover:bg-[#F0F2E9]',
                  )}
                >
                  Slow
                </button>
                <button
                  type="button"
                  onClick={() => setAnimSpeed('normal')}
                  className={cn(
                    'px-3 py-1 min-h-[32px] min-w-[44px] flex items-center justify-center rounded cursor-pointer transition-colors',
                    animSpeed === 'normal' ? 'bg-[#35563B] text-white font-bold' : 'hover:bg-[#F0F2E9]',
                  )}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setAnimSpeed('fast')}
                  className={cn(
                    'px-3 py-1 min-h-[32px] min-w-[44px] flex items-center justify-center rounded cursor-pointer transition-colors',
                    animSpeed === 'fast' ? 'bg-[#35563B] text-white font-bold' : 'hover:bg-[#F0F2E9]',
                  )}
                >
                  Fast
                </button>
              </div>
            </div>

            {/* Primary Action Button: Run Simulation */}
            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                size="md"
                block
                icon={<Play size={15} className="fill-white" />}
                onClick={() => {
                  setUserReset(false)
                  setHasUserResult(true)
                  runSelectedScenario()
                  scrollToResultsOnMobile()
                }}
                disabled={!selectedNodeId}
                className="bg-[#35563B] hover:bg-[#263D2D] text-white font-bold py-2.5 text-xs sm:text-sm shadow-xs min-h-[44px] cursor-pointer"
              >
                <span>Run Simulation</span>
                <ArrowRight size={15} />
              </Button>

              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  block
                  icon={<RotateCcw size={13} />}
                  onClick={() => {
                    setUserReset(true)
                    setHasUserResult(false)
                    resetScenario()
                  }}
                  className="text-xs py-1.5 border-[#E5E6DC] text-[#68716B] hover:text-[#202B27] cursor-pointer"
                >
                  Reset simulation
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            COLUMN 2 (Center 5.5 cols): FOOD WEB (SIMULATION VIEW)
            ------------------------------------------------------------------- */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-3">
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-3.5 shadow-2xs flex flex-col min-h-[490px]">
            {/* Header: Title + Mini Legend */}
            <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[#E5E6DC] gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#202B27]">
                  Food Web (Simulation View)
                </h3>
              </div>

              {/* Trophic Roles Mini Legend */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#68716B]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#EF9A88]" /> Apex</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#F1B36F]" /> Tertiary</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#F3D98B]" /> Secondary</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#91BFE0]" /> Primary</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#B5D39A]" /> Producer</span>
                <span className="flex items-center gap-1 pl-1 border-l border-[#E5E6DC]">
                  <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#EF9A88] flex items-center justify-center text-[7px] text-[#EF9A88] font-bold">✕</span>
                  Removed
                </span>
              </div>
            </div>

            {/* Cytoscape Simulation Graph Canvas */}
            <div className="relative mt-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] overflow-hidden h-[420px] min-h-[380px]">
              {graph ? (
                <FoodWebGraph
                  graph={graph}
                  removedNodeIds={activeRemovedIds}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={selectNode}
                  highlightLinks={true}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#68716B]">
                  No graph loaded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            COLUMN 3 (Right 3.5 cols): SIMULATION RESULTS & PLAIN ENGLISH STORY
            ------------------------------------------------------------------- */}
        <div ref={resultsRef} className="lg:col-span-4 xl:col-span-4 space-y-3.5 scroll-mt-20">
          {/* Header & Status Card */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#202B27]">Simulation Results</h3>
                <span className="text-[10px] text-[#899B78]">· Real-time</span>
              </div>
              {activeResult && (
                <span className="rounded-full bg-[#FDEEEB] border border-[#EF9A88]/40 px-2 py-0.5 text-[10px] font-bold text-[#EF9A88]">
                  {selectedNode?.name ?? 'Species'} Removed
                </span>
              )}
            </div>

            {/* Context callout: Auto preview vs User scenario */}
            {isAutoPreview ? (
              <p className="rounded-lg border border-[#E5E6DC] bg-[#F0F2E9]/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[#4A544E]" aria-live="polite">
                <strong className="font-semibold text-[#35563B]">Example preview</strong> — computed automatically so you can
                see how results look. Choose your own species and press <strong className="font-semibold">Run Simulation</strong> to
                replace it with your own scenario.
              </p>
            ) : activeResult ? (
              <p className="rounded-lg border border-[#E8EDE0] bg-[#E8EDE0]/50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[#263D2D]" aria-live="polite">
                <strong className="font-semibold text-[#35563B]">Scenario active</strong> — showing simulation outcomes for <strong className="font-semibold">{selectedNode?.name ?? 'selected species'}</strong>.
              </p>
            ) : null}

            {/* Plain-English Ecosystem Impact Meter */}
            {plainStory && (
              <div
                className="rounded-xl border p-2.5 text-xs space-y-1"
                style={{
                  backgroundColor: plainStory.severityColor.bg,
                  borderColor: plainStory.severityColor.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68716B]">
                    Ecosystem Impact Level
                  </span>
                  <span
                    className="font-bold text-[10.5px] px-2 py-0.5 rounded-full border bg-white"
                    style={{
                      color: plainStory.severityColor.text,
                      borderColor: plainStory.severityColor.border,
                    }}
                  >
                    {plainStory.severityLabel}
                  </span>
                </div>
                <p className="text-[11px] leading-snug font-medium" style={{ color: plainStory.severityColor.text }}>
                  {plainStory.headline}
                </p>
              </div>
            )}

            {/* 2x2 Quantitative Metrics Grid with Plain-English Subtitles */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {/* Metric 1: Species Removed */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white relative group">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Species Removed</span>
                  <button
                    type="button"
                    onClick={() => setActiveHelpMetric(activeHelpMetric === 'speciesRemoved' ? null : 'speciesRemoved')}
                    className="text-[#899B78] hover:text-[#35563B] cursor-pointer"
                    title="What does this mean?"
                  >
                    <HelpCircle size={11} />
                  </button>
                </div>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? (activeResult.mode === 'cascade' ? 1 : activeResult.removedNodeIds.length) : '0'}
                </p>
                <span className="text-[10px] text-[#899B78]">(Direct)</span>
                <span className="text-[9.5px] text-[#68716B] block mt-0.5">Primary removal target</span>
              </div>

              {/* Metric 2: Links Lost */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white relative group">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Links Lost</span>
                  <button
                    type="button"
                    onClick={() => setActiveHelpMetric(activeHelpMetric === 'linksLost' ? null : 'linksLost')}
                    className="text-[#899B78] hover:text-[#35563B] cursor-pointer"
                    title="What does this mean?"
                  >
                    <HelpCircle size={11} />
                  </button>
                </div>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? activeResult.scenario.linksLost : '0'}
                </p>
                <span className="text-[10px] text-[#68716B] tabular-nums truncate block">
                  out of {baseline?.linkCount ?? 0} {activeResult && activeResult.scenario.linkLossPercent.value !== null ? `(${formatPercent(activeResult.scenario.linkLossPercent.value)})` : ''}
                </span>
                <span className="text-[9.5px] text-[#68716B] block mt-0.5">Feeding links broken</span>
              </div>

              {/* Metric 3: Secondary Removals */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white relative group">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Secondary Removals</span>
                  <button
                    type="button"
                    onClick={() => setActiveHelpMetric(activeHelpMetric === 'secondaryRemovals' ? null : 'secondaryRemovals')}
                    className="text-[#899B78] hover:text-[#35563B] cursor-pointer"
                    title="What does this mean?"
                  >
                    <HelpCircle size={11} />
                  </button>
                </div>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? activeResult.scenario.secondaryRemovals : '0'}
                </p>
                <span className="text-[10px] text-[#899B78]">(via cascade)</span>
                <span className="text-[9.5px] text-[#68716B] block mt-0.5">
                  {activeResult?.scenario.secondaryRemovals === 0 ? '0 starved (backup food saved them)' : 'Starved (0 food left)'}
                </span>
              </div>

              {/* Metric 4: Total Removed */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white relative group">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Total Removed</span>
                  <button
                    type="button"
                    onClick={() => setActiveHelpMetric(activeHelpMetric === 'totalRemoved' ? null : 'totalRemoved')}
                    className="text-[#899B78] hover:text-[#35563B] cursor-pointer"
                    title="What does this mean?"
                  >
                    <HelpCircle size={11} />
                  </button>
                </div>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? activeResult.removedNodeIds.length : '0'}
                </p>
                <span className="text-[10px] text-[#68716B] tabular-nums truncate block">
                  out of {baseline?.nodeCount ?? 0}
                </span>
                <span className="text-[9.5px] text-[#68716B] block mt-0.5">Initial + starvation</span>
              </div>
            </div>

            {/* Interactive metric helper callout */}
            {activeHelpMetric && PLAIN_METRIC_GUIDE[activeHelpMetric] && (
              <div className="p-2.5 rounded-xl border border-[#35563B]/30 bg-[#E8EDE0]/70 text-xs space-y-1 relative">
                <button
                  type="button"
                  onClick={() => setActiveHelpMetric(null)}
                  className="absolute right-2 top-2 text-[#68716B] hover:text-[#202B27]"
                >
                  <X size={12} />
                </button>
                <p className="font-bold text-[#35563B]">
                  💡 {PLAIN_METRIC_GUIDE[activeHelpMetric].title}
                </p>
                <p className="text-[11px] text-[#202B27]">
                  {PLAIN_METRIC_GUIDE[activeHelpMetric].simpleExplanation}
                </p>
                <p className="text-[10.5px] italic text-[#68716B]">
                  Analogy: {PLAIN_METRIC_GUIDE[activeHelpMetric].analogy}
                </p>
              </div>
            )}
          </div>

          {/* =================================================================
              DEDICATED PLAIN-ENGLISH ECOSYSTEM STORY
              Answers the student's question: "What actually happened here?"
              ================================================================= */}
          {plainStory && (
            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5E6DC]">
                <BookOpen size={15} className="text-[#35563B]" />
                <h4 className="text-xs font-bold text-[#202B27] uppercase tracking-wider">
                  Plain-English Ecosystem Story
                </h4>
              </div>

              <div className="space-y-2 text-xs text-[#4A544E] leading-relaxed">
                <p className="font-semibold text-[#202B27] text-[12.5px]">
                  {plainStory.headline}
                </p>
                <p className="text-[11px]">
                  {plainStory.directRemovalStory}
                </p>
                <p className="text-[11px]">
                  {plainStory.cascadeStory}
                </p>
                <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] text-[10.5px] text-[#68716B] space-y-1">
                  <span className="font-semibold text-[#35563B] block">💡 Ecological Insight:</span>
                  <span>{plainStory.keyEcologicalPrinciple}</span>
                </div>
              </div>
            </div>
          )}

          {/* Affected Species List Card with Expandable Cause-and-Effect Details */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#202B27]">Affected Species</span>
                <span className="text-[10px] text-[#68716B]">
                  (Click any species for cause-and-effect)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAffectedCollapsed((prev) => !prev)}
                className="text-[#68716B] hover:text-[#202B27] cursor-pointer"
                aria-label={affectedCollapsed ? 'Expand affected list' : 'Collapse affected list'}
              >
                {affectedCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {!affectedCollapsed && (
              <div className="space-y-3">
                {/* Tabs: Direct Effects | Cascade Effects */}
                <div className="flex border-b border-[#E5E6DC] text-xs">
                  <button
                    type="button"
                    onClick={() => setAffectedTab('direct')}
                    className={cn(
                      'flex-1 pb-1.5 font-semibold text-center border-b-2 transition-colors cursor-pointer',
                      affectedTab === 'direct'
                        ? 'border-[#35563B] text-[#35563B]'
                        : 'border-transparent text-[#68716B] hover:text-[#202B27]',
                    )}
                  >
                    Direct Effects ({directlyAffectedList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffectedTab('cascade')}
                    className={cn(
                      'flex-1 pb-1.5 font-semibold text-center border-b-2 transition-colors cursor-pointer',
                      affectedTab === 'cascade'
                        ? 'border-[#35563B] text-[#35563B]'
                        : 'border-transparent text-[#68716B] hover:text-[#202B27]',
                    )}
                  >
                    Cascade Effects ({cascadeRemovalsList.length})
                  </button>
                </div>

                {/* List Content */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {affectedTab === 'direct' ? (
                    directlyAffectedList.length ? (
                      directlyAffectedList.map((item) => {
                        const isExpanded = expandedSpeciesId === item.id
                        const detail = graph ? getSpeciesVulnerabilityDetail(graph, activeResult, item.id) : null
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-[#E5E6DC] bg-white overflow-hidden text-xs transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedSpeciesId(isExpanded ? null : item.id)}
                              className="w-full flex items-center justify-between p-2 text-left hover:bg-[#F7F6EF] cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                <SpeciesIcon iconKey={item.iconKey} size={22} className="shrink-0" />
                                <span className="font-semibold text-[#202B27] leading-tight min-w-0">
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-[9.5px] font-semibold',
                                    item.isDepleted
                                      ? 'bg-[#FEF9E7] text-[#C06918] border border-[#F3D98B]'
                                      : 'bg-[#FDEEEB] text-[#EF9A88] border border-[#EF9A88]/40',
                                  )}
                                >
                                  {item.isDepleted ? 'Food depleted' : 'Lost food source'}
                                </span>
                                <span className="text-[10px] font-semibold text-[#EF9A88] tabular-nums">
                                  ↓ -{item.lostLinks} link
                                </span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </div>
                            </button>

                            {/* Expanded Interactive Cause & Effect Breakdown */}
                            {isExpanded && detail && (
                              <div className="p-2.5 border-t border-[#E5E6DC] bg-[#FCFBF7] text-[11px] space-y-1.5 animate-in fade-in duration-150">
                                <p className="text-[#202B27] leading-relaxed">
                                  <strong className="text-[#35563B]">Cause: </strong>
                                  {detail.causeAndEffect}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#68716B]">
                                  <span className="font-semibold">Remaining food items:</span>
                                  {detail.remainingFoodNames.length ? (
                                    <span className="text-[#202B27]">{detail.remainingFoodNames.join(', ')} ({detail.remainingFoodCount} backup sources)</span>
                                  ) : (
                                    <span className="text-[#C04938] font-bold">None left (Food depleted)</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs text-[#68716B] italic py-2 text-center">
                        {activeResult ? 'No direct consumers affected.' : 'Run a simulation to observe effects.'}
                      </p>
                    )
                  ) : cascadeRemovalsList.length ? (
                    cascadeRemovalsList.map((item) => {
                      const isExpanded = expandedSpeciesId === item.id
                      const detail = graph ? getSpeciesVulnerabilityDetail(graph, activeResult, item.id) : null
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-[#E5E6DC] bg-white overflow-hidden text-xs transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedSpeciesId(isExpanded ? null : item.id)}
                            className="w-full flex items-center justify-between p-2 text-left hover:bg-[#F7F6EF] cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <SpeciesIcon iconKey={item.iconKey} size={22} className="shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold text-[#202B27] truncate block">{item.name}</span>
                                <span className="text-[9.5px] text-[#899B78]">Round {item.round}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-[#FDEEEB] text-[#EF9A88] border border-[#EF9A88]/40">
                                Removed (Starved)
                              </span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>
                          </button>

                          {/* Expanded Interactive Cause & Effect Breakdown */}
                          {isExpanded && detail && (
                            <div className="p-2.5 border-t border-[#E5E6DC] bg-[#FCFBF7] text-[11px] space-y-1.5 animate-in fade-in duration-150">
                              <p className="text-[#C04938] leading-relaxed">
                                <strong>Starvation Cause: </strong>
                                {item.reason || detail.causeAndEffect}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-[#68716B] italic py-2 text-center">
                      {activeResult && activeResult.mode === 'cascade'
                        ? 'No secondary cascading removals (ecosystem resilient).'
                        : 'Cascade mode not active or no secondary removals.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM ROW: CASCADE TIMELINE SCRUBBER WITH LIVE ROUND EXPLAINER
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Scrubber Header & Playback Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E6DC]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#35563B]" />
            <h3 className="text-sm sm:text-base font-bold text-[#202B27]">
              Cascade Timeline
            </h3>
            <span className="text-xs text-[#68716B]">
              ({activeResult ? activeResult.removedNodeIds.length : 0} species removed total)
            </span>
            {_onNavigate && (
              <button
                type="button"
                onClick={() => _onNavigate('timeline')}
                className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#35563B] hover:text-[#263D2D] hover:underline cursor-pointer"
              >
                <span>Open Full Timeline Studio →</span>
              </button>
            )}
          </div>

          {/* Controls: Play/Pause, Slider, Round indicator, Step buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              disabled={!activeResult || activeResult.mode !== 'cascade' || activeResult.rounds.length === 0}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#35563B] text-white hover:bg-[#263D2D] disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
              title={isPlaying ? 'Pause timeline' : 'Play timeline'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="translate-x-0.5" />}
            </button>

            {/* Scrubber slider */}
            <input
              type="range"
              min={0}
              max={totalRounds}
              value={timelineStep}
              onChange={(e) => {
                setTimelineStep(Number(e.target.value))
                setIsPlaying(false)
              }}
              disabled={!activeResult || activeResult.mode !== 'cascade'}
              className="w-28 sm:w-44 accent-[#35563B] cursor-pointer"
            />

            <span className="text-xs font-bold text-[#202B27] tabular-nums">
              Round {timelineStep} / {totalRounds}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimelineStep((c) => Math.max(0, c - 1))}
                disabled={timelineStep <= 0}
                className="h-6 w-6 flex items-center justify-center rounded border border-[#E5E6DC] bg-white text-[#68716B] hover:text-[#202B27] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => setTimelineStep((c) => Math.min(totalRounds, c + 1))}
                disabled={timelineStep >= totalRounds}
                className="h-6 w-6 flex items-center justify-center rounded border border-[#E5E6DC] bg-white text-[#68716B] hover:text-[#202B27] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Round Stepper with Real Cascade Rounds */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          {/* Box 0: Initial State */}
          <div
            onClick={() => setTimelineStep(0)}
            className={cn(
              'rounded-xl border p-3 text-center cursor-pointer transition-all',
              timelineStep === 0
                ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Network size={16} className="text-[#35563B]" />
              <span className="text-xs font-bold text-[#202B27]">Initial State</span>
            </div>
            <p className="text-[11px] text-[#68716B] tabular-nums">
              {baseline ? baseline.nodeCount : 0} species · {baseline ? baseline.linkCount : 0} links
            </p>
          </div>

          {/* Box 1: Round 1 (Direct Removal) */}
          <div
            onClick={() => setTimelineStep(1)}
            className={cn(
              'rounded-xl border p-3 cursor-pointer transition-all relative flex items-center gap-2.5',
              timelineStep === 1
                ? 'border-[#EF9A88] bg-[#FDEEEB] shadow-2xs ring-1 ring-[#EF9A88]'
                : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
            )}
          >
            <div className="relative shrink-0">
              <SpeciesIcon iconKey={selectedNode?.iconKey} size={32} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF9A88] text-white text-[8px] font-bold">
                ✕
              </span>
            </div>
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-bold uppercase text-[#68716B] block">Round 1</span>
              <p className="text-xs font-bold text-[#EF9A88] truncate">{selectedNode?.name ?? 'Species'} removed</p>
              <p className="text-[10px] text-[#68716B] tabular-nums">
                {directlyAffectedList.length} affected
              </p>
            </div>
          </div>

          {/* Box 2: Round 2 (Cascade Starvation or Resilient Buffer) */}
          <div
            onClick={() => setTimelineStep(totalRounds > 1 ? 2 : 1)}
            className={cn(
              'rounded-xl border p-3 cursor-pointer transition-all relative flex items-center gap-2.5',
              timelineStep === 2
                ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
            )}
          >
            <div className="relative shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#E8EDE0] border border-[#35563B]/30 text-[#35563B]">
              {cascadeRemovalsList[0] ? (
                <>
                  <SpeciesIcon iconKey={cascadeRemovalsList[0].iconKey} size={32} />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF9A88] text-white text-[8px] font-bold">
                    ✕
                  </span>
                </>
              ) : (
                <ShieldCheck size={20} className="text-[#35563B]" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-bold uppercase text-[#68716B] block">
                {cascadeRemovalsList[0] ? 'Round 2' : 'Cascade Halt'}
              </span>
              <p className="text-xs font-bold text-[#202B27] truncate">
                {cascadeRemovalsList[0]?.name ? `${cascadeRemovalsList[0].name} starved` : '0 starved (resilient)'}
              </p>
              <p className="text-[10px] text-[#68716B] tabular-nums">
                {cascadeRemovalsList[0] ? 'Chain reaction triggered' : 'Dietary redundancy saved web'}
              </p>
            </div>
          </div>

          {/* Box 3: Round 3+ or Stabilized State */}
          <div
            onClick={() => setTimelineStep(totalRounds)}
            className={cn(
              'rounded-xl border p-3 cursor-pointer transition-all relative flex items-center gap-2.5',
              timelineStep >= 3 || (totalRounds <= 2 && timelineStep === totalRounds && timelineStep > 0)
                ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
            )}
          >
            <div className="relative shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F6EF] border border-[#E5E6DC] text-[#35563B]">
              {cascadeRemovalsList[1] ? (
                <>
                  <SpeciesIcon iconKey={cascadeRemovalsList[1].iconKey} size={32} />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF9A88] text-white text-[8px] font-bold">
                    ✕
                  </span>
                </>
              ) : (
                <Leaf size={18} className="text-[#35563B]" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-bold uppercase text-[#68716B] block">
                {activeResult && activeResult.rounds.length >= 2 ? 'Round 3' : 'Stabilized Equilibrium'}
              </span>
              <p className="text-xs font-bold text-[#202B27] truncate">
                {cascadeRemovalsList[1]?.name ? `${cascadeRemovalsList[1].name} starved` : 'Ecosystem stabilized'}
              </p>
              <p className="text-[10px] text-[#68716B] tabular-nums">
                {activeResult ? `${activeResult.scenario.nodeCount} species surviving` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Step Explanation Callout */}
        <div className="rounded-xl border border-[#E5E6DC] bg-white p-3 flex items-start gap-2.5 text-xs">
          <Info size={15} className="text-[#35563B] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#202B27] mr-1.5">What is happening in this step:</span>
            <span className="text-[#4A544E]">{currentRoundStory}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
