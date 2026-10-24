import { buildGraph } from './graphModel'
import { analyseAllSpecies, RANKING_METRICS, type AnalyseOptions } from './rankingEngine'
import { ECOSYSTEM_LABEL, type EcosystemCategory, type FoodWebDataset } from './types'

/* ============================================================================
 * comparisonEngine — cross-network summaries (Prompt §13).
 *
 * With two networks per ecosystem category, category-level figures are
 * exploratory. The engine therefore reports distributions (min, median, max)
 * alongside the raw per-network values, and every consumer of these numbers is
 * expected to keep the limitation visible.
 * ========================================================================== */

export const COMPARISON_LIMITATION =
  'A six-network study with two networks per ecosystem category is an exploratory comparison, not sufficient evidence that one ecosystem type is always more vulnerable. Category figures are ranges and medians across the supplied networks only.'

export interface MetricSummary {
  key: string
  label: string
  unit: 'percent' | 'count'
  /** Null when the metric is not applicable for every analysed node. */
  max: number | null
  min: number | null
  median: number | null
  mean: number | null
  defined: boolean
  topNodeLabel: string | null
  topNodeId: string | null
  definition: string
}

export interface DatasetComparisonSummary {
  datasetId: string
  datasetName: string
  ecosystem: EcosystemCategory
  ecosystemLabel: string
  sourceStatus: string
  isDemo: boolean
  nodeUnit: string
  citation: string
  origin: string
  sourceUrl: string | null
  license: string | null
  baselineNodeCount: number
  baselineLinkCount: number
  baselineConnectance: number | null
  analysedNodeCount: number
  metrics: MetricSummary[]
  dataNote: string
}

export interface CategoryMetricRow {
  key: string
  label: string
  unit: 'percent' | 'count'
  values: { datasetId: string; datasetName: string; value: number | null }[]
  median: number | null
  min: number | null
  max: number | null
  definedCount: number
}

export interface CategoryComparison {
  ecosystem: EcosystemCategory
  label: string
  datasetCount: number
  usableCount: number
  links: { datasetName: string; value: number }[]
  metrics: CategoryMetricRow[]
}

export function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function mean(values: number[]): number | null {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** One dataset's metric-wise scenario summary, computed from real scenarios. */
export async function summariseDatasetForComparison(
  dataset: FoodWebDataset,
  options: AnalyseOptions = {},
): Promise<DatasetComparisonSummary> {
  const graph = buildGraph(dataset)
  const analysis = await analyseAllSpecies(graph, dataset.name, options)

  const metrics: MetricSummary[] = RANKING_METRICS.map((definition) => {
    const entries: { value: number; label: string; nodeId: string }[] = []

    for (const nodeId of analysis.nodeOrder) {
      const scenario = analysis.scenarios.get(nodeId)
      if (!scenario) continue
      let value: number | null = null
      switch (definition.key) {
        case 'linkLossPercent':
          value = scenario.direct.scenario.linkLossPercent.value
          break
        case 'directlyAffectedConsumers':
          value = scenario.direct.scenario.directlyAffectedConsumerIds.length
          break
        case 'secondaryRemovals':
          value = scenario.cascade.scenario.secondaryRemovals
          break
        case 'cascadeRemovedPercent':
          value = scenario.cascade.scenario.secondaryPercentOfBaseline.value
          break
        case 'cascadeDepth':
          value = scenario.cascade.scenario.cascadeDepth
          break
        default:
          value = null
      }
      if (value !== null) entries.push({ value, label: scenario.label, nodeId })
    }

    // Deterministic "top" pick: highest value, then label, then id.
    const top = [...entries].sort(
      (a, b) =>
        b.value - a.value ||
        a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }) ||
        a.nodeId.localeCompare(b.nodeId),
    )[0]

    const values = entries.map((entry) => entry.value)
    return {
      key: definition.key,
      label: definition.label,
      unit: definition.unit,
      max: values.length ? Math.max(...values) : null,
      min: values.length ? Math.min(...values) : null,
      median: median(values),
      mean: mean(values),
      defined: values.length > 0,
      topNodeLabel: top?.label ?? null,
      topNodeId: top?.nodeId ?? null,
      definition: definition.definition,
    }
  })

  const connectance = analysis.baseline.connectance.value
  return {
    datasetId: dataset.id,
    datasetName: dataset.name,
    ecosystem: dataset.ecosystem,
    ecosystemLabel: ECOSYSTEM_LABEL[dataset.ecosystem],
    sourceStatus: dataset.provenance.validationStatus,
    isDemo: dataset.isDemo,
    nodeUnit: dataset.provenance.nodeUnit,
    citation: dataset.provenance.citation,
    origin: dataset.provenance.origin,
    sourceUrl: dataset.provenance.sourceUrl ?? null,
    license: dataset.provenance.license ?? null,
    baselineNodeCount: analysis.baseline.nodeCount,
    baselineLinkCount: analysis.baseline.linkCount,
    baselineConnectance: connectance,
    analysedNodeCount: analysis.scenarios.size,
    metrics,
    dataNote: dataset.isDemo
      ? 'Illustrative demo data — simplified for software demonstration; not a verified empirical food-web dataset.'
      : 'Imported dataset. Verify the source and validation status before treating these values as research results.',
  }
}

/** Compare two or more loaded networks, plus exploratory category ranges. */
export async function compareAcrossDatasets(
  datasets: FoodWebDataset[],
  options: AnalyseOptions = {},
): Promise<{ datasets: DatasetComparisonSummary[]; categories: CategoryComparison[] }> {
  const summaries: DatasetComparisonSummary[] = []
  for (const dataset of datasets) {
    summaries.push(await summariseDatasetForComparison(dataset, options))
  }

  const categories: CategoryComparison[] = (
    ['freshwater', 'terrestrial', 'marine'] as EcosystemCategory[]
  ).map((ecosystem) => {
    const group = summaries.filter((summary) => summary.ecosystem === ecosystem)
    const metricRows: CategoryMetricRow[] = RANKING_METRICS.map((definition) => {
      const values = group.map((summary) => {
        const metric = summary.metrics.find((entry) => entry.key === definition.key)
        return {
          datasetId: summary.datasetId,
          datasetName: summary.datasetName,
          value: metric?.max ?? null,
        }
      })
      const defined = values
        .map((entry) => entry.value)
        .filter((value): value is number => value !== null)
      return {
        key: definition.key,
        label: definition.label,
        unit: definition.unit,
        values,
        median: median(defined),
        min: defined.length ? Math.min(...defined) : null,
        max: defined.length ? Math.max(...defined) : null,
        definedCount: defined.length,
      }
    })

    return {
      ecosystem,
      label: ECOSYSTEM_LABEL[ecosystem],
      datasetCount: group.length,
      usableCount: group.filter((summary) => summary.baselineNodeCount > 0).length,
      links: group.map((summary) => ({
        datasetName: summary.datasetName,
        value: summary.baselineConnectance ?? 0,
      })),
      metrics: metricRows,
    }
  })

  return { datasets: summaries, categories }
}
