import {
  Activity,
  ArrowRight,
  Compass,
  Database,
  FlaskConical,
  GitFork,
  Layers,
  Network,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useMemo } from 'react'
import { RESEARCH_SLOT_SUMMARY } from '../data/datasetRegistry'
import { ECOSYSTEM_LABEL, TROPHIC_ROLE_LABEL } from '../core/types'
import { computeBaselineMetrics, formatConnectance, formatPercent } from '../core/metrics'
import { computeTrophicLevels } from '../core/layout'
import { baselineIncomingCount } from '../core/graphModel'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/Shell'
import { Badge, Button, Card, CardHeading, StatusBadge } from '../components/ui/primitives'
import { FoodWebGraph } from '../components/graph/FoodWebGraph'

export function Overview({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const {
    datasets,
    demoDatasets,
    importedDatasets,
    dataset,
    graph,
    selectDataset,
    selectNode,
    lastAnalysis,
  } = useAppState()

  const verified = datasets.filter((entry) => entry.sourceStatus === 'research-verified').length

  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  const trophicLevels = useMemo(() => (graph ? computeTrophicLevels(graph) : new Map<string, number>()), [graph])

  const maxTrophicLevel = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return 1
    const vals = Array.from(trophicLevels.values())
    return Math.max(1, ...vals) + 1
  }, [graph, trophicLevels])

  const avgConnections = useMemo(() => {
    if (!baseline || baseline.nodeCount === 0) return '0.00'
    return (baseline.linkCount / baseline.nodeCount).toFixed(2)
  }, [baseline])

  // Trophic Level Distribution grouping (Levels 1 to Max)
  const trophicDistribution = useMemo(() => {
    if (!graph) return []
    const counts: { level: number; label: string; count: number; percent: number; color: string }[] = []
    const total = graph.nodes.length || 1

    const levelCounts = new Map<number, number>()
    for (const lvl of trophicLevels.values()) {
      levelCounts.set(lvl, (levelCounts.get(lvl) ?? 0) + 1)
    }

    const maxLvl = Math.max(0, ...Array.from(trophicLevels.values()))
    const colors = ['#2D7A5D', '#4A9A7A', '#E09F3E', '#9E2A2B', '#5A189A']

    for (let l = maxLvl; l >= 0; l--) {
      const c = levelCounts.get(l) ?? 0
      let label = `Trophic Level ${l + 1}`
      if (l === 0) label = 'Basal / Producers (Level 1)'
      else if (l === 1) label = 'Primary Consumers (Level 2)'
      else if (l === maxLvl && maxLvl > 1) label = `Apex Predators (Level ${l + 1})`
      else label = `Intermediate Consumers (Level ${l + 1})`

      counts.push({
        level: l + 1,
        label,
        count: c,
        percent: (c / total) * 100,
        color: colors[l % colors.length] || '#2D7A5D',
      })
    }
    return counts
  }, [graph, trophicLevels])

  // Key Connected Species strictly by total documented degree (In + Out)
  const keySpecies = useMemo(() => {
    if (!graph) return []
    return [...graph.nodes]
      .map((node) => {
        const inDeg = baselineIncomingCount(graph, node.id)
        const outDeg = graph.consumersOf.get(node.id)?.length ?? 0
        const totalDeg = inDeg + outDeg
        return {
          node,
          inDeg,
          outDeg,
          totalDeg,
          level: (trophicLevels.get(node.id) ?? 0) + 1,
        }
      })
      .sort((a, b) => b.totalDeg - a.totalDeg)
      .slice(0, 5)
  }, [graph, trophicLevels])

  // Structural composition: Basal (no prey), Top (no predators), Intermediate (both)
  const structuralGroups = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return { basal: 0, intermediate: 0, top: 0, total: 1 }
    let basal = 0
    let top = 0
    let intermediate = 0
    for (const node of graph.nodes) {
      const inDeg = baselineIncomingCount(graph, node.id)
      const outDeg = graph.consumersOf.get(node.id)?.length ?? 0
      if (inDeg === 0) basal += 1
      else if (outDeg === 0) top += 1
      else intermediate += 1
    }
    return { basal, intermediate, top, total: graph.nodes.length }
  }, [graph])

  // Consumer composition by documented trophic role
  const roleComposition = useMemo(() => {
    if (!graph) return []
    const roleCounts = new Map<string, number>()
    for (const node of graph.nodes) {
      const r = node.trophicRole
      roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1)
    }
    const total = graph.nodes.length || 1
    return Array.from(roleCounts.entries())
      .map(([role, count]) => ({
        role,
        label: TROPHIC_ROLE_LABEL[role as keyof typeof TROPHIC_ROLE_LABEL] || role,
        count,
        percent: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
  }, [graph])

  const loadFirstDemo = () => {
    const first = demoDatasets[0]
    if (first) {
      selectDataset(first.id)
      onNavigate('explore')
    }
  }

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Top Header matching 01_Overview.png */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5EAE7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-[#E8F5EE] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F6B52]">
              Ecosystem Overview
            </span>
            <span className="text-xs font-semibold text-[#536960]">
              {dataset ? `${dataset.name} (${ECOSYSTEM_LABEL[dataset.ecosystem]})` : 'No dataset'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622] mt-1">
            Understand food-web vulnerability.
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-[#536960] max-w-3xl">
            Comparative food-web disruption and vulnerability analysis. Explore documented feeding links and simulate structural changes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            icon={<Compass size={14} />}
            onClick={() => onNavigate('explore')}
            className="text-xs h-9"
          >
            Explore Workspace
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<FlaskConical size={14} />}
            onClick={() => onNavigate('experiment')}
            className="bg-[#0F6B52] hover:bg-[#0D5A45] text-xs h-9"
          >
            Experiment Studio
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards (Matching 01_Overview.png top row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Species */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#536960]">
              Total Species
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F5EE] text-[#0F6B52]">
              <Layers size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622] tabular-nums">
            {baseline ? baseline.nodeCount : '—'}
          </p>
          <p className="mt-1 text-[11px] text-[#71837B]">
            Documented taxa in active network
          </p>
        </div>

        {/* Card 2: Total Interactions */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#536960]">
              Total Interactions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F3F7] text-[#1B7285]">
              <Network size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622] tabular-nums">
            {baseline ? baseline.linkCount : '—'}
          </p>
          <p className="mt-1 text-[11px] text-[#71837B]">
            Documented directed feeding links
          </p>
        </div>

        {/* Card 3: Trophic Levels */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#536960]">
              Trophic Levels
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEF4E8] text-[#C06918]">
              <Activity size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622] tabular-nums">
            {maxTrophicLevel}
          </p>
          <p className="mt-1 text-[11px] text-[#71837B]">
            Computed longest-path food hierarchy
          </p>
        </div>

        {/* Card 4: Avg. Connections */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#536960]">
              Avg. Connections
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0EEFB] text-[#6042A6]">
              <GitFork size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622] tabular-nums">
            {avgConnections}
          </p>
          <p className="mt-1 text-[11px] text-[#71837B]">
            Documented links per species
          </p>
        </div>
      </div>

      {/* Middle Grid: Food Web Network Preview (Left) + Distribution & Key Species (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Food Web Network Canvas Card */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="flex-1 rounded-2xl border border-[#DCE7E1] bg-white p-4 shadow-2xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE7]">
              <div>
                <h3 className="text-base font-bold text-[#0E1622]">Food Web Network</h3>
                <p className="text-xs text-[#536960]">
                  Visual graph representation of documented feeding relationships
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowRight size={13} />}
                onClick={() => onNavigate('explore')}
                className="text-xs h-7.5 px-3 border-[#DCE7E1] text-[#0F6B52] hover:bg-[#E8F5EE]"
              >
                Open in Full Explorer
              </Button>
            </div>

            {/* Interactive Graph Canvas Preview */}
            <div className="flex-1 relative mt-3 rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] overflow-hidden min-h-[420px]">
              {graph ? (
                <FoodWebGraph
                  graph={graph}
                  removedNodeIds={[]}
                  selectedNodeId={null}
                  onSelectNode={(id) => {
                    if (id) {
                      selectNode(id)
                      onNavigate('explore')
                    }
                  }}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#536960]">
                  No graph loaded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Trophic Level Distribution + Key Connected Species */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5 flex flex-col justify-between">
          {/* Card: Trophic Level Distribution */}
          <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
            <div className="pb-3 border-b border-[#E5EAE7]">
              <h3 className="text-sm font-bold text-[#0E1622]">Trophic Level Distribution</h3>
              <p className="text-xs text-[#536960]">
                Species concentration across the energy hierarchy
              </p>
            </div>

            <div className="mt-3.5 space-y-3">
              {trophicDistribution.map((item) => (
                <div key={item.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0E1622]">{item.label}</span>
                    <span className="text-[#536960] tabular-nums font-medium">
                      {item.count} species ({item.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E5EAE7] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, item.percent)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Key Connected Species (Strictly degree-ranked; NO keystone claims) */}
          <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs flex-1">
            <div className="pb-3 border-b border-[#E5EAE7] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0E1622]">Most Connected Species</h3>
                <p className="text-xs text-[#536960]">
                  Ranked strictly by documented direct degree (links)
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71837B]">
                In + Out
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {keySpecies.map(({ node, inDeg, outDeg, totalDeg, level }) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] hover:bg-[#E8F5EE]/40 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#0E1622] truncate">{node.name}</p>
                      <span className="rounded bg-black/5 px-1.5 py-0.2 text-[9.5px] font-medium text-[#536960]">
                        Lvl {level}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71837B] truncate">
                      {inDeg} prey · {outDeg} predators
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-[#0F6B52] tabular-nums">
                      {totalDeg} links
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        selectNode(node.id)
                        onNavigate('explore')
                      }}
                      className="text-[11px] h-6 px-2 text-[#0F6B52] hover:bg-[#E8F5EE]"
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Network Summary, Consumer Composition, and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Network Summary Table */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
          <div className="pb-3 border-b border-[#E5EAE7]">
            <h3 className="text-sm font-bold text-[#0E1622]">Network Structure Summary</h3>
            <p className="text-xs text-[#536960]">
              Mathematical parameters of the loaded web
            </p>
          </div>
          <dl className="mt-3 divide-y divide-[#E5EAE7] text-xs">
            <div className="py-2 flex justify-between">
              <dt className="text-[#536960]">Connectance (L / S(S-1))</dt>
              <dd className="font-bold text-[#0E1622] tabular-nums">
                {baseline ? formatConnectance(baseline.connectance.value) : 'N/A'}
              </dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[#536960]">Basal Nodes (In-degree = 0)</dt>
              <dd className="font-bold text-[#0E1622] tabular-nums">
                {structuralGroups.basal} ({((structuralGroups.basal / structuralGroups.total) * 100).toFixed(1)}%)
              </dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[#536960]">Intermediate Nodes</dt>
              <dd className="font-bold text-[#0E1622] tabular-nums">
                {structuralGroups.intermediate} ({((structuralGroups.intermediate / structuralGroups.total) * 100).toFixed(1)}%)
              </dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[#536960]">Top Nodes (Out-degree = 0)</dt>
              <dd className="font-bold text-[#0E1622] tabular-nums">
                {structuralGroups.top} ({((structuralGroups.top / structuralGroups.total) * 100).toFixed(1)}%)
              </dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[#536960]">Source Verification</dt>
              <dd>
                {dataset && <StatusBadge status={dataset.sourceStatus} />}
              </dd>
            </div>
          </dl>
        </div>

        {/* 2. Consumer Composition */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs">
          <div className="pb-3 border-b border-[#E5EAE7]">
            <h3 className="text-sm font-bold text-[#0E1622]">Consumer Composition</h3>
            <p className="text-xs text-[#536960]">
              Breakdown of documented functional roles
            </p>
          </div>
          <div className="mt-3 space-y-2.5">
            {roleComposition.map((r) => (
              <div key={r.role} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#0E1622]">{r.label}</span>
                  <span className="text-[#536960] tabular-nums">
                    {r.count} ({r.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#E5EAE7] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F6B52]"
                    style={{ width: `${Math.max(2, r.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Quick Actions Launchpad */}
        <div className="rounded-2xl border border-[#DCE7E1] bg-white p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#E5EAE7]">
              <h3 className="text-sm font-bold text-[#0E1622]">Quick Actions</h3>
              <p className="text-xs text-[#536960]">
                Key tools and experimental workflows
              </p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('experiment')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] hover:bg-[#E8F5EE] text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FlaskConical size={16} className="text-[#0F6B52]" />
                  <div>
                    <p className="text-xs font-bold text-[#0E1622]">Simulate Removal</p>
                    <p className="text-[11px] text-[#536960]">Single & multi-node cascades</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#71837B]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('conservation')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] hover:bg-[#E8F5EE] text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} className="text-[#1B7285]" />
                  <div>
                    <p className="text-xs font-bold text-[#0E1622]">Compare Biomes</p>
                    <p className="text-[11px] text-[#536960]">Cross-ecosystem atlas</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#71837B]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] hover:bg-[#E8F5EE] text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Database size={16} className="text-[#C06918]" />
                  <div>
                    <p className="text-xs font-bold text-[#0E1622]">Data Library</p>
                    <p className="text-[11px] text-[#536960]">Export CSV & view provenance</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#71837B]" />
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#E5EAE7]">
            <Button
              size="sm"
              variant="outline"
              icon={<ShieldAlert size={14} />}
              onClick={() => onNavigate('methodology')}
              className="w-full text-xs h-8"
            >
              Methodology & Validation
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Analysis & Scientific Caveats Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Analysis Card */}
        <Card>
          <CardHeading
            icon={<FlaskConical size={16} />}
            title="Recent or current analysis"
            subtitle="A short record of the last scenario computed in this browser."
          />
          {lastAnalysis ? (
            <div className="space-y-3">
              <dl className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                  <dt className="text-fg-faint">Dataset</dt>
                  <dd className="font-semibold text-fg">{lastAnalysis.datasetName}</dd>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                  <dt className="text-fg-faint">Mode</dt>
                  <dd className="font-semibold text-fg">
                    {lastAnalysis.mode === 'cascade' ? 'Direct removal + cascade' : 'Direct removal'}
                  </dd>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                  <dt className="text-fg-faint">Initial node</dt>
                  <dd className="font-semibold text-fg">{lastAnalysis.primaryNodeLabel}</dd>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                  <dt className="text-fg-faint">Link loss</dt>
                  <dd className="font-semibold tabular-nums text-fg">
                    {formatPercent(lastAnalysis.linkLossPercent)}
                  </dd>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                  <dt className="text-fg-faint">Secondary removals</dt>
                  <dd className="font-semibold tabular-nums text-fg">{lastAnalysis.secondaryRemovals}</dd>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                  <dt className="text-fg-faint">Computed</dt>
                  <dd className="font-semibold text-fg">{new Date(lastAnalysis.at).toLocaleString()}</dd>
                </div>
              </dl>
              <Button variant="outline" onClick={() => onNavigate('scenario')}>
                Return to scenario analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[13px] text-fg-muted">
                No scenario has been saved in this browser yet. Load a network and run a removal to produce the
                first result.
              </p>
              <Button variant="primary" icon={<Compass size={15} />} onClick={loadFirstDemo}>
                Open the first demo network
              </Button>
            </div>
          )}
        </Card>

        {/* Scientific Integrity & Caveats */}
        <Card>
          <CardHeading
            icon={<ShieldCheck size={16} />}
            title="What these outputs are — and are not"
            subtitle="The interpretation rules the application follows everywhere."
          />
          <ul className="space-y-2 text-[12.5px] leading-relaxed text-fg-muted">
            <li>
              <strong className="text-fg">Structural disruption, not extinction.</strong> Removing every recorded
              food source from a consumer does not prove it would starve or go extinct.
            </li>
            <li>
              <strong className="text-fg">Recorded relationships only.</strong> A missing link means the source
              dataset does not record it, not that the relationship does not exist in nature.
            </li>
            <li>
              <strong className="text-fg">Deterministic rules, not population dynamics.</strong> The cascade is a
              fixed structural rule applied to the graph, with no abundance, biomass or time.
            </li>
            <li>
              <strong className="text-fg">Separate metrics.</strong> There is no single vulnerability score in
              this version; rankings are produced per metric and can disagree with each other.
            </li>
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line-soft pt-3">
            <div className="rounded-xl border border-line bg-surface-2 p-2.5">
              <p className="text-[11px] uppercase tracking-wide text-fg-faint">Demo networks</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-fg">{demoDatasets.length}</p>
              <p className="text-[11px] text-fg-faint">Illustrative, two per category</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-2.5">
              <p className="text-[11px] uppercase tracking-wide text-fg-faint">Verified research</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-fg">{verified}</p>
              <p className="text-[11px] text-fg-faint">
                {RESEARCH_SLOT_SUMMARY.verified} of {RESEARCH_SLOT_SUMMARY.total} research slots verified
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dataset Verification Summary Bar */}
      <div className="rounded-2xl border border-[#DCE7E1] bg-white p-3.5 flex flex-wrap items-center justify-between gap-3 text-[12px] shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#0E1622]">Library status:</span>
          <Badge tone="demo">{demoDatasets.length} illustrative demo</Badge>
          <Badge tone="verified">{verified} verified research</Badge>
          {importedDatasets.length ? (
            <Badge tone="warning">{importedDatasets.length} imported, validation pending</Badge>
          ) : null}
        </div>
        <p className="text-[11.5px] text-[#71837B]">
          The two freshwater networks are replicate ponds from one mesocosm study (Pond 1 & 47), not independent ecosystems.
        </p>
      </div>
    </div>
  )
}
