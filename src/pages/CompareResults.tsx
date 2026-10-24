import { BarChart3, Download, GitCompareArrows, Play } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'
import { COMPARISON_LIMITATION } from '../core/comparisonEngine'
import { comparisonExportCsv, comparisonSummaryCsv, downloadArtifact } from '../core/exportUtils'
import { formatConnectance, formatPercent, roundTo } from '../core/metrics'
import { ECOSYSTEM_LABEL, SOURCE_STATUS_LABEL, type EcosystemCategory } from '../core/types'
import { useAppState } from '../state/AppState'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeading,
  EmptyState,
  HelpHint,
  ProgressBar,
  SelectInput,
  StatusBadge,
  cn,
} from '../components/ui/primitives'

/* ============================================================================
 * CompareResults — cross-network comparison (Prompt §13).
 *
 * All figures come from real scenarios run on each selected network. Category
 * level values are reported as ranges and medians across the supplied networks,
 * and the standing limitation is repeated wherever those numbers appear.
 * ========================================================================== */

const CHART_COLOURS = ['#0F6B52', '#218F91', '#2879B9', '#D97706', '#8B5CF6', '#C026D3']

/** Chart wrapper. A text footer keeps the key value readable without hover. */
function ChartCard({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeading title={title} subtitle={description} />
      <div className="h-64 w-full">{children}</div>
      {footer ? <div className="mt-2 text-[11px] text-fg-faint">{footer}</div> : null}
    </Card>
  )
}

export function CompareResults() {
  const { datasets, compareIds, toggleCompare, comparison, comparisonRunning, runComparison } = useAppState()
  const [ecosystemFilter, setEcosystemFilter] = useState<EcosystemCategory | 'all'>('all')

  const filteredDatasets = datasets.filter(
    (d) => ecosystemFilter === 'all' || d.ecosystem === ecosystemFilter,
  )

  const summaries = comparison?.datasets ?? []
  const categories = comparison?.categories ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 border-b border-[#E5EAE7] pb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F6B52]">Cross-Network Analysis</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E1622]">Insights & Compare</h1>
        <p className="text-xs sm:text-[13px] text-[#536960]">
          Compare 2–4 networks. Metrics are evaluated independently from each network's unchanged baseline.
        </p>
      </div>

      <Card>
        <CardHeading
          icon={<GitCompareArrows size={16} />}
          title="Select networks to compare"
          subtitle="Choose two or more loaded networks. Each network is analysed independently: every node is removed on its own, and the metrics below are the resulting distributions."
          actions={
            <Button
              variant="primary"
              icon={<Play size={14} />}
              onClick={runComparison}
              disabled={comparisonRunning || compareIds.length < 2}
            >
              Run comparison
            </Button>
          }
        />

        {/* Ecosystem Filter & Selection Counter */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line-soft bg-surface-2 p-2.5 text-[12px]">
          <div className="flex items-center gap-2">
            <label htmlFor="benchmark-eco-filter" className="text-[11px] font-medium text-fg-faint whitespace-nowrap">
              Ecosystem:
            </label>
            <SelectInput
              id="benchmark-eco-filter"
              value={ecosystemFilter}
              onChange={(e) => setEcosystemFilter(e.target.value as EcosystemCategory | 'all')}
              className="h-8 py-1 text-[12px]"
              aria-label="Filter networks by ecosystem"
            >
              <option value="all">All ecosystems ({datasets.length})</option>
              <option value="freshwater">Freshwater</option>
              <option value="terrestrial">Terrestrial</option>
              <option value="marine">Marine</option>
            </SelectInput>
          </div>
          <span className="text-[11.5px] text-fg-muted">
            <strong className="text-fg">{compareIds.length}</strong> of 4 selected
          </span>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDatasets.map((dataset, index) => {
            const selected = compareIds.includes(dataset.id)
            return (
              <li key={dataset.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 transition-colors',
                    selected ? 'border-primary bg-primary/[0.07]' : 'border-line-soft bg-surface-2 hover:border-line',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCompare(dataset.id)}
                    className="mt-1 accent-[#0F6B52]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-fg">{dataset.name}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <Badge tone="neutral">{ECOSYSTEM_LABEL[dataset.ecosystem]}</Badge>
                      <StatusBadge status={dataset.sourceStatus} />
                    </span>
                    <span className="mt-1 block text-[11px] text-fg-faint">
                      {dataset.nodes.length} nodes · {dataset.edges.length} links
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-1 w-8 rounded-full"
                      style={{ backgroundColor: CHART_COLOURS[index % CHART_COLOURS.length] }}
                    />
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        {comparisonRunning ? (
          <div className="mt-3">
            <ProgressBar
              value={60}
              label={`Analysing ${compareIds.length} network(s): every node is removed independently in both modes.`}
            />
          </div>
        ) : null}

        {compareIds.length < 2 ? (
          <p className="mt-3 text-[12px] text-fg-faint">
            Select at least two networks. A comparison of a single network cannot show how networks differ.
          </p>
        ) : null}
      </Card>

      {!comparison ? (
        <EmptyState
          icon={<BarChart3 size={18} />}
          title="No comparison computed yet"
          description="Select two or more networks above and run the comparison. Every chart and table below is built from the calculated scenario results, never from illustrative numbers."
        />
      ) : (
        <>
          <Callout tone="warning" title="Reading these figures">
            {COMPARISON_LIMITATION}
          </Callout>

          <Card>
            <CardHeading
              title="Baseline networks"
              subtitle="Raw counts and normalised values are both shown, so a larger network is never mistaken for a more vulnerable one."
              actions={
                <>
                  <Button size="sm" variant="outline" icon={<Download size={13} />} onClick={() => downloadArtifact(comparisonSummaryCsv(summaries))}>
                    Dataset summary (CSV)
                  </Button>
                  <Button size="sm" variant="outline" icon={<Download size={13} />} onClick={() => downloadArtifact(comparisonExportCsv(summaries))}>
                    Metric comparison (CSV)
                  </Button>
                </>
              }
            />
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[900px] border-collapse text-[12px]">
                <caption className="sr-only">Selected networks with their baseline statistics</caption>
                <thead>
                  <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide text-fg-faint">
                    <th scope="col" className="py-2 pr-3 font-medium">Network</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Data status</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Node unit</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Nodes</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Links</th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Connectance
                      <HelpHint text="L / (N x (N - 1)). Can rise or fall after a removal." />
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Links / node
                      <HelpHint text="Normalised link density, so networks of different sizes can be compared." />
                    </th>
                    <th scope="col" className="py-2 font-medium">Nodes analysed</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => (
                    <tr key={summary.datasetId} className="border-b border-line-soft/60">
                      <td className="py-2 pr-3 text-fg">{summary.datasetName}</td>
                      <td className="py-2 pr-3 text-fg-muted">{summary.ecosystemLabel}</td>
                      <td className="py-2 pr-3 text-fg-muted">{summary.sourceStatus}</td>
                      <td className="py-2 pr-3 text-fg-muted">{summary.nodeUnit}</td>
                      <td className="py-2 pr-3 tabular-nums text-fg">{summary.baselineNodeCount}</td>
                      <td className="py-2 pr-3 tabular-nums text-fg">{summary.baselineLinkCount}</td>
                      <td className="py-2 pr-3 tabular-nums text-fg">
                        {formatConnectance(summary.baselineConnectance)}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-fg-muted">
                        {summary.baselineNodeCount > 0
                          ? roundTo(summary.baselineLinkCount / summary.baselineNodeCount, 2).toFixed(2)
                          : 'N/A'}
                      </td>
                      <td className="py-2 tabular-nums text-fg-muted">{summary.analysedNodeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Baseline connectance by network"
              description="Density of recorded directed feeding links. Higher values mean more of the possible links are recorded."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaries.map((summary, index) => ({
                    name: summary.datasetName.split('·').pop()?.trim() ?? summary.datasetName,
                    value: summary.baselineConnectance ?? 0,
                    fill: CHART_COLOURS[index % CHART_COLOURS.length],
                  }))}
                  margin={{ top: 8, right: 12, bottom: 8, left: -18 }}
                >
                  <CartesianGrid stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#536960', fontSize: 10 }} interval={0} angle={-12} height={44} />
                  <YAxis tick={{ fill: '#536960', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #DCE7E1', borderRadius: 8, boxShadow: '0 4px 12px rgba(18,42,35,0.08)', fontSize: 12, color: '#122A23' }}
                    labelStyle={{ color: '#122A23', fontWeight: 600 }}
                    formatter={(value) => [Number(value ?? 0).toFixed(3), 'Connectance']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {summaries.map((summary, index) => (
                      <Cell key={summary.datasetId} fill={CHART_COLOURS[index % CHART_COLOURS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Largest link loss found in each network"
              description="The highest percentage of links lost by removing a single node, across all nodes analysed."
              footer={
                <ul className="space-y-0.5">
                  {summaries.map((summary) => {
                    const metric = summary.metrics.find((entry) => entry.key === 'linkLossPercent')
                    return (
                      <li key={summary.datasetId}>
                        {summary.datasetName}: highest {formatPercent(metric?.max ?? null)} from{' '}
                        {metric?.topNodeLabel ?? 'no applicable node'}
                      </li>
                    )
                  })}
                </ul>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaries.map((summary) => ({
                    name: summary.datasetName.split('·').pop()?.trim() ?? summary.datasetName,
                    value: summary.metrics.find((metric) => metric.key === 'linkLossPercent')?.max ?? 0,
                  }))}
                  margin={{ top: 8, right: 12, bottom: 8, left: -18 }}
                >
                  <CartesianGrid stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#536960', fontSize: 10 }} interval={0} angle={-12} height={44} />
                  <YAxis tick={{ fill: '#536960', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #DCE7E1', borderRadius: 8, boxShadow: '0 4px 12px rgba(18,42,35,0.08)', fontSize: 12, color: '#122A23' }}
                    labelStyle={{ color: '#122A23', fontWeight: 600 }}
                    formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, 'Highest link loss']}
                  />
                  <Bar dataKey="value" fill="#B33D46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Largest secondary removal count in each network"
              description="Cascade mode only: the most additional nodes any single removal qualified to remove, with the median across all nodes for context."
              footer={
                <ul className="space-y-0.5">
                  {summaries.map((summary) => {
                    const metric = summary.metrics.find((entry) => entry.key === 'secondaryRemovals')
                    return (
                      <li key={summary.datasetId}>
                        {summary.datasetName}: maximum {metric?.max ?? 0} from{' '}
                        {metric?.topNodeLabel ?? 'no applicable node'}, median {roundTo(metric?.median ?? 0, 2)}
                      </li>
                    )
                  })}
                </ul>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaries.map((summary) => ({
                    name: summary.datasetName.split('·').pop()?.trim() ?? summary.datasetName,
                    value: summary.metrics.find((metric) => metric.key === 'secondaryRemovals')?.max ?? 0,
                    median: summary.metrics.find((metric) => metric.key === 'secondaryRemovals')?.median ?? 0,
                  }))}
                  margin={{ top: 8, right: 12, bottom: 8, left: -18 }}
                >
                  <CartesianGrid stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#536960', fontSize: 10 }} interval={0} angle={-12} height={44} />
                  <YAxis tick={{ fill: '#536960', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #DCE7E1', borderRadius: 8, boxShadow: '0 4px 12px rgba(18,42,35,0.08)', fontSize: 12, color: '#122A23' }}
                    labelStyle={{ color: '#122A23', fontWeight: 600 }}
                    formatter={(value, name) => [String(value ?? 0), String(name ?? '')]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#536960' }} />
                  <Bar dataKey="value" name="Maximum" fill="#0F6B52" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="median" name="Median" fill="#218F91" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Median link loss per ecosystem category"
              description="Exploratory only: with two networks per category these medians describe the supplied networks, not the ecosystem type."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories
                    .filter((category) => category.datasetCount > 0)
                    .map((category) => ({
                      name: `${category.label} (${category.datasetCount})`,
                      value:
                        category.metrics.find((metric) => metric.key === 'linkLossPercent')?.median ?? 0,
                    }))}
                  margin={{ top: 8, right: 12, bottom: 8, left: -18 }}
                >
                  <CartesianGrid stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#536960', fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fill: '#536960', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #DCE7E1', borderRadius: 8, boxShadow: '0 4px 12px rgba(18,42,35,0.08)', fontSize: 12, color: '#122A23' }}
                    labelStyle={{ color: '#122A23', fontWeight: 600 }}
                    formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, 'Median of network maxima']}
                  />
                  <Bar dataKey="value" fill="#218F91" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <Card>
            <CardHeading
              title="Metric-wise summaries per network"
              subtitle="Minimum, median and maximum across every removal scenario for each metric. A text equivalent of the charts above."
            />
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[900px] border-collapse text-[12px]">
                <caption className="sr-only">Metric distributions for each selected network</caption>
                <thead>
                  <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide text-fg-faint">
                    <th scope="col" className="py-2 pr-3 font-medium">Network</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Metric</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Mode</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Min</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Median</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Max</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Node with the maximum</th>
                    <th scope="col" className="py-2 font-medium">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.flatMap((summary) =>
                    summary.metrics.map((metric) => (
                      <tr key={`${summary.datasetId}-${metric.key}`} className="border-b border-line-soft/60">
                        <td className="py-2 pr-3 text-fg">{summary.datasetName}</td>
                        <td className="py-2 pr-3 text-fg-muted">{metric.label}</td>
                        <td className="py-2 pr-3">
                          <Badge tone={metric.key === 'linkLossPercent' || metric.key === 'directlyAffectedConsumers' ? 'primary' : 'highlight'}>
                            {metric.key === 'linkLossPercent' || metric.key === 'directlyAffectedConsumers'
                              ? 'Direct'
                              : 'Cascade'}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-fg-muted">
                          {metric.unit === 'percent' ? formatPercent(metric.min) : (metric.min ?? 'N/A')}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-fg">
                          {metric.unit === 'percent' ? formatPercent(metric.median) : roundTo(metric.median ?? 0, 2)}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-fg">
                          {metric.unit === 'percent' ? formatPercent(metric.max) : (metric.max ?? 'N/A')}
                        </td>
                        <td className="py-2 pr-3 text-fg-muted">{metric.topNodeLabel ?? 'Not applicable'}</td>
                        <td className="py-2 text-[11px] text-fg-faint">{metric.definition}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeading
              title="Ecosystem category ranges"
              subtitle="Number of usable networks in each group, with the range and median of each metric across those networks."
            />
            <div className="grid gap-3 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.ecosystem} className="rounded-xl border border-line-soft bg-surface-2 p-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-fg">
                    {category.label}
                    <Badge tone={category.usableCount >= 2 ? 'secondary' : 'pending'}>
                      {category.usableCount} usable network(s)
                    </Badge>
                  </p>
                  <table className="mt-2 w-full border-collapse text-[11.5px]">
                    <caption className="sr-only">{category.label} metric ranges</caption>
                    <thead>
                      <tr className="text-left text-[10.5px] uppercase tracking-wide text-fg-faint">
                        <th scope="col" className="py-1 pr-2 font-medium">Metric</th>
                        <th scope="col" className="py-1 pr-2 font-medium">Range of network maxima</th>
                        <th scope="col" className="py-1 font-medium" title="Median across the networks in this category">
                          Median
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.metrics.map((metric) => (
                        <tr key={metric.key} className="border-t border-line-soft/60">
                          <td className="py-1 pr-2 text-fg-muted">{metric.label}</td>
                          <td className="py-1 pr-2 tabular-nums text-fg">
                            {metric.definedCount === 0
                              ? 'Not applicable'
                              : metric.unit === 'percent'
                                ? `${formatPercent(metric.min)} – ${formatPercent(metric.max)}`
                                : `${metric.min} – ${metric.max}`}
                          </td>
                          <td className="py-1 tabular-nums text-fg">
                            {metric.median === null
                              ? 'N/A'
                              : metric.unit === 'percent'
                                ? formatPercent(metric.median)
                                : roundTo(metric.median, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ul className="mt-2 space-y-0.5 text-[11px] text-fg-faint">
                    {category.links.map((link) => (
                      <li key={link.datasetName}>
                        {link.datasetName}: connectance {formatConnectance(link.value)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeading title="Provenance of every compared network" />
            <ul className="space-y-2">
              {summaries.map((summary) => (
                <li key={summary.datasetId} className="rounded-xl border border-line-soft bg-surface-2 p-2.5 text-[12px]">
                  <p className="font-medium text-fg">{summary.datasetName}</p>
                  <p className="mt-0.5 text-fg-muted">
                    {summary.ecosystemLabel} · {SOURCE_STATUS_LABEL[summary.sourceStatus as keyof typeof SOURCE_STATUS_LABEL] ?? summary.sourceStatus}
                  </p>
                  <p className="mt-0.5 text-fg-muted">Origin: {summary.origin}</p>
                  <p className="text-fg-muted">Citation: {summary.citation}</p>
                  <p className="text-fg-faint">
                    Source URL: {summary.sourceUrl ?? 'Not provided'} · Licence: {summary.license ?? 'Not provided'}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-faint">{summary.dataNote}</p>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
