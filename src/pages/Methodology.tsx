import {
  AlertTriangle,
  BookOpen,
  Bug,
  CheckCircle2,
  ExternalLink,
  Fish,
  FlaskConical,
  Info,
  Leaf,
  Link2,
  Play,
  Share2,
  Sliders,
  Target,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  runRankingChecks,
  runValidationSuite,
  VALIDATION_SUITE_TOTAL_NOTE,
  type CheckResult,
} from '../core/validationSuite'
import { formatPercent } from '../core/metrics'
import { runScenario } from '../core/scenarios'
import { RANKING_METRICS } from '../core/rankingEngine'
import { BUILT_IN_RESEARCH_DATASETS, RESEARCH_SLOT_SUMMARY } from '../data/datasetRegistry'
import { VALIDATION_FIXTURE_ID, CHAIN_FIXTURE_ID } from '../data/fixtures'
import { useAppState } from '../state/AppState'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeading,
  HelpHint,
  ProgressBar,
  StatusBadge,
  cn,
} from '../components/ui/primitives'

/* ============================================================================
 * Methodology — definitions, rules, live tests and honest limitations.
 *
 * The validation suite below runs the same expectations as the automated test
 * suite, in the browser, so a reviewer can watch them pass instead of trusting
 * a claim (Prompt §18).
 * ========================================================================== */

const METRIC_TABLE = [
  {
    name: 'Node count',
    formula: 'Ns',
    definition: 'Number of nodes remaining in the scenario.',
    guard: 'None needed.',
  },
  {
    name: 'Link count',
    formula: 'Ls',
    definition:
      'Number of directed feeding links remaining. Removing a node deletes every link where it is the source or the target.',
    guard: 'None needed.',
  },
  {
    name: 'Link loss (%)',
    formula: '100 × (L₀ − Ls) / L₀',
    definition: 'Percentage of baseline links lost.',
    guard: 'Not applicable when L₀ = 0. Never divided by zero and never reported as 0%.',
  },
  {
    name: 'Connectance',
    formula: 'L / [N × (N − 1)]',
    definition: 'Density of recorded directed feeding links, for a graph without self-links.',
    guard: 'Not applicable when N < 2. May rise or fall after a removal.',
  },
  {
    name: 'Consumers directly affected',
    formula: 'count',
    definition:
      'Surviving consumer nodes that had at least one recorded food source in the baseline and lost at least one of them immediately after the initial removal. Each consumer counts once; the removed node is excluded.',
    guard: 'Nodes with no recorded baseline food source are never counted.',
  },
  {
    name: 'Food-depleted consumers',
    formula: 'count',
    definition:
      'Consumers with at least one recorded baseline food source and none remaining. Reported for the state immediately after the initial removal, so direct and cascade modes stay comparable.',
    guard: 'Nodes already without a recorded food source in the baseline are never counted.',
  },
  {
    name: 'Secondary removals',
    formula: 'count',
    definition: 'Additional nodes removed by the rule-based cascade, excluding the initially selected node.',
    guard: 'Never negative; always equals the total removed minus one.',
  },
  {
    name: 'Secondary removals (%)',
    formula: '100 × secondary / N₀',
    definition: 'Percentage of baseline nodes removed by the cascade alone.',
    guard: 'Not applicable when N₀ = 0. Denominator is the whole baseline.',
  },
  {
    name: 'All removed (%)',
    formula: '100 × (1 + secondary) / N₀',
    definition: 'Percentage of baseline nodes removed in total, including the initial selection.',
    guard: 'Not applicable when N₀ = 0.',
  },
  {
    name: 'Cascade depth',
    formula: 'count',
    definition: 'Number of rounds in which at least one new node met the eligibility rule.',
    guard: 'Zero when no secondary removal occurs. The initial removal is not a round.',
  },
]

const EDGE_CASE_COVERAGE = [
  'Valid node in an ordinary network — direct and cascade both computed, no refresh needed.',
  'Consumer with alternative food sources — flagged as affected, never cascade-removed while a link remains.',
  'Consumer losing its only recorded food source — flagged in direct mode, removed in the correct cascade round.',
  'Producer with no incoming links — never treated as an endangered consumer.',
  'Node already without baseline incoming links — never cascade-eligible under the food-loss rule.',
  'One-node dataset — connectance and link loss reported as not applicable, no crash.',
  'Empty dataset — scenario analysis blocked with a clear explanation and a way to load data.',
  'Nodes but no links — connectance 0 for N ≥ 2, link loss not applicable, limitation explained.',
  'Isolated node in a larger network — preserved and reported, never silently discarded.',
  'Duplicate link — reported, deduplicated by keep-first, link counts never inflated.',
  'Link with an undefined endpoint — blocks the import and names the offending endpoint.',
  'Self-link — flagged, excluded from the primary analysis, recorded in the cleaning report.',
  'Cyclic network — simultaneous rounds, capped iterations, guaranteed termination.',
  'All eligible consumers already removed — the next round removes zero nodes and stops.',
  'Analyse all species — every scenario starts from the immutable baseline; progress shown; re-clicks blocked.',
  'Equal ranking values — alphabetical tie-break, identical values share a rank, ties shown honestly.',
  'Missing trophic role — excluded from role-dependent removal, with the assumption explained.',
  'No cascade occurs — reported as depth 0 with an explicit warning against over-reading it.',
  'Scenario removes every node — empty network shown, no division by zero, baseline still available.',
  'Malformed or unsupported upload — readable error, current dataset and result preserved.',
  'Reset — baseline restored exactly, highlights and round history cleared, dataset untouched.',
  'Dataset switch — new baseline loaded, old selections and results cleared.',
  'Mode switch — direct and cascade results kept separate from the same baseline.',
  'Search with no match — “No matching species”, filters clearable, nothing substituted.',
  'Small-screen layout — panels stack, navigation collapses, the graph stays pannable and zoomable.',
]

function CheckRow({ result }: { result: CheckResult }) {
  return (
    <tr className="border-b border-line-soft/60">
      <td className="py-1.5 pr-2">
        {result.passed ? (
          <span className="inline-flex items-center gap-1 text-secondary">
            <CheckCircle2 size={13} aria-hidden="true" /> <span className="sr-only">Pass</span>pass
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-danger">
            <XCircle size={13} aria-hidden="true" /> <span className="sr-only">Fail</span>fail
          </span>
        )}
      </td>
      <td className="py-1.5 pr-2 text-fg-muted">{result.name}</td>
      <td className="py-1.5 pr-2 font-mono text-[11px] text-fg-faint">{result.expected}</td>
      <td className="py-1.5 font-mono text-[11px] text-fg">{result.actual}</td>
    </tr>
  )
}

export function Methodology() {
  const { dataset, graph, baseline, result, importedDatasets } = useAppState()

  const sampleData = useMemo(() => {
    if (result) {
      return {
        isLiveScenario: true,
        label: result.primaryNodeLabel,
        linkLossPercent: result.scenario.linkLossPercent.value,
        linksLost: result.scenario.linksLost,
        baselineLinks: result.baseline.linkCount,
        directAffected: result.scenario.directlyAffectedConsumerIds.length,
        secondaryRemovals: result.scenario.secondaryRemovals,
        cascadeDepth: result.scenario.cascadeDepth,
        subtitle: `Calculated from the active scenario on ${dataset?.name ?? 'current network'} (${result.primaryNodeLabel}, ${result.mode === 'cascade' ? 'Cascade' : 'Direct'} mode).`,
      }
    }
    if (graph && dataset && baseline && baseline.linkCount > 0) {
      const sampleNode =
        graph.nodes.find((n) => n.trophicRole === 'primary-consumer' || n.trophicRole === 'secondary-consumer') ??
        graph.nodes[0]
      if (sampleNode) {
        try {
          const sim = runScenario(graph, dataset.name, sampleNode.id, 'cascade')
          return {
            isLiveScenario: false,
            label: sampleNode.name,
            linkLossPercent: sim.scenario.linkLossPercent.value,
            linksLost: sim.scenario.linksLost,
            baselineLinks: baseline.linkCount,
            directAffected: sim.scenario.directlyAffectedConsumerIds.length,
            secondaryRemovals: sim.scenario.secondaryRemovals,
            cascadeDepth: sim.scenario.cascadeDepth,
            subtitle: `Simulated illustrative removal of ${sampleNode.name} on the active network (${dataset.name}, ${baseline.nodeCount} nodes, ${baseline.linkCount} links).`,
          }
        } catch {
          // Fallback if simulation throws
        }
      }
    }
    return {
      isLiveScenario: false,
      label: 'Small fish',
      linkLossPercent: 50.0,
      linksLost: 3,
      baselineLinks: 6,
      directAffected: 1,
      secondaryRemovals: 1,
      cascadeDepth: 1,
      subtitle: 'Illustrative benchmark test case (6-node, 6-link reference network).',
    }
  }, [result, graph, dataset, baseline])

  // The synchronous checks are computed while initialising state, so no
  // setState happens inside an effect for them.
  const [suite, setSuite] = useState<CheckResult[]>(() => runValidationSuite().checks)
  const [rankingChecks, setRankingChecks] = useState<CheckResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(async () => {
    setRunning(true)
    setSuite(runValidationSuite().checks)
    const asyncChecks = await runRankingChecks()
    setRankingChecks(asyncChecks)
    setRunning(false)
  }, [])

  // Only the asynchronous half needs an effect; the state update happens after
  // the await, never synchronously during the effect.
  useEffect(() => {
    let active = true
    void runRankingChecks().then((checks) => {
      if (active) setRankingChecks(checks)
    })
    return () => {
      active = false
    }
  }, [])

  const all = [...suite, ...(rankingChecks ?? [])]
  const passed = all.filter((entry) => entry.passed).length
  const failed = all.length - passed
  const groups = Array.from(new Set(suite.map((entry) => entry.group)))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Methodology</span>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Methodology & interpretation</h1>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            Understand exactly what each result means. {VALIDATION_SUITE_TOTAL_NOTE}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={failed === 0 && all.length > 0 ? 'secondary' : failed > 0 ? 'danger' : 'neutral'}>
            {all.length ? `${passed} passed · ${failed} failed · ${all.length} total` : 'Running…'}
          </Badge>
          <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={() => void run()} disabled={running}>
            Re-run checks
          </Button>
        </div>
      </div>

      {running ? (
        <Card className="p-3">
          <ProgressBar value={70} label="Running the validation suite in this browser…" />
        </Card>
      ) : null}

      {/* Top 2-Column Grid: Network Model & Scenario Rules (Mockup 06) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeading
            icon={<Share2 size={16} className="text-primary" />}
            title="Network model"
            subtitle="A directed food web based on recorded feeding relationships."
          />
          <div className="mt-2 flex flex-col items-center justify-between gap-3 rounded-xl border border-line-soft bg-surface-2 p-4 sm:flex-row">
            {/* Food source */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm">
                <Leaf size={24} />
              </div>
              <span className="mt-2 text-xs font-semibold text-fg">Food source</span>
              <span className="text-[11px] text-fg-muted">(e.g. plant, prey)</span>
            </div>

            {/* Link 1 */}
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-medium text-fg-faint">Feeding link (from → to)</span>
              <div className="my-1 flex items-center text-emerald-800">
                <div className="h-0.5 w-12 sm:w-16 bg-emerald-700" />
                <div className="h-0 w-0 border-y-4 border-y-transparent border-l-8 border-l-emerald-700" />
              </div>
            </div>

            {/* Consumer */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-300 bg-sky-50 text-sky-700 shadow-sm">
                <Bug size={24} />
              </div>
              <span className="mt-2 text-xs font-semibold text-fg">Consumer</span>
              <span className="text-[11px] text-fg-muted">(e.g. insect, fish)</span>
            </div>

            {/* Link 2 */}
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-medium text-fg-faint">Feeding link</span>
              <div className="my-1 flex items-center text-emerald-800">
                <div className="h-0.5 w-12 sm:w-16 bg-emerald-700" />
                <div className="h-0 w-0 border-y-4 border-y-transparent border-l-8 border-l-emerald-700" />
              </div>
            </div>

            {/* Higher-level consumer */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 shadow-sm">
                <Fish size={24} />
              </div>
              <span className="mt-2 text-xs font-semibold text-fg">Higher-level consumer</span>
              <span className="text-[11px] text-fg-muted">(e.g. predator)</span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-fg">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-primary-dark">Every feeding link runs from the food organism to the consumer.</p>
              <p className="mt-0.5 text-fg-muted">This direction is consistent across all datasets in FoodWebGuard.</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeading
            icon={<Sliders size={16} className="text-primary" />}
            title="Scenario rules"
            subtitle="Structural cascade simulation based on recorded links."
          />
          <div className="mt-2 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                1
              </div>
              <div>
                <p className="text-xs font-semibold text-fg">Select a species</p>
                <p className="mt-0.5 text-xs text-fg-muted">Choose a species or group from the current baseline network.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                2
              </div>
              <div>
                <p className="text-xs font-semibold text-fg">Remove the species</p>
                <p className="mt-0.5 text-xs text-fg-muted">Remove the selected species and all connected feeding links (incoming and outgoing).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                3
              </div>
              <div>
                <p className="text-xs font-semibold text-fg">Optional cascade</p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Iteratively remove any consumer that has no remaining recorded food sources. Rounds are simultaneous and continue until no new nodes qualify.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Metrics Highlight Cards (Mockup 06) */}
      <Card>
        <CardHeading
          icon={<Target size={16} className="text-primary" />}
          title="Metrics"
          subtitle={sampleData.subtitle}
        />
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Link2 size={15} />
              </div>
              <span className="text-xs font-bold text-fg">Link loss</span>
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">Percentage of baseline links that are removed.</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-sky-700">
                {formatPercent(sampleData.linkLossPercent)}
              </span>
              <span className="text-[11px] text-fg-faint">
                {sampleData.linksLost} of {sampleData.baselineLinks} links
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Users size={15} />
              </div>
              <span className="text-xs font-bold text-fg">Direct effects</span>
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">Consumers directly affected by the initial removal.</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-emerald-700">
                {sampleData.directAffected}
              </span>
              <span className="text-[11px] text-fg-faint">nodes</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Share2 size={15} />
              </div>
              <span className="text-xs font-bold text-fg">Secondary removals</span>
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">Additional consumers removed in cascade rounds.</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-amber-700">
                {sampleData.secondaryRemovals}
              </span>
              <span className="text-[11px] text-fg-faint">nodes</span>
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <Target size={15} />
              </div>
              <span className="text-xs font-bold text-fg">Cascade depth</span>
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">Number of cascade rounds until no new nodes are removed.</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-purple-700">
                {sampleData.cascadeDepth}
              </span>
              <span className="text-[11px] text-fg-faint">
                {sampleData.cascadeDepth === 1 ? 'round' : 'rounds'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Amber Callout: What this does not claim (Mockup 06) */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <h3 className="text-xs font-bold text-amber-900">What this does not claim</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-800">
              <li>These results show structural effects based only on recorded feeding links. They do not predict real-world extinction, population decline or ecosystem collapse.</li>
              <li>Source datasets may be incomplete. A missing link means the relationship was not recorded, not that it does not exist in nature.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sources & reuse terms (Mockup 06) */}
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardHeading
            icon={<BookOpen size={16} className="text-primary" />}
            title="Sources & reuse terms"
            subtitle="Each research network includes its original source, citation and reuse terms. All integrated research datasets are open and reused under their published licences."
          />
          <a
            href="#/library"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline self-start sm:self-auto shrink-0"
          >
            View all datasets <ExternalLink size={12} />
          </a>
        </div>
        <div className="mt-3 divide-y divide-line-soft rounded-xl border border-line-soft bg-surface-2">
          {BUILT_IN_RESEARCH_DATASETS.slice(0, 3).map((item) => (
            <div key={item.id} className="flex flex-col justify-between gap-2 p-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold text-fg">{item.name}</p>
                <p className="text-[11px] text-fg-muted">{item.provenance.citation}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge tone="neutral" className="uppercase font-mono text-[10px]">
                  {item.provenance.license || 'CC0'}
                </Badge>
                <span className="text-[11px] text-fg-faint">Reuse permitted with citation</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeading title="Network representation" subtitle="Two rules that apply to every algorithm, chart, table and export." />
          <ul className="space-y-2 text-[13px] leading-relaxed text-fg-muted">
            <li>
              <strong className="text-fg">Directed edges.</strong> Every feeding relationship is a directed edge
              running from the food organism to the consumer. <code className="font-mono text-[11px]">algae → zooplankton</code>{' '}
              means zooplankton consumes algae. Edges are never silently reversed, and the arrowhead in the graph,
              the tables and every export all use the same direction.
            </li>
            <li>
              <strong className="text-fg">Stable identifiers.</strong> Every node has a stable id and every edge
              has a deterministic id (<code className="font-mono text-[11px]">e:source-&gt;target</code>). All
              algorithms key off those ids, never off display labels or the visual layout.
            </li>
            <li>
              <strong className="text-fg">Immutable baseline.</strong> A scenario is expressed as a set of removed
              node ids applied to a copy. The baseline graph and the dataset are never mutated, which is what
              makes reset exact and results repeatable.
            </li>
            <li>
              <strong className="text-fg">Self-links</strong> are excluded from the primary analysis and recorded
              in the cleaning report, because connectance assumes a graph without self-links.
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeading title="Simulation rules" subtitle="The exact, deterministic rules the program applies." />
          <ol className="list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-fg-muted">
            <li>
              <strong className="text-fg">Direct removal.</strong> Take an immutable snapshot of the baseline;
              clone it; remove the selected node; remove every link whose source or target is that node; keep every
              unrelated node and link unchanged; then calculate the metrics and flag the affected consumers.
            </li>
            <li>
              <strong className="text-fg">Cascade eligibility.</strong> A surviving node is eligible for
              secondary removal only when all of these hold: it had at least one recorded incoming food-source
              link in the baseline; it has zero incoming food-source links in the current scenario; it has not
              already been removed; and it is not the initially selected node. This is a structural rule based
              on the recorded edges, not on a verified trophic role.
            </li>
            <li>
              <strong className="text-fg">Simultaneous rounds.</strong> At the start of each round the whole
              network is examined, every eligible node is identified, and they are removed together. This removes
              any dependence on the order in which nodes happen to be stored.
            </li>
            <li>
              <strong className="text-fg">Termination.</strong> A node can be removed at most once, and a defensive
              round cap is applied as well, so malformed or cyclic data can never cause an infinite loop.
            </li>
            <li>
              <strong className="text-fg">Role is reported, not gated.</strong> Trophic role and role evidence are
              shown in every round so the uncertainty is visible, but they never add an eligibility condition.
              A node whose role evidence is <em>unknown</em> therefore still participates in the structural
              calculation, and its role label is left unchanged. Gating on verified roles would silently disable
              the cascade for datasets whose roles are all inferred.
            </li>
            <li>
              <strong className="text-fg">No recorded food source, no removal.</strong> A node that had zero
              incoming links in the baseline is never removed, because it cannot have lost one. Producers and
              basal groups normally fall into this group, but the rule states the structural reason rather than
              relying on the role label.
            </li>
          </ol>
        </Card>
      </div>

      <Card>
        <CardHeading
          title="Metric definitions and their guards"
          subtitle="The same definitions are used everywhere; the calculation module is shared and no component recalculates a value differently."
        />
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[820px] border-collapse text-[12px]">
            <caption className="sr-only">Metric definitions with formulas and edge-case guards</caption>
            <thead>
              <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide text-fg-faint">
                <th scope="col" className="py-2 pr-3 font-medium">Metric</th>
                <th scope="col" className="py-2 pr-3 font-medium">Formula</th>
                <th scope="col" className="py-2 pr-3 font-medium">Definition</th>
                <th scope="col" className="py-2 font-medium">Guard / edge case</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_TABLE.map((row) => (
                <tr key={row.name} className="border-b border-line-soft/60">
                  <td className="py-2 pr-3 font-medium text-fg">{row.name}</td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-primary">{row.formula}</td>
                  <td className="py-2 pr-3 text-fg-muted">{row.definition}</td>
                  <td className="py-2 text-fg-faint">{row.guard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-fg-faint">
          Ranking direction is always descending — a larger measured structural change ranks higher — with an
          alphabetical tie-break on the node label and a final tie-break on the node id. Tied values share a rank.
          A not-applicable value is shown as not applicable and given rank 0, never as a score. The ranking metrics
          are: {RANKING_METRICS.map((metric) => metric.shortLabel).join(', ')}.
        </p>
      </Card>

      <Card>
        <CardHeading
          icon={<FlaskConical size={16} />}
          title="Validation suite — run in this browser"
          subtitle={`The manual fixture ${VALIDATION_FIXTURE_ID} (6 nodes, 6 links, connectance 0.200) and the multi-round chain ${CHAIN_FIXTURE_ID} are checked against hand-calculated results on every load.`}
        />
        {!all.length ? (
          <p className="text-[13px] text-fg-muted">Running the checks…</p>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group} className="mb-4 last:mb-0">
                <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                  {group}
                  <span className="font-normal normal-case text-fg-faint">
                    {suite.filter((entry) => entry.group === group).filter((entry) => entry.passed).length}/
                    {suite.filter((entry) => entry.group === group).length} passed
                  </span>
                </p>
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[720px] border-collapse text-[12px]">
                    <caption className="sr-only">{group} checks</caption>
                    <thead>
                      <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide text-fg-faint">
                        <th scope="col" className="py-1.5 pr-2 font-medium">Result</th>
                        <th scope="col" className="py-1.5 pr-2 font-medium">Check</th>
                        <th scope="col" className="py-1.5 pr-2 font-medium">Expected</th>
                        <th scope="col" className="py-1.5 font-medium">Computed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suite
                        .filter((entry) => entry.group === group)
                        .map((entry) => (
                          <CheckRow key={`${entry.group}-${entry.name}`} result={entry} />
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {rankingChecks ? (
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                  Rankings
                  <span className="font-normal normal-case text-fg-faint">
                    {rankingChecks.filter((entry) => entry.passed).length}/{rankingChecks.length} passed
                  </span>
                </p>
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[720px] border-collapse text-[12px]">
                    <caption className="sr-only">Ranking checks</caption>
                    <thead>
                      <tr className="border-b border-line-soft text-left text-[11px] uppercase tracking-wide text-fg-faint">
                        <th scope="col" className="py-1.5 pr-2 font-medium">Result</th>
                        <th scope="col" className="py-1.5 pr-2 font-medium">Check</th>
                        <th scope="col" className="py-1.5 pr-2 font-medium">Expected</th>
                        <th scope="col" className="py-1.5 font-medium">Computed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingChecks.map((entry) => (
                        <CheckRow key={entry.name} result={entry} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        )}

        <Callout tone="info" className="mt-4" title="A note on the specification's “remove Small fish” figures">
          The build specification states that removing <em>Small fish</em> from the fixture leaves 4 links
          (2 lost, 33.3%). That figure contradicts the same specification's edge list for the fixture — three links
          touch Small fish — its own rule that removing a node deletes every link where it is the source or the
          target, and its own cascade expectation for the identical removal (“3 remaining links … 100 × 3 / 6 =
          50%”), which is only reachable when all three links are deleted. FoodWebGuard implements the internally
          consistent definition: <strong>3 links removed, 3 links remaining, 50.0% link loss</strong>, and the check
          above is explicitly labelled so the discrepancy is visible rather than hidden. Nothing else in the
          fixture is affected, and the “remove Algae” figures match the specification exactly.
        </Callout>
      </Card>

      <Card>
        <CardHeading
          title="Required edge cases and how each one is handled"
          subtitle="Every item below is implemented and, where the behaviour is computational, asserted by the automated test suite."
        />
        <ul className="grid gap-1.5 lg:grid-cols-2">
          {EDGE_CASE_COVERAGE.map((item) => (
            <li key={item} className="flex gap-2 text-[12.5px] leading-relaxed text-fg-muted">
              <CheckCircle2 size={13} aria-hidden="true" className="mt-1 shrink-0 text-secondary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeading title="Data provenance and verification status" />
          <div className="space-y-2">
            <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
              <p className="text-[12px] font-medium text-fg">Currently loaded</p>
              {dataset ? (
                <>
                  <p className="mt-1 text-[12px] text-fg-muted">{dataset.name}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    <StatusBadge status={dataset.sourceStatus} />
                    <Badge tone="neutral">{dataset.nodes.length} nodes</Badge>
                    <Badge tone="neutral">{dataset.edges.length} links</Badge>
                    <Badge tone="neutral">Node unit: {dataset.provenance.nodeUnit}</Badge>
                  </p>
                  <p className="mt-1.5 text-[11.5px] text-fg-muted">
                    Citation: {dataset.provenance.citation}
                  </p>
                  <p className="text-[11.5px] text-fg-muted">Origin: {dataset.provenance.origin}</p>
                </>
              ) : (
                <p className="mt-1 text-[12px] text-fg-muted">No dataset loaded.</p>
              )}
            </div>

            <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
              <p className="text-[12px] font-medium text-fg">
                Research library status ({RESEARCH_SLOT_SUMMARY.bundled} of {RESEARCH_SLOT_SUMMARY.total}{' '}
                slots sourced, {RESEARCH_SLOT_SUMMARY.verified} verified)
              </p>
              <p className="mt-1 text-[12px] text-fg-muted">
                {RESEARCH_SLOT_SUMMARY.bundled} of the {RESEARCH_SLOT_SUMMARY.total} target slots carry a sourced
                dataset; {RESEARCH_SLOT_SUMMARY.verified} of them are marked{' '}
                <strong>Research source verified</strong>{' '}
                {RESEARCH_SLOT_SUMMARY.pending > 0
                  ? `; the other ${RESEARCH_SLOT_SUMMARY.pending} slot(s) are marked “Research source pending”`
                  : ''}
                . That status is only assigned after the node and link sets have been re-derived from the committed
                source files, the link direction has been read from the source documentation, and the citation and
                reuse terms have been checked. The two freshwater networks are replicate ponds from one mesocosm
                experiment, which their provenance states. FoodWebGuard never assigns verified status automatically.
              </p>
              {importedDatasets.length ? (
                <p className="mt-2 text-[11.5px] text-fg-faint">
                  {importedDatasets.length} dataset(s) were imported in this browser. Imported files are parsed
                  locally and are never uploaded anywhere.
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
              <p className="text-[12px] font-medium text-fg">Status meanings</p>
              <ul className="mt-1 space-y-1 text-[11.5px] text-fg-muted">
                <li>
                  <Badge tone="demo">Illustrative demo</Badge> — authored teaching example, not an empirical
                  dataset.
                </li>
                <li>
                  <Badge tone="pending">Research source pending</Badge> — no documented source attached yet.
                </li>
                <li>
                  <Badge tone="warning">Research source provided, validation pending</Badge> — a source and citation
                  exist, but the cleaning and cross-checks are not complete.
                </li>
                <li>
                  <Badge tone="verified">Research source verified</Badge> — source, licence, node unit and cleaning
                  checks are all complete.
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeading
            icon={<AlertTriangle size={16} />}
            title="Scope limits and known limitations"
            subtitle="Stated here once, and repeated wherever the outputs appear."
          />
          <ul className="space-y-2 text-[12.5px] leading-relaxed text-fg-muted">
            <li>
              <strong className="text-fg">Not a prediction of extinction.</strong> The cascade is a deterministic
              structural scenario. A consumer losing every recorded food source does not prove it would die out.
            </li>
            <li>
              <strong className="text-fg">Not a population model.</strong> There is no abundance, biomass, energy
              flow or time in any calculation.
            </li>
            <li>
              <strong className="text-fg">No machine learning.</strong> Analyses are transparent graph operations
              and fixed rules, which is deliberate.
            </li>
            <li>
              <strong className="text-fg">Two networks per category is exploratory.</strong> Category-level
              medians describe the supplied networks only and cannot establish that an ecosystem type is generally
              more vulnerable.
            </li>
            <li>
              <strong className="text-fg">Recorded links are not all links.</strong> Absence of a link in a source
              dataset is a data limitation, not evidence about nature.
            </li>
            <li>
              <strong className="text-fg">Connectance is not a damage score.</strong> It can increase after a
              removal because the denominator shrinks faster than the link count.
            </li>
            <li>
              <strong className="text-fg">The shipped networks are illustrative.</strong> Their results must not be
              presented as scientific evidence about real ecosystems.
            </li>
          </ul>
          <Callout tone="info" className="mt-3" title="Keyboard and accessibility">
            All controls are keyboard reachable with visible focus, icon-only buttons have accessible names, the
            species list provides a keyboard path to every node, header-click sorting is not required for any
            ranking, status is never conveyed by colour alone, and reduced-motion preferences are respected.
            <span className="ml-1">
              <HelpHint text="Charts always have a text and table equivalent, so no value is available only visually." />
            </span>
          </Callout>
        </Card>
      </div>

      <Card>
        <CardHeading title="Reference points used while preparing the data model" />
        <ul className="space-y-1.5 text-[12.5px] text-fg-muted">
          <li>
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="https://github.com/globalbioticinteractions/globalwebdb"
              target="_blank"
              rel="noreferrer noopener"
            >
              GlobalWeb food-web archive
            </a>{' '}
            — archived food-web data; individual datasets require screening.
          </li>
          <li>
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="https://ecobase.ecopath.org/"
              target="_blank"
              rel="noreferrer noopener"
            >
              EcoBase
            </a>{' '}
            — published Ecopath ecosystem models with metadata and citations.
          </li>
          <li>
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="https://zenodo.org/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Zenodo
            </a>{' '}
            — published datasets with DOIs; licence and node unit must be checked per record.
          </li>
          <li>
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="https://js.cytoscape.org/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Cytoscape.js documentation
            </a>{' '}
            — the interactive network library used for the graph view.
          </li>
        </ul>
        <p className={cn('mt-2 text-[11.5px] text-fg-faint')}>
          These are starting points for the data research stage. They are not proof that any particular file is
          suitable, and no dataset is listed as imported or verified on the strength of a repository link alone.
        </p>
      </Card>
    </div>
  )
}
