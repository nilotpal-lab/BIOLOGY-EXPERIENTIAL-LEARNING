import {
  FileText,
  FlaskConical,
  GitCompareArrows,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Target,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { RankingPanel } from '../components/results/RankingTable'
import { AcademicReportModal } from '../components/results/AcademicReportModal'
import { FoodWebGraph } from '../components/graph/FoodWebGraph'
import { SpeciesIcon } from '../components/SpeciesIcon'
import {
  Badge,
  Button,
  Card,
  CardHeading,
  EmptyState,
  SelectInput,
  StatusBadge,
  TextInput,
  cn,
} from '../components/ui/primitives'
import { formatConnectance, formatPercent } from '../core/metrics'
import { ECOSYSTEM_LABEL, TROPHIC_ROLE_LABEL } from '../core/types'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/Shell'

/* ============================================================================
 * ExperimentStudio (ScenarioAnalysis) — Page 3 matching 03_Experiment_Studio_LAYOUT_REFERENCE_ONLY.png.
 *
 * Implements two dedicated experimental modes:
 * 1. Systematic Sensitivity Scan: Full whole-network analysis ranking every species
 *    independently under deterministic cascade metrics.
 * 2. Interactive Removal Studio: Setup panel (mode toggle, target picker, cascade rule),
 *    live simulation canvas preview, and side-by-side quantitative result chips.
 *
 * Strictly maintains scientific honesty: purely structural cascade, no fake population dynamics.
 * ========================================================================== */

export function ScenarioAnalysis({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const {
    datasets,
    dataset,
    selectDataset,
    graph,
    baseline,
    selectedNodeId,
    selectNode,
    mode,
    setMode,
    runSelectedScenario,
    resetScenario,
    result,
    ranking,
    metricKey,
    setMetricKey,
    analysis,
    analysisRunning,
    analysisProgress,
    runAnalyseAll,
    cancelAnalyse,
    compareIds,
    toggleCompare,
  } = useAppState()

  const [studioView, setStudioView] = useState<'systematic' | 'interactive'>('systematic')
  const [speciesSearch, setSpeciesSearch] = useState('')
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const selectedNode = useMemo(
    () => (graph && selectedNodeId ? graph.nodeById.get(selectedNodeId) ?? null : null),
    [graph, selectedNodeId],
  )

  const filteredSpecies = useMemo(() => {
    if (!graph) return []
    const q = speciesSearch.trim().toLowerCase()
    if (!q) return graph.nodes
    return graph.nodes.filter(
      (n) => n.name.toLowerCase().includes(q) || (n.scientificName?.toLowerCase().includes(q) ?? false),
    )
  }, [graph, speciesSearch])

  if (!dataset || !graph || !baseline) {
    return (
      <Card>
        <CardHeading title="No dataset loaded" subtitle="Load a network before viewing analytics." />
        <EmptyState
          title="No valid graph is loaded"
          description="Scenario analysis needs a network. Load an illustrative demo network or import a documented dataset first."
          action={
            <Button variant="primary" onClick={() => onNavigate('library')}>
              Open the dataset library
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5EAE7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              title="Deterministic = the same inputs always produce exactly the same result. There is no randomness in these simulations."
              className="inline-block rounded-full bg-[#E8F5EE] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F6B52] cursor-help"
            >
              Deterministic Simulation Studio
            </span>
            <span className="text-xs font-semibold text-[#536960]">
              {dataset.name} ({ECOSYSTEM_LABEL[dataset.ecosystem]})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622] mt-1">
            Experiment Studio
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-[#536960] max-w-3xl">
            Simulate species removals using the deterministic structural cascade model, and run whole-network vulnerability rankings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<Target size={14} />}
            onClick={() => onNavigate('explore')}
            className="text-xs h-9"
          >
            Explorer Workspace
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<GitCompareArrows size={14} />}
            onClick={() => {
              if (!compareIds.includes(dataset.id)) toggleCompare(dataset.id)
              onNavigate('compare')
            }}
            className="text-xs h-9"
          >
            Cross-Network Benchmark
          </Button>
        </div>
      </div>

      {/* Dataset Context Bar Strip with Selector */}
      <div className="rounded-2xl border border-[#DCE7E1] bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {/* Dataset Selector Dropdown — hidden on desktop, where the sidebar
                "Current Network" picker is permanently visible; both stay in
                sync because they write the same application state. */}
            <div className="min-w-[240px] max-w-sm flex-1 lg:hidden">
              <label htmlFor="analytics-dataset-select" className="sr-only">
                Loaded network
              </label>
              <SelectInput
                id="analytics-dataset-select"
                aria-label="Loaded network"
                value={dataset.id}
                onChange={(event) => selectDataset(event.target.value)}
                className="font-semibold text-[#0E1622] text-xs h-9"
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
              <div className="flex items-center gap-1.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] px-3 py-1.5 text-xs">
                <span className="font-bold tabular-nums text-[#0E1622]">{baseline.nodeCount}</span>
                <span className="text-[#71837B]">Species (nodes)</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] px-3 py-1.5 text-xs">
                <span className="font-bold tabular-nums text-[#0E1622]">{baseline.linkCount}</span>
                <span className="text-[#71837B]">Feeding links</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] px-3 py-1.5 text-xs">
                <span className="font-bold tabular-nums text-[#0E1622]">
                  {formatConnectance(baseline.connectance.value)}
                </span>
                <span className="text-[#71837B]">Connectance</span>
              </div>
              <Badge tone="neutral">{ECOSYSTEM_LABEL[dataset.ecosystem]}</Badge>
              <StatusBadge status={dataset.sourceStatus} />
              {dataset.sourceStatus === 'illustrative-demo' && (
                <span className="text-[10.5px] text-[#71837B]" title="Illustrative demo data — simplified for software demonstration; not a verified empirical food-web dataset.">
                  Illustrative teaching data — not field evidence
                </span>
              )}
            </div>
          </div>

          <p
            className="text-[11.5px] text-[#71837B]"
            title="Deterministic = the same inputs always produce exactly the same result. Stochastic = involving randomness, which these simulations never use."
          >
            All simulations are structural and deterministic (the same removal always produces the
            same result). No stochastic (random) population assumptions.
          </p>
        </div>
      </div>

      {/* Primary Studio View Toggle */}
      <div className="space-y-1.5">
        <div className="flex rounded-2xl bg-[#F4F8F5] p-1 border border-[#DCE7E1] max-w-md">
          <button
            type="button"
            onClick={() => setStudioView('systematic')}
            title="Sensitivity scan: runs the removal rule on every species, one at a time, and ranks the results"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-colors',
              studioView === 'systematic'
                ? 'bg-white text-[#0F6B52] shadow-2xs'
                : 'text-[#536960] hover:text-[#0E1622]',
            )}
          >
            <SlidersHorizontal size={14} />
            Systematic Sensitivity Scan
          </button>
          <button
            type="button"
            onClick={() => setStudioView('interactive')}
            title="Interactive studio: remove one species you choose and read its impact"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-colors',
              studioView === 'interactive'
                ? 'bg-white text-[#0F6B52] shadow-2xs'
                : 'text-[#536960] hover:text-[#0E1622]',
            )}
          >
            <FlaskConical size={14} />
            Interactive Removal Studio
          </button>
        </div>
        <p className="text-[10.5px] text-[#71837B]">
          <strong className="text-[#0E1622]">Sensitivity Scan</strong> = test every species, one at
          a time, and rank the impact · <strong className="text-[#0E1622]">Interactive Studio</strong>{' '}
          = remove one species you choose.
        </p>
      </div>

      {/* =====================================================================
          VIEW 1: SYSTEMATIC SENSITIVITY SCAN & RANKINGS (Default Whole-Network)
          ===================================================================== */}
      {studioView === 'systematic' && (
        <div className="space-y-4">
          <RankingPanel
            ranking={ranking}
            metricKey={metricKey}
            onMetricChange={setMetricKey}
            onSelectNode={(nodeId) => {
              selectNode(nodeId)
              onNavigate('explore')
            }}
            onAnalyseAll={runAnalyseAll}
            onCancel={cancelAnalyse}
            running={analysisRunning}
            progress={analysisProgress}
            hasAnalysis={Boolean(analysis)}
            datasetName={dataset.name}
            baselineNodeCount={baseline.nodeCount}
          />

          <Card>
            <CardHeading title="How to read these results" />
            <ul className="space-y-2 text-[13px] leading-relaxed text-[#536960]">
              <li>
                <strong className="text-[#0E1622]">Link loss answers “how much of the recorded network disappears?”</strong>{' '}
                It is a percentage of the baseline link count, and it is not applicable when the baseline has no
                links.
              </li>
              <li>
                <strong className="text-[#0E1622]">Directly affected consumers answers “who lost a food source?”</strong>{' '}
                It counts surviving consumers that lost at least one recorded food link, each counted once.
              </li>
              <li>
                <strong className="text-[#0E1622]">Secondary removals and cascade depth answer “how far did the rule
                travel?”</strong> They depend entirely on the cascade rule and never on abundance or biomass.
              </li>
              <li>
                <strong className="text-[#0E1622]">Different metrics can disagree.</strong> A node can cause the largest link
                loss while another leaves more consumers affected. That is exactly why the metrics are ranked
                separately and no combined score is produced.
              </li>
            </ul>
          </Card>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: INTERACTIVE REMOVAL STUDIO (03_Experiment_Studio layout)
          ===================================================================== */}
      {studioView === 'interactive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (5 cols): Experiment Configuration & Species Picker */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-[#E5EAE7] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0E1622]">Experiment Setup</h3>
                  <p className="text-xs text-[#536960]">
                    Configure target removals and cascade parameters
                  </p>
                </div>
                <FlaskConical size={16} className="text-[#0F6B52]" />
              </div>

              {/* Target Species Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0E1622] flex items-center justify-between">
                  <span>Select Target Species</span>
                  <span className="text-[11px] font-normal text-[#71837B]">
                    {selectedNode ? selectedNode.name : 'None selected'}
                  </span>
                </label>

                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71837B]" />
                  <TextInput
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    placeholder="Filter species to select..."
                    aria-label="Filter species to select"
                    className="pl-8 text-xs h-8.5 rounded-xl border-[#DCE7E1]"
                  />
                </div>

                <div className="max-h-[65vh] sm:max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[#E5EAE7] p-1.5 bg-[#F8FAF8]">
                  {filteredSpecies.length === 0 && (
                    <p className="px-2 py-3 text-center text-[11px] text-[#71837B]" aria-live="polite">
                      No species match “{speciesSearch}”. Clear the filter to see all {graph.nodes.length} species.
                      <button
                        type="button"
                        onClick={() => setSpeciesSearch('')}
                        className="ml-1 font-semibold text-[#0F6B52] underline underline-offset-2"
                      >
                        Clear filter
                      </button>
                    </p>
                  )}
                  {filteredSpecies.map((node) => {
                    const isSelected = selectedNodeId === node.id
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => selectNode(node.id)}
                        className={cn(
                          'w-full min-h-11 flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left',
                          isSelected
                            ? 'bg-[#E8F5EE] text-[#0F6B52] font-semibold ring-1 ring-[#0F6B52]'
                            : 'hover:bg-white text-[#0E1622]',
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SpeciesIcon iconKey={node.iconKey} size={16} />
                          <span className="truncate">{node.name}</span>
                        </div>
                        <span className="text-[10px] text-[#71837B] uppercase shrink-0">
                          {TROPHIC_ROLE_LABEL[node.trophicRole] || node.trophicRole}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Simulation Rule Selection */}
              <div className="space-y-2 pt-2 border-t border-[#E5EAE7]">
                <label className="text-xs font-bold text-[#0E1622]">
                  Simulation Propagation Rule
                </label>
                <p className="text-[10.5px] text-[#71837B] leading-snug -mt-1">
                  How the removal spreads through the recorded feeding links. Cascade = the effect
                  spreads to consumers that depended on the removed species. The active rule is
                  outlined and ticked.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('direct')}
                    aria-pressed={mode === 'direct'}
                    title="Active rule: removes the selected species and its links only"
                    className={cn(
                      'relative p-2.5 pl-8 rounded-xl border text-left transition-colors text-xs',
                      mode === 'direct'
                        ? 'border-[#0F6B52] bg-[#E8F5EE] text-[#0F6B52] font-bold ring-2 ring-[#0F6B52]/40'
                        : 'border-[#DCE7E1] bg-white text-[#536960] hover:bg-[#F8FAF8]',
                    )}
                  >
                    {mode === 'direct' && (
                      <span
                        aria-hidden="true"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0F6B52] text-white"
                      >
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                          <path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    <p className="font-semibold text-[#0E1622]">Direct Removal</p>
                    <p className="mt-0.5 text-[10.5px] text-[#71837B] leading-tight">
                      Immediate link loss only
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('cascade')}
                    aria-pressed={mode === 'cascade'}
                    title="Active rule: also removes consumers that lose all of their recorded food sources"
                    className={cn(
                      'relative p-2.5 pl-8 rounded-xl border text-left transition-colors text-xs',
                      mode === 'cascade'
                        ? 'border-[#0F6B52] bg-[#E8F5EE] text-[#0F6B52] font-bold ring-2 ring-[#0F6B52]/40'
                        : 'border-[#DCE7E1] bg-white text-[#536960] hover:bg-[#F8FAF8]',
                    )}
                  >
                    {mode === 'cascade' && (
                      <span
                        aria-hidden="true"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0F6B52] text-white"
                      >
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                          <path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    <p className="font-semibold text-[#0E1622]">Structural Cascade</p>
                    <p className="mt-0.5 text-[10.5px] text-[#71837B] leading-tight">
                      Consumers losing 100% food
                    </p>
                  </button>
                </div>
              </div>

              {/* Run Actions */}
              <div className="pt-3 border-t border-[#E5EAE7] space-y-1.5">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    icon={<Play size={14} />}
                    onClick={runSelectedScenario}
                    disabled={!selectedNodeId}
                    className="flex-1 bg-[#0F6B52] hover:bg-[#0D5A45] text-white text-xs h-9 font-semibold shadow-xs"
                  >
                    Run Experiment
                  </Button>
                  {result && (
                    <Button
                      variant="outline"
                      icon={<RotateCcw size={14} />}
                      onClick={resetScenario}
                      className="text-xs h-9 border-[#DCE7E1]"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                {!selectedNodeId && (
                  <p
                    className="text-[11px] font-medium text-[#71837B]"
                    aria-live="polite"
                  >
                    Select a target species above to enable Run Experiment.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Live Simulation Canvas Preview & Result Matrix */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs flex-1 flex flex-col">
              <div className="pb-3 border-b border-[#E5EAE7] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0E1622]">Simulation Results & Preview</h3>
                  <p className="text-xs text-[#536960]">
                    {result
                      ? `Scenario: ${result.mode === 'cascade' ? 'Direct + Cascade' : 'Direct'} on ${result.primaryNodeLabel}`
                      : 'Awaiting experiment execution'}
                  </p>
                </div>
                {result && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<FileText size={13} />}
                    onClick={() => setReportModalOpen(true)}
                    className="text-xs h-7.5 px-2.5 text-[#0F6B52] border-[#DCE7E1]"
                  >
                    Export PDF Report
                  </Button>
                )}
              </div>

              {result ? (
                <div className="mt-3.5 space-y-4 flex-1">
                  {/* Floating Result Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8]">
                      <span className="text-[10px] uppercase font-bold text-[#71837B]">Nodes Remaining</span>
                      <p className="text-lg font-extrabold text-[#0E1622] tabular-nums mt-0.5">
                        {result.scenario.nodeCount} / {result.baseline.nodeCount}
                      </p>
                      <span className="text-[10.5px] text-[#536960]">
                        ({formatPercent((result.scenario.nodeCount / result.baseline.nodeCount) * 100)})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60">
                      <span className="text-[10px] uppercase font-bold text-rose-800">Secondary Removals</span>
                      <p className="text-lg font-extrabold text-rose-900 tabular-nums mt-0.5">
                        +{result.scenario.secondaryRemovals}
                      </p>
                      <span className="text-[10.5px] text-rose-700">Cascade consumers</span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60">
                      <span className="text-[10px] uppercase font-bold text-amber-800">Link Loss</span>
                      <p className="text-lg font-extrabold text-amber-900 tabular-nums mt-0.5">
                        {formatPercent(result.scenario.linkLossPercent.value)}
                      </p>
                      <span className="text-[10.5px] text-amber-700">
                        -{result.scenario.linksLost} links
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8]">
                      <span className="text-[10px] uppercase font-bold text-[#71837B]">Directly Affected</span>
                      <p className="text-lg font-extrabold text-[#0E1622] tabular-nums mt-0.5">
                        {result.scenario.directlyAffectedConsumerIds.length}
                      </p>
                      <span className="text-[10.5px] text-[#536960]">Lost &ge;1 food source</span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8]">
                      <span className="text-[10px] uppercase font-bold text-[#71837B]">Food Depleted</span>
                      <p className="text-lg font-extrabold text-[#0E1622] tabular-nums mt-0.5">
                        {result.scenario.foodDepletedConsumerIds.length}
                      </p>
                      <span className="text-[10.5px] text-[#536960]">Lost 100% food</span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8]">
                      <span className="text-[10px] uppercase font-bold text-[#71837B]">Connectance</span>
                      <p className="text-lg font-extrabold text-[#0E1622] tabular-nums mt-0.5">
                        {formatConnectance(result.scenario.connectance.value)}
                      </p>
                      <span className="text-[10.5px] text-[#536960]">Post-removal</span>
                    </div>
                  </div>

                  {/* Graph Preview */}
                  <div className="relative rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] overflow-hidden min-h-[300px] flex-1">
                    <FoodWebGraph
                      graph={graph}
                      removedNodeIds={result.removedNodeIds}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={selectNode}
                      directlyAffectedIds={result.scenario.directlyAffectedConsumerIds}
                      foodDepletedIds={result.scenario.foodDepletedConsumerIds}
                      className="h-full w-full min-h-[300px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-[#DCE7E1] text-center my-auto">
                  <FlaskConical size={36} className="text-[#0F6B52]/50 mb-2" />
                  <p className="text-sm font-bold text-[#0E1622]">No experiment running</p>
                  <p className="text-xs text-[#536960] max-w-sm mt-1">
                    Select a species on the left and click "Run Experiment" to compute the deterministic cascade and view side-by-side metrics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Academic PDF Report Modal */}
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
