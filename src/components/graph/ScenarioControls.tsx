import { Download, FileText, GitBranch, Play, RotateCcw, Target, Waves } from 'lucide-react'
import {
  cascadeRoundsExportCsv,
  downloadArtifact,
  nodesExportCsv,
  edgesExportCsv,
  scenarioExportCsv,
  scenarioExportJson,
} from '../../core/exportUtils'
import { SpeciesIcon } from '../SpeciesIcon'
import { Button, Callout, Card, CardHeading, cn } from '../ui/primitives'
import type { FoodWebDataset, FoodWebNode, ScenarioMode, ScenarioResult } from '../../core/types'

/* ============================================================================
 * ScenarioControls — configuration and execution of the two analyses.
 *
 * The two modes are presented as clearly separate choices, and the effect of
 * the selected mode is described BEFORE the user runs it. Nothing is destroyed:
 * the baseline is always preserved, so a scenario is an experiment rather than
 * an irreversible action (Prompt §19).
 * ========================================================================== */

const MODE_COPY: Record<ScenarioMode, { title: string; blurb: string }> = {
  direct: {
    title: 'Direct removal',
    blurb:
      'Removes the selected node and every link where it is the source or the target, then measures the immediate structural effect. Surviving consumers that lose a recorded food source are flagged, but nothing else is removed.',
  },
  cascade: {
    title: 'Direct removal + cascade',
    blurb:
      'Does the direct removal first, then repeatedly removes surviving consumers that had at least one recorded food source in the baseline and have none left. Rounds are simultaneous and continue until no new node qualifies.',
  },
}

export function ScenarioControls({
  dataset,
  node,
  mode,
  onModeChange,
  onRun,
  onReset,
  result,
  onOpenReport,
}: {
  dataset: FoodWebDataset | null
  node: FoodWebNode | null
  mode: ScenarioMode
  onModeChange: (mode: ScenarioMode) => void
  onRun: () => void
  onReset: () => void
  result: ScenarioResult | null
  onOpenReport?: () => void
}) {
  const disabled = !dataset || dataset.nodes.length === 0 || !node

  return (
    <Card>
      <CardHeading
        icon={<Target size={16} />}
        title="Simulation"
        subtitle="Both modes always start from the same unchanged baseline network."
      />

      <div className="mb-3 rounded-xl border border-line-soft bg-surface-2 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-fg-faint">
          Selected species
        </p>
        {node ? (
          <div className="mt-1 flex items-center gap-2">
            <SpeciesIcon iconKey={node.iconKey} size={30} />
            <div>
              <p className="text-[13px] font-medium text-fg">{node.name}</p>
              <p className="text-[11px] text-fg-faint">Simulation will start from this node</p>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[12px] text-fg-muted">
            No species selected. Click a node in the network, or a row in the species list.
          </p>
        )}
      </div>

      <fieldset className="mb-3">
        <legend className="mb-1.5 text-[12px] font-medium text-fg-muted">Analysis mode</legend>
        <div className="grid gap-2">
          {(['direct', 'cascade'] as ScenarioMode[]).map((candidate) => {
            const active = candidate === mode
            return (
              <label
                key={candidate}
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 transition-colors',
                  active ? 'border-primary bg-primary/[0.08]' : 'border-line-soft bg-surface-2 hover:border-line',
                )}
              >
                <input
                  type="radio"
                  name="scenario-mode"
                  value={candidate}
                  checked={active}
                  onChange={() => onModeChange(candidate)}
                  className="mt-1 accent-[#0F6B52]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                    {candidate === 'direct' ? (
                      <Target size={13} aria-hidden="true" />
                    ) : (
                      <Waves size={13} aria-hidden="true" />
                    )}
                    {MODE_COPY[candidate].title}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-fg-muted">
                    {MODE_COPY[candidate].blurb}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon={<Play size={15} />} onClick={onRun} disabled={disabled}>
          Run {mode === 'cascade' ? 'cascade scenario' : 'direct removal'}
        </Button>
        <Button variant="outline" icon={<RotateCcw size={15} />} onClick={onReset} disabled={!result}>
          Reset simulation
        </Button>
      </div>

      {disabled ? (
        <p className="mt-2 text-xs font-medium text-fg-muted" aria-live="polite">
          {!dataset
            ? 'Load a dataset to enable simulation.'
            : dataset.nodes.length === 0
              ? 'The loaded dataset has no nodes, so no scenario can be run.'
              : 'Select a species to enable simulation.'}
        </p>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-fg-faint">
          Running a scenario does not delete anything permanently: FoodWebGuard keeps an immutable baseline copy
          and every scenario is recalculated from it, so results stay repeatable.
        </p>
      )}

      {result ? (
        <div className="mt-4 border-t border-line-soft pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-fg-muted">
            <GitBranch size={13} aria-hidden="true" /> Export this scenario and the current network
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dataset ? (
              <>
                {onOpenReport && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<FileText size={13} />}
                    onClick={onOpenReport}
                    className="bg-emerald-800 text-white hover:bg-emerald-900 border-emerald-800 font-medium"
                  >
                    Academic PDF Report
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download size={13} />}
                  onClick={() => downloadArtifact(scenarioExportCsv(result, dataset))}
                >
                  Scenario summary (CSV)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download size={13} />}
                  onClick={() => downloadArtifact(scenarioExportJson(result, dataset))}
                >
                  Scenario detail (JSON)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download size={13} />}
                  onClick={() => downloadArtifact(cascadeRoundsExportCsv(result, dataset))}
                >
                  Cascade round history (CSV)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Download size={13} />}
                  onClick={() => downloadArtifact(nodesExportCsv(dataset))}
                >
                  Node list (CSV)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Download size={13} />}
                  onClick={() => downloadArtifact(edgesExportCsv(dataset))}
                >
                  Link list (CSV)
                </Button>
              </>
            ) : null}
          </div>
          <Callout tone="info" className="mt-3">
            Every export contains the dataset id, name, data status, citation fields, simulation mode, the
            selected initial node, baseline and scenario counts, the metric definitions, and every warning or
            exclusion recorded for this result.
          </Callout>
        </div>
      ) : null}
    </Card>
  )
}
