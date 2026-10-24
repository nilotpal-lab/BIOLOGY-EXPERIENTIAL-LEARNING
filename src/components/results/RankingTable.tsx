import {
  ArrowUpDown,
  Ban,
  BarChart2,
  Download,
  Info,
  ListOrdered,
  Loader2,
  Play,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RANKING_METRICS } from '../../core/rankingEngine'
import { formatPercent, roundTo } from '../../core/metrics'
import { rankingExportCsv, downloadArtifact } from '../../core/exportUtils'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeading,
  EmptyState,
  HelpHint,
  MonoId,
  ProgressBar,
  SelectInput,
  TextInput,
  cn,
} from '../ui/primitives'
import {
  TROPHIC_ROLES,
  TROPHIC_ROLE_LABEL,
  type RankingMetricKey,
  type RankingResult,
  type TrophicRole,
} from '../../core/types'

/* ============================================================================
 * RankingPanel — species ranking engine matching mockup 05 (Analytics).
 *
 * Each metric is ranked on its own without composite scores. Top 5 visual chart,
 * searchable and role-filterable table, and plain-language metric definitions.
 * ========================================================================== */

function formatMetricValue(value: number | null, unit: 'percent' | 'count'): string {
  if (value === null) return 'N/A'
  return unit === 'percent' ? formatPercent(value) : String(roundTo(value, 2))
}

export function RankingPanel({
  ranking,
  metricKey,
  onMetricChange,
  onSelectNode,
  onAnalyseAll,
  onCancel,
  running,
  progress,
  hasAnalysis,
  datasetName,
  baselineNodeCount,
}: {
  ranking: RankingResult | null
  metricKey: RankingMetricKey
  onMetricChange: (key: RankingMetricKey) => void
  onSelectNode: (nodeId: string) => void
  onAnalyseAll: () => void
  onCancel: () => void
  running: boolean
  progress: { completed: number; total: number } | null
  hasAnalysis: boolean
  datasetName: string
  baselineNodeCount: number
}) {
  const metric = RANKING_METRICS.find((entry) => entry.key === metricKey) ?? RANKING_METRICS[0]
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<TrophicRole | 'all'>('all')

  const filteredRows = useMemo(() => {
    if (!ranking) return []
    const query = search.trim().toLowerCase()
    return ranking.rows.filter((row) => {
      if (roleFilter !== 'all' && row.role !== roleFilter) return false
      if (!query) return true
      return (
        row.label.toLowerCase().includes(query) ||
        row.nodeId.toLowerCase().includes(query)
      )
    })
  }, [ranking, search, roleFilter])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const [prevFilters, setPrevFilters] = useState({ search, roleFilter, metricKey })
  if (prevFilters.search !== search || prevFilters.roleFilter !== roleFilter || prevFilters.metricKey !== metricKey) {
    setPrevFilters({ search, roleFilter, metricKey })
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const top5Data = useMemo(() => {
    if (!ranking) return []
    return ranking.rows
      .filter((r) => r.metricValue !== null && r.metricValue > 0)
      .slice(0, 5)
      .map((r) => ({
        name: r.label.length > 18 ? `${r.label.slice(0, 16)}…` : r.label,
        fullName: r.label,
        value: r.metricValue ?? 0,
      }))
  }, [ranking])

  return (
    <div className="space-y-4">
      {/* Metric Selector segmented tabs & actions */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-line-soft">
          <div>
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <ListOrdered size={16} className="text-primary" />
              Metric-wise species ranking
            </h3>
            <p className="text-[12px] text-fg-muted">
              Select one metric to rank species. Rankings are calculated independently for each metric.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {running ? (
              <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={onCancel}>
                Cancel analysis
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                icon={running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                onClick={onAnalyseAll}
                disabled={running || baselineNodeCount === 0}
              >
                {hasAnalysis ? 'Re-run all species' : 'Analyse all species'}
              </Button>
            )}
            {ranking ? (
              <Button
                size="sm"
                variant="outline"
                icon={<Download size={14} />}
                onClick={() => downloadArtifact(rankingExportCsv(ranking))}
              >
                Export CSV
              </Button>
            ) : null}
          </div>
        </div>

        {running && progress ? (
          <div className="my-3">
            <ProgressBar
              value={(progress.completed / Math.max(1, progress.total)) * 100}
              label={`Running independent removal scenarios: ${progress.completed} of ${progress.total} nodes`}
            />
          </div>
        ) : null}

        {/* Segmented Metric Tabs */}
        <div role="tablist" aria-label="Ranking metric" className="mt-3 flex flex-wrap gap-2">
          {RANKING_METRICS.map((entry) => {
            const active = entry.key === metricKey
            return (
              <button
                key={entry.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onMetricChange(entry.key)}
                title={entry.definition}
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition-colors flex items-center gap-2',
                  active
                    ? 'border-primary bg-primary text-white shadow-2xs'
                    : 'border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg',
                )}
              >
                <span>{entry.shortLabel}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider',
                    active ? 'bg-white/20 text-white' : 'bg-surface text-fg-faint',
                  )}
                >
                  {entry.mode}
                </span>
              </button>
            )
          })}
        </div>

        {/* Dynamic Metric Definition Banner */}
        <div className="mt-3.5 rounded-xl border border-line-soft bg-surface-2 p-3 text-[12px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary" />
              <span className="font-bold text-fg">{metric.label}</span>
              <Badge tone={metric.mode === 'direct' ? 'primary' : 'highlight'}>
                {metric.mode === 'direct' ? 'Direct removal' : 'Cascade'}
              </Badge>
              <Badge tone="neutral">
                <ArrowUpDown size={10} aria-hidden="true" /> Descending
              </Badge>
            </div>
            <span className="text-[11px] font-medium text-primary">Current view</span>
          </div>
          <p className="mt-1 text-fg-muted leading-relaxed">{metric.definition}</p>
        </div>
      </div>

      {!ranking ? (
        <Card>
          <EmptyState
            icon={<ListOrdered size={20} />}
            title="No rankings yet"
            description={
              baselineNodeCount === 0
                ? 'There is no loaded network to rank. Load a demo network or import a dataset.'
                : `Run “Analyse all species” to remove each of the ${baselineNodeCount} nodes in ${datasetName} independently and rank the results under each metric.`
            }
            action={
              baselineNodeCount > 0 ? (
                <Button variant="primary" icon={<Play size={14} />} onClick={onAnalyseAll} disabled={running}>
                  Analyse all species
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12 items-start">
          {/* Left Column: Ranking Table (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <Card className="p-4">
              {/* Filter Bar */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line-soft bg-surface-2 p-2.5">
                <div className="relative min-w-[200px] flex-1 max-w-sm">
                  <Search
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint"
                  />
                  <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search species..."
                    aria-label="Filter ranked species"
                    className="h-8 pl-8 text-[12px]"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear species filter"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg p-1"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="ranking-role-filter" className="text-[11px] font-medium text-fg-faint whitespace-nowrap">
                    Role:
                  </label>
                  <SelectInput
                    id="ranking-role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as TrophicRole | 'all')}
                    aria-label="Filter rankings by trophic role"
                    className="h-8 py-1 text-[12px]"
                  >
                    <option value="all">All roles ({ranking.rows.length})</option>
                    {TROPHIC_ROLES.map((role) => {
                      const count = ranking.rows.filter((r) => r.role === role).length
                      if (count === 0) return null
                      return (
                        <option key={role} value={role}>
                          {TROPHIC_ROLE_LABEL[role]} ({count})
                        </option>
                      )
                    })}
                  </SelectInput>
                </div>

                <div className="ml-auto text-[11.5px] font-medium text-fg-muted">
                  {filteredRows.length === ranking.rows.length ? (
                    <span>{ranking.rows.length} species ranked</span>
                  ) : (
                    <span>
                      Showing {filteredRows.length} of {ranking.rows.length} species
                    </span>
                  )}
                </div>
              </div>

              {filteredRows.length === 0 ? (
                <Callout tone="info" className="my-3" title="No matching species">
                  No species in this ranking matches the query “{search}” or the selected trophic role.
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setRoleFilter('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </Callout>
              ) : (
                <>
                  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[760px] border-collapse text-[12px]">
                    <caption className="sr-only">
                      {metric.label} ranking for {datasetName}, descending, ties broken alphabetically
                    </caption>
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-fg-faint">
                        <th scope="col" className="py-2.5 pr-2 font-semibold">Rank</th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold">Species</th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold">Role</th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold text-primary">
                          {metric.shortLabel}
                        </th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold">
                          Links lost
                          <HelpHint text="Links removed by this node's direct removal." />
                        </th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold">
                          Affected
                          <HelpHint text="Consumers that lost at least one food source." />
                        </th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold">
                          Secondary
                          <HelpHint text="Additional consumers removed by the cascade." />
                        </th>
                        <th scope="col" className="py-2.5 pr-2 font-semibold">
                          Depth
                          <HelpHint text="Number of cascade rounds." />
                        </th>
                        <th scope="col" className="py-2.5 font-semibold text-right">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row) => (
                        <tr
                          key={row.nodeId}
                          className={cn(
                            'border-b border-line-soft transition-colors hover:bg-surface-2',
                            row.rank === 1 && row.metricValue !== null && 'bg-primary-soft/30',
                          )}
                        >
                          <td className="py-2.5 pr-2 tabular-nums">
                            {row.rank === 0 ? (
                              <span className="inline-flex items-center gap-1 text-fg-faint" title={row.metricNotApplicable}>
                                <Ban size={12} aria-hidden="true" /> n/a
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  'inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold',
                                  row.rank === 1
                                    ? 'bg-primary text-white'
                                    : row.rank <= 3
                                      ? 'bg-surface-2 text-fg border border-line'
                                      : 'text-fg-muted',
                                )}
                              >
                                {row.rank}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-2">
                            <button
                              type="button"
                              onClick={() => onSelectNode(row.nodeId)}
                              className="text-left font-semibold text-fg hover:text-primary transition-colors block"
                            >
                              {row.label}
                            </button>
                            <MonoId>{row.nodeId}</MonoId>
                          </td>
                          <td className="py-2.5 pr-2">
                            <Badge tone="neutral">{TROPHIC_ROLE_LABEL[row.role]}</Badge>
                          </td>
                          <td className="py-2.5 pr-2 font-bold tabular-nums text-primary">
                            {formatMetricValue(row.metricValue, metric.unit)}
                            {row.metricValue === null && row.metricNotApplicable ? (
                              <HelpHint text={row.metricNotApplicable} label="Not applicable" />
                            ) : null}
                          </td>
                          <td className="py-2.5 pr-2 tabular-nums text-fg-muted">{row.linksLost}</td>
                          <td className="py-2.5 pr-2 tabular-nums text-fg-muted">{row.directlyAffectedConsumers}</td>
                          <td className="py-2.5 pr-2 tabular-nums text-fg-muted">{row.secondaryRemovals}</td>
                          <td className="py-2.5 pr-2 tabular-nums text-fg-muted">{row.cascadeDepth}</td>
                          <td className="py-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSelectNode(row.nodeId)}
                              title={`Inspect ${row.label} in Workspace`}
                              aria-label={`Open ${row.label} in Workspace`}
                              className="text-xs h-7 px-2"
                            >
                              Open in Workspace
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredRows.length > 10 ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[12px]">
                    <div className="flex items-center gap-2 text-fg-muted">
                      <span>Rows:</span>
                      <select
                        aria-label="Rows per page"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value))
                          setPage(1)
                        }}
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] font-medium text-fg"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={1000}>All</option>
                      </select>
                      <span className="text-fg-faint text-[11.5px]">
                        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-7 px-2 text-[11px]"
                      >
                        Previous
                      </Button>
                      <span className="px-1 text-[11.5px] text-fg-muted">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-7 px-2 text-[11px]"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
                </>
              )}
            </Card>
          </div>

          {/* Right Column: Visualization & Context (4 cols) matching mockup 05 */}
          <div className="lg:col-span-4 space-y-3">
            {/* Top 5 species horizontal bar chart */}
            {top5Data.length > 0 ? (
              <Card className="p-4">
                <CardHeading
                  icon={<BarChart2 size={16} />}
                  title={`Top 5 species by ${metric.shortLabel.toLowerCase()}`}
                  subtitle="Highest measured structural change for this metric."
                />
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={top5Data}
                      margin={{ top: 4, right: 28, bottom: 4, left: 2 }}
                    >
                      <CartesianGrid stroke="#E8EFEA" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: '#71837B', fontSize: 10 }}
                        unit={metric.unit === 'percent' ? '%' : ''}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: '#122A23', fontSize: 10 }}
                        width={68}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #DCE7E1',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(val) => [
                          metric.unit === 'percent' ? `${Number(val).toFixed(1)}%` : String(val),
                          metric.shortLabel,
                        ]}
                      />
                      <Bar dataKey="value" fill="#0F6B52" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : null}

            {/* About this metric */}
            <Card className="p-4">
              <CardHeading
                icon={<Info size={16} />}
                title="About this metric"
              />
              <p className="text-[12.5px] leading-relaxed text-fg-muted">
                {metric.definition}
              </p>
              <p className="mt-2 text-[11.5px] text-fg-faint border-t border-line-soft pt-2">
                Ties are broken alphabetically by species name, then by identifier. Tied values share a rank.
              </p>
            </Card>

            {/* Dataset information */}
            <Card className="p-4">
              <CardHeading title="Dataset information" />
              <dl className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-fg-faint">Name:</dt>
                  <dd className="font-semibold text-fg text-right truncate max-w-[180px]">{datasetName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-faint">Nodes:</dt>
                  <dd className="tabular-nums font-semibold text-fg">{baselineNodeCount} species</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-faint">Ranked:</dt>
                  <dd className="tabular-nums font-semibold text-fg">{ranking.rows.length} analyzed</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {/* Disclaimer banner matching mockup 05 */}
      <div className="rounded-2xl border border-line-soft bg-surface-2 p-3.5 text-[12px] flex items-center gap-2.5 text-fg-muted shadow-2xs">
        <Info size={16} className="text-primary shrink-0" />
        <p>
          <strong className="text-fg">Rankings are calculated separately for each metric.</strong> There is no single vulnerability score in this version. Metrics can disagree with each other.
        </p>
      </div>
    </div>
  )
}
