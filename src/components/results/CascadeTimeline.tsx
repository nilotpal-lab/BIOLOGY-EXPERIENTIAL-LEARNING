import { ChevronDown, ChevronRight, Waves } from 'lucide-react'
import { useId, useState } from 'react'
import { Badge, Card, CardHeading, EmptyState, MonoId } from '../ui/primitives'
import { TROPHIC_ROLE_LABEL, type ScenarioResult } from '../../core/types'

/* ============================================================================
 * CascadeTimeline — the round-by-round record of secondary removals.
 *
 * The prompt requires the round structure, the reason each node met the rule,
 * and the food sources that disappeared before its removal, to all be
 * inspectable. Nothing here is animated or dramatised: it is the computed
 * sequence (Prompt §9.3).
 * ========================================================================== */

export function CascadeTimeline({
  result,
  labelFor,
}: {
  result: ScenarioResult
  labelFor: (id: string) => string
}) {
  const [open, setOpen] = useState<number | null>(result.rounds[0]?.round ?? null)
  const baseId = useId()

  if (result.mode !== 'cascade') {
    return (
      <Card>
        <CardHeading
          title="Cascade rounds"
          subtitle="Direct-removal mode removes only the selected node, so there are no cascade rounds."
        />
        <EmptyState
          icon={<Waves size={18} />}
          title="No cascade was run"
          description="Switch the analysis mode to “Direct removal + cascade” and run the scenario again to see the rule-based secondary removals, round by round."
        />
      </Card>
    )
  }

  if (!result.rounds.length) {
    return (
      <Card>
        <CardHeading
          title="Cascade rounds"
          subtitle={`Initial removal: ${result.primaryNodeLabel}`}
        />
        <EmptyState
          icon={<Waves size={18} />}
          title="No secondary removals under the current cascade rule"
          description="No surviving consumer lost all of its recorded food sources, so cascade depth is 0. This is not proof that the food web is robust in nature — it describes this recorded network under this rule."
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeading
        title="Cascade rounds"
        subtitle={`Initial removal: ${result.primaryNodeLabel} · ${result.scenario.secondaryRemovals} secondary removal(s) over ${result.scenario.cascadeDepth} round(s). Each round removes every node that qualified at the start of that round.`}
      />
      <ol className="space-y-2">
        {result.rounds.map((round) => {
          const expanded = open === round.round
          const panelId = `${baseId}-round-${round.round}`
          return (
            <li key={round.round} className="rounded-xl border border-line-soft bg-surface-2">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : round.round)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
                  {expanded ? (
                    <ChevronDown size={15} aria-hidden="true" className="text-primary" />
                  ) : (
                    <ChevronRight size={15} aria-hidden="true" className="text-fg-faint" />
                  )}
                  Round {round.round}
                  <Badge tone="danger">{round.removals.length} removed</Badge>
                </span>
                <span className="truncate text-[12px] text-fg-muted">
                  {round.removals.map((removal) => removal.label).join(', ')}
                </span>
              </button>

              {expanded ? (
                <div id={panelId} className="space-y-2 border-t border-line-soft px-3 py-2.5">
                  {round.removals.map((removal) => (
                    <div key={removal.nodeId} className="rounded-lg border border-line-soft p-2.5">
                      <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-fg">
                        {removal.label}
                        <Badge tone="neutral">{TROPHIC_ROLE_LABEL[removal.role]}</Badge>
                        <MonoId>{removal.nodeId}</MonoId>
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{removal.reason}</p>
                      <p className="mt-1 text-[11px] text-fg-faint">
                        Recorded food sources in the baseline:{' '}
                        {removal.baselineFoodSourceIds.map(labelFor).join(', ') || 'none recorded'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-fg-faint">
        Rule applied: a surviving consumer is removed in a round only if it had at least one recorded food-source
        link in the baseline and has none left at the start of that round. Producers and basal groups are never
        removed by this rule, and a node that already had no recorded food source in the baseline is never
        eligible.
      </p>
    </Card>
  )
}
