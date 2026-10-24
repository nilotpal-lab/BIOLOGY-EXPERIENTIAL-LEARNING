/* ============================================================================
 * FoodWebGuard — shared data model
 *
 * Mandatory edge convention (Master Build Prompt §2.4):
 *   source = the FOOD ORGANISM     target = the CONSUMER
 *   e.g. `algae -> zooplankton` means zooplankton consumes algae.
 * Every algorithm, chart, table, tooltip and export follows this direction.
 * ========================================================================== */

/** Ecosystem category used for the cross-network comparison screen. */
export type EcosystemCategory = 'freshwater' | 'terrestrial' | 'marine'

export const ECOSYSTEM_CATEGORIES: readonly EcosystemCategory[] = [
  'freshwater',
  'terrestrial',
  'marine',
] as const

export const ECOSYSTEM_LABEL: Record<EcosystemCategory, string> = {
  freshwater: 'Freshwater',
  terrestrial: 'Terrestrial',
  marine: 'Marine',
}

/** A node may be one species or an aggregated trophic group. */
export type NodeType = 'species' | 'trophic-group'

export const NODE_TYPES: readonly NodeType[] = ['species', 'trophic-group'] as const

export const NODE_TYPE_LABEL: Record<NodeType, string> = {
  'species': 'Species',
  'trophic-group': 'Trophic group',
}

/** Documented functional role of a node. */
export type TrophicRole =
  | 'producer'
  | 'basal-group'
  | 'primary-consumer'
  | 'secondary-consumer'
  | 'apex-predator'
  | 'decomposer'
  | 'omnivore'
  | 'other'

export const TROPHIC_ROLES: readonly TrophicRole[] = [
  'producer',
  'basal-group',
  'primary-consumer',
  'secondary-consumer',
  'apex-predator',
  'decomposer',
  'omnivore',
  'other',
] as const

export const TROPHIC_ROLE_LABEL: Record<TrophicRole, string> = {
  'producer': 'Producer',
  'basal-group': 'Basal group',
  'primary-consumer': 'Primary consumer',
  'secondary-consumer': 'Secondary consumer',
  'apex-predator': 'Apex predator',
  'decomposer': 'Decomposer',
  'omnivore': 'Omnivore',
  'other': 'Other documented role',
}

/**
 * Roles that can, under the cascade eligibility rule, be removed as secondary
 * losses when they run out of recorded food sources.  Producers and basal
 * groups are deliberately excluded: a plant having no recorded food source is
 * expected, not evidence that it lost one (Prompt §9.1, Case 4).
 */
export const CONSUMER_ROLES: readonly TrophicRole[] = [
  'primary-consumer',
  'secondary-consumer',
  'apex-predator',
  'omnivore',
  'decomposer',
  'other',
] as const

export function isConsumerRole(role: TrophicRole): boolean {
  return CONSUMER_ROLES.includes(role)
}

/** How a trophic role was established, so inferred values are never hidden. */
export type RoleProvenance = 'documented' | 'inferred' | 'unknown'

export const ROLE_PROVENANCE_LABEL: Record<RoleProvenance, string> = {
  documented: 'Documented',
  inferred: 'Inferred',
  unknown: 'Unknown',
}

/** Dataset provenance / verification status (Prompt §2.1–2.2). */
export type SourceStatus =
  | 'illustrative-demo'
  | 'research-pending'
  | 'research-provided-validation-pending'
  | 'research-verified'

export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  'illustrative-demo': 'Illustrative demo',
  'research-pending': 'Research source pending',
  'research-provided-validation-pending': 'Research source provided, validation pending',
  'research-verified': 'Research source verified',
}

/** Which visual treatment a source-status badge gets. */
export type StatusTone = 'demo' | 'pending' | 'warning' | 'verified'

export const SOURCE_STATUS_TONE: Record<SourceStatus, StatusTone> = {
  'illustrative-demo': 'demo',
  'research-pending': 'pending',
  'research-provided-validation-pending': 'warning',
  'research-verified': 'verified',
}

/* -------------------------------------------------------------------------- */
/* Nodes and edges                                                            */
/* -------------------------------------------------------------------------- */

export interface FoodWebNode {
  /** Stable, unique identifier. All algorithms key off this, never off labels. */
  id: string
  /** Common name, or the documented trophic-group name. */
  name: string
  /** Optional. Only populated when actually verified — never invented. */
  scientificName?: string | null
  nodeType: NodeType
  trophicRole: TrophicRole
  roleEvidence: RoleProvenance
  /** Concise educational description. */
  description: string
  /** Key into the species artwork registry. Falls back to a neutral icon. */
  iconKey: string
  habitat?: string | null
  sourceNote?: string | null
  /** Identifier from the original source dataset, when one exists. */
  originalId?: string | null
}

export interface FoodWebEdge {
  /** Stable edge identifier, e.g. `e:algae->zooplankton`. */
  id: string
  /** FOOD ORGANISM. */
  source: string
  /** CONSUMER. */
  target: string
  /** Relationship type where known (e.g. "grazing", "predation"). */
  relationship?: string | null
  /** Citation or note for this link, where the source provides one. */
  sourceNote?: string | null
}

export interface DatasetProvenance {
  /** Original publication or repository. 'Not provided' when unknown. */
  origin: string
  citation: string
  sourceUrl?: string | null
  /** License or reuse conditions, where known. */
  license?: string | null
  /** Downloaded / prepared version information, where known. */
  version?: string | null
  /** Whether nodes are individual species or aggregated trophic groups. */
  nodeUnit: string
  /** Every cleaning decision made while preparing the dataset. */
  cleaningNotes: string[]
  validationStatus: SourceStatus
  retrievedOn?: string | null
}

export interface FoodWebDataset {
  id: string
  name: string
  ecosystem: EcosystemCategory
  summary: string
  /** True for the illustrative teaching networks. */
  isDemo: boolean
  /** Convenience mirror of provenance.validationStatus. */
  sourceStatus: SourceStatus
  provenance: DatasetProvenance
  nodes: FoodWebNode[]
  edges: FoodWebEdge[]
  /** Set for datasets the user imported into this browser. */
  userProvided?: boolean
}

/* -------------------------------------------------------------------------- */
/* Graph model                                                                */
/* -------------------------------------------------------------------------- */

export interface FoodWebGraph {
  datasetId: string
  nodes: FoodWebNode[]
  edges: FoodWebEdge[]
  /** node id -> node */
  nodeById: Map<string, FoodWebNode>
  /** consumer id -> recorded food-source ids (incoming edges) */
  foodSourcesOf: Map<string, string[]>
  /** food-source id -> consumer ids (outgoing edges) */
  consumersOf: Map<string, string[]>
  /** node id -> ids of edges touching it, in either direction */
  edgeIdsOf: Map<string, string[]>
}

/* -------------------------------------------------------------------------- */
/* Metrics and scenarios                                                      */
/* -------------------------------------------------------------------------- */

export type ScenarioMode = 'direct' | 'cascade'

export const SCENARIO_MODE_LABEL: Record<ScenarioMode, string> = {
  direct: 'Direct removal',
  cascade: 'Direct removal + cascade',
}

/** A metric that may legitimately be "not applicable" instead of zero. */
export interface MetricValue {
  value: number | null
  /** Why the metric is not applicable — shown to the user verbatim. */
  notApplicable?: string
}

export interface BaselineMetrics {
  nodeCount: number
  linkCount: number
  connectance: MetricValue
}

export interface ScenarioMetrics {
  nodeCount: number
  linkCount: number
  linksLost: number
  linkLossPercent: MetricValue
  connectance: MetricValue
  /** Surviving consumers that lost >= 1 previously recorded food link. */
  directlyAffectedConsumerIds: string[]
  /** Consumers with >=1 baseline food link and zero now. */
  foodDepletedConsumerIds: string[]
  /** Additional nodes removed by the cascade, excluding the initial node. */
  secondaryRemovals: number
  /** 100 * secondary removals / N0 (Prompt §7.7), denominator stated in the UI. */
  secondaryPercentOfBaseline: MetricValue
  /** 100 * ALL removed nodes incl. the initial one / N0 (Prompt §9.3). */
  removedPercentOfBaseline: MetricValue
  /** Number of cascade rounds that removed at least one node. */
  cascadeDepth: number
  /** All removed nodes including the initial selection. */
  totalRemoved: number
}

export interface CascadeRemovalRecord {
  nodeId: string
  label: string
  role: TrophicRole
  /** Human-readable reason the node met the eligibility rule. */
  reason: string
  /** Recorded food sources it had in the baseline. */
  baselineFoodSourceIds: string[]
  /** Food sources still recorded at the moment before this removal. */
  remainingFoodSourceIds: string[]
}

export interface CascadeRound {
  /** 1-based. The initial user-selected removal is not a round. */
  round: number
  removals: CascadeRemovalRecord[]
}

export interface ScenarioWarning {
  code: string
  message: string
}

export interface ScenarioResult {
  datasetId: string
  datasetName: string
  mode: ScenarioMode
  /** The node the user selected for the initial removal. */
  primaryNodeId: string
  primaryNodeLabel: string
  computedAt: string
  baseline: BaselineMetrics
  scenario: ScenarioMetrics
  rounds: CascadeRound[]
  removedNodeIds: string[]
  /** Links removed by the initial direct removal (source -> target pairs). */
  directlyRemovedLinks: { source: string; target: string }[]
  warnings: ScenarioWarning[]
}

/* -------------------------------------------------------------------------- */
/* Ranking                                                                    */
/* -------------------------------------------------------------------------- */

export type RankingMetricKey =
  | 'linkLossPercent'
  | 'directlyAffectedConsumers'
  | 'secondaryRemovals'
  | 'cascadeRemovedPercent'
  | 'cascadeDepth'

export interface RankingMetricDefinition {
  key: RankingMetricKey
  label: string
  shortLabel: string
  /** All ranking metrics are "higher = larger measured change". */
  direction: 'desc'
  unit: 'percent' | 'count'
  definition: string
  /** Reported from direct mode, cascade mode, or both. */
  mode: ScenarioMode
}

export interface RankingRow {
  /**
   * 1-based rank under the selected metric, or 0 when the metric is not
   * applicable for this node. Tied values share a rank (1, 1, 3, ...).
   */
  rank: number
  nodeId: string
  label: string
  role: TrophicRole
  /** Primary metric value. Null only when genuinely not applicable. */
  metricValue: number | null
  metricNotApplicable?: string
  linksLost: number
  linkCount: number
  nodeCount: number
  directlyAffectedConsumers: number
  foodDepletedConsumers: number
  secondaryRemovals: number
  cascadeDepth: number
  removedPercentOfBaseline: number | null
  /** True when the node was excluded from the ranking, with a reason. */
  excluded?: string
}

export interface RankingResult {
  datasetId: string
  datasetName: string
  metric: RankingMetricDefinition
  mode: ScenarioMode
  rows: RankingRow[]
  /** Nodes that could not be tested, with the reason why. */
  excluded: { nodeId: string; label: string; reason: string }[]
  computedAt: string
  /** Total nodes in the baseline, for progress/coverage reporting. */
  baselineNodeCount: number
}

/* -------------------------------------------------------------------------- */
/* Import / validation                                                        */
/* -------------------------------------------------------------------------- */

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: IssueSeverity
  code: string
  message: string
  /** Where the problem was found, e.g. `nodes row 7` or `edges row 3`. */
  location?: string
  /** Whether the user can resolve it by choosing to exclude the record. */
  fixable?: boolean
  /** Source line the issue refers to, for the "exclude" affordance. */
  edgeId?: string
  nodeId?: string
}

export interface CleaningReport {
  inputNodeCount: number
  inputEdgeCount: number
  acceptedNodeCount: number
  acceptedEdgeCount: number
  duplicateEdgesRemoved: number
  selfLinksExcluded: number
  invalidEdgesExcluded: number
  inferredMetadata: string[]
  outstandingWarnings: string[]
}

export interface ImportPreview {
  /** Parsed candidate dataset — only committed after validation passes. */
  dataset: FoodWebDataset | null
  issues: ValidationIssue[]
  report: CleaningReport | null
  /** Blocking problems prevent the final import. */
  blocked: boolean
}
