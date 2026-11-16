import { AlertTriangle, BookOpen, FileText } from 'lucide-react'
import { describeScenario } from '../../core/scenarios'
import { Card, CardHeading, Callout } from '../ui/primitives'
import type { ScenarioResult } from '../../core/types'

/* ============================================================================
 * WhatChanged — the readable results explanation (Prompt §14).
 *
 * Every sentence is generated from the computed scenario, so it can never
 * overstate what the simulation did. Warnings and exclusions are always shown
 * alongside, never hidden behind a summary.
 * ========================================================================== */

export function WhatChanged({
  result,
  labelFor,
}: {
  result: ScenarioResult
  labelFor: (id: string) => string
}) {
  const lines = describeScenario(result)
  const isCascade = result.mode === 'cascade'
  const secondaryCount = result.scenario.secondaryRemovals
  const affectedCount = result.scenario.directlyAffectedConsumerIds.length
  const depletedCount = result.scenario.foodDepletedConsumerIds.length
  const isEquivalenceGuaranteed = isCascade ? secondaryCount === 0 : depletedCount === 0

  return (
    <Card>
      <CardHeading
        icon={<FileText size={16} />}
        title="What changed?"
        subtitle={`Generated from the computed result for ${result.datasetName}.`}
      />
      <ol className="space-y-2">
        {lines.map((line, index) => (
          <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-fg-muted break-words">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span className="break-words">{line}</span>
          </li>
        ))}
      </ol>

      {/* Plain-English Educational Insight for Students */}
      <div className="mt-3 rounded-xl border border-[#35563B]/20 bg-[#F7F6EF] p-3 text-xs space-y-1.5 min-w-0 break-words">
        <div className="flex items-center gap-1.5 font-bold text-[#35563B]">
          <BookOpen size={14} />
          <span>Plain-English Ecosystem Summary:</span>
        </div>
        <p className="text-[12px] text-[#4A544E] leading-relaxed break-words">
          {isCascade && secondaryCount > 0 ? (
            <>
              <strong>🚨 Domino Starvation Occurred:</strong> Removing <span className="font-semibold text-[#202B27]">{result.primaryNodeLabel}</span> broke vital energy pathways. {secondaryCount} consumer species depended exclusively on the removed organisms and starved in {result.rounds.length} round(s).
            </>
          ) : isCascade ? (
            <>
              <strong>🛡️ High Dietary Resilience:</strong> Even though {affectedCount} species lost a food item, <strong>zero secondary species starved</strong> because surviving predators had alternative prey available (dietary redundancy). The cascade report matches direct removal for this species.
            </>
          ) : (
            <>
              <strong>🔍 Direct Removal Evaluation:</strong> Measures the immediate severance of {result.directlyRemovedLinks.length} feeding links. {depletedCount > 0 ? `${depletedCount} species lost all food and would starve in a cascade.` : 'Surviving predators retain alternative prey options.'}
            </>
          )}
        </p>

        {isEquivalenceGuaranteed ? (
          <div className="pt-2 border-t border-[#35563B]/15 text-[11px] text-[#4A544E] leading-relaxed">
            <span className="font-semibold text-[#202B27]">🔬 Direct vs. Cascade Equivalence: </span>
            <span>
              Both Direct Removal and Cascade mode yield the exact same species count ({result.scenario.nodeCount} remaining) for <strong>{result.primaryNodeLabel}</strong> because all dependent consumers retain alternative food items. Under the deterministic cascade rule, secondary extinction only occurs when 100% of an organism&apos;s food sources are lost.
            </span>
          </div>
        ) : !isCascade && depletedCount > 0 ? (
          <div className="pt-2 border-t border-amber-300/60 text-[11px] text-amber-900 leading-relaxed bg-amber-50/50 p-2 rounded-lg mt-2">
            <span className="font-semibold text-amber-950">⚠️ Cascade Divergence Expected: </span>
            <span>
              {depletedCount} consumer species ({result.scenario.foodDepletedConsumerIds.join(', ')}) lost 100% of their recorded food. In Direct Removal they remain visible, but switching to Cascade mode will trigger secondary starvation and remove them from the ecosystem.
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-line-soft bg-surface-2 p-2.5 text-[12px] min-w-0">
          <p className="text-fg-faint font-medium">Links removed by the initial removal</p>
          <ul className="mt-1 space-y-0.5 text-fg-muted max-h-40 overflow-y-auto pr-1">
            {result.directlyRemovedLinks.length ? (
              result.directlyRemovedLinks.map((link) => (
                <li key={`${link.source}->${link.target}`} className="truncate" title={`${labelFor(link.source)} → ${labelFor(link.target)}`}>
                  {labelFor(link.source)} <span className="text-secondary">→</span> {labelFor(link.target)}
                </li>
              ))
            ) : (
              <li>No recorded links touch this node, so no link was removed.</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg border border-line-soft bg-surface-2 p-2.5 text-[12px] min-w-0">
          <p className="text-fg-faint font-medium">Nodes removed in total ({result.scenario.totalRemoved})</p>
          <ul className="mt-1 space-y-0.5 text-fg-muted max-h-40 overflow-y-auto pr-1">
            <li className="truncate">
              Initial selection: <span className="text-fg font-semibold">{result.primaryNodeLabel}</span>
            </li>
            {result.rounds.flatMap((round) =>
              round.removals.map((removal) => (
                <li key={removal.nodeId} className="truncate" title={`Round ${round.round}: ${removal.label} (Starved)`}>
                  Round {round.round}: <span className="text-fg font-semibold">{removal.label}</span> (Starved)
                </li>
              )),
            )}
          </ul>
        </div>
      </div>

      {result.warnings.length ? (
        <div className="mt-3 space-y-2">
          {result.warnings.map((warning) => (
            <Callout
              key={warning.code}
              tone={warning.code === 'NETWORK_EMPTY_AFTER_SCENARIO' ? 'danger' : 'warning'}
              title={warning.code}
              icon={<AlertTriangle size={14} />}
            >
              {warning.message}
            </Callout>
          ))}
        </div>
      ) : null}

      <Callout tone="info" className="mt-3">
        <strong>What this does not establish.</strong> These are structural effects under the recorded links and
        the selected simulation rule. The cascade is a deterministic structural experiment, not a population
        model, and losing all recorded food-source links does not prove that an organism would die or become
        extinct in nature. Results are scenario-dependent: a different dataset, or a different rule, would give
        different numbers.
      </Callout>
    </Card>
  )
}
