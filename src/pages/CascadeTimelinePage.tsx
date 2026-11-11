import {
  ArrowDown,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  Lightbulb,
  Network,
  Pause,
  Play,
  Search,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FoodWebGraph } from '../components/graph/FoodWebGraph'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { SelectInput, cn } from '../components/ui/primitives'
import { computeBaselineMetrics, formatPercent } from '../core/metrics'
import { runScenario } from '../core/scenarios'
import { TROPHIC_ROLE_LABEL } from '../core/types'
import { useAppState } from '../state/AppState'
import {
  generatePlainEnglishStory,
  getEducationalPresets,
  type EducationalPreset,
} from '../core/plainEnglishExplanations'
import type { RouteId } from '../components/layout/routes'

export interface CascadeTimelinePageProps {
  onNavigate?: (route: RouteId) => void
}

export function CascadeTimelinePage({ onNavigate: _onNavigate }: CascadeTimelinePageProps = {}) {
  const {
    dataset,
    graph,
    selectedNodeId,
    selectNode,
    mode,
    setMode,
    runSelectedScenario,
    result,
  } = useAppState()

  const [simMode, setSimMode] = useState<'direct' | 'cascade'>('cascade')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [showGuide, setShowGuide] = useState(false)

  // Sync mode with global app state
  useEffect(() => {
    if (mode !== simMode) {
      setMode(simMode)
    }
  }, [simMode, mode, setMode])

  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  // Select a sensible default species (e.g. Carp or key consumer) if none is selected
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
  }, [selectedNodeId, graph, selectNode])

  const selectedNode = useMemo(
    () => (graph && selectedNodeId ? graph.nodeById.get(selectedNodeId) ?? null : null),
    [graph, selectedNodeId],
  )

  // Compute activeResult: use existing result if matching, or compute dynamically from empirical graph
  const activeResult = useMemo(() => {
    if (result && result.primaryNodeId === selectedNodeId && result.mode === simMode) {
      return result
    }
    if (graph && selectedNode && dataset) {
      try {
        return runScenario(graph, dataset.name, selectedNode.id, simMode)
      } catch {
        return null
      }
    }
    return null
  }, [result, graph, selectedNode, dataset, simMode, selectedNodeId])

  // Plain-English story generated dynamically from computed results
  const plainStory = useMemo(() => {
    if (!graph || !baseline || !activeResult) return null
    return generatePlainEnglishStory(graph, baseline, activeResult)
  }, [graph, baseline, activeResult])

  // Educational presets for 1-click exploration
  const educationalPresets = useMemo(
    () => (graph ? getEducationalPresets(graph) : []),
    [graph],
  )

  const handleApplyPreset = (preset: EducationalPreset) => {
    selectNode(preset.speciesId)
    setSimMode(preset.mode)
    setMode(preset.mode)
    window.setTimeout(() => {
      runSelectedScenario()
    }, 40)
  }

  // Total progression steps: 0 = Initial, 1 = Round 1, ..., N = Round N
  const totalRounds = useMemo(() => {
    if (!activeResult) return 0
    if (activeResult.mode === 'cascade') {
      return 1 + activeResult.rounds.length
    }
    return 1
  }, [activeResult])

  // When activeResult changes, set default step to Round 2 (or total rounds) to showcase active cascade
  useEffect(() => {
    if (activeResult && activeResult.mode === 'cascade' && activeResult.rounds.length > 0) {
      setCurrentStep(Math.min(2, 1 + activeResult.rounds.length))
    } else if (activeResult) {
      setCurrentStep(1)
    } else {
      setCurrentStep(0)
    }
    setIsPlaying(false)
  }, [activeResult])

  // Auto-play animation timer
  useEffect(() => {
    if (!isPlaying || !activeResult || totalRounds <= 0) {
      return
    }
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalRounds) {
          setIsPlaying(false)
          return totalRounds
        }
        return prev + 1
      })
    }, 1800)
    return () => clearInterval(timer)
  }, [isPlaying, activeResult, totalRounds])

  const availableSpecies = useMemo(() => {
    if (!graph) return []
    return graph.nodes
  }, [graph])

  // Calculate removed node IDs up to current step
  const activeRemovedIds = useMemo(() => {
    if (!activeResult) return []
    if (activeResult.mode !== 'cascade' || activeResult.rounds.length === 0) {
      return currentStep > 0 ? activeResult.removedNodeIds : []
    }
    if (currentStep === 0) return []
    if (currentStep === 1) return [activeResult.primaryNodeId]
    const includedRounds = activeResult.rounds.slice(0, currentStep - 1)
    const secondaryIds = includedRounds.flatMap((r) => r.removals.map((rem) => rem.nodeId))
    return [activeResult.primaryNodeId, ...secondaryIds]
  }, [activeResult, currentStep])

  // Cumulative species remaining and link loss over rounds for bottom charts
  const progressionData = useMemo(() => {
    if (!baseline || !activeResult) return []
    const points = [
      {
        roundLabel: 'Initial',
        step: 0,
        speciesRemaining: baseline.nodeCount,
        cumulativeLinksLost: 0,
      },
    ]

    const primaryLinksLost = activeResult.directlyRemovedLinks.length
    points.push({
      roundLabel: 'Round 1',
      step: 1,
      speciesRemaining: baseline.nodeCount - 1,
      cumulativeLinksLost: primaryLinksLost,
    })

    if (activeResult.mode === 'cascade') {
      let removedCount = 1
      let linksLostCount = primaryLinksLost
      const totalLoss = activeResult.scenario.linksLost
      activeResult.rounds.forEach((round, idx) => {
        removedCount += round.removals.length
        const roundProgress = (idx + 1) / Math.max(1, activeResult.rounds.length)
        linksLostCount = Math.round(primaryLinksLost + (totalLoss - primaryLinksLost) * roundProgress)

        points.push({
          roundLabel: `Round ${idx + 2}`,
          step: idx + 2,
          speciesRemaining: Math.max(0, baseline.nodeCount - removedCount),
          cumulativeLinksLost: Math.min(totalLoss, linksLostCount),
        })
      })
    }
    return points
  }, [baseline, activeResult])

  // Removed species list with round details and plain-English cause
  const removedSpeciesCards = useMemo(() => {
    if (!activeResult || !graph) return []
    const cards: Array<{
      id: string
      name: string
      iconKey?: string
      roundLabel: string
      role: string
      reason: string
    }> = []

    // Primary initial removal
    const primaryNode = graph.nodeById.get(activeResult.primaryNodeId)
    cards.push({
      id: activeResult.primaryNodeId,
      name: primaryNode?.name ?? activeResult.primaryNodeId,
      iconKey: primaryNode?.iconKey,
      roundLabel: 'Round 1',
      role: primaryNode?.trophicRole ? (TROPHIC_ROLE_LABEL[primaryNode.trophicRole] ?? 'Target') : 'Target',
      reason: 'Deliberately removed at start of experiment',
    })

    // Cascade secondary removals
    if (activeResult.mode === 'cascade') {
      activeResult.rounds.forEach((r) => {
        r.removals.forEach((rem) => {
          const node = graph.nodeById.get(rem.nodeId)
          cards.push({
            id: rem.nodeId,
            name: node?.name ?? rem.nodeId,
            iconKey: node?.iconKey,
            roundLabel: `Round ${r.round + 1}`,
            role: node?.trophicRole ? (TROPHIC_ROLE_LABEL[node.trophicRole] ?? 'Consumer') : 'Consumer',
            reason: rem.reason || 'Lost 100% of recorded food sources and starved',
          })
        })
      })
    }
    return cards
  }, [activeResult, graph])

  // Real-time round description
  const currentStepDescription = useMemo(() => {
    if (!activeResult) return 'Select a species to examine round-by-round effects.'
    if (currentStep === 0) {
      return `Baseline Ecosystem: All ${baseline?.nodeCount ?? 0} species and ${baseline?.linkCount ?? 0} feeding links intact.`
    }
    if (currentStep === 1) {
      return `Round 1 (Direct Removal): "${activeResult.primaryNodeLabel}" removed. ${activeResult.directlyRemovedLinks.length} feeding links severed.`
    }
    if (activeResult.mode === 'cascade' && activeResult.rounds[currentStep - 2]) {
      const r = activeResult.rounds[currentStep - 2]
      return `Round ${r.round + 1} (Starvation Cascade): ${r.removals.map((rem) => rem.label).join(', ')} had 0 food sources remaining and starved.`
    }
    return `Ecosystem Stabilized: No further consumer met the starvation rule.`
  }, [activeResult, currentStep, baseline])

  return (
    <div className="space-y-4 max-w-[1780px] mx-auto pb-8">
      {/* =====================================================================
          1. PAGE HEADER / BANNER WITH NEWCOMER ONBOARDING
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text */}
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-6 space-y-2 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#202B27] tracking-tight">
                Cascade Timeline
              </h1>
              <span className="rounded-full bg-[#E8EDE0] border border-[#35563B]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#35563B]">
                Step-by-Step Chain Reaction Studio
              </span>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#68716B] max-w-2xl leading-relaxed">
              Explore the sequential rounds of species loss. Watch how the disappearance of a single organism can trigger a domino effect across the entire food web.
            </p>

            {/* Quick Action Presets & Guide Toggle */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#35563B] bg-[#35563B]/10 px-2.5 py-1 text-xs font-semibold text-[#35563B] hover:bg-[#35563B]/20 transition-colors cursor-pointer"
              >
                <BookOpen size={13} />
                <span>{showGuide ? 'Hide Timeline Guide' : '🎓 How Cascade Extinctions Work'}</span>
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

          {/* Freshwater Ecosystem Illustration */}
          <div className="lg:col-span-4 h-36 lg:h-full relative overflow-hidden flex items-center justify-end">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/50 to-transparent z-1 lg:w-32" />
            <img
              src="/hero-freshwater-artwork.webp"
              alt="Freshwater ecosystem"
              className="w-full h-full object-cover object-[80%_25%] max-h-44"
            />
          </div>
        </div>

        {/* ===================================================================
            EXPANDABLE GUIDE: "What is an Extinction Cascade?"
            =================================================================== */}
        {showGuide && (
          <div className="border-t border-[#E5E6DC] bg-[#F7F6EF] p-4 sm:p-5 animate-in fade-in duration-200">
            <div className="max-w-4xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-[#C06918]" />
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#202B27]">
                    How Extinction Cascades Work in Nature and in This Studio
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-[#E5E6DC] bg-white space-y-1">
                  <span className="font-bold text-[#202B27] block">1. The Trigger Event</span>
                  <p className="text-[11px] text-[#68716B] leading-relaxed">
                    A species is removed (Round 1). Its predators suddenly lose a primary food source, while its prey species are relieved of hunting pressure.
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E6DC] bg-white space-y-1">
                  <span className="font-bold text-[#202B27] block">2. The 100% Starvation Rule</span>
                  <p className="text-[11px] text-[#68716B] leading-relaxed">
                    Under standard ecological modeling rules, a consumer is only removed if <strong className="text-[#C04938]">all 100%</strong> of its recorded food items disappear. If it has backup foods, it survives!
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E6DC] bg-white space-y-1">
                  <span className="font-bold text-[#202B27] block">3. Multi-Round Dominoes</span>
                  <p className="text-[11px] text-[#68716B] leading-relaxed">
                    When Round 2 creatures starve, predators eating *them* may also run out of food in Round 3. The cascade halts when every surviving animal has at least one meal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          2. SETUP & CONTROLS ROW
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Card 1: 1. Select a Species to Remove */}
        <div className="xl:col-span-4 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
            1. Select a Species to Remove
          </p>

          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#899B78]"
            />
            <SelectInput
              aria-label="Select a species to remove"
              value={selectedNodeId ?? ''}
              onChange={(e) => selectNode(e.target.value)}
              className="w-full text-xs font-semibold text-[#202B27] rounded-xl border border-[#E5E6DC] bg-white py-2 pl-9 pr-8 shadow-2xs cursor-pointer"
            >
              {availableSpecies.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} {n.scientificName ? `(${n.scientificName})` : ''}
                </option>
              ))}
            </SelectInput>
          </div>

          {/* Selected Organism Preview Card */}
          {selectedNode && (
            <div className="rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <SpeciesIcon
                  iconKey={selectedNode.iconKey}
                  size={48}
                  className="rounded-lg bg-white border border-[#E5E6DC] p-1 shrink-0"
                  label={selectedNode.name}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#202B27] truncate">{selectedNode.name}</p>
                  <p className="text-[11px] italic text-[#68716B] truncate">
                    {selectedNode.scientificName || `${selectedNode.name.toLowerCase()} sp.`}
                  </p>
                  {graph && (
                    <p className="text-[10px] text-[#68716B] mt-0.5">
                      {(graph.foodSourcesOf.get(selectedNode.id) ?? []).length} food sources · {(graph.consumersOf.get(selectedNode.id) ?? []).length} predators
                    </p>
                  )}
                </div>
              </div>
              <span className="inline-block text-[10px] font-semibold bg-[#FEF4E8] text-[#C06918] px-2.5 py-1 rounded-md border border-[#F1B36F]/40 shrink-0">
                {TROPHIC_ROLE_LABEL[selectedNode.trophicRole] || 'Consumer'}
              </span>
            </div>
          )}
        </div>

        {/* Card 2: 2. Simulation Mode */}
        <div className="xl:col-span-5 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B] mb-2.5">
              2. Simulation Mode
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
              <div className="sm:col-span-7 space-y-2">
                <label
                  onClick={() => setSimMode('direct')}
                  className={cn(
                    'flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all',
                    simMode === 'direct'
                      ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                      : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                  )}
                >
                  <input
                    type="radio"
                    name="cascade-sim-mode"
                    checked={simMode === 'direct'}
                    onChange={() => setSimMode('direct')}
                    className="mt-0.5 text-[#35563B] focus:ring-[#35563B]"
                  />
                  <div className="min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#202B27]">Direct Removal</p>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white border border-[#E5E6DC] text-[#68716B]">1 Step</span>
                    </div>
                    <p className="text-[10.5px] text-[#68716B] leading-snug mt-0.5">
                      Remove only the selected species without triggering starvation waves.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setSimMode('cascade')}
                  className={cn(
                    'flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all',
                    simMode === 'cascade'
                      ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                      : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                  )}
                >
                  <input
                    type="radio"
                    name="cascade-sim-mode"
                    checked={simMode === 'cascade'}
                    onChange={() => setSimMode('cascade')}
                    className="mt-0.5 text-[#35563B] focus:ring-[#35563B]"
                  />
                  <div className="min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#202B27]">Direct Removal + Cascade</p>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#FEF4E8] border border-[#F1B36F]/40 text-[#C06918]">Chain Reaction</span>
                    </div>
                    <p className="text-[10.5px] text-[#68716B] leading-snug mt-0.5">
                      Simulate multi-round starvation cascades when consumers lose all food.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Button */}
              <div className="sm:col-span-5 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={runSelectedScenario}
                  disabled={!selectedNodeId}
                  className="w-full h-full min-h-[74px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white py-3 px-3 text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50 text-center cursor-pointer"
                >
                  <Play size={13} className="fill-current shrink-0" />
                  <span>Run Cascade Simulation →</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Simulation Summary (2x2 Grid) */}
        <div className="xl:col-span-3 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <span className="font-bold text-xs text-[#202B27]">Simulation Summary</span>
            {plainStory && (
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white"
                style={{
                  color: plainStory.severityColor.text,
                  borderColor: plainStory.severityColor.border,
                }}
              >
                {plainStory.severityLabel}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Stat 1: Initial Species */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Initial Species
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {baseline?.nodeCount ?? 0}
              </p>
              <span className="text-[9.5px] text-[#899B78] block">Baseline total</span>
            </div>

            {/* Stat 2: Total Removed */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Total Removed
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {activeResult ? activeResult.removedNodeIds.length : '0'}
              </p>
              <span className="text-[10px] text-[#68716B] tabular-nums block">
                ({baseline && activeResult ? formatPercent((activeResult.removedNodeIds.length / baseline.nodeCount) * 100) : '0%'})
              </span>
              <span className="text-[9.5px] text-[#68716B] block">Initial + cascade</span>
            </div>

            {/* Stat 3: Rounds */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Rounds
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {totalRounds}
              </p>
              <span className="text-[9.5px] text-[#899B78] block">Starvation waves</span>
            </div>

            {/* Stat 4: Links Lost */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Links Lost
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {activeResult ? activeResult.scenario.linksLost : '0'}
              </p>
              <span className="text-[10px] text-[#68716B] tabular-nums block">
                ({activeResult && activeResult.scenario.linkLossPercent.value !== null ? formatPercent(activeResult.scenario.linkLossPercent.value) : '0%'})
              </span>
              <span className="text-[9.5px] text-[#68716B] block">Energy pathways cut</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MIDDLE SECTION: FOOD WEB AT ROUND X & CASCADE TIMELINE STACK
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Food Web Graph at Round X (8 Columns) */}
        <div className="lg:col-span-8 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E6DC]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#202B27]">
                Food Web at Round {currentStep === 0 ? 'Initial' : currentStep}
              </h2>
              <span className="text-xs text-[#68716B]">
                {activeRemovedIds.length} species removed · {baseline ? baseline.nodeCount - activeRemovedIds.length : 0} remaining
              </span>
            </div>

            {/* Legend indicators */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#EF9A88]" />
                <span className="text-[#68716B]">Removed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F3D98B]" />
                <span className="text-[#68716B]">Affected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#B5D39A]" />
                <span className="text-[#68716B]">Unaffected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#94A3B8]" />
                <span className="text-[#68716B]">Feeding link</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-[#EF9A88]" />
                <span className="text-[#EF9A88] font-medium">Lost link</span>
              </div>
            </div>
          </div>

          {/* Cytoscape Canvas */}
          {graph && (
            <div className="relative">
              <FoodWebGraph
                graph={graph}
                removedNodeIds={activeRemovedIds}
                selectedNodeId={selectedNodeId}
                onSelectNode={selectNode}
                directlyAffectedIds={currentStep > 0 ? activeResult?.scenario.directlyAffectedConsumerIds ?? [] : []}
                foodDepletedIds={currentStep > 0 ? activeResult?.scenario.foodDepletedConsumerIds ?? [] : []}
                highlightLinks={true}
                searchQuery=""
                className="min-h-[460px] lg:min-h-[520px]"
              />
            </div>
          )}

          {/* Live Step Context Bar */}
          <div className="rounded-xl border border-[#E5E6DC] bg-white p-3 flex items-start gap-2.5 text-xs">
            <Info size={15} className="text-[#35563B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#202B27] mr-1">Round Status: </span>
              <span className="text-[#4A544E]">{currentStepDescription}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Cascade Timeline Scrubber & Round Stack (4 Columns) */}
        <div className="lg:col-span-4 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3.5">
          {/* Header & Scrubber Controls */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E6DC]">
              <span className="font-bold text-xs text-[#202B27]">Cascade Timeline</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="h-6 w-6 rounded-full bg-[#35563B] text-white flex items-center justify-center hover:bg-[#263D2D] transition-colors shrink-0 shadow-2xs cursor-pointer"
                  title={isPlaying ? 'Pause timeline' : 'Play timeline progression'}
                >
                  {isPlaying ? <Pause size={11} /> : <Play size={11} className="ml-0.5 fill-current" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, totalRounds)}
                  value={currentStep}
                  onChange={(e) => setCurrentStep(Number(e.target.value))}
                  className="w-16 sm:w-24 accent-[#35563B] cursor-pointer"
                  aria-label="Timeline round scrubber"
                />
                <span className="text-[11px] font-mono font-bold text-[#202B27] whitespace-nowrap">
                  Round {currentStep} / {Math.max(1, totalRounds)}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    disabled={currentStep <= 0}
                    className="h-6 w-6 rounded-md border border-[#E5E6DC] bg-white flex items-center justify-center text-[#202B27] disabled:opacity-30 cursor-pointer"
                    aria-label="Previous round"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(Math.max(1, totalRounds), prev + 1))}
                    disabled={currentStep >= Math.max(1, totalRounds)}
                    className="h-6 w-6 rounded-md border border-[#E5E6DC] bg-white flex items-center justify-center text-[#202B27] disabled:opacity-30 cursor-pointer"
                    aria-label="Next round"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Stack of Round Cards with Flow Arrows & Plain-English Explanations */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {/* Round 0: Initial State Card */}
            <div
              onClick={() => setCurrentStep(0)}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer text-xs',
                currentStep === 0
                  ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                  : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#FCFBF7] border border-[#E5E6DC] flex items-center justify-center text-[#35563B] shrink-0">
                  <Network size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#202B27]">Initial State (Baseline)</p>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white border border-[#E5E6DC] text-[#35563B] font-semibold">Healthy</span>
                  </div>
                  <p className="text-[10.5px] text-[#68716B]">
                    {baseline?.nodeCount ?? 0} species · {baseline?.linkCount ?? 0} links
                  </p>
                  <p className="text-[10px] text-[#899B78] mt-0.5">
                    Undisturbed ecosystem. All feeding links intact.
                  </p>
                </div>
              </div>
            </div>

            {/* Downward Arrow */}
            {activeResult && (
              <div className="flex justify-center text-[#C04938] py-0.5">
                <ArrowDown size={14} className="stroke-[2.5]" />
              </div>
            )}

            {/* Round 1: Initial Species Removal */}
            {activeResult && (
              <div
                onClick={() => setCurrentStep(1)}
                className={cn(
                  'p-3 rounded-xl border transition-all cursor-pointer text-xs',
                  currentStep === 1
                    ? 'border-[#EF9A88] bg-[#FDF1EE] shadow-2xs ring-1 ring-[#EF9A88]'
                    : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <SpeciesIcon
                      iconKey={graph?.nodeById.get(activeResult.primaryNodeId)?.iconKey}
                      size={34}
                      className="rounded-lg bg-white border border-[#E5E6DC] p-0.5"
                    />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EF9A88] text-white flex items-center justify-center text-[9px] font-bold">
                      ✕
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#C04938]">Round 1</p>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white border border-[#EF9A88]/40 text-[#C04938] font-semibold">Direct Action</span>
                    </div>
                    <p className="text-[11px] font-bold text-[#C04938] truncate">
                      {activeResult.primaryNodeLabel} removed
                    </p>
                    <p className="text-[10.5px] text-[#68716B]">
                      {activeResult.scenario.directlyAffectedConsumerIds.length} species affected · {activeResult.directlyRemovedLinks.length} links lost
                    </p>
                    <p className="text-[10px] text-[#68716B] mt-0.5 leading-tight">
                      Target species is eliminated. Predators of {activeResult.primaryNodeLabel} lose a feeding link.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cascade Rounds 2, 3, etc. */}
            {activeResult &&
              activeResult.mode === 'cascade' &&
              activeResult.rounds.map((round) => {
                const roundStep = round.round + 1
                const isActive = currentStep === roundStep
                const firstRemoval = round.removals[0]
                const removalNode = graph?.nodeById.get(firstRemoval?.nodeId)

                return (
                  <div key={round.round} className="space-y-2">
                    <div className="flex justify-center text-[#C04938] py-0.5">
                      <ArrowDown size={14} className="stroke-[2.5]" />
                    </div>
                    <div
                      onClick={() => setCurrentStep(roundStep)}
                      className={cn(
                        'p-3 rounded-xl border transition-all cursor-pointer text-xs',
                        isActive
                          ? 'border-[#EF9A88] bg-[#FDF1EE] shadow-2xs ring-1 ring-[#EF9A88]'
                          : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="relative shrink-0">
                          <SpeciesIcon
                            iconKey={removalNode?.iconKey}
                            size={34}
                            className="rounded-lg bg-white border border-[#E5E6DC] p-0.5"
                          />
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EF9A88] text-white flex items-center justify-center text-[9px] font-bold">
                            ✕
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-[#C04938]">Round {round.round + 1}</p>
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#FDEEEB] border border-[#EF9A88]/40 text-[#C04938] font-semibold">Starvation Wave</span>
                          </div>
                          <p className="text-[11px] font-bold text-[#C04938] truncate">
                            {round.removals.map((r) => r.label).join(', ')} starved
                          </p>
                          <p className="text-[10.5px] text-[#68716B]">
                            {round.removals.length} species removed
                          </p>
                          <p className="text-[10px] text-[#68716B] mt-0.5 leading-tight">
                            {firstRemoval?.reason ||
                              'Consumer had zero remaining food sources and starved. Cascade propagates.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

            {/* Stabilized State Box for Zero Secondary Starvations */}
            {activeResult && activeResult.mode === 'cascade' && activeResult.rounds.length === 0 && (
              <div className="p-3 rounded-xl border border-[#35563B]/30 bg-[#E8EDE0]/60 text-xs text-center space-y-1">
                <p className="font-bold text-[#35563B]">🛡️ Zero Secondary Starvations</p>
                <p className="text-[10.5px] text-[#4A544E]">
                  Cascade halted immediately. Surviving predators possessed alternative food sources.
                </p>
              </div>
            )}

            {/* Equilibrium Reached Box for Multi-round cascades */}
            {activeResult && activeResult.mode === 'cascade' && activeResult.rounds.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-center text-[#35563B] py-0.5">
                  <ArrowDown size={14} className="stroke-[2.5]" />
                </div>
                <div
                  onClick={() => setCurrentStep(totalRounds)}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer text-xs',
                    currentStep === totalRounds
                      ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs ring-1 ring-[#35563B]'
                      : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#FCFBF7] border border-[#E5E6DC] flex items-center justify-center text-[#35563B] shrink-0 text-sm">
                      ⚖️
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#202B27]">Equilibrium Reached</p>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white border border-[#E5E6DC] text-[#35563B] font-semibold">Stabilized</span>
                      </div>
                      <p className="text-[10.5px] text-[#68716B]">
                        {baseline ? baseline.nodeCount - activeResult.removedNodeIds.length : 0} surviving species
                      </p>
                      <p className="text-[10px] text-[#899B78] mt-0.5">
                        Cascade concluded. Every surviving consumer has at least one recorded food source.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. BOTTOM SECTION: CHARTS WITH PLAIN-ENGLISH GUIDES & REMOVED SPECIES
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Chart 1: Species Remaining Over Rounds (4 Columns) */}
        <div className="xl:col-span-4 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#202B27]">Species Remaining Over Rounds</p>
            <span className="text-[10px] text-[#899B78]">Survival Curve</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                <XAxis dataKey="roundLabel" tick={{ fontSize: 9.5, fill: '#68716B' }} />
                <YAxis
                  tick={{ fontSize: 9.5, fill: '#68716B' }}
                  label={{
                    value: 'Number of Species',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#68716B', fontSize: 10 },
                  }}
                  domain={[0, 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FCFBF7',
                    borderColor: '#E5E6DC',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="speciesRemaining"
                  stroke="#35563B"
                  strokeWidth={2.5}
                  dot={{ fill: '#35563B', r: 3.5 }}
                  activeDot={{ r: 5.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-[#68716B] leading-tight">
            📉 <strong>How to read:</strong> Steeper declines reflect specialist-heavy webs vulnerable to rapid chain-reaction collapses.
          </p>
        </div>

        {/* Chart 2: Cumulative Link Loss (4 Columns) */}
        <div className="xl:col-span-4 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#202B27]">Cumulative Link Loss</p>
            <span className="text-[10px] text-[#C06918]">Interaction Severance</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                <XAxis dataKey="roundLabel" tick={{ fontSize: 9.5, fill: '#68716B' }} />
                <YAxis
                  tick={{ fontSize: 9.5, fill: '#68716B' }}
                  label={{
                    value: 'Links Lost',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#68716B', fontSize: 10 },
                  }}
                  domain={[0, 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FCFBF7',
                    borderColor: '#E5E6DC',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLinksLost"
                  stroke="#F1B36F"
                  strokeWidth={2.5}
                  dot={{ fill: '#F1B36F', r: 3.5 }}
                  activeDot={{ r: 5.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-[#68716B] leading-tight">
            📈 <strong>How to read:</strong> Tracks the progressive breakage of predator-prey energy pathways across sequential rounds.
          </p>
        </div>

        {/* Panel 3: Removed Species Cards List (4 Columns) */}
        <div className="xl:col-span-4 min-w-0 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#202B27]">
              Removed Species ({removedSpeciesCards.length})
            </p>
            <span className="text-[10px] text-[#68716B]">Casualty Register</span>
          </div>
          {removedSpeciesCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-1 max-h-52 overflow-y-auto pr-1">
              {removedSpeciesCards.map((sp) => (
                <div
                  key={sp.id}
                  className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white text-center flex flex-col items-center justify-center relative shadow-2xs"
                >
                  <div className="relative">
                    <SpeciesIcon iconKey={sp.iconKey} size={36} />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EF9A88] text-white flex items-center justify-center text-[9px] font-bold">
                      ✕
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#202B27] truncate w-full mt-1.5">
                    {sp.name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] font-semibold px-1 rounded bg-[#FDEEEB] text-[#EF9A88]">
                      {sp.roundLabel}
                    </span>
                    <span className="text-[9px] text-[#68716B]">
                      {sp.role}
                    </span>
                  </div>
                  <p className="text-[8.5px] text-[#899B78] mt-1 line-clamp-1 w-full" title={sp.reason}>
                    {sp.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-center text-xs text-[#68716B] italic">
              Run a simulation to observe removed species across rounds.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
