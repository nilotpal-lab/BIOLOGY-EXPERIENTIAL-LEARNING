import { ArrowRight, Info, Play, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { SpeciesIcon } from '../SpeciesIcon'
import { Badge, Button, Card, CardHeading, EmptyState, RoleBadge, cn } from '../ui/primitives'
import {
  NODE_TYPE_LABEL,
  type FoodWebGraph,
  type FoodWebNode,
  type ScenarioResult,
} from '../../core/types'

/* ============================================================================
 * SpeciesInspector — details for the selected node matching 02_Explorer_Master_Reference.png.
 *
 * Implements the tabbed inspector:
 * - Overview: Scientific classification, energy layer, description, food sources & consumers.
 * - Relationships: Direct prey and predators with complete connection details.
 * - Metrics: In-degree, out-degree, total degree, connectance share.
 * - Images: Artwork display.
 * - Prominent "Select this species for simulation" button at bottom.
 *
 * Strictly maintains scientific honesty: purely recorded interactions, no fake extinction claims.
 * ========================================================================== */

type NodeScenarioState = 'present' | 'selected' | 'removed' | 'affected' | 'depleted'

function nodeScenarioState(
  nodeId: string,
  result: ScenarioResult | null,
  isSelected: boolean,
): NodeScenarioState {
  if (!result) return isSelected ? 'selected' : 'present'
  if (result.removedNodeIds.includes(nodeId)) return 'removed'
  if (result.scenario.foodDepletedConsumerIds.includes(nodeId)) return 'depleted'
  if (result.scenario.directlyAffectedConsumerIds.includes(nodeId)) return 'affected'
  return isSelected ? 'selected' : 'present'
}

const STATE_LABEL: Record<NodeScenarioState, string> = {
  present: 'Present in this scenario',
  selected: 'Selected for simulation',
  removed: 'Removed in this scenario',
  affected: 'Directly affected',
  depleted: 'Food depleted in this scenario',
}

export function SpeciesInspector({
  graph,
  node,
  result,
  isSelected,
  onSelectForSimulation,
  onResetSimulation,
  canRun,
}: {
  graph: FoodWebGraph
  node: FoodWebNode | null
  result: ScenarioResult | null
  isSelected: boolean
  onSelectForSimulation: (id: string) => void
  onResetSimulation: () => void
  canRun: boolean
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'metrics' | 'images'>('overview')

  if (!node) {
    return (
      <Card>
        <CardHeading title="Species inspector" subtitle="No species or trophic group is selected." />
        <EmptyState
          icon={<Info size={18} />}
          title="No species selected"
          description="Select a node in the network, or pick one from the species list, to inspect its recorded food sources and consumers."
        />
      </Card>
    )
  }

  const foodSources = graph.foodSourcesOf.get(node.id) ?? []
  const consumers = graph.consumersOf.get(node.id) ?? []
  const state = nodeScenarioState(node.id, result, isSelected)
  const totalDegree = foodSources.length + consumers.length

  return (
    <Card className="rounded-2xl border-[#DCE7E1] shadow-2xs overflow-hidden">
      {/* Organism Header */}
      <div className="flex items-start gap-3 pb-3 border-b border-[#E5EAE7]">
        <SpeciesIcon
          iconKey={node.iconKey}
          size={52}
          className="rounded-xl border border-[#DCE7E1] bg-[#F8FAF8] p-1.5 shrink-0 shadow-2xs"
          decorative={false}
          label={`Illustration for ${node.name}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#0E1622] truncate">{node.name}</h3>
          {node.scientificName && (
            <p className="text-xs italic text-[#536960] truncate">{node.scientificName}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <RoleBadge role={node.trophicRole} evidence={node.roleEvidence} />
            <Badge tone="neutral">{NODE_TYPE_LABEL[node.nodeType]}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs Header (Matching 02_Explorer_Master_Reference.png) */}
      <div className="flex border-b border-[#E5EAE7] -mx-4 px-4 bg-[#F8FAF8]/50 text-xs">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'relationships' as const, label: `Relationships (${totalDegree})` },
          { id: 'metrics' as const, label: 'Metrics' },
          { id: 'images' as const, label: 'Images' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2 font-semibold border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-[#0F6B52] text-[#0F6B52]'
                : 'border-transparent text-[#71837B] hover:text-[#0E1622]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="mt-3 space-y-3">
          <p className="text-[12.5px] leading-relaxed text-[#536960]">{node.description}</p>

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] p-2">
              <dt className="text-[11px] text-[#71837B]">Scientific name</dt>
              <dd className="font-semibold text-[#0E1622] truncate">
                {node.scientificName ? node.scientificName : 'Not provided in dataset'}
              </dd>
            </div>
            <div className="rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] p-2">
              <dt className="text-[11px] text-[#71837B]">Scenario status</dt>
              <dd className={cn('font-semibold truncate', state === 'removed' ? 'text-rose-600' : state === 'depleted' ? 'text-amber-600' : 'text-[#0E1622]')}>
                {STATE_LABEL[state]}
              </dd>
            </div>
            <div className="rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] p-2">
              <dt className="text-[11px] text-[#71837B]">Recorded incoming links</dt>
              <dd className="font-semibold text-[#0E1622] tabular-nums">
                {foodSources.length} (food sources)
              </dd>
            </div>
            <div className="rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] p-2">
              <dt className="text-[11px] text-[#71837B]">Recorded outgoing links</dt>
              <dd className="font-semibold text-[#0E1622] tabular-nums">
                {consumers.length} (consumers)
              </dd>
            </div>
          </dl>

          <div className="space-y-2.5 pt-1">
            <div>
              <p className="mb-1 text-xs font-bold text-[#0E1622]">
                Recorded food sources <span className="text-[11px] font-normal text-[#71837B]">(incoming: food → this node)</span>
              </p>
              {foodSources.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {foodSources.map((id) => (
                    <li key={id}>
                      <Badge tone="secondary">
                        {graph.nodeById.get(id)?.name ?? id} <ArrowRight size={10} aria-hidden="true" /> this node
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#71837B]">
                  No recorded food-source links in this dataset. That is a limitation of the recorded network, not
                  necessarily a fact about the organism.
                </p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-bold text-[#0E1622]">
                Recorded consumers <span className="text-[11px] font-normal text-[#71837B]">(outgoing: this node → consumer)</span>
              </p>
              {consumers.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {consumers.map((id) => (
                    <li key={id}>
                      <Badge tone="primary">
                        this node <ArrowRight size={10} aria-hidden="true" />{' '}
                        {graph.nodeById.get(id)?.name ?? id}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#71837B]">
                  No recorded consumer links in this dataset. That is a limitation of the recorded network, not
                  necessarily a fact about the organism.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] p-2 text-xs">
              <p className="text-[11px] text-[#71837B]">Dataset source note</p>
              <p className="text-[#536960]">{node.sourceNote ?? 'Not provided in this dataset'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Relationships */}
      {activeTab === 'relationships' && (
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#0E1622]">Food Sources (Prey)</span>
              <span className="text-[11px] text-[#71837B]">{foodSources.length} recorded</span>
            </div>
            {foodSources.length ? (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {foodSources.map((id) => {
                  const target = graph.nodeById.get(id)
                  return (
                    <div key={id} className="flex items-center justify-between p-1.5 rounded-lg border border-[#E5EAE7] bg-[#F8FAF8]">
                      <span className="font-semibold text-[#0E1622]">{target?.name ?? id}</span>
                      <span className="text-[10px] text-[#71837B]">Prey</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[#71837B] italic">No incoming links recorded.</p>
            )}
          </div>

          <div className="pt-2 border-t border-[#E5EAE7]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#0E1622]">Consumers (Predators)</span>
              <span className="text-[11px] text-[#71837B]">{consumers.length} recorded</span>
            </div>
            {consumers.length ? (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {consumers.map((id) => {
                  const target = graph.nodeById.get(id)
                  return (
                    <div key={id} className="flex items-center justify-between p-1.5 rounded-lg border border-[#E5EAE7] bg-[#F8FAF8]">
                      <span className="font-semibold text-[#0E1622]">{target?.name ?? id}</span>
                      <span className="text-[10px] text-[#71837B]">Predator</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[#71837B] italic">No outgoing links recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Metrics */}
      {activeTab === 'metrics' && (
        <div className="mt-3 space-y-2.5 text-xs">
          <div className="rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#536960]">In-Degree (Prey links):</span>
              <span className="font-bold text-[#0E1622] tabular-nums">{foodSources.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#536960]">Out-Degree (Predator links):</span>
              <span className="font-bold text-[#0E1622] tabular-nums">{consumers.length}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5EAE7] pt-2">
              <span className="font-semibold text-[#0E1622]">Total Direct Degree:</span>
              <span className="font-extrabold text-[#0F6B52] tabular-nums">{totalDegree}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#536960]">Share of Network Links:</span>
              <span className="font-bold text-[#0E1622] tabular-nums">
                {graph.edges.length > 0 ? ((totalDegree / graph.edges.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Images */}
      {activeTab === 'images' && (
        <div className="mt-3 flex flex-col items-center justify-center p-6 rounded-xl border border-[#E5EAE7] bg-[#F8FAF8] text-center">
          <SpeciesIcon iconKey={node.iconKey} size={84} />
          <p className="mt-2 text-sm font-bold text-[#0E1622]">{node.name}</p>
          <p className="text-xs italic text-[#536960]">{node.scientificName || 'Botanical icon'}</p>
        </div>
      )}

      {/* Action Footer: Prominent Green Simulation Button */}
      <div className="mt-4 pt-3 border-t border-[#E5EAE7] flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={<Play size={14} />}
          onClick={() => onSelectForSimulation(node.id)}
          disabled={!canRun}
          className="flex-1 bg-[#0F6B52] hover:bg-[#0D5A45] text-white text-xs h-9 font-semibold shadow-xs"
        >
          Select this species for simulation
        </Button>
        {result ? (
          <Button
            variant="ghost"
            icon={<Undo2 size={14} />}
            onClick={onResetSimulation}
            className="text-xs h-9"
          >
            Reset simulation
          </Button>
        ) : null}
      </div>
      {!canRun ? (
        <p className="mt-1.5 text-[11px] text-[#71837B]">
          Simulation is unavailable because the loaded dataset has no nodes.
        </p>
      ) : null}
    </Card>
  )
}
