import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Leaf,
  Network,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react'
import { useEffect, useMemo, useState, useRef } from 'react'
import { FoodWebGraph } from '../components/graph/FoodWebGraph'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { Button, SelectInput, cn } from '../components/ui/primitives'
import { computeBaselineMetrics, formatPercent } from '../core/metrics'
import { runScenario } from '../core/scenarios'
import { TROPHIC_ROLE_LABEL } from '../core/types'
import { useAppState } from '../state/AppState'
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
  const userResetRef = useRef(false)

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
    if (userResetRef.current) return null
    if (result) return result
    if (graph && selectedNode && dataset) {
      try {
        return runScenario(graph, dataset.name, selectedNode.id, mode)
      } catch {
        return null
      }
    }
    return null
  }, [result, graph, selectedNode, dataset, mode])

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

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-[1780px] mx-auto pb-6">
      {/* =====================================================================
          PAGE HEADER / BANNER (Matching Image 2 Reference)
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text */}
          <div className="lg:col-span-8 p-4 sm:p-5 lg:p-5 space-y-1 z-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-normal text-[#202B27] tracking-tight">
              Simulation Laboratory
            </h1>
            <p className="text-xs sm:text-[13px] text-[#68716B] max-w-2xl leading-relaxed">
              Remove species and observe how the ecosystem responds. Choose a species and simulate direct removal or cascading effects to analyse ecosystem stability.
            </p>
          </div>

          {/* Banner Ecosystem Art on Right softly fading to Warm Ivory */}
          <div className="lg:col-span-4 relative h-24 sm:h-28 lg:h-full min-h-[90px] w-full overflow-hidden">
            <img
              src="/hero-ecosystem.jpg"
              alt="Freshwater ecosystem scenery"
              className="h-full w-full object-cover object-[70%_20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN 3-COLUMN WORKSPACE: Controls | Simulation View | Results
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* -------------------------------------------------------------------
            COLUMN 1 (Left 3.5 cols): SIMULATION CONTROLS
            1. Select Simulation Mode
            2. Select a Species
            3. Simulation Settings & Action Button
            ------------------------------------------------------------------- */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-4">
          {/* 1. Select Simulation Mode */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
              1. Select Simulation Mode
            </p>

            <div className="space-y-2">
              {/* Option A: Direct Removal */}
              <button
                type="button"
                onClick={() => {
                  userResetRef.current = false
                  setMode('direct')
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                  mode === 'direct'
                    ? 'border-[#35563B] bg-[#E8EDE0]/90 shadow-2xs'
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
                <div>
                  <p className="text-xs font-bold text-[#202B27]">Direct Removal</p>
                  <p className="text-[11px] text-[#68716B] leading-snug mt-0.5">
                    Remove only the selected species and observe immediate effects.
                  </p>
                </div>
              </button>

              {/* Option B: Direct Removal + Cascade */}
              <button
                type="button"
                onClick={() => {
                  userResetRef.current = false
                  setMode('cascade')
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                  mode === 'cascade'
                    ? 'border-[#35563B] bg-[#E8EDE0]/90 shadow-2xs'
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
                <div>
                  <p className="text-xs font-bold text-[#202B27]">Direct Removal + Cascade</p>
                  <p className="text-[11px] text-[#68716B] leading-snug mt-0.5">
                    Remove the selected species and simulate cascading effects when consumers lose all food sources.
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
                  userResetRef.current = false
                  selectNode(e.target.value)
                }}
                className="w-full text-xs font-semibold text-[#202B27] rounded-xl border border-[#E5E6DC] bg-white py-2 pl-3 pr-8 shadow-2xs"
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
                  <span className="inline-block mt-1 text-[9.5px] font-semibold bg-[#FEF4E8] text-[#C06918] px-2 py-0.2 rounded-full border border-[#F1B36F]/40">
                    {TROPHIC_ROLE_LABEL[selectedNode.trophicRole] || 'Consumer'}
                  </span>
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
                  'h-5 w-9 rounded-full transition-colors relative p-0.5',
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
              <div className="flex items-center justify-between text-[10px] text-[#899B78] pt-1">
                <button
                  type="button"
                  onClick={() => setAnimSpeed('slow')}
                  className={cn(
                    'px-2 py-0.5 rounded',
                    animSpeed === 'slow' ? 'bg-[#35563B] text-white font-bold' : 'hover:bg-[#F0F2E9]',
                  )}
                >
                  Slow
                </button>
                <button
                  type="button"
                  onClick={() => setAnimSpeed('normal')}
                  className={cn(
                    'px-2 py-0.5 rounded',
                    animSpeed === 'normal' ? 'bg-[#35563B] text-white font-bold' : 'hover:bg-[#F0F2E9]',
                  )}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setAnimSpeed('fast')}
                  className={cn(
                    'px-2 py-0.5 rounded',
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
                  userResetRef.current = false
                  runSelectedScenario()
                }}
                disabled={!selectedNodeId}
                className="bg-[#35563B] hover:bg-[#263D2D] text-white font-bold py-2.5 text-xs sm:text-sm shadow-xs"
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
                    userResetRef.current = true
                    resetScenario()
                  }}
                  className="text-xs py-1.5 border-[#E5E6DC] text-[#68716B] hover:text-[#202B27]"
                >
                  Reset simulation
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            COLUMN 2 (Center 6 cols): FOOD WEB (SIMULATION VIEW)
            ------------------------------------------------------------------- */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-3">
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-3.5 shadow-2xs flex flex-col min-h-[460px]">
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
            {/* Definite height (no flex-1): flex-basis 0% would override h-[390px] and the
                min-h-based card height is indefinite, so FoodWebGraph's h-full collapses
                to content height and the cytoscape canvas renders 0px tall. */}
            <div className="relative mt-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] overflow-hidden h-[390px] min-h-[360px]">
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
            COLUMN 3 (Right 3 cols): SIMULATION RESULTS & AFFECTED SPECIES
            ------------------------------------------------------------------- */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-4">
          {/* Header & Status Card */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <h3 className="text-sm font-bold text-[#202B27]">Simulation Results</h3>
              {activeResult && (
                <span className="rounded-full bg-[#FDEEEB] border border-[#EF9A88]/40 px-2 py-0.5 text-[10px] font-bold text-[#EF9A88]">
                  {selectedNode?.name ?? 'Species'} Removed
                </span>
              )}
            </div>

            {/* 2x2 Quantitative Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {/* Metric 1: Species Removed */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
                <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Species Removed</span>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? (activeResult.mode === 'cascade' ? 1 : activeResult.removedNodeIds.length) : '0'}
                </p>
                <span className="text-[10px] text-[#899B78]">(Direct)</span>
              </div>

              {/* Metric 2: Links Lost */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
                <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Links Lost</span>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? activeResult.scenario.linksLost : '0'}
                </p>
                <span className="text-[10px] text-[#68716B] tabular-nums truncate block">
                  out of {baseline?.linkCount ?? 0} {activeResult && activeResult.scenario.linkLossPercent.value !== null ? `(${formatPercent(activeResult.scenario.linkLossPercent.value)})` : ''}
                </span>
              </div>

              {/* Metric 3: Secondary Removals */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
                <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Secondary Removals</span>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? activeResult.scenario.secondaryRemovals : '0'}
                </p>
                <span className="text-[10px] text-[#899B78]">(via cascade)</span>
              </div>

              {/* Metric 4: Total Removed */}
              <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white">
                <span className="text-[10px] font-semibold text-[#68716B] block uppercase">Total Removed</span>
                <p className="text-xl font-bold text-[#202B27] tabular-nums mt-0.5">
                  {activeResult ? activeResult.removedNodeIds.length : '0'}
                </p>
                <span className="text-[10px] text-[#68716B] tabular-nums truncate block">
                  out of {baseline?.nodeCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Affected Species List Card */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <span className="font-bold text-xs text-[#202B27]">Affected Species</span>
              <button
                type="button"
                onClick={() => setAffectedCollapsed((prev) => !prev)}
                className="text-[#68716B] hover:text-[#202B27]"
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
                      'flex-1 pb-1.5 font-semibold text-center border-b-2 transition-colors',
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
                      'flex-1 pb-1.5 font-semibold text-center border-b-2 transition-colors',
                      affectedTab === 'cascade'
                        ? 'border-[#35563B] text-[#35563B]'
                        : 'border-transparent text-[#68716B] hover:text-[#202B27]',
                    )}
                  >
                    Cascade Effects ({cascadeRemovalsList.length})
                  </button>
                </div>

                {/* List Content */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {affectedTab === 'direct' ? (
                    directlyAffectedList.length ? (
                      directlyAffectedList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-[#E5E6DC] bg-white text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <SpeciesIcon iconKey={item.iconKey} size={22} className="shrink-0" />
                            <span className="font-semibold text-[#202B27] truncate">{item.name}</span>
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
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#68716B] italic py-2 text-center">
                        {activeResult ? 'No direct consumers affected.' : 'Run a simulation to observe effects.'}
                      </p>
                    )
                  ) : cascadeRemovalsList.length ? (
                    cascadeRemovalsList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl border border-[#E5E6DC] bg-white text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <SpeciesIcon iconKey={item.iconKey} size={22} className="shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-[#202B27] truncate block">{item.name}</span>
                            <span className="text-[9.5px] text-[#899B78]">Round {item.round}</span>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-[#FDEEEB] text-[#EF9A88] border border-[#EF9A88]/40">
                          Removed
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#68716B] italic py-2 text-center">
                      {activeResult && activeResult.mode === 'cascade'
                        ? 'No secondary cascading removals.'
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
          BOTTOM ROW: CASCADE TIMELINE SCRUBBER (Full Width matching Image 2)
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
              ({activeResult ? activeResult.removedNodeIds.length : 0} species removed)
            </span>
          </div>

          {/* Controls: Play/Pause, Slider, Round indicator, Step buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              disabled={!activeResult || activeResult.mode !== 'cascade' || activeResult.rounds.length === 0}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#35563B] text-white hover:bg-[#263D2D] disabled:opacity-40 transition-colors shadow-2xs"
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
                className="h-6 w-6 flex items-center justify-center rounded border border-[#E5E6DC] bg-white text-[#68716B] hover:text-[#202B27] disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => setTimelineStep((c) => Math.min(totalRounds, c + 1))}
                disabled={timelineStep >= totalRounds}
                className="h-6 w-6 flex items-center justify-center rounded border border-[#E5E6DC] bg-white text-[#68716B] hover:text-[#202B27] disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Visual Round Progression Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          {/* Box 0: Initial State */}
          <div
            onClick={() => setTimelineStep(0)}
            className={cn(
              'rounded-xl border p-3 text-center cursor-pointer transition-all',
              timelineStep === 0
                ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs'
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
                ? 'border-[#EF9A88] bg-[#FDEEEB] shadow-2xs'
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

          {/* Box 2: Round 2 (Cascade Step 1) */}
          <div
            onClick={() => setTimelineStep(2)}
            className={cn(
              'rounded-xl border p-3 cursor-pointer transition-all relative flex items-center gap-2.5',
              timelineStep === 2
                ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs'
                : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
            )}
          >
            <div className="relative shrink-0">
              <SpeciesIcon
                iconKey={cascadeRemovalsList[0]?.iconKey || 'snail'}
                size={32}
              />
              {cascadeRemovalsList[0] && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF9A88] text-white text-[8px] font-bold">
                  ✕
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-bold uppercase text-[#68716B] block">Round 2</span>
              <p className="text-xs font-bold text-[#202B27] truncate">
                {cascadeRemovalsList[0]?.name ? `${cascadeRemovalsList[0].name} removed` : 'Secondary cascade'}
              </p>
              <p className="text-[10px] text-[#68716B] tabular-nums">
                {activeResult && activeResult.rounds[0] ? `${activeResult.rounds[0].removals.length} species affected` : '—'}
              </p>
            </div>
          </div>

          {/* Box 3: Round 3+ */}
          <div
            onClick={() => setTimelineStep(3)}
            className={cn(
              'rounded-xl border p-3 cursor-pointer transition-all relative flex items-center gap-2.5',
              timelineStep >= 3
                ? 'border-[#35563B] bg-[#E8EDE0] shadow-2xs'
                : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]',
            )}
          >
            <div className="relative shrink-0">
              <SpeciesIcon
                iconKey={cascadeRemovalsList[1]?.iconKey || 'minnow'}
                size={32}
              />
              {cascadeRemovalsList[1] && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF9A88] text-white text-[8px] font-bold">
                  ✕
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-bold uppercase text-[#68716B] block">Round 3</span>
              <p className="text-xs font-bold text-[#202B27] truncate">
                {cascadeRemovalsList[1]?.name ? `${cascadeRemovalsList[1].name} removed` : 'Stabilized state'}
              </p>
              <p className="text-[10px] text-[#68716B] tabular-nums">
                {activeResult ? `${activeResult.removedNodeIds.length} total removed` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
