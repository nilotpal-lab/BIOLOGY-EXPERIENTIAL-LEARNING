import { SOURCE_STATUS_LABEL, type EcosystemCategory, type FoodWebDataset, type RankingResult, type ScenarioResult } from './types'
import type { DatasetComparisonSummary } from './comparisonEngine'

/* ============================================================================
 * exportUtils — CSVs that contain the actual calculated data (Prompt §17).
 *
 * Every export carries the provenance block (dataset id, name, data status,
 * citation) and the warning/exclusion list, so a result can never be read
 * without the caveats that produced it.
 * ========================================================================== */

export interface ExportArtifact {
  filename: string
  content: string
  mime: string
}

/** RFC-4180-ish CSV escaping. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(header: string[], rows: (unknown[])[]): string {
  const lines = [header.map(csvCell).join(',')]
  for (const row of rows) lines.push(row.map(csvCell).join(','))
  return `${lines.join('\r\n')}\r\n`
}

/** Key/value CSV used for single-scenario summaries. */
function keyValueCsv(pairs: [string, unknown][]): string {
  return toCsv(['field', 'value'], pairs)
}

function safeId(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '_')
}

export function provenancePairs(dataset: FoodWebDataset): [string, unknown][] {
  return [
    ['dataset_id', dataset.id],
    ['dataset_name', dataset.name],
    ['ecosystem_category', dataset.ecosystem],
    ['data_status', SOURCE_STATUS_LABEL[dataset.sourceStatus]],
    ['is_illustrative_demo', dataset.isDemo ? 'yes' : 'no'],
    ['node_unit', dataset.provenance.nodeUnit],
    ['origin', dataset.provenance.origin],
    ['citation', dataset.provenance.citation],
    ['source_url', dataset.provenance.sourceUrl ?? 'Not provided'],
    ['license_or_reuse', dataset.provenance.license ?? 'Not provided'],
    ['prepared_version', dataset.provenance.version ?? 'Not provided'],
    ['validation_status', SOURCE_STATUS_LABEL[dataset.provenance.validationStatus]],
    ['cleaning_notes', dataset.provenance.cleaningNotes.join(' | ')],
    ['baseline_nodes', dataset.nodes.length],
    ['baseline_links', dataset.edges.length],
  ]
}

/* -------------------------------------------------------------------------- */
/* Network exports                                                            */
/* -------------------------------------------------------------------------- */

export function nodesExportCsv(dataset: FoodWebDataset): ExportArtifact {
  const csv = toCsv(
    [
      'dataset_id',
      'dataset_name',
      'node_id',
      'name',
      'scientific_name',
      'node_type',
      'trophic_role',
      'role_evidence',
      'description',
      'icon_key',
      'habitat',
      'original_id',
      'source_note',
    ],
    dataset.nodes.map((node) => [
      dataset.id,
      dataset.name,
      node.id,
      node.name,
      node.scientificName ?? 'Not provided',
      node.nodeType,
      node.trophicRole,
      node.roleEvidence,
      node.description,
      node.iconKey,
      node.habitat ?? 'Not provided',
      node.originalId ?? 'Not provided',
      node.sourceNote ?? 'Not provided',
    ]),
  )
  return {
    filename: `${safeId(dataset.id)}_nodes.csv`,
    content: csv,
    mime: 'text/csv;charset=utf-8',
  }
}

export function edgesExportCsv(dataset: FoodWebDataset): ExportArtifact {
  const csv = toCsv(
    [
      'dataset_id',
      'dataset_name',
      'edge_id',
      'source_food_organism',
      'target_consumer',
      'direction_note',
      'relationship',
      'source_note',
    ],
    dataset.edges.map((edge) => [
      dataset.id,
      dataset.name,
      edge.id,
      edge.source,
      edge.target,
      'source is the food organism; target is the consumer',
      edge.relationship ?? 'Not provided',
      edge.sourceNote ?? 'Not provided',
    ]),
  )
  return {
    filename: `${safeId(dataset.id)}_links.csv`,
    content: csv,
    mime: 'text/csv;charset=utf-8',
  }
}

/* -------------------------------------------------------------------------- */
/* Scenario exports                                                           */
/* -------------------------------------------------------------------------- */

export function scenarioExportCsv(result: ScenarioResult, dataset: FoodWebDataset): ExportArtifact {
  const pairs: [string, unknown][] = [
    ...provenancePairs(dataset),
    ['simulation_mode', result.mode === 'cascade' ? 'direct removal + cascade' : 'direct removal'],
    ['selected_initial_node_id', result.primaryNodeId],
    ['selected_initial_node_label', result.primaryNodeLabel],
    ['computed_at', result.computedAt],
    ['baseline_node_count', result.baseline.nodeCount],
    ['baseline_link_count', result.baseline.linkCount],
    [
      'baseline_connectance',
      result.baseline.connectance.value === null
        ? `not applicable - ${result.baseline.connectance.notApplicable ?? ''}`
        : result.baseline.connectance.value,
    ],
    ['scenario_node_count', result.scenario.nodeCount],
    ['scenario_link_count', result.scenario.linkCount],
    ['links_lost', result.scenario.linksLost],
    [
      'link_loss_percent',
      result.scenario.linkLossPercent.value === null
        ? `not applicable - ${result.scenario.linkLossPercent.notApplicable ?? ''}`
        : result.scenario.linkLossPercent.value,
    ],
    [
      'scenario_connectance',
      result.scenario.connectance.value === null
        ? `not applicable - ${result.scenario.connectance.notApplicable ?? ''}`
        : result.scenario.connectance.value,
    ],
    ['consumers_directly_affected_count', result.scenario.directlyAffectedConsumerIds.length],
    ['consumers_directly_affected', result.scenario.directlyAffectedConsumerIds.join(' | ')],
    ['food_depleted_consumers_count', result.scenario.foodDepletedConsumerIds.length],
    ['food_depleted_consumers', result.scenario.foodDepletedConsumerIds.join(' | ')],
    ['secondary_removals', result.scenario.secondaryRemovals],
    [
      'secondary_removals_percent_of_baseline_nodes',
      result.scenario.secondaryPercentOfBaseline.value === null
        ? `not applicable - ${result.scenario.secondaryPercentOfBaseline.notApplicable ?? ''}`
        : result.scenario.secondaryPercentOfBaseline.value,
    ],
    ['cascade_depth', result.scenario.cascadeDepth],
    [
      'total_removed_including_initial',
      `${result.scenario.totalRemoved} of ${result.baseline.nodeCount}`,
    ],
    [
      'all_removed_percent_of_baseline_nodes',
      result.scenario.removedPercentOfBaseline.value === null
        ? `not applicable - ${result.scenario.removedPercentOfBaseline.notApplicable ?? ''}`
        : result.scenario.removedPercentOfBaseline.value,
    ],
    ['removed_node_ids', result.removedNodeIds.join(' | ')],
    [
      'links_removed_by_initial_removal',
      result.directlyRemovedLinks.map((link) => `${link.source}->${link.target}`).join(' | '),
    ],
    ['warnings_and_exclusions', result.warnings.map((warning) => `[${warning.code}] ${warning.message}`).join(' || ')],
  ]
  return {
    filename: `${safeId(result.datasetId)}_${result.mode}_${safeId(result.primaryNodeId)}_scenario.csv`,
    content: keyValueCsv(pairs),
    mime: 'text/csv;charset=utf-8',
  }
}

export function scenarioExportJson(result: ScenarioResult, dataset: FoodWebDataset): ExportArtifact {
  const payload = {
    exportKind: 'foodwebguard.scenario.v1',
    provenance: Object.fromEntries(provenancePairs(dataset)),
    result: {
      ...result,
      metricDefinitions: {
        linkLossPercent: '100 x (L0 - Ls) / L0, defined only when L0 > 0',
        connectance: 'L / (N x (N - 1)), defined only when N >= 2',
        directlyAffectedConsumers:
          'surviving consumers that lost at least one previously recorded food-source link immediately after the initial removal',
        foodDepletedConsumers:
          'consumers with at least one recorded baseline food source and none remaining immediately after the initial removal',
        secondaryRemovals: 'additional nodes removed by the cascade, excluding the initial selection',
        cascadeDepth: 'number of cascade rounds with at least one removal',
      },
    },
  }
  return {
    filename: `${safeId(result.datasetId)}_${result.mode}_${safeId(result.primaryNodeId)}_scenario.json`,
    content: JSON.stringify(payload, null, 2),
    mime: 'application/json',
  }
}

export function cascadeRoundsExportCsv(result: ScenarioResult, dataset: FoodWebDataset): ExportArtifact {
  const rows = result.rounds.length
    ? result.rounds.flatMap((round) =>
        round.removals.map((removal) => [
          dataset.id,
          result.mode,
          result.primaryNodeLabel,
          round.round,
          removal.nodeId,
          removal.label,
          removal.role,
          removal.baselineFoodSourceIds.join(' | '),
          removal.remainingFoodSourceIds.length === 0 ? '(none)' : removal.remainingFoodSourceIds.join(' | '),
          removal.reason,
        ]),
      )
    : [
        [
          dataset.id,
          result.mode,
          result.primaryNodeLabel,
          '',
          '',
          '',
          '',
          '',
          '',
          'No secondary removals under the current cascade rule: cascade depth is 0.',
        ],
      ]

  return {
    filename: `${safeId(result.datasetId)}_cascade_rounds_${safeId(result.primaryNodeId)}.csv`,
    content: toCsv(
      [
        'dataset_id',
        'simulation_mode',
        'initial_node',
        'cascade_round',
        'removed_node_id',
        'removed_node_label',
        'trophic_role',
        'baseline_food_sources',
        'food_sources_remaining_at_removal',
        'reason_the_rule_applied',
      ],
      rows,
    ),
    mime: 'text/csv;charset=utf-8',
  }
}

/* -------------------------------------------------------------------------- */
/* Ranking exports                                                            */
/* -------------------------------------------------------------------------- */

export function rankingExportCsv(ranking: RankingResult): ExportArtifact {
  const csv = toCsv(
    [
      'dataset_id',
      'dataset_name',
      'simulation_mode',
      'ranking_metric',
      'ranking_metric_definition',
      'sort_direction',
      'tie_break',
      'rank',
      'node_id',
      'node_label',
      'trophic_role',
      'metric_value',
      'metric_not_applicable_reason',
      'links_lost_direct',
      'links_remaining_direct',
      'nodes_remaining_direct',
      'consumers_directly_affected',
      'food_depleted_consumers',
      'secondary_removals',
      'cascade_depth',
      'all_removed_percent_of_baseline_nodes',
    ],
    ranking.rows.map((row) => [
      ranking.datasetId,
      ranking.datasetName,
      ranking.mode,
      ranking.metric.label,
      ranking.metric.definition,
      'descending (larger measured change ranks higher)',
      'rank by value, then alphabetically by node label, then by node id',
      row.rank,
      row.nodeId,
      row.label,
      row.role,
      row.metricValue ?? '',
      row.metricNotApplicable ?? '',
      row.linksLost,
      row.linkCount,
      row.nodeCount,
      row.directlyAffectedConsumers,
      row.foodDepletedConsumers,
      row.secondaryRemovals,
      row.cascadeDepth,
      row.removedPercentOfBaseline ?? '',
    ]),
  )
  return {
    filename: `${safeId(ranking.datasetId)}_ranking_${ranking.metric.key}.csv`,
    content: csv,
    mime: 'text/csv;charset=utf-8',
  }
}

/* -------------------------------------------------------------------------- */
/* Comparison export                                                          */
/* -------------------------------------------------------------------------- */

export function comparisonExportCsv(summaries: DatasetComparisonSummary[]): ExportArtifact {
  const rows: unknown[][] = []
  for (const summary of summaries) {
    for (const metric of summary.metrics) {
      rows.push([
        summary.datasetId,
        summary.datasetName,
        summary.ecosystemLabel,
        summary.sourceStatus,
        summary.nodeUnit,
        summary.citation,
        summary.baselineNodeCount,
        summary.baselineLinkCount,
        summary.baselineConnectance ?? '',
        summary.analysedNodeCount,
        metric.label,
        metric.unit,
        metric.min ?? '',
        metric.median ?? '',
        metric.max ?? '',
        metric.topNodeLabel ?? '',
        metric.definition,
        summary.dataNote,
      ])
    }
  }

  return {
    filename: 'foodwebguard_cross_network_comparison.csv',
    content: toCsv(
      [
        'dataset_id',
        'dataset_name',
        'ecosystem_category',
        'data_status',
        'node_unit',
        'citation',
        'baseline_nodes',
        'baseline_links',
        'baseline_connectance',
        'nodes_analysed',
        'metric',
        'unit',
        'min_across_scenarios',
        'median_across_scenarios',
        'max_across_scenarios',
        'node_with_max',
        'metric_definition',
        'data_note',
      ],
      rows,
    ),
    mime: 'text/csv;charset=utf-8',
  }
}

/** Dataset-level CSV including the per-category normalisation. */
export function comparisonSummaryCsv(summaries: DatasetComparisonSummary[]): ExportArtifact {
  return {
    filename: 'foodwebguard_dataset_summary.csv',
    content: toCsv(
      [
        'dataset_id',
        'dataset_name',
        'ecosystem_category',
        'data_status',
        'node_unit',
        'citation',
        'baseline_nodes',
        'baseline_links',
        'baseline_connectance',
        'links_per_node',
        'nodes_analysed',
      ],
      summaries.map((summary) => [
        summary.datasetId,
        summary.datasetName,
        summary.ecosystemLabel,
        summary.sourceStatus,
        summary.nodeUnit,
        summary.citation,
        summary.baselineNodeCount,
        summary.baselineLinkCount,
        summary.baselineConnectance ?? '',
        summary.baselineNodeCount > 0
          ? summary.baselineLinkCount / summary.baselineNodeCount
          : '',
        summary.analysedNodeCount,
      ]),
    ),
    mime: 'text/csv;charset=utf-8',
  }
}

export function groupingLabel(category: EcosystemCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

/* -------------------------------------------------------------------------- */
/* Browser download                                                           */
/* -------------------------------------------------------------------------- */

export function downloadArtifact(artifact: ExportArtifact): void {
  const blob = new Blob([artifact.content], { type: artifact.mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = artifact.filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Release the object URL on the next tick so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
