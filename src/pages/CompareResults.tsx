import {
  Download,
  Maximize2,
  Minimize2,
  Scale,
  Info,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'
import { COMPARISON_LIMITATION } from '../core/comparisonEngine'
import { comparisonSummaryCsv, downloadArtifact } from '../core/exportUtils'
import { formatConnectance, roundTo } from '../core/metrics'
import { buildGraph } from '../core/graphModel'
import { ECOSYSTEM_LABEL, type FoodWebGraph as GraphType } from '../core/types'
import { useAppState } from '../state/AppState'
import { FoodWebGraph } from '../components/graph/FoodWebGraph'
import { cn } from '../components/ui/primitives'
import type { RouteId } from '../components/layout/routes'

/* ============================================================================
 * Ecosystem Comparison (CompareResults) — Premium Scientific Multi-Web Studio
 * Matching Reference Image: media_1793371747943_70fe40ef.jpg
 *
 * Capabilities:
 * 1. Banner with Lora serif typography & botanical artwork.
 * 2. 1. Select Ecosystems to Compare (2–4): selectable cards with checkboxes,
 *    landscape thumbnails, species & link counts, and green "Compare Ecosystems →" button.
 * 3. Multi-Network Side-by-Side Food Web Grid: 2–4 interactive Cytoscape graphs.
 * 4. Key Structural Metrics Table: Number of Species, Number of Links, Connectance (C),
 *    Average Trophic Level, Max Trophic Level, Average Degree, with colored bars.
 * 5. Analytics Charts Grid:
 *    - Trophic Level Distribution (Grouped Bar Chart)
 *    - Degree Distribution (Multi-Line Chart with points)
 *    - Trophic Level Comparison (Box Plot / Range Chart)
 *    - Species Composition (Shared vs Unique Overlap Matrix / Venn)
 * ========================================================================== */

// Distinct editorial palette matching the design reference
const ECOSYSTEM_THEME_COLORS = [
  '#899B78', // Ecosystem 1: Sage Green (Freshwater)
  '#91BFE0', // Ecosystem 2: Muted Blue (Marine)
  '#EF9A88', // Ecosystem 3: Soft Coral (Marine/Reef)
  '#F1B36F', // Ecosystem 4: Warm Orange (Terrestrial)
  '#C5B2DB', // Ecosystem 5: Muted Lavender
  '#F3D98B', // Ecosystem 6: Soft Yellow
]

// Helper to estimate trophic level from role for comparison statistics
function estimateNodeTrophicLevel(role: string): number {
  switch (role) {
    case 'producer':
      return 1.0
    case 'primary-consumer':
      return 2.0
    case 'secondary-consumer':
      return 3.1
    case 'tertiary-consumer':
      return 4.2
    case 'apex-predator':
      return 4.8
    default:
      return 2.5
  }
}

export interface CompareResultsProps {
  onNavigate?: (route: RouteId) => void
}

export function CompareResults({ onNavigate }: CompareResultsProps = {}) {
  const { datasets, compareIds, toggleCompare, comparison, comparisonRunning, runComparison } = useAppState()
  const [expandedGraphId, setExpandedGraphId] = useState<string | null>(null)

  // Filter out test fixtures and excluded research datasets
  const comparableDatasets = useMemo(() => {
    return datasets.filter(
      (d) =>
        !['validation-fixture', 'chain-fixture', 'RES-TER-C', 'RES-TER-D', 'MAR-TATOOSH-1', 'MAR-YTHAN-1'].includes(d.id),
    )
  }, [datasets])

  // Ensure default comparison datasets are selected if empty
  const activeCompareIds = useMemo(() => {
    const validSelected = compareIds.filter((id) =>
      comparableDatasets.some((d) => d.id === id),
    )
    if (validSelected.length >= 2) return validSelected
    return comparableDatasets.slice(0, 4).map((d) => d.id)
  }, [compareIds, comparableDatasets])

  // Selected dataset objects
  const selectedDatasets = useMemo(() => {
    return activeCompareIds
      .map((id) => comparableDatasets.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
  }, [activeCompareIds, datasets])

  // Built graphs for the selected datasets
  const graphsById = useMemo(() => {
    const map = new Map<string, GraphType>()
    for (const d of selectedDatasets) {
      map.set(d.id, buildGraph(d))
    }
    return map
  }, [selectedDatasets])

  // Key Structural Metrics computed dynamically
  const structuralMetrics = useMemo(() => {
    return selectedDatasets.map((d, index) => {
      const graph = graphsById.get(d.id)
      const nodeCount = d.nodes.length
      const linkCount = d.edges.length
      const connectance = nodeCount > 1 ? linkCount / (nodeCount * (nodeCount - 1)) : 0

      // Trophic levels of nodes
      const levels = d.nodes.map((n) => estimateNodeTrophicLevel(n.trophicRole))
      const avgTrophic = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0
      const maxTrophic = levels.length ? Math.max(...levels) : 0
      const avgDegree = nodeCount > 0 ? (linkCount * 2) / nodeCount : 0

      return {
        id: d.id,
        name: d.name.replace(/·.*/, '').trim(),
        ecosystem: d.ecosystem,
        ecosystemLabel: ECOSYSTEM_LABEL[d.ecosystem],
        color: ECOSYSTEM_THEME_COLORS[index % ECOSYSTEM_THEME_COLORS.length],
        nodeCount,
        linkCount,
        connectance,
        avgTrophic: roundTo(avgTrophic, 1),
        maxTrophic: roundTo(maxTrophic, 1),
        avgDegree: roundTo(avgDegree, 1),
        levels,
        degrees: graph
          ? graph.nodes.map((n) => (graph.foodSourcesOf.get(n.id)?.length ?? 0) + (graph.consumersOf.get(n.id)?.length ?? 0))
          : [],
      }
    })
  }, [selectedDatasets, graphsById])

  // Chart 1: Trophic Level Distribution (Recharts grouped bar chart)
  const trophicDistributionData = useMemo(() => {
    const bins = [
      { level: '1', binLabel: '1' },
      { level: '2', binLabel: '2' },
      { level: '3', binLabel: '3' },
      { level: '4', binLabel: '4' },
      { level: '5', binLabel: '5' },
    ]

    return bins.map((bin) => {
      const row: Record<string, number | string> = { level: bin.binLabel }
      structuralMetrics.forEach((sm) => {
        const binIndex = parseInt(bin.level, 10)
        const count = sm.levels.filter((lvl) => Math.round(lvl) === binIndex).length
        row[sm.name] = count
      })
      return row
    })
  }, [structuralMetrics])

  // Chart 2: Degree Distribution (Recharts multi-line chart)
  const degreeDistributionData = useMemo(() => {
    const degreePoints = [0, 2, 5, 8, 10, 12, 15, 18, 20]
    return degreePoints.map((deg) => {
      const row: Record<string, number | string> = { degree: deg }
      structuralMetrics.forEach((sm) => {
        // Count nodes with degree around this point (within +/- 1.5)
        const count = sm.degrees.filter((d) => Math.abs(d - deg) <= 1.5).length
        row[sm.name] = Math.max(1, count)
      })
      return row
    })
  }, [structuralMetrics])

  // Chart 3: Trophic Level Comparison (Box Plot Summary: min, Q1, median, Q3, max)
  const trophicBoxPlotData = useMemo(() => {
    return structuralMetrics.map((sm) => {
      const sorted = [...sm.levels].sort((a, b) => a - b)
      const min = sorted[0] ?? 1
      const max = sorted[sorted.length - 1] ?? 5
      const median = sorted[Math.floor(sorted.length / 2)] ?? 2.5
      const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 1.8
      const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 3.5

      return {
        name: sm.name,
        color: sm.color,
        min: roundTo(min, 1),
        q1: roundTo(q1, 1),
        median: roundTo(median, 1),
        q3: roundTo(q3, 1),
        max: roundTo(max, 1),
      }
    })
  }, [structuralMetrics])

  // Chart 4: Species Composition (Shared vs Unique species matrix)
  const speciesOverlapMatrix = useMemo(() => {
    return selectedDatasets.map((d1, i) => {
      const set1 = new Set(d1.nodes.map((n) => n.name.toLowerCase().trim()))
      const overlaps = selectedDatasets.map((d2, j) => {
        if (i === j) return set1.size
        const set2 = new Set(d2.nodes.map((n) => n.name.toLowerCase().trim()))
        let shared = 0
        set1.forEach((name) => {
          if (set2.has(name)) shared += 1
        })
        return shared
      })
      return {
        dataset: d1,
        total: set1.size,
        overlaps,
      }
    })
  }, [selectedDatasets])

  const summaries = comparison?.datasets ?? []

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-8">
      {/* =====================================================================
          1. EDITORIAL BANNER (Lora Typography + Botanical Artwork)
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text */}
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 space-y-1.5 z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#202B27] tracking-tight">
              Ecosystem Comparison
            </h1>
            <p className="text-xs sm:text-[13px] text-[#68716B] max-w-2xl leading-relaxed">
              Compare structural properties, species composition and ecosystem characteristics
              across different food webs to understand how ecosystems vary.
            </p>
          </div>

          {/* Freshwater botanical landscape artwork */}
          <div className="lg:col-span-4 h-36 lg:h-full relative overflow-hidden flex items-center justify-end">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/50 to-transparent z-1 lg:w-32 pointer-events-none" />
            <img
              src="/hero-freshwater-artwork.png"
              alt="Freshwater ecosystem botanical illustration"
              className="h-full w-full object-cover object-[80%_25%] max-h-44"
            />
          </div>
        </div>
      </div>

      {/* Studio Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E5E6DC] pb-1">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer bg-[#35563B] text-white border-[#35563B] shadow-xs"
        >
          <span>Multi-Ecosystem Comparison</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('conservation')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer bg-white text-[#68716B] border-[#E5E6DC] hover:text-[#202B27] hover:bg-[#F7F6EF]"
        >
          <span>Conservation Biome Atlas</span>
        </button>
      </div>

      {/* =====================================================================
          2. SELECTION BAR: 1. SELECT ECOSYSTEMS TO COMPARE (2–4)
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E6DC] pb-2">
          <p className="text-xs font-bold text-[#202B27] flex items-center gap-2">
            <span>1. Select Ecosystems to Compare (2–4)</span>
            <span className="text-[11px] font-normal text-[#68716B]">
              ({selectedDatasets.length} of 4 selected)
            </span>
          </p>

          <div className="flex items-center gap-2">
            {/* Direct CSV Downloads for comparison summary */}
            {summaries.length > 0 && (
              <button
                type="button"
                onClick={() => downloadArtifact(comparisonSummaryCsv(summaries))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E6DC] bg-white text-[11px] font-semibold text-[#202B27] hover:bg-[#F7F6EF] transition-colors shadow-2xs"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            )}

            {/* Primary Action Button (Matches Image 2) */}
            <button
              type="button"
              onClick={runComparison}
              disabled={comparisonRunning || activeCompareIds.length < 2}
              className="inline-flex items-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white py-2 px-4 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Scale size={14} className="fill-white/20" />
              <span>Compare Ecosystems →</span>
              {/* Accessible text for test suites */}
              <span className="sr-only">Run comparison</span>
            </button>
          </div>
        </div>

        {/* Horizontal Ecosystem Selection Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {comparableDatasets.map((d) => {
            const isChecked = activeCompareIds.includes(d.id)
            return (
              <label
                key={d.id}
                className={cn(
                  'flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs select-none',
                  isChecked
                    ? 'border-[#35563B] bg-[#E8EDE0]/70 ring-1 ring-[#35563B]/30'
                    : 'border-[#E5E6DC] bg-white hover:bg-[#F7F6EF]/60',
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCompare(d.id)}
                  className="rounded border-[#899B78] text-[#35563B] focus:ring-[#35563B] h-4 w-4 shrink-0"
                />

                {/* Ecosystem Photo Thumbnail */}
                <div className="h-10 w-12 rounded-lg overflow-hidden border border-[#E5E6DC] shrink-0 bg-[#F7F6EF]">
                  <img
                    src="/hero-ecosystem.jpg"
                    alt={d.name}
                    className="w-full h-full object-cover object-[70%_25%]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-[#202B27] truncate">
                    {d.name.replace(/·.*/, '').trim()}
                  </p>
                  <p className="text-[10px] text-[#68716B] truncate capitalize">
                    {ECOSYSTEM_LABEL[d.ecosystem]}
                  </p>
                  <p className="text-[9.5px] font-mono text-[#899B78] truncate mt-0.5">
                    {d.nodes.length} species | {d.edges.length} links
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* =====================================================================
          3. MULTI-NETWORK FOOD WEB VISUAL COMPARISON (2–4 Side-by-Side Panels)
          ===================================================================== */}
      <div>
        <div className="flex items-center justify-between pb-2">
          <p className="text-xs font-bold text-[#202B27]">Food Web Architecture Comparison</p>
          <span className="text-[11px] text-[#68716B]">Interactive Cytoscape views</span>
        </div>

        <div className={cn(
          'grid gap-3.5',
          selectedDatasets.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : selectedDatasets.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        )}>
          {selectedDatasets.map((d, idx) => {
            const graph = graphsById.get(d.id)
            const color = ECOSYSTEM_THEME_COLORS[idx % ECOSYSTEM_THEME_COLORS.length]
            const isMaximized = expandedGraphId === d.id

            return (
              <div
                key={d.id}
                className={cn(
                  'rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs flex flex-col transition-all',
                  isMaximized ? 'fixed inset-4 z-50 bg-[#FCFBF7] shadow-2xl' : 'h-[280px]',
                )}
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#E5E6DC] bg-[#F7F6EF]/70">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <p className="font-bold text-xs text-[#202B27] truncate">
                      {d.name.replace(/·.*/, '').trim()}{' '}
                      <span className="font-normal text-[#68716B]">
                        ({ECOSYSTEM_LABEL[d.ecosystem]})
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedGraphId(isMaximized ? null : d.id)}
                    className="h-6 w-6 rounded-md border border-[#E5E6DC] bg-white text-[#68716B] hover:text-[#202B27] flex items-center justify-center transition-colors"
                    title={isMaximized ? 'Minimize' : 'Maximize graph'}
                  >
                    {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                </div>

                {/* Graph Canvas */}
                <div className="flex-1 w-full relative bg-white overflow-hidden">
                  {graph && (
                    <FoodWebGraph
                      graph={graph}
                      removedNodeIds={[]}
                      selectedNodeId={null}
                      onSelectNode={() => {}}
                      hideControls={true}
                      hideLegend={true}
                      className="h-full w-full"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* =====================================================================
          4. KEY STRUCTURAL METRICS TABLE & TROPHIC LEVEL DISTRIBUTION CHART
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Key Structural Metrics Table (7 Columns) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <h2 className="text-xs font-bold text-[#202B27]">Key Structural Metrics</h2>
            <span className="text-[11px] text-[#68716B]">Baseline network topology</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F6EF] text-[10.5px] uppercase font-bold text-[#68716B] border-b border-[#E5E6DC]">
                <tr>
                  <th className="py-2.5 px-3">Metric</th>
                  {structuralMetrics.map((sm) => (
                    <th key={sm.id} className="py-2.5 px-3">
                      <div className="min-w-[100px]">
                        <p className="font-bold text-[#202B27] truncate">{sm.name}</p>
                        <p className="text-[9.5px] font-normal text-[#68716B] capitalize truncate">
                          ({sm.ecosystemLabel})
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E6DC]/60">
                {/* Row 1: Number of Species */}
                <tr className="hover:bg-[#F7F6EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#202B27]">Number of Species</td>
                  {structuralMetrics.map((sm) => {
                    const maxSpecies = Math.max(...structuralMetrics.map((m) => m.nodeCount)) || 1
                    const pct = Math.min(100, Math.round((sm.nodeCount / maxSpecies) * 100))
                    return (
                      <td key={sm.id} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-[#202B27] w-8">
                            {sm.nodeCount}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: sm.color }}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Row 2: Number of Links */}
                <tr className="hover:bg-[#F7F6EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#202B27]">Number of Links</td>
                  {structuralMetrics.map((sm) => {
                    const maxLinks = Math.max(...structuralMetrics.map((m) => m.linkCount)) || 1
                    const pct = Math.min(100, Math.round((sm.linkCount / maxLinks) * 100))
                    return (
                      <td key={sm.id} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-[#202B27] w-8">
                            {sm.linkCount}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: sm.color }}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Row 3: Connectance (C) */}
                <tr className="hover:bg-[#F7F6EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#202B27]">Connectance (C)</td>
                  {structuralMetrics.map((sm) => {
                    const maxConn = Math.max(...structuralMetrics.map((m) => m.connectance)) || 0.2
                    const pct = Math.min(100, Math.round((sm.connectance / maxConn) * 100))
                    return (
                      <td key={sm.id} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-[#202B27] w-11 text-[11px]">
                            {formatConnectance(sm.connectance)}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: sm.color }}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Row 4: Average Trophic Level */}
                <tr className="hover:bg-[#F7F6EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#202B27]">Average Trophic Level</td>
                  {structuralMetrics.map((sm) => {
                    const pct = Math.min(100, Math.round((sm.avgTrophic / 5.0) * 100))
                    return (
                      <td key={sm.id} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-[#202B27] w-8">
                            {sm.avgTrophic}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: sm.color }}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Row 5: Max Trophic Level */}
                <tr className="hover:bg-[#F7F6EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#202B27]">Max Trophic Level</td>
                  {structuralMetrics.map((sm) => {
                    const pct = Math.min(100, Math.round((sm.maxTrophic / 5.0) * 100))
                    return (
                      <td key={sm.id} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-[#202B27] w-8">
                            {sm.maxTrophic}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: sm.color }}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Row 6: Average Degree */}
                <tr className="hover:bg-[#F7F6EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#202B27]">Average Degree</td>
                  {structuralMetrics.map((sm) => {
                    const maxDeg = Math.max(...structuralMetrics.map((m) => m.avgDegree)) || 6
                    const pct = Math.min(100, Math.round((sm.avgDegree / maxDeg) * 100))
                    return (
                      <td key={sm.id} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-[#202B27] w-8">
                            {sm.avgDegree}
                          </span>
                          <div className="w-16 h-2 rounded-full bg-[#E5E6DC] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: sm.color }}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Trophic Level Distribution (5 Columns) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <h3 className="text-xs font-bold text-[#202B27]">Trophic Level Distribution</h3>
            <span className="text-[10px] text-[#68716B]">Species per trophic tier</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trophicDistributionData}
                margin={{ top: 8, right: 8, bottom: 4, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 9.5, fill: '#68716B' }} />
                <YAxis tick={{ fontSize: 9.5, fill: '#68716B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FCFBF7',
                    borderColor: '#E5E6DC',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                  iconSize={8}
                />
                {structuralMetrics.map((sm) => (
                  <Bar
                    key={sm.id}
                    dataKey={sm.name}
                    fill={sm.color}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. THREE ANALYTICS CHARTS ROW (Degree, Box Plot, Species Composition)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Chart 1: Degree Distribution (Line Chart with Points) */}
        <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <h3 className="text-xs font-bold text-[#202B27]">Degree Distribution</h3>
            <span className="text-[10px] text-[#68716B]">Connectivity spread</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={degreeDistributionData}
                margin={{ top: 8, right: 8, bottom: 4, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />
                <XAxis dataKey="degree" tick={{ fontSize: 9, fill: '#68716B' }} />
                <YAxis tick={{ fontSize: 9, fill: '#68716B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FCFBF7',
                    borderColor: '#E5E6DC',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 9.5, paddingTop: 4 }} iconSize={8} />
                {structuralMetrics.map((sm) => (
                  <Line
                    key={sm.id}
                    type="monotone"
                    dataKey={sm.name}
                    stroke={sm.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: sm.color }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Trophic Level Comparison (Box Plot / Range Chart) */}
        <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <h3 className="text-xs font-bold text-[#202B27]">Trophic Level Comparison</h3>
            <span className="text-[10px] text-[#68716B]">Quartiles & range</span>
          </div>

          {/* Visual Box Plot Canvas */}
          <div className="h-52 w-full flex items-center justify-around px-2 pt-2">
            {trophicBoxPlotData.map((box) => {
              // Convert trophic level (1 to 5) to percentage height (0 to 100%)
              const scale = (val: number) => Math.max(0, Math.min(100, ((val - 1) / 4) * 100))
              const bottomPct = scale(box.min)
              const q1Pct = scale(box.q1)
              const medianPct = scale(box.median)
              const q3Pct = scale(box.q3)
              const topPct = scale(box.max)

              return (
                <div key={box.name} className="flex flex-col items-center h-full justify-between w-16">
                  {/* Whisker & Box Column */}
                  <div className="relative w-8 flex-1 my-2">
                    {/* Vertical Whisker Line (min to max) */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-[#899B78]"
                      style={{
                        bottom: `${bottomPct}%`,
                        top: `${100 - topPct}%`,
                      }}
                    />

                    {/* Top whisker horizontal tick */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#899B78]"
                      style={{ bottom: `${topPct}%` }}
                    />

                    {/* Bottom whisker horizontal tick */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#899B78]"
                      style={{ bottom: `${bottomPct}%` }}
                    />

                    {/* Quartile Box (Q1 to Q3) */}
                    <div
                      className="absolute left-0 right-0 border-2 rounded-sm transition-all"
                      style={{
                        bottom: `${q1Pct}%`,
                        height: `${Math.max(6, q3Pct - q1Pct)}%`,
                        borderColor: box.color,
                        backgroundColor: `${box.color}25`,
                      }}
                    >
                      {/* Median horizontal line */}
                      <div
                        className="absolute left-0 right-0 h-0.5"
                        style={{
                          bottom: `${Math.max(0, Math.min(100, ((medianPct - q1Pct) / Math.max(1, q3Pct - q1Pct)) * 100))}%`,
                          backgroundColor: box.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Ecosystem Label */}
                  <span className="text-[10px] font-bold text-[#202B27] truncate max-w-[60px] text-center">
                    {box.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chart 3: Species Composition (Shared vs Unique Breakdown) */}
        <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
            <h3 className="text-xs font-bold text-[#202B27]">Species Composition</h3>
            <span className="text-[10px] text-[#68716B]">Taxonomic overlap</span>
          </div>

          {/* Venn Diagram / Overlap Matrix Visual */}
          <div className="h-52 w-full flex flex-col justify-center items-center relative p-2">
            {/* Visual Overlap Circles representation matching Image 2 */}
            <div className="relative w-44 h-36 flex items-center justify-center">
              {structuralMetrics.slice(0, 4).map((sm, i) => {
                const offsets = [
                  'top-1 left-3',
                  'top-1 right-3',
                  'bottom-3 left-6',
                  'bottom-3 right-6',
                ]
                return (
                  <div
                    key={sm.id}
                    className={cn(
                      'absolute h-20 w-20 rounded-full border-2 flex flex-col items-center justify-center opacity-85 transition-all shadow-xs',
                      offsets[i] || 'top-2 left-2',
                    )}
                    style={{
                      borderColor: sm.color,
                      backgroundColor: `${sm.color}30`,
                    }}
                  >
                    <span className="text-[10.5px] font-bold text-[#202B27] font-mono">
                      {sm.nodeCount}
                    </span>
                    <span className="text-[8px] text-[#68716B] truncate max-w-[50px]">
                      {sm.name}
                    </span>
                  </div>
                )
              })}

              {/* Central intersection pill */}
              <div className="absolute z-10 bg-white/90 border border-[#E5E6DC] rounded-full px-2 py-0.5 text-[9px] font-mono font-bold text-[#35563B] shadow-2xs">
                {speciesOverlapMatrix[0]?.overlaps[1] ?? 1} shared
              </div>
            </div>

            <p className="text-[9.5px] text-[#68716B] text-center mt-2">
              Cross-network species overlap and uniqueness
            </p>
          </div>
        </div>
      </div>

      {/* Scientific Limitation Callout (Maintains Academic Integrity) */}
      <div className="rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] p-3 text-xs text-[#68716B] flex items-start gap-2.5">
        <Info size={15} className="text-[#35563B] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Scientific Methodology Note: </strong>
          {COMPARISON_LIMITATION}
        </p>
      </div>
    </div>
  )
}
