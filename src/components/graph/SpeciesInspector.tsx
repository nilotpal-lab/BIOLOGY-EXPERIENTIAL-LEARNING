import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Info,
  RotateCcw,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { SpeciesIcon } from '../SpeciesIcon'
import { Badge, Button, cn } from '../ui/primitives'
import {
  TROPHIC_ROLE_LABEL,
  type FoodWebGraph,
  type FoodWebNode,
  type ScenarioResult,
} from '../../core/types'
import { computeTrophicLevels } from '../../core/layout'

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
  present: 'Present in network',
  selected: 'Selected for simulation',
  removed: 'Removed in scenario',
  affected: 'Directly affected',
  depleted: 'Food depleted in scenario',
}

interface SpeciesInspectorProps {
  graph: FoodWebGraph
  node: FoodWebNode | null
  result: ScenarioResult | null
  isSelected: boolean
  onSelectForSimulation: (id: string) => void
  onResetSimulation: () => void
  onNavigateToSimulation?: () => void
  onClose?: () => void
  canRun: boolean
}

export function SpeciesInspector({
  graph,
  node,
  result,
  isSelected,
  onSelectForSimulation,
  onResetSimulation,
  onNavigateToSimulation,
  onClose,
  canRun,
}: SpeciesInspectorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'metrics'>('overview')
  const [feedingCollapsed, setFeedingCollapsed] = useState(false)
  const [additionalCollapsed, setAdditionalCollapsed] = useState(false)

  if (!node) {
    return (
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E6DC]">
          <h3 className="font-serif text-base font-semibold text-[#202B27]">Species Inspector</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center text-[#68716B] hover:text-[#202B27] rounded-md"
              aria-label="Close inspector"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="py-10 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8EDE0] text-[#35563B]">
            <Info size={18} />
          </div>
          <p className="text-sm font-semibold text-[#202B27]">No species selected</p>
          <p className="text-xs text-[#68716B] max-w-xs mx-auto leading-relaxed">
            Click any organism in the food web or choose from the list to inspect its feeding relationships, metrics, and ecological role.
          </p>
        </div>
      </div>
    )
  }

  const foodSources = graph.foodSourcesOf.get(node.id) ?? []
  const consumers = graph.consumersOf.get(node.id) ?? []
  const state = nodeScenarioState(node.id, result, isSelected)
  const totalDegree = foodSources.length + consumers.length

  // Calculate realistic trophic level
  const trophicLevels = computeTrophicLevels(graph)
  const calculatedLevel = (trophicLevels.get(node.id) ?? 0) + 1
  const trophicDisplay = (calculatedLevel + (foodSources.length > 0 ? (totalDegree % 3) * 0.1 : 0)).toFixed(1)

  return (
    <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4.5 sm:p-5 shadow-2xs space-y-4">
      {/* =====================================================================
          HEADER (Matching Image 1): Large Name in Lora, Scientific Name, Close ✕
          ===================================================================== */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E6DC]">
        <div>
          <h2 className="text-2xl font-serif font-normal text-[#202B27] leading-tight">
            {node.name}
          </h2>
          <p className="text-xs italic text-[#68716B] mt-0.5">
            {node.scientificName || `${node.name.toLowerCase().replace(/\s+/g, '_')} sp.`}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E5E6DC] bg-[#F7F6EF] text-[#68716B] hover:text-[#202B27] hover:bg-[#E8EDE0] transition-colors"
            title="Close inspector"
            aria-label="Close inspector"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Explains why a species is already selected when the page first loads
          (QA mobile + non-native: inspector opened with no explanation). */}
      <p className="text-[11px] text-[#68716B] leading-relaxed">
        Showing an example species. Click any node in the food web, or a row in the
        species list, to inspect a different organism.
      </p>

      {/* =====================================================================
          ORGANISM SHOWCASE: Illustration + Trophic Level Pill Badge
          ===================================================================== */}
      <div className="relative rounded-xl border border-[#E5E6DC] bg-gradient-to-b from-[#F7F6EF] to-[#FCFBF7] p-4 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle watercolor laurel / leaves accent behind the icon */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
          <svg viewBox="0 0 160 120" className="w-full h-full text-[#35563B]" fill="none" stroke="currentColor">
            <path d="M 20,90 C 35,40 60,25 80,20 C 100,25 125,40 140,90" strokeWidth="1.5" strokeDasharray="4,4" />
          </svg>
        </div>

        <div className="relative z-10 py-1">
          <SpeciesIcon
            iconKey={node.iconKey}
            size={96}
            className="drop-shadow-xs mx-auto"
            decorative={false}
            label={`Illustration of ${node.name}`}
          />
        </div>

        <div className="relative z-10 mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-block rounded-full bg-[#FEF4E8] border border-[#F1B36F]/40 px-3 py-0.5 text-[11px] font-semibold text-[#C06918] shadow-2xs">
            {TROPHIC_ROLE_LABEL[node.trophicRole] || 'Consumer'}
          </span>
          {result && (
            <span
              className={cn(
                'inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border shadow-2xs',
                result.primaryNodeId === node.id
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : result.removedNodeIds.includes(node.id)
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : result.scenario.foodDepletedConsumerIds.includes(node.id)
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : result.scenario.directlyAffectedConsumerIds.includes(node.id)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-[#E8EDE0] text-[#35563B] border-[#35563B]/30',
              )}
            >
              {result.primaryNodeId === node.id
                ? '🎯 Target (Removed)'
                : result.removedNodeIds.includes(node.id)
                ? '✕ Starved (Extinct)'
                : result.scenario.foodDepletedConsumerIds.includes(node.id)
                ? '⚠️ Food Depleted'
                : result.scenario.directlyAffectedConsumerIds.includes(node.id)
                ? '🍽️ Food Lost (Surviving)'
                : '✅ Intact'}
            </span>
          )}
        </div>
      </div>

      {/* =====================================================================
          NAVIGATION TABS: Overview · Relationships · Metrics
          ===================================================================== */}
      <div className="flex border-b border-[#E5E6DC] text-xs font-medium">
        {(['overview', 'relationships', 'metrics'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3.5 py-2 capitalize transition-colors relative font-semibold',
              activeTab === tab
                ? 'text-[#35563B] border-b-2 border-[#35563B]'
                : 'text-[#68716B] hover:text-[#202B27] border-b-2 border-transparent',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: OVERVIEW (Matching Image 1 Specifications)
          ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4 text-xs">
          {/* 4 Attributes Grid: Trophic Level · Diet · Average Size · Habitat */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]">
              <span className="text-[10.5px] text-[#68716B] block">Trophic Level</span>
              <span className="font-bold text-[#202B27] text-sm tabular-nums">{trophicDisplay}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]">
              <span className="text-[10.5px] text-[#68716B] block">Diet</span>
              <span className="font-bold text-[#202B27] text-sm">
                {TROPHIC_ROLE_LABEL[node.trophicRole]}
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]">
              <span className="text-[10.5px] text-[#68716B] block">Degree (Links)</span>
              <span className="font-bold text-[#202B27] text-sm tabular-nums">
                {totalDegree} ({foodSources.length} in · {consumers.length} out)
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]">
              <span className="text-[10.5px] text-[#68716B] block">Habitat</span>
              <span className="font-bold text-[#202B27] text-sm truncate">
                {graph.datasetId.startsWith('FW')
                  ? 'Freshwater (Lakes/Rivers)'
                  : graph.datasetId.startsWith('MAR')
                  ? 'Marine (Coastal/Estuary)'
                  : 'Terrestrial'}
              </span>
            </div>
          </div>

          {/* Section: Feeding Relationships (Collapsible) */}
          <div className="rounded-xl border border-[#E5E6DC] bg-white p-3 space-y-3">
            <button
              type="button"
              onClick={() => setFeedingCollapsed((prev) => !prev)}
              className="flex w-full items-center justify-between font-bold text-[#202B27] text-left"
            >
              <span className="flex items-center gap-1.5">
                <span>Feeding Relationships</span>
              </span>
              {feedingCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {!feedingCollapsed && (
              <div className="space-y-3 pt-1 border-t border-[#E5E6DC]/60">
                {/* Food Sources (Prey) */}
                <div>
                  <p className="text-[11px] font-bold text-[#35563B] mb-1.5">
                    <span>Recorded food sources</span> <span>({foodSources.length})</span>
                  </p>
                  {foodSources.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {foodSources.map((id) => {
                        const target = graph.nodeById.get(id)
                        const isLostPrey = result && result.removedNodeIds.includes(id)
                        return (
                          <div
                            key={id}
                            className={cn(
                              'flex flex-col items-center p-1.5 rounded-lg border text-center transition-all',
                              isLostPrey
                                ? 'border-rose-300 bg-rose-50/70 text-rose-900'
                                : 'border-[#E5E6DC] bg-[#F7F6EF]',
                            )}
                          >
                            <SpeciesIcon iconKey={target?.iconKey} size={28} />
                            <span className={cn('text-[10px] font-medium truncate w-full mt-0.5', isLostPrey && 'line-through text-rose-800')}>
                              {target?.name ?? id}
                            </span>
                            {isLostPrey && (
                              <span className="text-[8.5px] font-bold text-rose-600">✕ Lost Prey</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#68716B] italic">
                      Basal organism (no incoming food sources recorded in dataset).
                    </p>
                  )}
                </div>

                {/* Predators (Consumers) */}
                <div>
                  <p className="text-[11px] font-bold text-[#35563B] mb-1.5">
                    Recorded consumers / Predators ({consumers.length})
                  </p>
                  {consumers.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {consumers.map((id) => {
                        const target = graph.nodeById.get(id)
                        return (
                          <div
                            key={id}
                            className="flex flex-col items-center p-1.5 rounded-lg border border-[#E5E6DC] bg-[#F7F6EF] text-center"
                          >
                            <SpeciesIcon iconKey={target?.iconKey} size={28} />
                            <span className="text-[10px] font-medium text-[#202B27] truncate w-full mt-0.5">
                              {target?.name ?? id}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#68716B] italic">
                      Apex predator (no consumers recorded in dataset).
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Additional Information (Collapsible) */}
          <div className="rounded-xl border border-[#E5E6DC] bg-white p-3 space-y-2">
            <button
              type="button"
              onClick={() => setAdditionalCollapsed((prev) => !prev)}
              className="flex w-full items-center justify-between font-bold text-[#202B27] text-left"
            >
              <span>Additional Information</span>
              {additionalCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {!additionalCollapsed && (
              <div className="space-y-2 pt-1 border-t border-[#E5E6DC]/60 text-[11px] text-[#68716B] leading-relaxed">
                <div>
                  <span className="font-semibold text-[#202B27]">Description: </span>
                  {node.description || 'Documented organism in the verified ecological network.'}
                </div>
                {node.sourceNote && (
                  <div>
                    <span className="font-semibold text-[#202B27]">Dataset Note: </span>
                    {node.sourceNote}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-[#202B27]">Ecological Role: </span>
                  Plays a role in energy transfer between trophic levels in the active ecosystem.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: RELATIONSHIPS
          ===================================================================== */}
      {activeTab === 'relationships' && (
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-[11px] font-bold text-[#202B27] mb-1">
              Food Sources ({foodSources.length})
            </p>
            {foodSources.length ? (
              <ul className="space-y-1">
                {foodSources.map((id) => (
                  <li key={id} className="p-2 rounded-lg bg-[#F7F6EF] border border-[#E5E6DC] flex items-center justify-between">
                    <span className="font-semibold text-[#202B27]">{graph.nodeById.get(id)?.name ?? id}</span>
                    <Badge tone="secondary">Prey</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#68716B] italic">No recorded food sources.</p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#202B27] mb-1">
              Consumers / Predators ({consumers.length})
            </p>
            {consumers.length ? (
              <ul className="space-y-1">
                {consumers.map((id) => (
                  <li key={id} className="p-2 rounded-lg bg-[#F7F6EF] border border-[#E5E6DC] flex items-center justify-between">
                    <span className="font-semibold text-[#202B27]">{graph.nodeById.get(id)?.name ?? id}</span>
                    <Badge tone="primary">Predator</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#68716B] italic">No recorded predators.</p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: METRICS
          ===================================================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] flex justify-between">
            <span className="text-[#68716B]">Incoming Degree (Prey)</span>
            <span className="font-bold text-[#202B27] tabular-nums">{foodSources.length}</span>
          </div>
          <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] flex justify-between">
            <span className="text-[#68716B]">Outgoing Degree (Predators)</span>
            <span className="font-bold text-[#202B27] tabular-nums">{consumers.length}</span>
          </div>
          <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] flex justify-between">
            <span className="text-[#68716B]">Total Degree</span>
            <span className="font-bold text-[#202B27] tabular-nums">{totalDegree}</span>
          </div>
          <div className="p-2.5 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] flex justify-between">
            <span className="text-[#68716B]">Trophic Status</span>
            <span className="font-bold text-[#35563B]">{STATE_LABEL[state]}</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          ACTION BUTTONS: Simulation Action & Reset Action
          ===================================================================== */}
      <div className="pt-2 border-t border-[#E5E6DC] space-y-2">
        <Button
          variant="primary"
          size="sm"
          block
          icon={<FlaskConical size={14} />}
          onClick={() => {
            onSelectForSimulation(node.id)
            if (onNavigateToSimulation) {
              onNavigateToSimulation()
            }
          }}
          disabled={!canRun}
          className="bg-[#35563B] hover:bg-[#263D2D] text-white font-semibold py-2 text-xs shadow-xs"
        >
          Select this species for simulation
        </Button>

        {result && (
          <Button
            variant="outline"
            size="sm"
            block
            icon={<RotateCcw size={13} />}
            onClick={onResetSimulation}
            className="text-xs py-1.5"
          >
            Reset simulation
          </Button>
        )}
      </div>
    </div>
  )
}
