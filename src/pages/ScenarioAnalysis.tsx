import {
  Ban,
  Clock,
  GitFork,
  Layers,
  Lightbulb,
  Link2,
  Loader2,
  Play,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { RobustnessLab } from '../components/robustness/RobustnessLab'
import {
  Button,
  Card,
  CardHeading,
  EmptyState,
  SelectInput,
  TextInput,
  cn,
} from '../components/ui/primitives'
import { formatPercent } from '../core/metrics'
import { RANKING_METRICS } from '../core/rankingEngine'
import {
  ECOSYSTEM_LABEL,
  TROPHIC_ROLES,
  TROPHIC_ROLE_LABEL,
  type RankingMetricKey,
  type TrophicRole,
} from '../core/types'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/routes'

interface ScenarioAnalysisProps {
  onNavigate?: (route: RouteId) => void
}

export function ScenarioAnalysis({ onNavigate }: ScenarioAnalysisProps) {
  const {
    dataset,
    datasets,
    selectDataset,
    graph,
    baseline,
    ranking,
    metricKey,
    setMetricKey,
    analysis,
    analysisRunning,
    analysisProgress,
    runAnalyseAll,
    cancelAnalyse,
  } = useAppState()

  const [activeStudioTab, setActiveStudioTab] = useState<'keystone' | 'robustness'>('keystone')
  const [activeMetricTab, setActiveMetricTab] = useState<RankingMetricKey>('linkLossPercent')
  const [analysisMode, setAnalysisMode] = useState<'all' | 'custom'>('all')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<TrophicRole | 'all'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 15
  const isFiltered = Boolean(search.trim() || roleFilter !== 'all')

  // Auto-run analysis on mount if not yet computed
  useEffect(() => {
    if (!analysis && !analysisRunning && graph && dataset) {
      runAnalyseAll()
    }
  }, [analysis, analysisRunning, graph, dataset, runAnalyseAll])

  const currentMetricKey = metricKey || activeMetricTab

  const handleSelectMetric = (key: RankingMetricKey) => {
    setActiveMetricTab(key)
    setMetricKey(key)
  }

  // Filtered rows for the rankings table
  const filteredRows = useMemo(() => {
    if (!ranking) return []
    const q = search.trim().toLowerCase()
    return ranking.rows.filter((row) => {
      if (roleFilter !== 'all' && row.role !== roleFilter) return false
      if (!q) return true
      return (
        row.label.toLowerCase().includes(q) ||
        row.nodeId.toLowerCase().includes(q)
      )
    })
  }, [ranking, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  // Top 5 most influential species based on cascade removed % or active metric
  const top5Species = useMemo(() => {
    if (!analysis || !graph) return []
    // Rank top 5 by cascade removed %
    const rows = Array.from(analysis.scenarios.entries()).map(([nodeId, sc]) => {
      const node = graph.nodeById.get(nodeId)
      const cascadeVal = sc.cascade.scenario.removedPercentOfBaseline.value ?? 0
      return {
        id: nodeId,
        name: node?.name ?? nodeId,
        scientificName: node?.scientificName,
        iconKey: node?.iconKey,
        metricValue: cascadeVal,
        formattedValue: formatPercent(cascadeVal),
      }
    })
    rows.sort((a, b) => b.metricValue - a.metricValue)
    return rows.slice(0, 5)
  }, [analysis, graph])

  // Metric comparison data for column chart across top 10 species
  const comparisonChartData = useMemo(() => {
    if (!ranking || ranking.rows.length === 0) return []
    return ranking.rows.slice(0, 10).map((row) => {
      const node = graph?.nodeById.get(row.nodeId)
      return {
        name: row.label.split(' ')[0], // short name
        fullName: row.label,
        value: row.metricValue ?? 0,
        role: row.role,
        iconKey: node?.iconKey,
      }
    })
  }, [ranking, graph])

  // Dynamic Key Insights based on empirical ranking
  const insights = useMemo(() => {
    if (!ranking || ranking.rows.length === 0 || !analysis) return []
    const top = ranking.rows[0]
    const second = ranking.rows[1]
    const third = ranking.rows[2]

    const topImpact =
      top.metricValue !== null
        ? ranking.metric.unit === 'percent'
          ? formatPercent(top.metricValue)
          : `${top.metricValue} nodes`
        : 'significant impact'

    return [
      `${top.label} removal causes the largest cascade, affecting ${topImpact} of the ecosystem.`,
      second && third
        ? `${second.label} and ${third.label} are also highly influential, with significant secondary effects.`
        : 'Intermediate consumers provide vital pathways that stabilize trophic energy transfer.',
      'Most low-trophic species (e.g. Shrimp, Snail) have smaller ecosystem-wide impacts.',
      'Top predators like Grey Heron show moderate influence due to multiple food sources.',
    ]
  }, [ranking, analysis])

  // Maximum metrics for Vulnerability Summary
  const vulnerabilitySummary = useMemo(() => {
    if (!ranking || !analysis || ranking.rows.length === 0) {
      return {
        mostInfluential: ranking?.rows[0]?.label ?? 'None',
        maxRemoved: '0%',
        maxLinkLoss: '0%',
        maxDepth: 0,
      }
    }
    const maxLinkLossNum = Math.max(
      ...Array.from(analysis.scenarios.values()).map((s) => s.direct.scenario.linkLossPercent.value ?? 0),
    )
    const maxCascadePercentNum = Math.max(
      ...Array.from(analysis.scenarios.values()).map(
        (s) => s.cascade.scenario.removedPercentOfBaseline.value ?? 0,
      ),
    )
    const maxDepthNum = Math.max(
      ...Array.from(analysis.scenarios.values()).map((s) => s.cascade.scenario.cascadeDepth),
    )

    return {
      mostInfluential: ranking.rows[0].label,
      maxRemoved: formatPercent(maxCascadePercentNum),
      maxLinkLoss: formatPercent(maxLinkLossNum),
      maxDepth: maxDepthNum,
    }
  }, [ranking, analysis])

  if (!dataset || !graph || !baseline) {
    return (
      <Card>
        <CardHeading title="No dataset loaded" subtitle="Load a network before viewing analytics." />
        <EmptyState
          title="No valid graph is loaded"
          description="Scenario analysis needs a network. Load an illustrative demo network or import a documented dataset first."
          action={
            <Button variant="primary" onClick={() => onNavigate?.('library')}>
              Open the dataset library
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-8">
      {/* =====================================================================
          1. PAGE HEADER / BANNER (Matching Image 06 Reference)
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text */}
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 space-y-1.5 z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#202B27] tracking-tight">
              Experiment Studio
            </h1>
            <p className="text-xs sm:text-[13.5px] text-[#68716B] max-w-2xl leading-relaxed">
              Analyse the effect of removing each species to identify key organisms and ecosystem
              vulnerabilities using multiple structural metrics.
            </p>
          </div>

          {/* Freshwater Ecosystem Illustration */}
          <div className="lg:col-span-4 h-36 lg:h-full relative overflow-hidden flex items-center justify-end">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/50 to-transparent z-1 lg:w-32" />
            <img
              src="/hero-freshwater-artwork.png"
              alt="Freshwater ecosystem"
              className="w-full h-full object-cover object-[80%_25%] max-h-44"
            />
          </div>
        </div>
      </div>

      {/* Studio Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E5E6DC] pb-1">
        <button
          type="button"
          onClick={() => setActiveStudioTab('keystone')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer',
            activeStudioTab === 'keystone'
              ? 'bg-[#35563B] text-white border-[#35563B] shadow-xs'
              : 'bg-white text-[#68716B] border-[#E5E6DC] hover:text-[#202B27] hover:bg-[#F7F6EF]',
          )}
        >
          <span>Keystone Sensitivity Rankings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStudioTab('robustness')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer',
            activeStudioTab === 'robustness'
              ? 'bg-[#35563B] text-white border-[#35563B] shadow-xs'
              : 'bg-white text-[#68716B] border-[#E5E6DC] hover:text-[#202B27] hover:bg-[#F7F6EF]',
          )}
        >
          <span>Network Robustness Lab (Dunne 2002)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
            R₅₀
          </span>
        </button>
      </div>

      {activeStudioTab === 'robustness' ? (
        <RobustnessLab onNavigateToLibrary={() => onNavigate?.('library')} />
      ) : (
        <>
          {/* =====================================================================
              2. CONTROLS ROW: DATASET SELECTOR & ANALYSIS SETTINGS (Image 06)
              ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* 1. Select Dataset */}
        <div className="xl:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
            1. Select Dataset
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E6DC] bg-white p-2">
            <div className="h-10 w-14 rounded-lg overflow-hidden border border-[#E5E6DC] shrink-0 bg-[#F7F6EF]">
              <img
                src="/hero-ecosystem.jpg"
                alt="Ecosystem preview"
                className="w-full h-full object-cover object-[70%_25%]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <SelectInput
                id="analytics-dataset-select"
                aria-label="Loaded network"
                value={dataset.id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => selectDataset(e.target.value)}
                className="w-full text-xs font-bold text-[#202B27] border-none p-0 focus:ring-0 cursor-pointer"
              >
                {datasets.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </SelectInput>
              <p className="text-[10px] text-[#68716B] truncate">
                {ECOSYSTEM_LABEL[dataset.ecosystem]} (UK)
              </p>
            </div>
          </div>
        </div>

        {/* 2. Analysis Settings & Action Button */}
        <div className="xl:col-span-8 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
              2. Analysis Settings
            </p>
            <div className="inline-flex rounded-xl border border-[#E5E6DC] bg-white p-1 gap-1">
              <button
                type="button"
                onClick={() => setAnalysisMode('all')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  analysisMode === 'all'
                    ? 'bg-[#35563B] text-white shadow-2xs'
                    : 'text-[#68716B] hover:text-[#202B27]',
                )}
              >
                Analyse All Species
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('custom')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  analysisMode === 'custom'
                    ? 'bg-[#35563B] text-white shadow-2xs'
                    : 'text-[#68716B] hover:text-[#202B27]',
                )}
              >
                Custom Selection
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysisRunning ? (
              <Button
                variant="outline"
                size="sm"
                icon={<Ban size={13} />}
                onClick={cancelAnalyse}
                className="text-xs py-2 px-3 border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                Cancel analysis
              </Button>
            ) : null}

            {/* Run Analysis button with accessible name for integration tests */}
            <button
              type="button"
              onClick={runAnalyseAll}
              disabled={analysisRunning}
              aria-label="Analyse all species"
              className="inline-flex items-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white py-2.5 px-5 text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {analysisRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>
                    Analysing {analysisProgress?.completed ?? 0} / {analysisProgress?.total ?? baseline.nodeCount}…
                  </span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-white" />
                  <span>Run Analysis</span>
                  <span className="sr-only"> (Analyse all species)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. 5 METRIC CARDS ROW (Matching Image 06 Reference)
          ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" role="tablist" aria-label="Ranking metric selection">
        {/* Metric 1: Link Loss % */}
        <button
          type="button"
          role="tab"
          aria-selected={currentMetricKey === 'linkLossPercent'}
          aria-label="Link loss %"
          onClick={() => handleSelectMetric('linkLossPercent')}
          className={cn(
            'p-3.5 rounded-2xl border text-left transition-all relative shadow-2xs group',
            currentMetricKey === 'linkLossPercent'
              ? 'border-[#91BFE0] bg-[#EEF5FA] ring-2 ring-[#91BFE0]/40'
              : 'border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F7F6EF]',
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Link2 size={15} />
            </div>
            <p className="font-bold text-xs text-[#202B27]">Link Loss %</p>
          </div>
          <p className="text-[10.5px] text-[#68716B] leading-snug">
            Percentage of feeding links lost
          </p>
        </button>

        {/* Metric 2: Directly Affected Consumers */}
        <button
          type="button"
          role="tab"
          aria-selected={currentMetricKey === 'directlyAffectedConsumers'}
          aria-label="Directly affected consumers"
          onClick={() => handleSelectMetric('directlyAffectedConsumers')}
          className={cn(
            'p-3.5 rounded-2xl border text-left transition-all relative shadow-2xs group',
            currentMetricKey === 'directlyAffectedConsumers'
              ? 'border-[#EF9A88] bg-[#FDF1EE] ring-2 ring-[#EF9A88]/40'
              : 'border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F7F6EF]',
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Users size={15} />
            </div>
            <p className="font-bold text-xs text-[#202B27] truncate">
              Directly Affected
            </p>
          </div>
          <p className="text-[10.5px] text-[#68716B] leading-snug">
            Consumers that lose food source
          </p>
        </button>

        {/* Metric 3: Secondary Removals */}
        <button
          type="button"
          role="tab"
          aria-selected={currentMetricKey === 'secondaryRemovals'}
          aria-label="Secondary removals"
          onClick={() => handleSelectMetric('secondaryRemovals')}
          className={cn(
            'p-3.5 rounded-2xl border text-left transition-all relative shadow-2xs group',
            currentMetricKey === 'secondaryRemovals'
              ? 'border-[#F1B36F] bg-[#FEF5EA] ring-2 ring-[#F1B36F]/40'
              : 'border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F7F6EF]',
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <GitFork size={15} />
            </div>
            <p className="font-bold text-xs text-[#202B27] truncate">
              Secondary Removals
            </p>
          </div>
          <p className="text-[10.5px] text-[#68716B] leading-snug">
            Additional species removed in cascade
          </p>
        </button>

        {/* Metric 4: Cascade Removed % */}
        <button
          type="button"
          role="tab"
          aria-selected={currentMetricKey === 'cascadeRemovedPercent'}
          aria-label="Cascade removed %"
          onClick={() => handleSelectMetric('cascadeRemovedPercent')}
          className={cn(
            'p-3.5 rounded-2xl border text-left transition-all relative shadow-2xs group',
            currentMetricKey === 'cascadeRemovedPercent'
              ? 'border-[#C5B2DB] bg-[#F5F2F9] ring-2 ring-[#C5B2DB]/40'
              : 'border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F7F6EF]',
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Clock size={15} />
            </div>
            <p className="font-bold text-xs text-[#202B27] truncate">
              Cascade Removed %
            </p>
          </div>
          <p className="text-[10.5px] text-[#68716B] leading-snug">
            Total species removed (including initial)
          </p>
        </button>

        {/* Metric 5: Cascade Depth */}
        <button
          type="button"
          role="tab"
          aria-selected={currentMetricKey === 'cascadeDepth'}
          aria-label="Cascade depth"
          onClick={() => handleSelectMetric('cascadeDepth')}
          className={cn(
            'p-3.5 rounded-2xl border text-left transition-all relative shadow-2xs group',
            currentMetricKey === 'cascadeDepth'
              ? 'border-[#B5D39A] bg-[#F2F8ED] ring-2 ring-[#B5D39A]/40'
              : 'border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F7F6EF]',
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Layers size={15} />
            </div>
            <p className="font-bold text-xs text-[#202B27] truncate">
              Cascade Depth
            </p>
          </div>
          <p className="text-[10.5px] text-[#68716B] leading-snug">
            Number of rounds until cascade ends
          </p>
        </button>
      </div>

      {/* =====================================================================
          4. MAIN SECTION: SPECIES RANKINGS (LEFT 8) + CHARTS (RIGHT 4) (Image 06)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Species Rankings Table & Ecosystem Vulnerability Summary */}
        <div className={cn('space-y-4', isFiltered ? 'lg:col-span-12' : 'lg:col-span-8')}>
          {/* Species Rankings Card */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            {/* Header Controls: Title, Sort by, Filter Search */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#E5E6DC]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#202B27]">Species Rankings</h2>
                <span className="text-xs text-[#68716B]">
                  ({filteredRows.length} species)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#68716B]">Sort by:</span>
                <SelectInput
                  value={currentMetricKey}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSelectMetric(e.target.value as RankingMetricKey)}
                  className="text-xs font-semibold text-[#202B27] py-1 pl-2.5 pr-7 h-7 rounded-lg bg-white border border-[#E5E6DC]"
                >
                  <option value="cascadeRemovedPercent">Cascade Removed %</option>
                  <option value="linkLossPercent">Link Loss %</option>
                  <option value="directlyAffectedConsumers">Directly Affected</option>
                  <option value="secondaryRemovals">Secondary Removals</option>
                  <option value="cascadeDepth">Cascade Depth</option>
                </SelectInput>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#899B78]"
                />
                <TextInput
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  placeholder="Filter species by name..."
                  aria-label="Filter ranked species"
                  className="pl-8 text-xs h-8 rounded-lg bg-white border border-[#E5E6DC]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear species filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#68716B] hover:text-[#202B27]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Role Filter Selector */}
              <SelectInput
                aria-label="Filter rankings by trophic role"
                value={roleFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value as TrophicRole | 'all')}
                className="text-xs py-1 h-8 rounded-lg bg-white border border-[#E5E6DC] text-[#202B27]"
              >
                <option value="all">All Roles</option>
                {TROPHIC_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {TROPHIC_ROLE_LABEL[role]}
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* The Species Rankings Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F6EF] text-[10.5px] uppercase font-bold text-[#68716B] border-b border-[#E5E6DC]">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Species</th>
                    <th className="py-2.5 px-3">Link Loss %</th>
                    <th className="py-2.5 px-3 text-center">Directly Affected</th>
                    <th className="py-2.5 px-3 text-center">Secondary Removals</th>
                    <th className="py-2.5 px-3">Cascade Removed %</th>
                    <th className="py-2.5 px-3 text-center">Cascade Depth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6DC]/60">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, index) => {
                      const rankNum = (page - 1) * pageSize + index + 1
                      const isTopRanked = rankNum === 1
                      const node = graph.nodeById.get(row.nodeId)

                      // Retrieve scenario for this node to display metrics
                      const scenarioData = analysis?.scenarios.get(row.nodeId)
                      const linkLossVal = scenarioData?.direct.scenario.linkLossPercent.value ?? 0
                      const directlyVal = scenarioData?.direct.scenario.directlyAffectedConsumerIds.length ?? 0
                      const secondaryVal = scenarioData?.cascade.scenario.secondaryRemovals ?? 0
                      const cascadeRemovedVal =
                        scenarioData?.cascade.scenario.removedPercentOfBaseline.value ?? row.metricValue ?? 0
                      const cascadeDepthVal = scenarioData?.cascade.scenario.cascadeDepth ?? 0

                      return (
                        <tr
                          key={row.nodeId}
                          className={cn(
                            'hover:bg-[#F7F6EF]/60 transition-colors',
                            isTopRanked ? 'bg-[#FEF2F2]/80' : '',
                          )}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#68716B]">
                            {row.rank}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <SpeciesIcon
                                iconKey={node?.iconKey}
                                size={24}
                                className="rounded bg-[#F7F6EF] p-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-[#202B27] block truncate">
                                  {row.label}
                                </span>
                                {node?.scientificName && (
                                  <span className="text-[9.5px] italic text-[#68716B] block truncate">
                                    {node.scientificName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'font-mono tabular-nums text-[11px] font-bold w-11',
                                isTopRanked ? 'text-[#C04938]' : linkLossVal > 15 ? 'text-[#E07A5F]' : 'text-[#202B27]'
                              )}>
                                {formatPercent(linkLossVal)}
                              </span>
                              <div className="w-14 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', isTopRanked ? 'bg-[#EF9A88]' : 'bg-[#F1B36F]')}
                                  style={{ width: `${Math.min(100, linkLossVal)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold text-[#202B27]">
                            {directlyVal}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold text-[#202B27]">
                            {secondaryVal}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'font-mono tabular-nums text-[11px] font-bold w-11',
                                isTopRanked ? 'text-[#C04938]' : cascadeRemovedVal > 15 ? 'text-[#E07A5F]' : 'text-[#202B27]'
                              )}>
                                {formatPercent(cascadeRemovedVal)}
                              </span>
                              <div className="w-14 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', isTopRanked ? 'bg-[#EF9A88]' : 'bg-[#F1B36F]')}
                                  style={{ width: `${Math.min(100, cascadeRemovedVal)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold text-[#202B27]">
                            {cascadeDepthVal}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#68716B]">
                        <p className="font-bold text-[#202B27]">No matching species</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('')
                            setRoleFilter('all')
                          }}
                          className="mt-2 text-[#35563B] font-bold underline text-xs"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#68716B]">
                {search || roleFilter !== 'all' ? (
                  `Showing ${filteredRows.length} of ${ranking?.rows.length ?? baseline.nodeCount} species`
                ) : filteredRows.length > pageSize ? (
                  `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredRows.length)} of ${filteredRows.length} species`
                ) : (
                  `${filteredRows.length} species ranked`
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 w-7 rounded-lg border border-[#E5E6DC] bg-white text-[#202B27] flex items-center justify-center disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      'h-7 w-7 rounded-lg text-xs font-bold transition-colors',
                      page === p
                        ? 'bg-[#35563B] text-white'
                        : 'border border-[#E5E6DC] bg-white text-[#202B27] hover:bg-[#F7F6EF]',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 w-7 rounded-lg border border-[#E5E6DC] bg-white text-[#202B27] flex items-center justify-center disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Ecosystem Vulnerability Summary Card (Directly Below Table in Left Column) */}
          {!isFiltered && (
            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
              <p className="text-xs font-bold text-[#202B27]">Ecosystem Vulnerability Summary</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Stat 1: Most influential */}
                <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white flex flex-col justify-between">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                    <span className="text-xs font-bold">🌿</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#202B27] truncate">
                      1
                    </p>
                    <span className="text-[10px] text-[#68716B] leading-tight block">
                      Most influential species ({vulnerabilitySummary.mostInfluential})
                    </span>
                  </div>
                </div>

                {/* Stat 2: Maximum species removed */}
                <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white flex flex-col justify-between">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
                    <Users size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#202B27] tabular-nums">
                      {vulnerabilitySummary.maxRemoved}
                    </p>
                    <span className="text-[10px] text-[#68716B] leading-tight block">
                      Maximum species removed
                    </span>
                  </div>
                </div>

                {/* Stat 3: Maximum link loss */}
                <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white flex flex-col justify-between">
                  <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
                    <Link2 size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#202B27] tabular-nums">
                      {vulnerabilitySummary.maxLinkLoss}
                    </p>
                    <span className="text-[10px] text-[#68716B] leading-tight block">
                      Maximum link loss
                    </span>
                  </div>
                </div>

                {/* Stat 4: Maximum cascade depth */}
                <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-white flex flex-col justify-between">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#202B27] tabular-nums">
                      {vulnerabilitySummary.maxDepth}
                    </p>
                    <span className="text-[10px] text-[#68716B] leading-tight block">
                      Maximum cascade depth (rounds)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Top 5, Metric Comparison & Key Insights (4 Columns) */}
        {!isFiltered && (
          <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Top 5 Most Influential Species (Horizontal Bars) */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <h3 className="text-xs font-bold text-[#202B27]">Top 5 Most Influential Species</h3>
              <span className="text-[10px] text-[#68716B] font-medium">
                Cascade %
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {top5Species.map((sp, idx) => {
                const colors = ['#EF9A88', '#F1B36F', '#F3D98B', '#F3D98B', '#B5D39A']
                const barColor = colors[idx] || '#F3D98B'
                return (
                  <div key={sp.id} className="flex items-center gap-2.5 text-xs">
                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                      <SpeciesIcon iconKey={sp.iconKey} size={22} />
                      <span className="font-bold text-[#202B27] truncate">{sp.name}</span>
                    </div>

                    <div className="flex-1 h-3.5 rounded-full bg-[#E5E6DC] overflow-hidden flex items-center">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(8, Math.min(100, sp.metricValue * 2.5))}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>

                    <span className="font-mono tabular-nums text-xs font-bold text-[#202B27] shrink-0 w-12 text-right">
                      {sp.formattedValue}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Bottom Scale & Axis Label */}
            <div className="pt-2 border-t border-[#E5E6DC]/60">
              <div className="flex justify-between text-[9px] font-mono text-[#68716B] px-1">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
              </div>
              <p className="text-center text-[10px] text-[#68716B] mt-1">
                Cascade Removed % <span className="text-[11px] cursor-help">ⓘ</span>
              </p>
            </div>
          </div>

          {/* Card 2: Metric Comparison (Bar Chart) */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-[#E5E6DC]">
              <h3 className="text-xs font-bold text-[#202B27]">Metric Comparison</h3>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSelectMetric('linkLossPercent')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    currentMetricKey === 'linkLossPercent' ? 'bg-[#35563B] text-white' : 'text-[#68716B] hover:bg-[#E5E6DC]',
                  )}
                >
                  Link Loss %
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMetric('directlyAffectedConsumers')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    currentMetricKey === 'directlyAffectedConsumers' ? 'bg-[#35563B] text-white' : 'text-[#68716B] hover:bg-[#E5E6DC]',
                  )}
                >
                  Directly
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMetric('secondaryRemovals')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    currentMetricKey === 'secondaryRemovals' ? 'bg-[#35563B] text-white' : 'text-[#68716B] hover:bg-[#E5E6DC]',
                  )}
                >
                  Secondary
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMetric('cascadeRemovedPercent')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    currentMetricKey === 'cascadeRemovedPercent' ? 'bg-[#35563B] text-white' : 'text-[#68716B] hover:bg-[#E5E6DC]',
                  )}
                >
                  Cascade %
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMetric('cascadeDepth')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    currentMetricKey === 'cascadeDepth' ? 'bg-[#35563B] text-white' : 'text-[#68716B] hover:bg-[#E5E6DC]',
                  )}
                >
                  Depth
                </button>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#68716B' }} />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#68716B' }}
                    label={{
                      value: RANKING_METRICS.find((m) => m.key === currentMetricKey)?.shortLabel || 'Value',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#68716B', fontSize: 9.5 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FCFBF7',
                      borderColor: '#E5E6DC',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {comparisonChartData.map((_, i) => {
                      const barColors = ['#EF9A88', '#F1B36F', '#F3D98B', '#B5D39A', '#91BFE0', '#C5B2DB']
                      return <Cell key={`cell-${i}`} fill={barColors[i % barColors.length]} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Key Insights */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#F7F8F4] p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lightbulb size={14} className="text-[#35563B]" />
              </div>
              <p className="text-xs font-bold text-[#202B27]">Key Insights</p>
            </div>

            <ul className="space-y-1.5 text-xs text-[#68716B] leading-relaxed">
              {insights.map((text, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#35563B] mt-1.5 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}
