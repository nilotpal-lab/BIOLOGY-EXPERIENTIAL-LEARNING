import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { HelpHint, MetricReadout, cn } from '../ui/primitives'
import { formatConnectance, formatPercent } from '../../core/metrics'
import type { BaselineMetrics, ScenarioResult } from '../../core/types'

/* ============================================================================
 * MetricCards — baseline and scenario metrics side by side.
 *
 * Every card states its unit and, where a percentage is shown, the denominator
 * (Prompt §7.9, §19). Not-applicable metrics say so and explain why.
 * ========================================================================== */

const DEFINITIONS = {
  nodeCount: 'Number of nodes remaining in the scenario.',
  linkCount: 'Number of directed feeding links remaining. Removing a node deletes every link where it is the source or the target.',
  linkLoss:
    'Percentage of baseline feeding links lost: 100 x (L0 - Ls) / L0. Defined only when the baseline contains at least one link.',
  connectance:
    'Connectance = L / (N x (N - 1)) for a directed graph without self-links, defined only when N >= 2. It can rise or fall after a removal, because both the link count and the number of possible links change.',
  affected:
    'Surviving consumer nodes that lost at least one previously recorded food-source link immediately after the initial removal. Each consumer is counted once.',
  depleted:
    'Consumers with at least one recorded food-source link in the baseline and none remaining after the initial removal. Not a statement about starvation.',
  secondary: 'Additional nodes removed by the rule-based cascade, excluding the initially selected node.',
  secondaryPercent:
    'Percentage of baseline nodes removed by the cascade alone: 100 x secondary removals / N0. The initially selected node is not in the numerator.',
  removedPercent:
    'Percentage of baseline nodes removed in total, including the initial selection: 100 x all removed / N0.',
  depth: 'Number of cascade rounds in which at least one new node met the eligibility rule. The initial removal is not a round.',
} as const

function Delta({ before, after }: { before: number; after: number }) {
  const difference = after - before
  const Icon = difference === 0 ? Minus : difference > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] tabular-nums',
        difference === 0 ? 'text-fg-faint' : difference > 0 ? 'text-secondary' : 'text-highlight',
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {difference > 0 ? '+' : ''}
      {difference} vs baseline
    </span>
  )
}

export function BaselineVsScenario({
  baseline,
  result,
  labelFor,
}: {
  baseline: BaselineMetrics
  result: ScenarioResult
  /** Resolves node ids to display labels for the supporting text. */
  labelFor?: (id: string) => string
}) {
  const scenario = result.scenario
  const label = (id: string) => labelFor?.(id) ?? id

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-faint">
            Nodes remaining
            <HelpHint text={DEFINITIONS.nodeCount} label="Nodes remaining" />
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-fg">
            {scenario.nodeCount}
            <span className="text-[13px] font-normal text-fg-faint"> of {baseline.nodeCount}</span>
          </div>
          <Delta before={baseline.nodeCount} after={scenario.nodeCount} />
          <p className="mt-1 text-[10.5px] text-fg-faint">Surviving species in ecosystem</p>
        </div>

        <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-faint">
            Links remaining
            <HelpHint text={DEFINITIONS.linkCount} label="Links remaining" />
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-fg">
            {scenario.linkCount}
            <span className="text-[13px] font-normal text-fg-faint"> of {baseline.linkCount}</span>
          </div>
          <Delta before={baseline.linkCount} after={scenario.linkCount} />
          <p className="mt-1 text-[10.5px] text-fg-faint">Active feeding relationships</p>
        </div>

        <MetricReadout
          label="Link loss"
          metric={scenario.linkLossPercent}
          emphasis="danger"
          hint={DEFINITIONS.linkLoss}
          supporting={
            scenario.linkLossPercent.value === null
              ? 'Baseline contains 0 links.'
              : `Links lost · ${scenario.linksLost}/${baseline.linkCount} · ${formatPercent(scenario.linkLossPercent.value)}`
          }
        />

        <MetricReadout
          label="Connectance"
          metric={scenario.connectance}
          format="connectance"
          emphasis="primary"
          hint={DEFINITIONS.connectance}
          supporting={
            baseline.connectance.value === null
              ? 'Baseline connectance is not applicable.'
              : `Baseline connectance: ${formatConnectance(baseline.connectance.value)}.`
          }
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricReadout
          label="Consumers directly affected"
          metric={{ value: scenario.directlyAffectedConsumerIds.length }}
          format="count"
          emphasis="secondary"
          hint={DEFINITIONS.affected}
          supporting={
            scenario.directlyAffectedConsumerIds.length
              ? scenario.directlyAffectedConsumerIds.map(label).join(', ')
              : 'No surviving consumer lost a recorded food source.'
          }
        />
        <MetricReadout
          label="Food-depleted consumers"
          metric={{ value: scenario.foodDepletedConsumerIds.length }}
          format="count"
          emphasis="highlight"
          hint={DEFINITIONS.depleted}
          supporting={
            scenario.foodDepletedConsumerIds.length
              ? scenario.foodDepletedConsumerIds.map(label).join(', ')
              : 'No surviving consumer lost every recorded food source.'
          }
        />
        <MetricReadout
          label="Secondary removals"
          metric={{ value: scenario.secondaryRemovals }}
          format="count"
          emphasis="highlight"
          hint={DEFINITIONS.secondary}
          supporting={result.mode === 'direct' ? 'Direct-removal mode never removes secondary nodes.' : undefined}
        />
        <MetricReadout
          label="Cascade depth"
          metric={{ value: scenario.cascadeDepth }}
          format="count"
          emphasis="highlight"
          hint={DEFINITIONS.depth}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <MetricReadout
          label="Secondary removals as % of baseline nodes"
          metric={scenario.secondaryPercentOfBaseline}
          emphasis="highlight"
          hint={DEFINITIONS.secondaryPercent}
          supporting={`Denominator: ${baseline.nodeCount} baseline nodes.`}
        />
        <MetricReadout
          label="All removed nodes as % of baseline nodes"
          metric={scenario.removedPercentOfBaseline}
          emphasis="danger"
          hint={DEFINITIONS.removedPercent}
          supporting={`Removed: ${scenario.totalRemoved} of ${baseline.nodeCount} (including the initial selection).`}
        />
      </div>

      <p className="text-[11px] text-fg-faint">
        Displayed percentages are rounded to one decimal place for reading; the stored values are the full
        floating-point results. Baseline: {baseline.nodeCount} nodes, {baseline.linkCount} links, connectance{' '}
        {formatConnectance(baseline.connectance.value)}. Current scenario:{' '}
        {formatPercent(scenario.linkLossPercent.value)} link loss.
      </p>
    </div>
  )
}
