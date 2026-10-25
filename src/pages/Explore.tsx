import {
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Info,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tv,
  X,
} from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { FoodWebGraph, GraphLegend } from '../components/graph/FoodWebGraph'
import { CascadeTimeline } from '../components/graph/CascadeTimeline'
import { ScenarioControls } from '../components/graph/ScenarioControls'
import { SpeciesInspector } from '../components/graph/SpeciesInspector'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { BaselineVsScenario } from '../components/results/MetricCards'
import { WhatChanged } from '../components/results/WhatChanged'
import { AcademicReportModal } from '../components/results/AcademicReportModal'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeading,
  EmptyState,
  SelectInput,
  StatusBadge,
  TextInput,
  cn,
} from '../components/ui/primitives'
import { computeBaselineMetrics, formatConnectance, formatPercent } from '../core/metrics'
import { edgesExportCsv, downloadArtifact, nodesExportCsv } from '../core/exportUtils'
import { ECOSYSTEM_LABEL, TROPHIC_ROLE_LABEL, TROPHIC_ROLES, type TrophicRole } from '../core/types'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/Shell'

/* ============================================================================
 * Explore / Workspace — light botanical primary workspace (mockups 02/03 & 07).
 *
 * Provides a dominant interactive food-web graph, searchable species inspector,
 * and direct simulation controls with collapsible side panels.
 * Includes Presentation Mode and an accessible, non-dragging Results Drawer.
 * ========================================================================== */

export function Explore({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const {
    dataset,
    datasets,
    graph,
    selectDataset,
    selectedNodeId,
    selectNode,
    mode,
    setMode,
    runSelectedScenario,
    resetScenario,
    result,
    removeFromScenario,
  } = useAppState()

  const [viewMode, setViewMode] = useState<'lab' | 'presentation'>('lab')
  const [drawerState, setDrawerState] = useState<'collapsed' | 'expanded' | 'closed'>('collapsed')
  const [presentationSidebar, setPresentationSidebar] = useState<'none' | 'species' | 'inspector'>('none')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<TrophicRole | 'all'>('all')
  const [highlightLinks] = useState(true)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [cascadeStep, setCascadeStep] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Reset cascade playback when scenario result changes or resets
  useEffect(() => {
    if (result?.mode === 'cascade' && result.rounds.length > 0) {
      setCascadeStep(1 + result.rounds.length) // default to final state
    } else {
      setCascadeStep(null)
      setIsPlaying(false)
    }
    // If a scenario is newly computed, ensure drawer is at least collapsed (visible)
    if (result) {
      setDrawerState('collapsed')
    }
  }, [result])

  const activeRemovedNodeIds = useMemo(() => {
    if (!result) return []
    if (result.mode !== 'cascade' || result.rounds.length === 0 || cascadeStep === null) {
      return result.removedNodeIds
    }
    if (cascadeStep === 0) return []
    if (cascadeStep === 1) return [result.primaryNodeId]
    const roundIdx = cascadeStep - 2
    const includedRounds = result.rounds.slice(0, roundIdx + 1)
    const secondaryIds = includedRounds.flatMap((r) => r.removals.map((rem) => rem.nodeId))
    return [result.primaryNodeId, ...secondaryIds]
  }, [result, cascadeStep])

  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  const selectedNode = useMemo(
    () => (graph && selectedNodeId ? graph.nodeById.get(selectedNodeId) ?? null : null),
    [graph, selectedNodeId],
  )

  const filteredNodes = useMemo(() => {
    if (!graph) return []
    const query = search.trim().toLowerCase()
    return graph.nodes
      .filter((node) => (roleFilter === 'all' ? true : node.trophicRole === roleFilter))
      .filter((node) =>
        query
          ? node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  }, [graph, roleFilter, search])

  const labelFor = (id: string) => graph?.nodeById.get(id)?.name ?? id

  const rolesPresent = useMemo(() => {
    if (!graph) return []
    const present = new Set(graph.nodes.map((node) => node.trophicRole))
    return TROPHIC_ROLES.filter((role) => present.has(role))
  }, [graph])

  if (!dataset || !graph || !baseline) {
    return (
      <Card>
        <CardHeading title="No dataset loaded" subtitle="There is no graph to explore yet." />
        <EmptyState
          title="No valid graph is loaded"
          description="Load an illustrative demo network from the Dataset library, or import a documented CSV or JSON food web. Scenario analysis stays disabled until a network is loaded."
          action={
            <Button variant="primary" onClick={() => onNavigate('library')}>
              Open the dataset library
            </Button>
          }
        />
      </Card>
    )
  }

  // =========================================================================
  // PRESENTATION MODE
  // =========================================================================
  if (viewMode === 'presentation') {
    return (
      <div className="space-y-3">
        {/* Top Presentation Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <span className="font-bold text-fg text-sm">{dataset.name}</span>
            <Badge tone="neutral">{ECOSYSTEM_LABEL[dataset.ecosystem]}</Badge>
            <StatusBadge status={dataset.sourceStatus} />
            <span className="text-[11.5px] text-fg-muted border-l border-line-soft pl-2.5">
              Arrow direction: <strong className="text-fg font-semibold">Food source → Consumer</strong>
            </span>
            {result ? (
              <Badge tone="danger" className="font-semibold">
                Scenario: {result.mode === 'cascade' ? 'Direct + Structural Cascade' : 'Direct Removal'} ({result.primaryNodeLabel})
              </Badge>
            ) : (
              <Badge tone="verified">Untouched Baseline</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={presentationSidebar === 'species' ? 'primary' : 'outline'}
              icon={<Search size={13} />}
              onClick={() =>
                setPresentationSidebar((prev) => (prev === 'species' ? 'none' : 'species'))
              }
              title="Toggle species directory panel"
              className="text-xs h-8 px-2.5"
            >
              Species list ({filteredNodes.length})
            </Button>
            <Button
              size="sm"
              variant={presentationSidebar === 'inspector' ? 'primary' : 'outline'}
              icon={<SlidersHorizontal size={13} />}
              onClick={() =>
                setPresentationSidebar((prev) => (prev === 'inspector' ? 'none' : 'inspector'))
              }
              title="Toggle node inspector panel"
              className="text-xs h-8 px-2.5"
            >
              Inspector
            </Button>
            {result ? (
              <Button
                size="sm"
                variant="primary"
                icon={<FileText size={13} />}
                onClick={() => setReportModalOpen(true)}
                className="bg-emerald-800 text-white hover:bg-emerald-900 border-emerald-800 text-xs h-8 px-3 font-semibold shadow-xs"
              >
                Print / Save PDF Report
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              icon={<LayoutDashboard size={14} />}
              onClick={() => setViewMode('lab')}
              title="Return to standard Lab workspace with sidebars"
              className="text-xs h-8 px-3 font-semibold border-primary/30 text-primary hover:bg-primary/5"
            >
              Exit presentation view
            </Button>
          </div>
        </div>

        {/* Central Presentation Canvas Area */}
        <div className="relative rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
          {/* Non-obstructive Floating Metric HUD */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none max-w-xl">
            {result ? (
              <div className="pointer-events-auto flex flex-wrap gap-2 p-2 rounded-xl bg-surface/90 backdrop-blur-md border border-line-soft shadow-xs text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2 border border-line-soft">
                  <span className="text-fg-faint">Nodes remaining:</span>
                  <span className="font-bold tabular-nums text-fg">
                    {result.scenario.nodeCount} / {result.baseline.nodeCount}
                  </span>
                  <span className="text-fg-muted font-medium">
                    ({formatPercent((result.scenario.nodeCount / result.baseline.nodeCount) * 100)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                  <span className="font-semibold text-rose-700">Secondary removals:</span>
                  <span className="font-bold tabular-nums text-rose-800">
                    +{result.scenario.secondaryRemovals}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2 border border-line-soft">
                  <span className="text-fg-faint">Feeding links:</span>
                  <span className="font-bold tabular-nums text-fg">
                    {result.scenario.linkCount} / {result.baseline.linkCount}
                  </span>
                  <span className="text-rose-700 font-medium">
                    (-{formatPercent(result.scenario.linkLossPercent.value)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="text-amber-800 font-medium">
                    {result.scenario.directlyAffectedConsumerIds.length} affected
                  </span>
                  <span className="text-fg-faint">·</span>
                  <span className="font-bold text-amber-900">
                    {result.scenario.foodDepletedConsumerIds.length} depleted
                  </span>
                </div>
              </div>
            ) : (
              <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/90 backdrop-blur-md border border-line-soft shadow-xs text-xs text-fg">
                <span className="font-bold tabular-nums">{baseline.nodeCount}</span>
                <span className="text-fg-muted">species</span>
                <span className="text-fg-faint">·</span>
                <span className="font-bold tabular-nums">{baseline.linkCount}</span>
                <span className="text-fg-muted">links</span>
                <span className="text-fg-faint">·</span>
                <span className="text-fg-muted">Connectance:</span>
                <span className="font-mono font-semibold">{formatConnectance(baseline.connectance.value)}</span>
              </div>
            )}
          </div>

          {/* Slide-over panels in Presentation view */}
          {presentationSidebar === 'species' && (
            <div className="absolute top-0 right-0 z-30 h-full w-80 bg-surface/98 border-l border-line p-3.5 shadow-xl flex flex-col backdrop-blur-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line-soft">
                <span className="text-xs font-bold uppercase tracking-wider text-fg">Species Directory</span>
                <button
                  type="button"
                  onClick={() => setPresentationSidebar('none')}
                  className="p-1 text-fg-faint hover:text-fg"
                  aria-label="Close species directory"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mb-2">
                <TextInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter species..."
                  className="text-xs h-8"
                />
              </div>
              <ul className="flex-1 overflow-y-auto space-y-1 text-xs pr-1">
                {filteredNodes.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => selectNode(node.id)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-lg border transition-colors flex items-center justify-between',
                        node.id === selectedNodeId
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-transparent hover:bg-surface-2 text-fg',
                      )}
                    >
                      <span className="truncate">{node.name}</span>
                      <span className="text-[10px] text-fg-faint">{TROPHIC_ROLE_LABEL[node.trophicRole]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {presentationSidebar === 'inspector' && selectedNode && (
            <div className="absolute top-0 right-0 z-30 h-full w-88 bg-surface/98 border-l border-line p-3.5 shadow-xl flex flex-col backdrop-blur-xs overflow-y-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line-soft">
                <span className="text-xs font-bold uppercase tracking-wider text-fg">Organism Inspector</span>
                <button
                  type="button"
                  onClick={() => setPresentationSidebar('none')}
                  className="p-1 text-fg-faint hover:text-fg"
                  aria-label="Close inspector"
                >
                  <X size={14} />
                </button>
              </div>
              <SpeciesInspector
                graph={graph}
                node={selectedNode}
                result={result}
                isSelected={Boolean(selectedNodeId)}
                onSelectForSimulation={(id) => removeFromScenario(id)}
                onResetSimulation={resetScenario}
                canRun={graph.nodes.length > 0}
              />
            </div>
          )}

          {/* Cytoscape Graph in Presentation Mode */}
          <FoodWebGraph
            graph={graph}
            removedNodeIds={activeRemovedNodeIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={selectNode}
            directlyAffectedIds={result?.scenario.directlyAffectedConsumerIds ?? []}
            foodDepletedIds={result?.scenario.foodDepletedConsumerIds ?? []}
            highlightLinks={highlightLinks}
            searchQuery={search}
            className="min-h-[580px] lg:min-h-[640px] w-full"
          />

          {/* Floating Presentation Control Bar at Bottom Center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-surface/95 backdrop-blur-md border border-line shadow-lg text-xs max-w-[95vw]">
            <div className="flex items-center gap-2 px-2 border-r border-line-soft pr-3">
              <span className="text-fg-faint">Target:</span>
              {selectedNode ? (
                <div className="flex items-center gap-1.5 font-semibold text-fg">
                  <SpeciesIcon iconKey={selectedNode.iconKey} size={15} />
                  <span>{selectedNode.name}</span>
                </div>
              ) : (
                <span className="text-fg-muted italic">Click an organism on graph</span>
              )}
            </div>

            {/* Mode Segmented Controls */}
            <div className="flex items-center rounded-lg bg-surface-2 p-0.5 border border-line-soft">
              <button
                type="button"
                onClick={() => setMode('direct')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors',
                  mode === 'direct' ? 'bg-surface text-fg font-bold shadow-2xs' : 'text-fg-muted hover:text-fg',
                )}
              >
                Direct removal
              </button>
              <button
                type="button"
                onClick={() => setMode('cascade')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors',
                  mode === 'cascade' ? 'bg-surface text-fg font-bold shadow-2xs' : 'text-fg-muted hover:text-fg',
                )}
              >
                Direct + Cascade
              </button>
            </div>

            {/* Action buttons */}
            <Button
              size="sm"
              variant="primary"
              icon={<Play size={13} />}
              onClick={runSelectedScenario}
              disabled={!selectedNodeId}
              className="h-8 text-xs font-semibold px-3"
            >
              Simulate removal
            </Button>
            {result ? (
              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw size={13} />}
                onClick={resetScenario}
                className="h-8 text-xs font-semibold px-3"
              >
                Reset
              </Button>
            ) : null}

            {result ? (
              <button
                type="button"
                onClick={() =>
                  setDrawerState((prev) => (prev === 'expanded' ? 'collapsed' : 'expanded'))
                }
                aria-expanded={drawerState === 'expanded'}
                aria-controls="presentation-results-drawer"
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-fg hover:bg-surface-2 transition-colors ml-1"
              >
                <span>{drawerState === 'expanded' ? 'Hide drawer' : 'View metrics drawer'}</span>
                <ChevronUp
                  size={13}
                  className={cn('transition-transform', drawerState === 'expanded' && 'rotate-180')}
                />
              </button>
            ) : null}
          </div>
        </div>

        {/* Accessible Collapsible Results Drawer in Presentation Mode */}
        {result && drawerState !== 'closed' && (
          <div
            id="presentation-results-drawer"
            className="rounded-2xl border border-line bg-surface shadow-md overflow-hidden transition-all"
          >
            {/* Drawer Control Bar */}
            <div className="flex items-center justify-between border-b border-line-soft bg-surface-2/60 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-fg">Quantitative Results:</span>
                <span className="text-fg-muted">
                  Initial target: <strong className="text-fg">{result.primaryNodeLabel}</strong> · {result.mode === 'cascade' ? 'Cascade mode' : 'Direct mode'} · {result.scenario.totalRemoved} node(s) removed total
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDrawerState((prev) => (prev === 'expanded' ? 'collapsed' : 'expanded'))
                  }
                  className="h-7 text-xs px-2"
                  aria-label={drawerState === 'expanded' ? 'Collapse drawer' : 'Expand drawer'}
                >
                  {drawerState === 'expanded' ? (
                    <>
                      <ChevronDown size={13} className="mr-1" /> Collapse
                    </>
                  ) : (
                    <>
                      <ChevronUp size={13} className="mr-1" /> Expand
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDrawerState('closed')}
                  className="h-7 text-xs px-2 text-fg-faint hover:text-fg"
                  aria-label="Close results drawer"
                >
                  <X size={13} className="mr-1" /> Close
                </Button>
              </div>
            </div>

            {/* Expanded Drawer Content */}
            {drawerState === 'expanded' && (
              <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                <BaselineVsScenario baseline={result.baseline} result={result} labelFor={labelFor} />
                <WhatChanged result={result} labelFor={labelFor} />
                {result.mode === 'cascade' && result.rounds.length > 0 && cascadeStep !== null ? (
                  <CascadeTimeline
                    result={result}
                    step={cascadeStep}
                    onStepChange={setCascadeStep}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying((prev) => !prev)}
                  />
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Academic Printable PDF Report Modal */}
        {result && (
          <AcademicReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            dataset={dataset}
            result={result}
          />
        )}
      </div>
    )
  }

  // =========================================================================
  // STANDARD LAB MODE (Default inspectable workspace)
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Workspace</h2>
          <p className="mt-0.5 text-[13.5px] text-fg-muted">
            Explore recorded feeding links and simulate structural effects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Tv size={14} />}
            onClick={() => setViewMode('presentation')}
            title="Switch to focused presentation view with minimal clutter"
            className="text-xs h-8 px-3 font-semibold border-primary/30 text-primary hover:bg-primary/5"
          >
            Presentation view
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Info size={14} />}
            onClick={() => onNavigate('methodology')}
          >
            How to use
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<BookOpenCheck size={14} />}
            onClick={() => onNavigate('library')}
          >
            Dataset library
          </Button>
        </div>
      </div>

      {/* Dataset Context Bar Strip */}
      <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {/* Dataset Selector Dropdown — hidden on desktop, where the sidebar
                "Current Network" picker is permanently visible; both stay in
                sync because they write the same application state. */}
            <div className="min-w-[240px] max-w-sm flex-1 lg:hidden">
              <label htmlFor="dataset-select" className="sr-only">
                Loaded network
              </label>
              <SelectInput
                id="dataset-select"
                aria-label="Loaded network"
                value={dataset.id}
                onChange={(event) => selectDataset(event.target.value)}
                className="font-semibold text-fg"
              >
                {datasets.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {ECOSYSTEM_LABEL[entry.ecosystem]} · {entry.name}
                    {entry.id.startsWith('VALIDATION') ? ' — validation fixture (internal test)' : ''}
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* Stat Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-line-soft bg-surface-2 px-3 py-1.5 text-[12px]">
                <span className="font-bold tabular-nums text-fg">{baseline.nodeCount}</span>
                <span className="text-fg-faint">Species (nodes)</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-line-soft bg-surface-2 px-3 py-1.5 text-[12px]">
                <span className="font-bold tabular-nums text-fg">{baseline.linkCount}</span>
                <span className="text-fg-faint">Feeding links</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-line-soft bg-surface-2 px-3 py-1.5 text-[12px]">
                <span className="font-bold tabular-nums text-fg">
                  {formatConnectance(baseline.connectance.value)}
                </span>
                <span className="text-fg-faint">Connectance</span>
              </div>
              <Badge tone="neutral">{ECOSYSTEM_LABEL[dataset.ecosystem]}</Badge>
              <StatusBadge status={dataset.sourceStatus} />
              {dataset.sourceStatus === 'illustrative-demo' && (
                <span
                  className="text-[10.5px] text-fg-faint"
                  title="Illustrative demo data — simplified for software demonstration; not a verified empirical food-web dataset."
                >
                  Illustrative teaching data — not field evidence
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Download size={13} />}
              onClick={() => downloadArtifact(nodesExportCsv(dataset))}
              title="Download nodes list CSV"
            >
              Node list
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<Download size={13} />}
              onClick={() => downloadArtifact(edgesExportCsv(dataset))}
              title="Download links list CSV"
            >
              Link list
            </Button>
            <button
              type="button"
              onClick={() => setDetailsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary-hover px-2 py-1 transition-colors"
            >
              <span>{detailsOpen ? 'Hide details' : 'View details'}</span>
              <ChevronDown size={13} className={cn('transition-transform', detailsOpen && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* Collapsible Details Panel */}
        {detailsOpen ? (
          <div className="mt-3.5 border-t border-line-soft pt-3 text-[12px]">
            <p className="text-fg-muted leading-relaxed mb-2">{dataset.summary}</p>
            <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-[11.5px] rounded-xl border border-line-soft bg-surface-2 p-3">
              {[
                ['Origin', dataset.provenance.origin],
                ['Citation', dataset.provenance.citation],
                ['Source URL or DOI', dataset.provenance.sourceUrl ?? 'Not provided'],
                ['Licence', dataset.provenance.license ?? 'Not provided'],
                ['Node unit', dataset.provenance.nodeUnit],
                ['Validation status', dataset.provenance.validationStatus],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="inline text-fg-faint">{k}: </dt>
                  <dd className="inline text-fg font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>

      {/* 3-Column Workspace Layout */}
      <div className="grid gap-4 xl:grid-cols-12 items-start">
        {/* Left Region: Species list */}
        {leftPanelOpen ? (
          <div className={cn('space-y-3 order-2 xl:order-1', rightPanelOpen ? 'xl:col-span-3' : 'xl:col-span-4')}>
            <Card>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line-soft">
                <div>
                  <h3 className="text-sm font-bold text-fg">Species</h3>
                  <p className="text-[11px] text-fg-faint">
                    {filteredNodes.length} of {graph.nodes.length} nodes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftPanelOpen(false)}
                  className="text-fg-faint hover:text-fg p-1 xl:hidden"
                  aria-label="Close species panel"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint"
                  />
                  <TextInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search species..."
                    aria-label="Search species"
                    className="pl-8 text-[12.5px] h-9"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear species search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg p-1"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>

                {/* Role filter */}
                <div>
                  <label htmlFor="role-filter" className="sr-only">
                    Filter by trophic role
                  </label>
                  <SelectInput
                    id="role-filter"
                    aria-label="Filter by trophic role"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as TrophicRole | 'all')}
                    className="text-[12px] h-8 py-1"
                  >
                    <option value="all">All roles ({graph.nodes.length})</option>
                    {rolesPresent.map((role) => (
                      <option key={role} value={role}>
                        {TROPHIC_ROLE_LABEL[role]}
                      </option>
                    ))}
                  </SelectInput>
                </div>

                {/* Species list */}
                {filteredNodes.length ? (
                  <ul className="max-h-[360px] space-y-1 overflow-auto pr-1">
                    {filteredNodes.map((node) => {
                      const active = node.id === selectedNodeId
                      const removed = result?.removedNodeIds.includes(node.id) ?? false
                      return (
                        <li key={node.id}>
                          <button
                            type="button"
                            onClick={() => selectNode(node.id)}
                            className={cn(
                              'w-full text-left rounded-xl border p-2 text-xs transition-colors flex items-center justify-between gap-2',
                              active
                                ? 'border-primary bg-primary-soft/40 shadow-xs ring-1 ring-primary'
                                : 'border-line-soft bg-surface hover:bg-surface-2',
                              removed && 'opacity-50 line-through',
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SpeciesIcon iconKey={node.iconKey} size={16} />
                              <div className="min-w-0">
                                <p className="font-semibold text-fg truncate">{node.name}</p>
                                <p className="text-[10px] text-fg-faint truncate">
                                  {TROPHIC_ROLE_LABEL[node.trophicRole]}
                                </p>
                              </div>
                            </div>
                            <span
                              className="text-[10.5px] tabular-nums text-fg-faint shrink-0"
                              title="in = recorded food sources this species eats · out = consumers that eat this species"
                            >
                              in:{graph.foodSourcesOf.get(node.id)?.length ?? 0} out:{graph.consumersOf.get(node.id)?.length ?? 0}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-fg-faint text-xs">
                    <p className="font-semibold text-fg">No matching species</p>
                    <p className="mt-1">Try clearing the search or role filter.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setRoleFilter('all')
                      }}
                      className="mt-3 text-xs"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <GraphLegend />
          </div>
        ) : null}

        {/* Center Region: Network Graph Canvas */}
        <div
          className={cn(
            'space-y-3 order-1 xl:order-2',
            leftPanelOpen && rightPanelOpen
              ? 'xl:col-span-6'
              : !leftPanelOpen && !rightPanelOpen
              ? 'xl:col-span-12'
              : 'xl:col-span-8',
          )}
        >
          <Card>
            <CardHeading
              title="Interactive food web"
              subtitle="Directed edges point from food source to consumer"
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLeftPanelOpen((prev) => !prev)}
                    title={leftPanelOpen ? 'Collapse species list' : 'Expand species list'}
                    aria-label={leftPanelOpen ? 'Collapse species list' : 'Expand species list'}
                    className="inline-flex text-[11.5px] h-7 px-2"
                  >
                    {leftPanelOpen ? <PanelLeftClose size={13} className="mr-1" /> : <PanelLeftOpen size={13} className="mr-1" />}
                    {leftPanelOpen ? 'Hide list' : 'Species list'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRightPanelOpen((prev) => !prev)}
                    title={rightPanelOpen ? 'Collapse inspector' : 'Expand inspector'}
                    aria-label={rightPanelOpen ? 'Collapse inspector' : 'Expand inspector'}
                    className="inline-flex text-[11.5px] h-7 px-2"
                  >
                    {rightPanelOpen ? <PanelRightClose size={13} className="mr-1" /> : <PanelRightOpen size={13} className="mr-1" />}
                    {rightPanelOpen ? 'Hide inspector' : 'Inspector'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const anyClosed = !leftPanelOpen || !rightPanelOpen
                      if (anyClosed) {
                        setLeftPanelOpen(true)
                        setRightPanelOpen(true)
                      } else {
                        setLeftPanelOpen(false)
                        setRightPanelOpen(false)
                      }
                    }}
                    title={!leftPanelOpen && !rightPanelOpen ? 'Restore side panels' : 'Maximize graph canvas'}
                    aria-label={!leftPanelOpen && !rightPanelOpen ? 'Restore side panels' : 'Maximize graph canvas'}
                    className="hidden xl:inline-flex text-[11.5px] h-7 px-2"
                  >
                    {!leftPanelOpen && !rightPanelOpen ? <Minimize2 size={13} className="mr-1" /> : <Maximize2 size={13} className="mr-1" />}
                    {!leftPanelOpen && !rightPanelOpen ? 'Restore' : 'Maximize'}
                  </Button>
                </div>
              }
            />

            <FoodWebGraph
              graph={graph}
              removedNodeIds={activeRemovedNodeIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={selectNode}
              directlyAffectedIds={result?.scenario.directlyAffectedConsumerIds ?? []}
              foodDepletedIds={result?.scenario.foodDepletedConsumerIds ?? []}
              highlightLinks={highlightLinks}
              searchQuery={search}
              className="min-h-[500px] lg:min-h-[560px]"
            />

            {result?.mode === 'cascade' && result.rounds.length > 0 && cascadeStep !== null ? (
              <CascadeTimeline
                result={result}
                step={cascadeStep}
                onStepChange={setCascadeStep}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((prev) => !prev)}
              />
            ) : null}

            {result ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] border-t border-line-soft pt-2.5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="danger">
                    {result.scenario.totalRemoved} node(s) removed
                  </Badge>
                  <Badge tone="secondary">
                    {result.scenario.directlyAffectedConsumerIds.length} directly affected
                  </Badge>
                  <Badge tone="highlight">
                    {result.scenario.foodDepletedConsumerIds.length} food-depleted
                  </Badge>
                  <Badge tone="neutral">
                    {result.scenario.linkCount} of {result.baseline.linkCount} links remain
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<FileText size={13} />}
                  onClick={() => setReportModalOpen(true)}
                  className="bg-emerald-800 text-white hover:bg-emerald-900 border-emerald-800 text-xs h-7.5 px-3 font-semibold shadow-xs"
                >
                  Print / Save PDF Report
                </Button>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Right Region: Selected Species Inspector & Simulation.
            On small screens the simulation controls come first (right after the
            species list) so Run is never buried below the long inspector. */}
        {rightPanelOpen ? (
          <div className={cn('space-y-3 order-3 xl:order-3 flex flex-col', leftPanelOpen ? 'xl:col-span-3' : 'xl:col-span-4')}>
            <div className="order-2 xl:order-1">
              <SpeciesInspector
                graph={graph}
                node={selectedNode}
                result={result}
                isSelected={Boolean(selectedNodeId)}
                onSelectForSimulation={(id) => removeFromScenario(id)}
                onResetSimulation={resetScenario}
                canRun={graph.nodes.length > 0}
              />
            </div>

            <div className="order-1 xl:order-2">
              <ScenarioControls
                dataset={dataset}
                node={selectedNode}
                mode={mode}
                onModeChange={setMode}
                onRun={runSelectedScenario}
                onReset={resetScenario}
                result={result}
                onOpenReport={() => setReportModalOpen(true)}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Results beneath workspace when scenario is run */}
      {result ? (
        <div className="space-y-4 mt-6">
          <Card>
            <CardHeading
              title="Baseline versus scenario"
              subtitle={`${result.mode === 'cascade' ? 'Direct removal + cascade' : 'Direct removal'} · initial node: ${result.primaryNodeLabel} · computed ${new Date(
                result.computedAt,
              ).toLocaleTimeString()}`}
            />
            <BaselineVsScenario baseline={result.baseline} result={result} labelFor={labelFor} />
          </Card>
          <WhatChanged result={result} labelFor={labelFor} />
        </div>
      ) : (
        <Callout tone="info" title="No scenario is running">
          The network above is the untouched baseline. Select a species and run a scenario to see
          the metrics, affected consumers, and explanation of what changed. Reset simulation always restores this
          exact baseline.
        </Callout>
      )}

      {/* Academic Printable PDF Report Modal */}
      {result && (
        <AcademicReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          dataset={dataset}
          result={result}
        />
      )}
    </div>
  )
}
