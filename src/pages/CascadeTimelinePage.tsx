import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Network,
  Pause,
  Play,
  Search,
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
import { TROPHIC_ROLE_LABEL } from '../core/types'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/routes'

export interface CascadeTimelinePageProps {
  onNavigate?: (route: RouteId) => void
}

export function CascadeTimelinePage({ onNavigate: _onNavigate }: CascadeTimelinePageProps = {}) {
  const {
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

  // Sync mode with global app state
  useEffect(() => {
    if (mode !== simMode) {
      setMode(simMode)
    }
  }, [simMode, mode, setMode])

  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  // Select a sensible default species if none is selected
  useEffect(() => {
    if (!selectedNodeId && graph && graph.nodes.length > 0) {
      const defaultNode =
        graph.nodes.find((n) => n.trophicRole === 'secondary-consumer' || n.trophicRole === 'omnivore') ||
        graph.nodes[0]
      selectNode(defaultNode.id)
    }
  }, [selectedNodeId, graph, selectNode])

  // Ensure cascade mode is active and results are loaded
  useEffect(() => {
    if (result && result.mode === 'cascade' && result.rounds.length > 0) {
      // Step: 0 = Initial, 1 = Round 1, etc.
      setCurrentStep(result.rounds.length)
    } else if (result) {
      setCurrentStep(1)
    } else {
      setCurrentStep(0)
      setIsPlaying(false)
    }
  }, [result])

  // Auto-play animation timer
  useEffect(() => {
    if (!isPlaying || !result || result.mode !== 'cascade' || result.rounds.length === 0) {
      return
    }
    const maxSteps = result.rounds.length
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps) {
          setIsPlaying(false)
          return maxSteps
        }
        return prev + 1
      })
    }, 1800)
    return () => clearInterval(timer)
  }, [isPlaying, result])

  const selectedNode = useMemo(
    () => (graph && selectedNodeId ? graph.nodeById.get(selectedNodeId) ?? null : null),
    [graph, selectedNodeId],
  )

  const availableSpecies = useMemo(() => {
    if (!graph) return []
    return graph.nodes
  }, [graph])

  // Total rounds for current scenario
  const totalRounds = result && result.mode === 'cascade' ? result.rounds.length : 0

  // Calculate removed node IDs up to current step
  const activeRemovedIds = useMemo(() => {
    if (!result) return []
    if (result.mode !== 'cascade' || result.rounds.length === 0) {
      return currentStep > 0 ? result.removedNodeIds : []
    }
    if (currentStep === 0) return []
    if (currentStep === 1) return [result.primaryNodeId]
    const includedRounds = result.rounds.slice(0, currentStep)
    const secondaryIds = includedRounds.flatMap((r) => r.removals.map((rem) => rem.nodeId))
    return [result.primaryNodeId, ...secondaryIds]
  }, [result, currentStep])

  // Cumulative species remaining and link loss over rounds for bottom charts
  const progressionData = useMemo(() => {
    if (!baseline) return []
    const points = [
      {
        roundLabel: 'Initial',
        step: 0,
        speciesRemaining: baseline.nodeCount,
        cumulativeLinksLost: 0,
      },
    ]

    if (result) {
      const primaryLinksLost = result.directlyRemovedLinks.length
      points.push({
        roundLabel: 'Round 1',
        step: 1,
        speciesRemaining: baseline.nodeCount - 1,
        cumulativeLinksLost: primaryLinksLost,
      })

      if (result.mode === 'cascade') {
        let removedCount = 1
        let linksLostCount = primaryLinksLost
        result.rounds.forEach((round, idx) => {
          removedCount += round.removals.length
          // Estimate links lost progression proportionally
          const roundProgress = (idx + 1) / result.rounds.length
          const totalLoss = result.scenario.linksLost
          linksLostCount = Math.round(primaryLinksLost + (totalLoss - primaryLinksLost) * roundProgress)

          points.push({
            roundLabel: `Round ${idx + 2}`,
            step: idx + 2,
            speciesRemaining: Math.max(0, baseline.nodeCount - removedCount),
            cumulativeLinksLost: Math.min(totalLoss, linksLostCount),
          })
        })
      }
    }
    return points
  }, [baseline, result])

  // Removed species list with round details
  const removedSpeciesCards = useMemo(() => {
    if (!result || !graph) return []
    const cards: Array<{
      id: string
      name: string
      iconKey?: string
      roundLabel: string
    }> = []

    // Primary initial removal
    const primaryNode = graph.nodeById.get(result.primaryNodeId)
    cards.push({
      id: result.primaryNodeId,
      name: primaryNode?.name ?? result.primaryNodeId,
      iconKey: primaryNode?.iconKey,
      roundLabel: 'Round 1',
    })

    // Cascade secondary removals
    if (result.mode === 'cascade') {
      result.rounds.forEach((r) => {
        r.removals.forEach((rem) => {
          const node = graph.nodeById.get(rem.nodeId)
          cards.push({
            id: rem.nodeId,
            name: node?.name ?? rem.nodeId,
            iconKey: node?.iconKey,
            roundLabel: `Round ${r.round + 1}`,
          })
        })
      })
    }
    return cards
  }, [result, graph])

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-8">
      {/* =====================================================================
          1. PAGE HEADER / BANNER (Matching Image 1 Reference)
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text */}
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 space-y-1.5 z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#202B27] tracking-tight">
              Cascade Timeline
            </h1>
            <p className="text-xs sm:text-[13.5px] text-[#68716B] max-w-2xl leading-relaxed">
              Explore the step-by-step effects of species removal. See how the loss of one species
              can trigger a chain reaction across the entire ecosystem.
            </p>
          </div>

          {/* Freshwater Ecosystem Illustration */}
          <div className="lg:col-span-4 h-36 lg:h-full relative overflow-hidden flex items-center justify-end">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/50 to-transparent z-1 lg:w-32" />
            <img
              src="/hero-ecosystem.jpg"
              alt="Freshwater ecosystem"
              className="w-full h-full object-cover object-[70%_25%] max-h-44"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. SETUP & CONTROLS ROW (Matching Image 1 Reference)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Card 1: 1. Select a Species to Remove */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
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
              className="w-full text-xs font-semibold text-[#202B27] rounded-xl border border-[#E5E6DC] bg-white py-2 pl-9 pr-8 shadow-2xs"
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
            <div className="rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3 flex items-center gap-3">
              <SpeciesIcon
                iconKey={selectedNode.iconKey}
                size={48}
                className="rounded-lg bg-white border border-[#E5E6DC] p-1 shrink-0"
                label={selectedNode.name}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#202B27] truncate">{selectedNode.name}</p>
                <p className="text-[10.5px] italic text-[#68716B] truncate">
                  {selectedNode.scientificName || `${selectedNode.name.toLowerCase()} sp.`}
                </p>
                <span className="inline-block mt-1 text-[9.5px] font-semibold bg-[#FEF4E8] text-[#C06918] px-2 py-0.2 rounded-full border border-[#F1B36F]/40">
                  {TROPHIC_ROLE_LABEL[selectedNode.trophicRole] || 'Consumer'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: 2. Simulation Mode */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B] mb-2.5">
              2. Simulation Mode
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setSimMode('direct')}
                className={cn(
                  'flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all',
                  simMode === 'direct'
                    ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs'
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
                  <p className="font-bold text-[#202B27]">Direct Removal</p>
                  <p className="text-[11px] text-[#68716B] leading-snug">
                    Remove only the selected species
                  </p>
                </div>
              </label>

              <label
                onClick={() => setSimMode('cascade')}
                className={cn(
                  'flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all',
                  simMode === 'cascade'
                    ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs'
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
                  <p className="font-bold text-[#202B27]">Direct Removal + Cascade</p>
                  <p className="text-[11px] text-[#68716B] leading-snug">
                    Simulate cascading effects when consumers lose all food sources
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={runSelectedScenario}
            disabled={!selectedNodeId}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white py-2.5 px-4 text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <span>Run Cascade Simulation</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 3: Simulation Summary (2x2 Grid) */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <span className="font-bold text-xs text-[#202B27]">Simulation Summary</span>
            {result && (
              <span className="inline-block text-[10px] font-bold bg-[#FCEBE7] text-[#C04938] px-2.5 py-0.5 rounded-full border border-[#EF9A88]/40">
                Cascade Complete
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
            </div>

            {/* Stat 2: Total Removed */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Total Removed
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {result ? result.removedNodeIds.length : '0'}
              </p>
              <span className="text-[10px] text-[#68716B] tabular-nums">
                ({baseline && result ? formatPercent((result.removedNodeIds.length / baseline.nodeCount) * 100) : '0%'})
              </span>
            </div>

            {/* Stat 3: Rounds */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Rounds
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {result && result.mode === 'cascade' ? result.rounds.length : (result ? 1 : 0)}
              </p>
            </div>

            {/* Stat 4: Links Lost */}
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
              <span className="text-[10px] font-semibold text-[#68716B] block uppercase">
                Links Lost
              </span>
              <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                {result ? result.scenario.linksLost : '0'}
              </p>
              <span className="text-[10px] text-[#68716B] tabular-nums">
                ({result && result.scenario.linkLossPercent.value !== null ? formatPercent(result.scenario.linkLossPercent.value) : '0%'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MIDDLE SECTION: FOOD WEB AT ROUND X & CASCADE TIMELINE STACK
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Food Web Graph at Round X (8 Columns) */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
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
            <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
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
                directlyAffectedIds={result?.scenario.directlyAffectedConsumerIds ?? []}
                foodDepletedIds={result?.scenario.foodDepletedConsumerIds ?? []}
                highlightLinks={true}
                searchQuery=""
                className="min-h-[460px] lg:min-h-[520px]"
              />
            </div>
          )}
        </div>

        {/* Right Column: Cascade Timeline Scrubber & Round Stack (4 Columns) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3.5">
          {/* Header & Scrubber Controls */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <span className="font-bold text-xs text-[#202B27]">Cascade Timeline</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono font-bold text-[#202B27]">
                  Round {currentStep} / {Math.max(1, totalRounds)}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  disabled={currentStep <= 0}
                  className="h-6 w-6 rounded-md border border-[#E5E6DC] bg-white flex items-center justify-center text-[#202B27] disabled:opacity-30"
                  aria-label="Previous round"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(Math.max(1, totalRounds), prev + 1))}
                  disabled={currentStep >= Math.max(1, totalRounds)}
                  className="h-6 w-6 rounded-md border border-[#E5E6DC] bg-white flex items-center justify-center text-[#202B27] disabled:opacity-30"
                  aria-label="Next round"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Play/Pause & Range Scrubber */}
            <div className="flex items-center gap-2.5 pt-2.5">
              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className="h-7 w-7 rounded-lg bg-[#35563B] text-white flex items-center justify-center hover:bg-[#263D2D] transition-colors shrink-0 shadow-2xs"
                title={isPlaying ? 'Pause timeline' : 'Play timeline progression'}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(1, totalRounds)}
                value={currentStep}
                onChange={(e) => setCurrentStep(Number(e.target.value))}
                className="w-full accent-[#35563B] cursor-pointer"
                aria-label="Timeline round scrubber"
              />
            </div>
          </div>

          {/* Vertical Stack of Round Cards */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {/* Round 0: Initial State Card */}
            <div
              onClick={() => setCurrentStep(0)}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer text-xs',
                currentStep === 0
                  ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs'
                  : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#FCFBF7] border border-[#E5E6DC] flex items-center justify-center text-[#35563B] shrink-0">
                  <Network size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#202B27]">Initial State</p>
                  <p className="text-[10.5px] text-[#68716B]">
                    {baseline?.nodeCount ?? 0} species · {baseline?.linkCount ?? 0} links
                  </p>
                  <p className="text-[10px] text-[#899B78] mt-0.5">
                    All species present in the ecosystem.
                  </p>
                </div>
              </div>
            </div>

            {/* Round 1: Initial Species Removal */}
            {result && (
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
                      iconKey={graph?.nodeById.get(result.primaryNodeId)?.iconKey}
                      size={32}
                      className="rounded-lg bg-white border border-[#E5E6DC] p-0.5"
                    />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EF9A88] text-white flex items-center justify-center text-[9px] font-bold">
                      ✕
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#C04938]">Round 1</p>
                    </div>
                    <p className="text-[11px] font-bold text-[#202B27] truncate">
                      {result.primaryNodeLabel} removed
                    </p>
                    <p className="text-[10.5px] text-[#68716B]">
                      {result.scenario.directlyAffectedConsumerIds.length} species affected · {result.directlyRemovedLinks.length} links lost
                    </p>
                    <p className="text-[10px] text-[#68716B] mt-0.5 leading-tight">
                      {result.primaryNodeLabel} is removed. Species that depended on {result.primaryNodeLabel} lose their food source.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cascade Rounds 2, 3, etc. */}
            {result &&
              result.mode === 'cascade' &&
              result.rounds.map((round) => {
                const roundStep = round.round
                const isActive = currentStep === roundStep
                const firstRemoval = round.removals[0]
                const removalNode = graph?.nodeById.get(firstRemoval?.nodeId)

                return (
                  <div
                    key={round.round}
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
                          size={32}
                          className="rounded-lg bg-white border border-[#E5E6DC] p-0.5"
                        />
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EF9A88] text-white flex items-center justify-center text-[9px] font-bold">
                          ✕
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#C04938]">Round {round.round + 1}</p>
                        <p className="text-[11px] font-bold text-[#202B27] truncate">
                          {round.removals.map((r) => r.label).join(', ')} removed
                        </p>
                        <p className="text-[10.5px] text-[#68716B]">
                          {round.removals.length} species removed
                        </p>
                        <p className="text-[10px] text-[#68716B] mt-0.5 leading-tight">
                          {firstRemoval?.reason || 'Consumer loses all food sources and is removed. Further species are affected.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. BOTTOM SECTION: RECHARTS GRAPHS & REMOVED SPECIES CARDS
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Chart 1: Species Remaining Over Rounds (4 Columns) */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-[#202B27]">Species Remaining Over Rounds</p>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                <XAxis dataKey="roundLabel" tick={{ fontSize: 9, fill: '#68716B' }} />
                <YAxis tick={{ fontSize: 9, fill: '#68716B' }} domain={[0, 'dataMax + 2']} />
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
                  strokeWidth={2}
                  dot={{ fill: '#35563B', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cumulative Link Loss (4 Columns) */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-[#202B27]">Cumulative Link Loss</p>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                <XAxis dataKey="roundLabel" tick={{ fontSize: 9, fill: '#68716B' }} />
                <YAxis tick={{ fontSize: 9, fill: '#68716B' }} domain={[0, 'dataMax + 2']} />
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
                  strokeWidth={2}
                  dot={{ fill: '#F1B36F', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: Removed Species Cards List (4 Columns) */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-[#202B27]">
            Removed Species ({removedSpeciesCards.length})
          </p>
          {removedSpeciesCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {removedSpeciesCards.map((sp) => (
                <div
                  key={sp.id}
                  className="p-2 rounded-xl border border-[#E5E6DC] bg-white text-center flex flex-col items-center justify-center relative shadow-2xs"
                >
                  <div className="relative">
                    <SpeciesIcon iconKey={sp.iconKey} size={32} />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EF9A88] text-white flex items-center justify-center text-[9px] font-bold">
                      ✕
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-[#202B27] truncate w-full mt-1">
                    {sp.name}
                  </span>
                  <span className="text-[9px] text-[#68716B]">{sp.roundLabel}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-center text-xs text-[#68716B] italic">
              Run a simulation to observe removed species across rounds.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
