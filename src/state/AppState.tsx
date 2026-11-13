import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { buildGraph } from '../core/graphModel'
import { computeBaselineMetrics } from '../core/metrics'
import { runScenario, ScenarioInputError } from '../core/scenarios'
import {
  analyseAllSpecies,
  buildRanking,
  type SpeciesAnalysis,
} from '../core/rankingEngine'
import {
  compareAcrossDatasets,
  type CategoryComparison,
  type DatasetComparisonSummary,
} from '../core/comparisonEngine'
import {
  BUILT_IN_DATASETS,
  DEMO_LAB_DATASETS,
  loadImportedDatasets,
  loadLastAnalysis,
  saveImportedDatasets,
  saveLastAnalysis,
  type LastAnalysisSummary,
} from '../data/datasetRegistry'
import type {
  BaselineMetrics,
  FoodWebDataset,
  FoodWebGraph,
  RankingMetricKey,
  RankingResult,
  ScenarioMode,
  ScenarioResult,
} from '../core/types'

/* ============================================================================
 * AppState — one source of truth for graph data and every derived result.
 *
 * Boundaries kept explicitly separate so reset and dataset switching can clear
 * only what they should (Prompt §15.2):
 *   dataset selection · immutable baseline graph · selected node ·
 *   scenario mode · current scenario result · species analysis · ranking ·
 *   imported datasets · comparison selection · transient notices.
 * A simulation result is NEVER written back into the baseline dataset.
 * ========================================================================== */

export interface Notice {
  tone: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
}

export interface ComparisonResult {
  datasets: DatasetComparisonSummary[]
  categories: CategoryComparison[]
}

interface AppStateValue {
  datasets: FoodWebDataset[]
  demoDatasets: FoodWebDataset[]
  importedDatasets: FoodWebDataset[]
  dataset: FoodWebDataset | null
  graph: FoodWebGraph | null
  baseline: BaselineMetrics | null
  selectDataset: (id: string) => void
  addImportedDataset: (dataset: FoodWebDataset) => void
  removeImportedDataset: (id: string) => void

  selectedNodeId: string | null
  selectNode: (id: string | null) => void

  mode: ScenarioMode
  setMode: (mode: ScenarioMode) => void
  result: ScenarioResult | null
  runSelectedScenario: () => void
  resetScenario: () => void

  metricKey: RankingMetricKey
  setMetricKey: (key: RankingMetricKey) => void
  analysis: SpeciesAnalysis | null
  analysisRunning: boolean
  analysisProgress: { completed: number; total: number } | null
  runAnalyseAll: () => void
  cancelAnalyse: () => void
  ranking: RankingResult | null
  removeFromScenario: (nodeId: string) => void

  compareIds: string[]
  toggleCompare: (id: string) => void
  comparison: ComparisonResult | null
  comparisonRunning: boolean
  runComparison: () => void

  notice: Notice | null
  setNotice: (notice: Notice | null) => void

  lastAnalysis: LastAnalysisSummary | null
}

const AppStateContext = createContext<AppStateValue | null>(null)

const SELECTED_DATASET_STORAGE_KEY = 'fwg.selectedDatasetId'

/** Restores the last selected dataset id; non-fatal when storage is unavailable. */
function loadSelectedDatasetId(available: FoodWebDataset[]): string {
  const fallback = DEMO_LAB_DATASETS[0]?.id ?? ''
  try {
    const stored = window.localStorage.getItem(SELECTED_DATASET_STORAGE_KEY)
    if (stored && available.some((entry) => entry.id === stored)) return stored
  } catch {
    // Storage unavailable (private mode etc.) — fall back to the first demo.
  }
  return fallback
}

function saveSelectedDatasetId(id: string | undefined): void {
  try {
    if (id) window.localStorage.setItem(SELECTED_DATASET_STORAGE_KEY, id)
  } catch {
    // Non-fatal: selection persistence is a convenience, never a requirement.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [importedDatasets, setImportedDatasets] = useState<FoodWebDataset[]>(() =>
    loadImportedDatasets(),
  )
  const datasets = useMemo(
    () => [...BUILT_IN_DATASETS, ...importedDatasets],
    [importedDatasets],
  )

  const [datasetId, setDatasetId] = useState<string>(() =>
    loadSelectedDatasetId([...BUILT_IN_DATASETS, ...loadImportedDatasets()]),
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [mode, setModeState] = useState<ScenarioMode>('direct')
  const [result, setResult] = useState<ScenarioResult | null>(null)

  const [metricKey, setMetricKeyState] = useState<RankingMetricKey>('linkLossPercent')
  const [analysis, setAnalysis] = useState<SpeciesAnalysis | null>(null)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<{ completed: number; total: number } | null>(
    null,
  )

  const [compareIds, setCompareIds] = useState<string[]>([])
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [comparisonRunning, setComparisonRunning] = useState(false)

  const [notice, setNoticeState] = useState<Notice | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<LastAnalysisSummary | null>(() => loadLastAnalysis())

  const analysisAbort = useRef<AbortController | null>(null)

  const dataset = useMemo(
    () => datasets.find((entry) => entry.id === datasetId) ?? datasets[0] ?? null,
    [datasets, datasetId],
  )

  // Keep the last selection across refreshes; the resolved dataset (not the raw
  // id) is stored so a removed imported dataset can never be restored.
  useEffect(() => {
    saveSelectedDatasetId(dataset?.id)
  }, [dataset?.id])

  /**
   * The baseline graph model. Rebuilt only when the dataset identity changes,
   * and never mutated by a scenario.
   */
  const graph = useMemo(() => (dataset ? buildGraph(dataset) : null), [dataset])
  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  // Imported datasets are persisted in this browser only, and the storage
  // failure path is non-fatal (Prompt §15.3).
  useEffect(() => {
    saveImportedDatasets(importedDatasets)
  }, [importedDatasets])

  const clearScenarioState = useCallback(() => {
    setResult(null)
    setSelectedNodeId(null)
  }, [])

  const clearAnalysis = useCallback(() => {
    analysisAbort.current?.abort()
    analysisAbort.current = null
    setAnalysis(null)
    setAnalysisRunning(false)
    setAnalysisProgress(null)
  }, [])

  /** Switching datasets loads the new baseline and drops stale results. */
  const selectDataset = useCallback(
    (id: string) => {
      setDatasetId(id)
      clearScenarioState()
      clearAnalysis()
      setComparison(null)
      setNoticeState(null)
    },
    [clearAnalysis, clearScenarioState],
  )

  const addImportedDataset = useCallback(
    (incoming: FoodWebDataset) => {
      setImportedDatasets((current) => {
        const withoutSame = current.filter((entry) => entry.id !== incoming.id)
        return [...withoutSame, incoming]
      })
      setDatasetId(incoming.id)
      clearScenarioState()
      clearAnalysis()
    },
    [clearAnalysis, clearScenarioState],
  )

  const removeImportedDataset = useCallback(
    (id: string) => {
      setImportedDatasets((current) => current.filter((entry) => entry.id !== id))
      setCompareIds((current) => current.filter((entry) => entry !== id))
      setComparison(null)
      if (id === datasetId) {
        setDatasetId(DEMO_LAB_DATASETS[0]?.id ?? '')
        clearScenarioState()
        clearAnalysis()
      }
    },
    [clearAnalysis, clearScenarioState, datasetId],
  )

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id)
  }, [])

  const setMode = useCallback(
    (next: ScenarioMode) => {
      setModeState(next)
      // The previous result belongs to the other mode, so it is cleared rather
      // than displayed against the wrong calculation (Prompt §11 Case 23).
      setResult(null)
    },
    [],
  )

  const removeFromScenario = useCallback((nodeId: string) => {
    // Selecting a different species never inherits the previous scenario.
    setSelectedNodeId(nodeId)
    setResult(null)
  }, [])

  const runSelectedScenario = useCallback(() => {
    if (!graph || !dataset) {
      setNoticeState({
        tone: 'danger',
        title: 'No dataset loaded',
        message:
          'Load a demo network or import your own dataset before running a scenario. There is no network to analyse yet.',
      })
      return
    }
    if (!selectedNodeId) {
      setNoticeState({
        tone: 'warning',
        title: 'No species selected',
        message:
          'Select a species or trophic group in the network, or from the species list, before running a scenario.',
      })
      return
    }

    try {
      const next = runScenario(graph, dataset.name, selectedNodeId, mode)
      setResult(next)
      setNoticeState(null)

      const summary: LastAnalysisSummary = {
        datasetId: dataset.id,
        datasetName: dataset.name,
        mode: next.mode,
        primaryNodeLabel: next.primaryNodeLabel,
        linkLossPercent: next.scenario.linkLossPercent.value,
        secondaryRemovals: next.scenario.secondaryRemovals,
        at: next.computedAt,
      }
      setLastAnalysis(summary)
      saveLastAnalysis(summary)
    } catch (error) {
      const message =
        error instanceof ScenarioInputError
          ? error.message
          : 'The scenario could not be completed. The dataset and any previous result are unchanged.'
      setNoticeState({ tone: 'danger', title: 'Scenario not run', message })
    }
  }, [dataset, graph, mode, selectedNodeId])

  /** Reset restores the baseline network and clears scenario-specific state. */
  const resetScenario = useCallback(() => {
    setResult(null)
    setSelectedNodeId(null)
    setNoticeState({
      tone: 'info',
      title: 'Simulation reset',
      message:
        'The original node and link set has been restored, and scenario highlights, cascade rounds and result values have been cleared. Dataset metadata and the baseline graph are unchanged.',
    })
  }, [])

  const cancelAnalyse = useCallback(() => {
    analysisAbort.current?.abort()
    analysisAbort.current = null
    setAnalysisRunning(false)
    setAnalysisProgress(null)
    setNoticeState({
      tone: 'info',
      title: 'Analysis cancelled',
      message:
        'The full-species analysis was stopped. Any previously completed ranking results have been cleared so partial results are not mistaken for complete ones.',
    })
  }, [])

  const runAnalyseAll = useCallback(() => {
    if (!graph || !dataset) {
      setNoticeState({
        tone: 'danger',
        title: 'No dataset loaded',
        message: 'There is no loaded network to analyse.',
      })
      return
    }
    // Repeated rapid clicks must not launch overlapping jobs (Prompt §11 Case 15).
    if (analysisRunning) return

    const controller = new AbortController()
    analysisAbort.current = controller
    setAnalysisRunning(true)
    setAnalysis(null)
    setAnalysisProgress({ completed: 0, total: graph.nodes.length })

    void analyseAllSpecies(graph, dataset.name, {
      signal: controller.signal,
      onProgress: (completed, total) => setAnalysisProgress({ completed, total }),
    })
      .then((next) => {
        if (controller.signal.aborted) return
        setAnalysis(next)
        setAnalysisRunning(false)
        analysisAbort.current = null
        if (next.cancelled) return
      })
      .catch(() => {
        setAnalysisRunning(false)
        analysisAbort.current = null
        setNoticeState({
          tone: 'danger',
          title: 'Analysis failed',
          message:
            'The full-species analysis could not be completed. The current dataset and any existing result are unchanged.',
        })
      })
  }, [analysisRunning, dataset, graph])

  const setMetricKey = useCallback((key: RankingMetricKey) => {
    setMetricKeyState(key)
  }, [])

  const ranking = useMemo(() => {
    if (!analysis) return null
    return buildRanking(analysis, metricKey)
  }, [analysis, metricKey])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
    setComparison(null)
  }, [])

  const runComparison = useCallback(() => {
    const selected = datasets.filter((entry) => compareIds.includes(entry.id))
    if (selected.length < 2) {
      setNoticeState({
        tone: 'warning',
        title: 'Select at least two networks',
        message:
          'The comparison screen needs two or more networks. A comparison of one network tells you nothing about how networks differ.',
      })
      return
    }
    if (comparisonRunning) return
    setComparisonRunning(true)
    setComparison(null)

    void compareAcrossDatasets(selected)
      .then((next) => {
        setComparison(next)
        setComparisonRunning(false)
      })
      .catch(() => {
        setComparisonRunning(false)
        setNoticeState({
          tone: 'danger',
          title: 'Comparison failed',
          message: 'The cross-network comparison could not be completed. No results were changed.',
        })
      })
  }, [compareIds, comparisonRunning, datasets])

  const value = useMemo<AppStateValue>(
    () => ({
      datasets,
      demoDatasets: DEMO_LAB_DATASETS,
      importedDatasets,
      dataset,
      graph,
      baseline,
      selectDataset,
      addImportedDataset,
      removeImportedDataset,
      selectedNodeId,
      selectNode,
      mode,
      setMode,
      result,
      runSelectedScenario,
      resetScenario,
      metricKey,
      setMetricKey,
      analysis,
      analysisRunning,
      analysisProgress,
      runAnalyseAll,
      cancelAnalyse,
      ranking,
      removeFromScenario,
      compareIds,
      toggleCompare,
      comparison,
      comparisonRunning,
      runComparison,
      notice,
      setNotice: setNoticeState,
      lastAnalysis,
    }),
    [
      addImportedDataset,
      analysis,
      analysisProgress,
      analysisRunning,
      baseline,
      cancelAnalyse,
      compareIds,
      comparison,
      comparisonRunning,
      dataset,
      datasets,
      graph,
      importedDatasets,
      lastAnalysis,
      metricKey,
      mode,
      notice,
      ranking,
      removeFromScenario,
      removeImportedDataset,
      resetScenario,
      result,
      runAnalyseAll,
      runComparison,
      runSelectedScenario,
      selectDataset,
      selectNode,
      selectedNodeId,
      setMetricKey,
      setMode,
      toggleCompare,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}
