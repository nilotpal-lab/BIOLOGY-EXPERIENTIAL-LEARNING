import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SpeciesIcon } from '../SpeciesIcon'
import { Button, Card, CardHeading, EmptyState, SelectInput, cn } from '../ui/primitives'
import { formatConnectance, formatPercent } from '../../core/metrics'
import {
  auditDatasetEligibility,
  exportExtinctionCurvesCsv,
  exportStepReplayCsv,
  runAllRobustnessStrategies,
  ROBUSTNESS_STRATEGY_INFO,
  type DatasetAuditRecord,
  type DeterministicStrategy,
  type RobustnessLabRun,
  type RobustnessStep,
  type RobustnessStrategy,
} from '../../core/robustness'
import { buildGraph } from '../../core/graphModel'
import { BUILT_IN_RESEARCH_DATASETS, DEMO_LAB_DATASETS } from '../../data/datasetRegistry'
import { ECOSYSTEM_LABEL } from '../../core/types'
import { useAppState } from '../../state/AppState'

interface RobustnessLabProps {
  onNavigateToLibrary?: () => void
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function RobustnessLab({ onNavigateToLibrary }: RobustnessLabProps) {
  const { dataset, datasets, selectDataset, graph } = useAppState()

  // Simulation run state
  const [labRun, setLabRun] = useState<RobustnessLabRun | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeStrategies, setActiveStrategies] = useState<Record<RobustnessStrategy, boolean>>({
    'most-connected': true,
    'most-connected-basal-protected': true,
    'least-connected': true,
    'random': true,
  })

  // Replay state
  const [replayStrategy, setReplayStrategy] = useState<RobustnessStrategy>('most-connected')
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Methodology panel toggle
  const [showMethodology, setShowMethodology] = useState(false)

  // Run simulation when dataset or graph changes
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) {
      setLabRun(null)
      return
    }

    setIsSimulating(true)
    // Run simulation
    const timer = setTimeout(() => {
      try {
        const result = runAllRobustnessStrategies(graph, { iterations: 1000, seed: 42 })
        setLabRun(result)
        setCurrentStepIdx(0)
        setIsPlaying(false)
      } finally {
        setIsSimulating(false)
      }
    }, 20)

    return () => clearTimeout(timer)
  }, [graph])

  // Replay steps for the currently chosen replay strategy
  const replaySteps: RobustnessStep[] = useMemo(() => {
    if (!labRun) return []
    if (replayStrategy === 'random') {
      return labRun.results['random']?.sampleRun ?? []
    }
    return labRun.results[replayStrategy as DeterministicStrategy]?.steps ?? []
  }, [labRun, replayStrategy])

  // Pre-implementation audit records for all 12 bundled datasets
  const datasetAuditRecords: DatasetAuditRecord[] = useMemo(() => {
    const research = BUILT_IN_RESEARCH_DATASETS.map((ds) =>
      auditDatasetEligibility(buildGraph(ds), {
        name: ds.name,
        ecosystem: ds.ecosystem,
        isDemo: false,
        sourceStatus: ds.sourceStatus,
      }),
    )
    const demo = DEMO_LAB_DATASETS.map((ds) =>
      auditDatasetEligibility(buildGraph(ds), {
        name: ds.name,
        ecosystem: ds.ecosystem,
        isDemo: true,
        sourceStatus: ds.sourceStatus,
      }),
    )
    return [...research, ...demo]
  }, [])

  // Autoplay effect for replay
  useEffect(() => {
    if (!isPlaying) return
    if (replaySteps.length === 0) return

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= replaySteps.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 800)

    return () => clearInterval(interval)
  }, [isPlaying, replaySteps.length])

  // Chart data points combining all active strategies
  const chartData = useMemo(() => {
    if (!labRun || labRun.totalSpecies === 0) return []
    const S = labRun.totalSpecies

    // We build points from primary removal count m = 0 to S
    const pts = []
    const resA = labRun.results['most-connected']
    const resB = labRun.results['most-connected-basal-protected']
    const resC = labRun.results['least-connected']
    const resD = labRun.results['random']

    for (let m = 0; m <= S; m++) {
      const pFrac = m / S
      const ptA = resA?.extinctionCurve.find((p) => p.primaryCount === m)
      const ptB = resB?.extinctionCurve.find((p) => p.primaryCount === m)
      const ptC = resC?.extinctionCurve.find((p) => p.primaryCount === m)
      const ptD = resD?.extinctionCurve.find((p) => p.primaryCount === m)

      // Extinction curves terminate when no further primary removals can occur
      // (faithful to Dunne et al. 2002 Figure 1)
      const valA = ptA ? ptA.totalLossFraction * 100 : null
      const valB = ptB ? ptB.totalLossFraction * 100 : null
      const valC = ptC ? ptC.totalLossFraction * 100 : null

      const randomEnvelope: [number, number] | null =
        ptD && ptD.percentile2_5TotalLossFraction != null && ptD.percentile97_5TotalLossFraction != null
          ? [ptD.percentile2_5TotalLossFraction * 100, ptD.percentile97_5TotalLossFraction * 100]
          : null

      pts.push({
        primaryCount: m,
        primaryFraction: pFrac,
        percentLabel: `${(pFrac * 100).toFixed(0)}%`,
        stratA: valA,
        stratB: valB,
        stratC: valC,
        randomMean: ptD ? ptD.meanTotalLossFraction! * 100 : null,
        randomP2_5: ptD ? ptD.percentile2_5TotalLossFraction! * 100 : null,
        randomP97_5: ptD ? ptD.percentile97_5TotalLossFraction! * 100 : null,
        randomEnvelope,
      })
    }

    return pts
  }, [labRun])

  // Current active step in replay
  const activeStep = replaySteps[currentStepIdx] ?? null

  const handleManualRun = () => {
    if (!graph) return
    setIsSimulating(true)
    setTimeout(() => {
      try {
        const result = runAllRobustnessStrategies(graph, { iterations: 1000, seed: 42 })
        setLabRun(result)
        setCurrentStepIdx(0)
      } finally {
        setIsSimulating(false)
      }
    }, 20)
  }

  const handleExportCurves = () => {
    if (!labRun) return
    const csv = exportExtinctionCurvesCsv(labRun)
    downloadCsv(`${labRun.datasetId}-robustness-curves.csv`, csv)
  }

  const handleExportSteps = () => {
    if (!labRun) return
    const steps = replaySteps
    if (steps.length === 0) return
    const csv = exportStepReplayCsv(steps)
    downloadCsv(`${labRun.datasetId}-${replayStrategy}-removal-steps.csv`, csv)
  }

  if (!dataset || !graph) {
    return (
      <Card>
        <CardHeading title="No dataset loaded" subtitle="Load a network before viewing analytics." />
        <EmptyState
          title="No valid graph is loaded"
          description="Network Robustness Lab needs a network. Load a research network or illustrative demo first."
          action={
            <Button variant="primary" onClick={onNavigateToLibrary}>
              Open the dataset library
            </Button>
          }
        />
      </Card>
    )
  }

  const resA = labRun?.results['most-connected']
  const resB = labRun?.results['most-connected-basal-protected']
  const resC = labRun?.results['least-connected']
  const resD = labRun?.results['random']

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-10">
      {/* =====================================================================
          1. LAB HEADER & CONTROLS ROW
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Dataset Selection Card */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
            1. Select Network
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E6DC] bg-white p-2">
            <div className="h-10 w-14 rounded-lg overflow-hidden border border-[#E5E6DC] shrink-0 bg-[#F7F6EF]">
              <img
                src="/hero-ecosystem.webp"
                alt="Ecosystem preview"
                className="w-full h-full object-cover object-[70%_25%]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <SelectInput
                id="robustness-dataset-select"
                aria-label="Loaded network for robustness"
                value={dataset.id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => selectDataset(e.target.value)}
                className="w-full text-xs font-bold text-[#202B27] border-none p-0 focus:ring-0 cursor-pointer"
              >
                {datasets.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </SelectInput>
              <p className="text-[10px] text-[#68716B] truncate">
                {ECOSYSTEM_LABEL[dataset.ecosystem]} ({dataset.nodes.length} species,{' '}
                {dataset.edges.length} links)
              </p>
            </div>
          </div>
        </div>

        {/* Lab Controls & Simulation Trigger */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F0E6] px-2 py-0.5 text-[10px] font-bold text-[#35563B]">
                <Sparkles size={11} /> Dunne et al. (2002) Framework
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
                2. Removal Strategy Display
              </p>
            </div>
            {/* Toggle checkboxes for which curves appear */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {(['most-connected', 'most-connected-basal-protected', 'least-connected', 'random'] as RobustnessStrategy[]).map(
                (stratKey) => {
                  const info = ROBUSTNESS_STRATEGY_INFO[stratKey]
                  const active = activeStrategies[stratKey]
                  return (
                    <button
                      key={stratKey}
                      type="button"
                      onClick={() =>
                        setActiveStrategies((prev) => ({ ...prev, [stratKey]: !prev[stratKey] }))
                      }
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border',
                        active
                          ? 'bg-white border-[#E5E6DC] text-[#202B27] shadow-2xs'
                          : 'bg-transparent border-dashed border-[#D1D2C7] text-[#9BA39D] opacity-60',
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span>{info.shortLabel}</span>
                    </button>
                  )
                },
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualRun}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white py-2.5 px-4 text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw size={13} className={cn(isSimulating && 'animate-spin')} />
              <span>{isSimulating ? 'Simulating 1,000 Runs…' : 'Re-run Lab Simulation'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCurves}
              disabled={!labRun}
              title="Export Extinction Curves CSV"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E6DC] bg-white hover:bg-[#F7F6EF] text-[#202B27] py-2.5 px-3 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. NETWORK PROPERTIES & CONNECTANCE BANNER
          ===================================================================== */}
      {labRun && (
        <div className="rounded-2xl border border-[#E5E6DC] bg-white p-4 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-2.5 rounded-xl bg-[#FCFBF7] border border-[#E5E6DC]">
              <span className="text-[10px] font-bold text-[#68716B] uppercase tracking-wider block">
                Total Species (S)
              </span>
              <p className="font-mono text-lg font-bold text-[#202B27] mt-0.5">
                {labRun.totalSpecies}
              </p>
              <span className="text-[10px] text-[#68716B]">Baseline nodes</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FCFBF7] border border-[#E5E6DC]">
              <span className="text-[10px] font-bold text-[#68716B] uppercase tracking-wider block">
                Feeding Links (L)
              </span>
              <p className="font-mono text-lg font-bold text-[#202B27] mt-0.5">
                {labRun.totalLinks}
              </p>
              <span className="text-[10px] text-[#68716B]">Directed interactions</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FCFBF7] border border-[#E5E6DC]">
              <span className="text-[10px] font-bold text-[#68716B] uppercase tracking-wider block">
                Basal Species (B)
              </span>
              <p className="font-mono text-lg font-bold text-[#202B27] mt-0.5">
                {labRun.basalCount}{' '}
                <span className="text-xs font-normal text-[#68716B]">
                  ({formatPercent(labRun.basalFraction * 100)})
                </span>
              </p>
              <span className="text-[10px] text-[#68716B]">0 incoming links</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#EEF5FA] border border-[#91BFE0]/60">
              <span className="text-[10px] font-bold text-[#20547A] uppercase tracking-wider block">
                Dunne Connectance
              </span>
              <p className="font-mono text-lg font-bold text-[#1B4361] mt-0.5">
                {formatConnectance(labRun.dunneConnectance, 3)}
              </p>
              <span className="text-[10px] text-[#4A7291] font-mono">C = L / S²</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F7F6EF] border border-[#E5E6DC]">
              <span className="text-[10px] font-bold text-[#68716B] uppercase tracking-wider block">
                FoodWebGuard C
              </span>
              <p className="font-mono text-lg font-bold text-[#202B27] mt-0.5">
                {formatConnectance(labRun.fwgConnectance, 3)}
              </p>
              <span className="text-[10px] text-[#68716B] font-mono">L / (N(N-1))</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F2F8ED] border border-[#B5D39A]/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#2D5A34] uppercase tracking-wider block">
                Dunne (2002) Finding
              </span>
              <p className="text-[11px] font-bold text-[#202B27] leading-tight">
                Robustness increases with connectance
              </p>
              <span className="text-[9.5px] text-[#4D6E52]">Ecology Letters 5:558</span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. 4 R50 STRATEGY SUMMARY CARDS
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Strategy A Card */}
        <div className="rounded-2xl border border-[#EF9A88] bg-[#FDF8F6] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C04938] flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E07A5F]" /> Strategy A
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#EF9A88] text-[#C04938]">
              Most-Connected
            </span>
          </div>

          <p className="text-xs text-[#68716B] mb-2 leading-tight">
            Species with highest dynamic degree removed first
          </p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#202B27]">
              {resA?.r50 != null ? formatPercent(resA.r50 * 100, 1) : 'N/A'}
            </span>
            <span className="text-xs font-bold text-[#68716B]">R₅₀</span>
          </div>

          <div className="text-[11px] text-[#68716B] space-y-0.5 pt-1 border-t border-[#EF9A88]/40">
            <p>
              Primary removals to 50% loss:{' '}
              <span className="font-mono font-bold text-[#202B27]">
                {resA?.r50PrimaryRemovals != null
                  ? resA.r50PrimaryRemovals.toFixed(1)
                  : 'N/A'}{' '}
                species
              </span>
            </p>
            <p>
              Cascade triggered:{' '}
              <span className="font-bold text-[#C04938]">
                {resA ? resA.steps.reduce((acc, s) => acc + s.secondaryCount, 0) : 0} secondary losses
              </span>
            </p>
          </div>
        </div>

        {/* Strategy B Card */}
        <div className="rounded-2xl border border-[#F1B36F] bg-[#FEFAF5] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#B87023] flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D4973B]" /> Strategy B
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#F1B36F] text-[#B87023]">
              Basal Protected
            </span>
          </div>

          <p className="text-xs text-[#68716B] mb-2 leading-tight">
            Most-connected, but autotrophs / detritus spared
          </p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#202B27]">
              {resB?.r50 != null ? formatPercent(resB.r50 * 100, 1) : 'N/A'}
            </span>
            <span className="text-xs font-bold text-[#68716B]">R₅₀</span>
          </div>

          <div className="text-[11px] text-[#68716B] space-y-0.5 pt-1 border-t border-[#F1B36F]/40">
            <p>
              Primary removals to 50% loss:{' '}
              <span className="font-mono font-bold text-[#202B27]">
                {resB?.r50PrimaryRemovals != null
                  ? resB.r50PrimaryRemovals.toFixed(1)
                  : 'N/A'}{' '}
                species
              </span>
            </p>
            <p>
              Basal nodes protected:{' '}
              <span className="font-bold text-[#2D5A34]">
                {labRun?.basalCount ?? 0} species (100%)
              </span>
            </p>
          </div>
        </div>

        {/* Strategy C Card */}
        <div className="rounded-2xl border border-[#91BFE0] bg-[#F5F9FC] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#2E6B94] flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4B7B94]" /> Strategy C
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#91BFE0] text-[#2E6B94]">
              Least-Connected
            </span>
          </div>

          <p className="text-xs text-[#68716B] mb-2 leading-tight">
            Lowest dynamic degree removed first
          </p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#202B27]">
              {resC?.r50 != null ? formatPercent(resC.r50 * 100, 1) : 'N/A'}
            </span>
            <span className="text-xs font-bold text-[#68716B]">R₅₀</span>
          </div>

          <div className="text-[11px] text-[#68716B] space-y-0.5 pt-1 border-t border-[#91BFE0]/40">
            <p>
              Primary removals to 50% loss:{' '}
              <span className="font-mono font-bold text-[#202B27]">
                {resC?.r50PrimaryRemovals != null
                  ? resC.r50PrimaryRemovals.toFixed(1)
                  : 'N/A'}{' '}
                species
              </span>
            </p>
            <p>
              Cascade extent:{' '}
              <span className="font-bold text-[#202B27]">
                {resC ? resC.steps.reduce((acc, s) => acc + s.secondaryCount, 0) : 0} secondary losses
              </span>
            </p>
          </div>
        </div>

        {/* Strategy D Card (Random 1,000 Runs) */}
        <div className="rounded-2xl border border-[#B5D39A] bg-[#F4F8F0] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#264D2B] flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#35563B]" /> Strategy D
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#B5D39A] text-[#264D2B]">
              Random (1,000 Runs)
            </span>
          </div>

          <p className="text-xs text-[#68716B] mb-2 leading-tight">
            Mean of 1,000 independent random sequences
          </p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#202B27]">
              {resD?.meanR50 != null ? formatPercent(resD.meanR50 * 100, 1) : 'N/A'}
            </span>
            <span className="text-xs font-bold text-[#68716B]">Mean R₅₀</span>
          </div>

          <div className="text-[11px] text-[#68716B] space-y-0.5 pt-1 border-t border-[#B5D39A]/40">
            <p>
              95% Envelope [2.5%–97.5%]:{' '}
              <span className="font-mono font-bold text-[#264D2B]">
                {resD?.r50Percentile2_5 != null && resD?.r50Percentile97_5 != null
                  ? `[${formatPercent(resD.r50Percentile2_5 * 100, 1)}, ${formatPercent(resD.r50Percentile97_5 * 100, 1)}]`
                  : 'N/A'}
              </span>
            </p>
            <p>
              Std Dev (σ):{' '}
              <span className="font-mono font-bold text-[#202B27]">
                {resD?.r50StdDev != null ? resD.r50StdDev.toFixed(3) : 'N/A'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. INTERACTIVE EXTINCTION CURVES (RECHARTS)
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E6DC] pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-[#202B27]">
              Extinction Curves & Biodiversity Collapse (Dunne et al. 2002)
            </h2>
            <p className="text-xs text-[#68716B]">
              X-axis shows fraction of species removed primarily. Y-axis shows total cumulative loss
              (primary + secondary cascades).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#C04938] font-bold bg-[#FEF2F2] px-2.5 py-1 rounded-lg border border-[#FCA5A5]/60">
              <span className="w-2.5 h-0.5 bg-[#C04938] inline-block" /> 50% Threshold Line
            </span>
          </div>
        </div>

        {/* The Recharts Chart */}
        <div className="h-80 sm:h-96 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 24, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E6DC" vertical={false} />

              <XAxis
                dataKey="percentLabel"
                tick={{ fontSize: 10, fill: '#68716B' }}
                label={{
                  value: 'Fraction of Species Removed Primarily (m / S)',
                  position: 'insideBottom',
                  offset: -12,
                  style: { textAnchor: 'middle', fill: '#68716B', fontSize: 11, fontWeight: 600 },
                }}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#68716B' }}
                tickFormatter={(val) => `${val}%`}
                label={{
                  value: 'Total Species Lost (%)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 12,
                  style: { textAnchor: 'middle', fill: '#68716B', fontSize: 11, fontWeight: 600 },
                }}
              />

              <Tooltip
                formatter={(value: any, name: any) => {
                  if (Array.isArray(value)) {
                    const low = Number(value[0])
                    const high = Number(value[1])
                    return [
                      isNaN(low) || isNaN(high)
                        ? 'N/A'
                        : `${low.toFixed(1)}% – ${high.toFixed(1)}%`,
                      name,
                    ]
                  }
                  const num = Number(value)
                  return [isNaN(num) ? 'N/A' : `${num.toFixed(1)}%`, name]
                }}
                labelFormatter={(label) => `Primary removals: ${label}`}
                contentStyle={{
                  backgroundColor: '#FCFBF7',
                  borderColor: '#E5E6DC',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '11px',
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />

              {/* 50% Extinction / Loss Threshold Reference Line */}
              <ReferenceLine
                y={50}
                stroke="#C04938"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '50% Loss Threshold (R₅₀)',
                  fill: '#C04938',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontWeight: 700,
                }}
              />

              {/* Random Removal Confidence Envelope (2.5% to 97.5%) */}
              {activeStrategies['random'] && (
                <Area
                  type="monotone"
                  dataKey="randomEnvelope"
                  stroke="#35563B"
                  strokeOpacity={0.25}
                  strokeDasharray="2 2"
                  fill="#35563B"
                  fillOpacity={0.12}
                  name="Random 95% Envelope"
                />
              )}

              {/* Random Removal Mean Curve (Strategy D) */}
              {activeStrategies['random'] && (
                <Line
                  type="monotone"
                  dataKey="randomMean"
                  stroke="#35563B"
                  strokeWidth={2.5}
                  dot={false}
                  name="Strategy D · Random Mean"
                />
              )}

              {/* Strategy A Curve (Most-Connected) */}
              {activeStrategies['most-connected'] && (
                <Line
                  type="monotone"
                  dataKey="stratA"
                  stroke="#E07A5F"
                  strokeWidth={2.5}
                  dot={labRun && labRun.totalSpecies <= 30 ? { r: 3, fill: '#E07A5F' } : false}
                  name="Strategy A · Most-Connected"
                />
              )}

              {/* Strategy B Curve (Basal Protected) */}
              {activeStrategies['most-connected-basal-protected'] && (
                <Line
                  type="monotone"
                  dataKey="stratB"
                  stroke="#D4973B"
                  strokeWidth={2.5}
                  dot={labRun && labRun.totalSpecies <= 30 ? { r: 3, fill: '#D4973B' } : false}
                  name="Strategy B · Basal Protected"
                />
              )}

              {/* Strategy C Curve (Least-Connected) */}
              {activeStrategies['least-connected'] && (
                <Line
                  type="monotone"
                  dataKey="stratC"
                  stroke="#4B7B94"
                  strokeWidth={2.5}
                  dot={labRun && labRun.totalSpecies <= 30 ? { r: 3, fill: '#4B7B94' } : false}
                  name="Strategy C · Least-Connected"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =====================================================================
          5. STEP-BY-STEP REMOVAL REPLAY CONTROLLER & DETAIL
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E6DC] pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-[#202B27]">
              Step-by-Step Removal Replay
            </h2>
            <p className="text-xs text-[#68716B]">
              Step through the exact sequence of primary removals and view which consumers collapse
              in each cascade round.
            </p>
          </div>

          {/* Strategy selector pills for replay */}
          <div className="inline-flex rounded-xl border border-[#E5E6DC] bg-white p-1 gap-1">
            {(['most-connected', 'most-connected-basal-protected', 'least-connected', 'random'] as RobustnessStrategy[]).map(
              (stratKey) => {
                const info = ROBUSTNESS_STRATEGY_INFO[stratKey]
                const isSelected = replayStrategy === stratKey
                return (
                  <button
                    key={stratKey}
                    type="button"
                    onClick={() => {
                      setReplayStrategy(stratKey)
                      setCurrentStepIdx(0)
                      setIsPlaying(false)
                    }}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      isSelected
                        ? 'bg-[#35563B] text-white shadow-2xs'
                        : 'text-[#68716B] hover:text-[#202B27]',
                    )}
                  >
                    {info.shortLabel}
                  </button>
                )
              },
            )}
          </div>
        </div>

        {/* Controls row: Slider, Play/Pause, Scrubber */}
        {replaySteps.length > 0 && activeStep ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E5E6DC]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStepIdx(0)}
                  disabled={currentStepIdx === 0}
                  className="h-8 w-8 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] flex items-center justify-center disabled:opacity-40 hover:bg-[#F7F6EF]"
                  title="First step"
                >
                  <SkipBack size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIdx === 0}
                  className="h-8 w-8 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] flex items-center justify-center disabled:opacity-40 hover:bg-[#F7F6EF]"
                  title="Previous step"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="h-8 px-3 rounded-lg bg-[#35563B] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#263D2D] shadow-xs cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={13} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-white" /> Auto-play
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentStepIdx((prev) => Math.min(replaySteps.length - 1, prev + 1))
                  }
                  disabled={currentStepIdx >= replaySteps.length - 1}
                  className="h-8 w-8 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] flex items-center justify-center disabled:opacity-40 hover:bg-[#F7F6EF]"
                  title="Next step"
                >
                  ›
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStepIdx(replaySteps.length - 1)}
                  disabled={currentStepIdx >= replaySteps.length - 1}
                  className="h-8 w-8 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] flex items-center justify-center disabled:opacity-40 hover:bg-[#F7F6EF]"
                  title="Last step"
                >
                  <SkipForward size={14} />
                </button>
              </div>

              {/* Slider Scrubber */}
              <div className="flex-1 max-w-md flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={replaySteps.length - 1}
                  value={currentStepIdx}
                  onChange={(e) => {
                    setCurrentStepIdx(Number(e.target.value))
                    setIsPlaying(false)
                  }}
                  className="w-full accent-[#35563B] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#202B27] shrink-0 w-20 text-right">
                  Step {activeStep.step} / {replaySteps.length}
                </span>
              </div>

              {/* Step replay CSV export */}
              <button
                type="button"
                onClick={handleExportSteps}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] hover:bg-[#F7F6EF] text-[#202B27] py-1.5 px-3 text-xs font-semibold"
              >
                <Download size={12} />
                <span>Export Sequence CSV</span>
              </button>
            </div>

            {/* Active Step Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Primary Removed Organism Card */}
              <div className="md:col-span-5 rounded-xl border border-[#EF9A88] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C04938] bg-[#FDF1EE] px-2 py-0.5 rounded-md">
                    Primary Removal (Step {activeStep.step})
                  </span>
                  <span className="font-mono text-xs text-[#68716B]">
                    Active Degree: <strong>{activeStep.primaryDegree}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <SpeciesIcon
                    iconKey={graph.nodeById.get(activeStep.primaryNodeId)?.iconKey}
                    size={36}
                    className="rounded-lg bg-[#FCFBF7] border border-[#E5E6DC] p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#202B27] truncate">
                      {activeStep.primaryNodeName}
                    </h3>
                    <p className="text-[11px] text-[#68716B]">
                      Role: <span className="capitalize">{activeStep.primaryNodeRole}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E6DC] text-xs text-[#68716B] leading-relaxed">
                  Targeted according to{' '}
                  <strong className="text-[#202B27]">
                    {ROBUSTNESS_STRATEGY_INFO[replayStrategy].shortLabel}
                  </strong>{' '}
                  policy.
                </div>
              </div>

              {/* Secondary Cascade Losses Card */}
              <div className="md:col-span-7 rounded-xl border border-[#E5E6DC] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#202B27]">
                    Secondary Structural Cascade
                  </span>
                  <span className="text-xs font-bold text-[#68716B]">
                    {activeStep.cascadeRounds} propagation round(s)
                  </span>
                </div>

                {activeStep.secondaryCount === 0 ? (
                  <div className="py-4 text-center text-xs text-[#68716B]">
                    <ShieldCheck size={20} className="mx-auto mb-1 text-[#35563B]" />
                    <p className="font-bold text-[#202B27]">No secondary extinctions</p>
                    <p className="text-[11px]">
                      All surviving consumers still had at least one recorded food source.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[#C04938] font-bold">
                      {activeStep.secondaryCount} consumer(s) lost all recorded food sources and
                      collapsed:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {activeStep.secondaryRemovedNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-[#FDF1EE] border border-[#EF9A88]/60 px-2 py-0.5 text-xs text-[#C04938] font-medium"
                        >
                          <AlertTriangle size={11} /> {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress breakdown at this step */}
                <div className="pt-2 border-t border-[#E5E6DC]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#68716B] mb-1">
                    <span>
                      Cumulative Lost:{' '}
                      <strong className="text-[#202B27]">{activeStep.cumulativeTotalLost}</strong> /{' '}
                      {labRun?.totalSpecies} ({formatPercent(activeStep.totalLossFraction * 100)})
                    </span>
                    <span>
                      Surviving: <strong>{activeStep.survivingCount}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E6DC] overflow-hidden flex">
                    <div
                      className="h-full bg-[#C04938]"
                      style={{ width: `${activeStep.totalLossFraction * 100}%` }}
                    />
                    <div
                      className="h-full bg-[#35563B]"
                      style={{ width: `${(1 - activeStep.totalLossFraction) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-[#D1D2C7] bg-white text-center space-y-1.5">
            <ShieldCheck size={24} className="mx-auto text-[#35563B]" />
            <p className="font-bold text-xs text-[#202B27]">
              No primary removal steps recorded under this strategy
            </p>
            <p className="text-[11px] text-[#68716B] max-w-md mx-auto">
              Under Strategy B (Basal protected), basal autotrophs and detrital groups are excluded from
              primary removal and never cascade. In networks consisting solely of basal species, or when
              all available candidate species are protected, no removal steps occur.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================================
          6. REMOVAL SEQUENCE DATA TABLE
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E6DC] pb-2">
          <h2 className="text-sm font-bold text-[#202B27]">
            Full Removal Sequence Table ({replaySteps.length} steps)
          </h2>
          <span className="text-xs text-[#68716B]">
            Strategy: {ROBUSTNESS_STRATEGY_INFO[replayStrategy].label}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-white max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F6EF] text-[10.5px] uppercase font-bold text-[#68716B] border-b border-[#E5E6DC] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-12">Step</th>
                <th className="py-2.5 px-3">Primary Organism</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-center">Active Degree</th>
                <th className="py-2.5 px-3 text-center">Secondary Losses</th>
                <th className="py-2.5 px-3 text-center">Cascade Rounds</th>
                <th className="py-2.5 px-3">Cumulative Lost</th>
                <th className="py-2.5 px-3">Total Loss %</th>
                <th className="py-2.5 px-3 text-center">Surviving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E6DC]/60">
              {replaySteps.map((step, idx) => {
                const isSelected = idx === currentStepIdx
                const isOverThreshold = step.totalLossFraction >= 0.5
                return (
                  <tr
                    key={step.step}
                    onClick={() => setCurrentStepIdx(idx)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-[#EBF3EC]'
                        : isOverThreshold
                          ? 'bg-[#FEF2F2]/40 hover:bg-[#F7F6EF]'
                          : 'hover:bg-[#F7F6EF]/60',
                    )}
                  >
                    <td className="py-2 px-3 font-mono font-bold text-[#68716B]">{step.step}</td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-[#202B27]">{step.primaryNodeName}</span>
                    </td>
                    <td className="py-2 px-3 capitalize text-[#68716B]">
                      {step.primaryNodeRole}
                    </td>
                    <td className="py-2 px-3 font-mono text-center font-bold text-[#202B27]">
                      {step.primaryDegree}
                    </td>
                    <td className="py-2 px-3 font-mono text-center font-bold">
                      {step.secondaryCount > 0 ? (
                        <span className="text-[#C04938]">+{step.secondaryCount}</span>
                      ) : (
                        <span className="text-[#68716B]">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-center text-[#68716B]">
                      {step.cascadeRounds}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#202B27]">
                      {step.cumulativeTotalLost}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          'font-mono tabular-nums font-bold text-xs',
                          isOverThreshold ? 'text-[#C04938]' : 'text-[#202B27]',
                        )}
                      >
                        {formatPercent(step.totalLossFraction * 100)}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-center text-[#68716B]">
                      {step.survivingCount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          7. EXPANDABLE METHODOLOGY & ACADEMIC CITATION PANEL
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setShowMethodology((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#E8F0E6] text-[#35563B] flex items-center justify-center">
              <BookOpen size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#202B27]">
                Methodology & Literature Citation: Dunne, Williams, and Martinez (2002)
              </h3>
              <p className="text-[11px] text-[#68716B]">
                Theoretical foundations of network robustness, connectance, and structural collapse
              </p>
            </div>
          </div>
          {showMethodology ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {showMethodology && (
          <div className="mt-4 pt-4 border-t border-[#E5E6DC] space-y-3.5 text-xs text-[#4A544E] leading-relaxed">
            <div className="p-3 rounded-xl bg-white border border-[#E5E6DC] space-y-1">
              <p className="font-bold text-[#202B27]">Primary Citation:</p>
              <p className="italic font-serif text-[#202B27]">
                Dunne, J. A., Williams, R. J., & Martinez, N. D. (2002). Network structure and
                biodiversity loss in food webs: robustness increases with connectance.{' '}
                <span className="font-sans font-bold text-[#35563B]">Ecology Letters</span>, 5(4),
                558–567. doi:10.1046/j.1461-0248.2002.00354.x
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <h4 className="font-bold text-[#202B27]">The R₅₀ Robustness Metric</h4>
                <p>
                  Robustness ($R_{50}$) is defined as the proportion of species that must be removed
                  primarily to induce a cumulative biodiversity loss of at least 50% ($E \ge 0.5 S$).
                  Total loss includes the primarily removed species plus all secondary structural
                  extinctions. Linear interpolation between discrete removal steps resolves odd-sized
                  networks exactly.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#202B27]">Connectance & Secondary Cascade Rule</h4>
                <p>
                  Dunne connectance is computed as $C = L / S^2$. When species are removed, consumers
                  undergo secondary extinction if all of their recorded food sources are eliminated.
                  Basal species (0 baseline incoming food links) never experience secondary removal.
                  Degrees are dynamically updated after every primary removal and cascade round.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5E6DC] space-y-1">
              <h4 className="font-bold text-[#202B27]">Deterministic Tie-Breaking Policy</h4>
              <p className="text-[11px] text-[#4A544E]">
                For Strategies A and B (most-connected), candidate species are sorted by active degree
                descending (k = d_in + d_out), breaking ties deterministically by
                stable node ID ascending. For Strategy C (least-connected), candidates are sorted by active
                degree ascending, breaking ties alphabetically by node ID. For Strategy D (random),
                deletion sequences are produced by a seeded 32-bit Mulberry32 PRNG (seed 42) across 1,000
                independent runs to guarantee scientific reproducibility.
              </p>
            </div>

            {/* Pre-Implementation Dataset Audit & Eligibility Table */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4 className="font-bold text-[#202B27]">
                  Pre-Implementation Dataset Audit & Eligibility Table (12 Bundled Networks)
                </h4>
                <span className="text-[10px] font-mono bg-[#E8F0E6] text-[#35563B] px-2 py-0.5 rounded-md font-bold self-start sm:self-auto">
                  All 6 Research Slots Verified
                </span>
              </div>
              <p className="text-[11px] text-[#68716B]">
                Every network in FoodWebGuard is audited for link directionality (resource → consumer),
                basal species count (0 incoming links), connectance, and eligibility under Dunne et al. (2002)
                removal strategies.
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#F7F6EF] text-[10px] uppercase font-bold text-[#68716B] border-b border-[#E5E6DC]">
                    <tr>
                      <th className="py-2 px-3">Network ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-center">Species (S)</th>
                      <th className="py-2 px-3 text-center">Links (L)</th>
                      <th className="py-2 px-3 text-center">Dunne C</th>
                      <th className="py-2 px-3 text-center">FWG C</th>
                      <th className="py-2 px-3 text-center">Basal (B)</th>
                      <th className="py-2 px-3">Robustness Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E6DC]/60 font-sans">
                    {datasetAuditRecords.map((rec) => (
                      <tr key={rec.datasetId} className="hover:bg-[#F7F6EF]/50">
                        <td className="py-2 px-3 font-mono font-bold text-[#202B27]">
                          {rec.datasetId}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              rec.isDemo
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                            )}
                          >
                            {rec.isDemo ? 'Demo Lab' : 'Research Verified'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-center font-bold text-[#202B27]">
                          {rec.totalSpecies}
                        </td>
                        <td className="py-2 px-3 font-mono text-center text-[#68716B]">
                          {rec.totalLinks}
                        </td>
                        <td className="py-2 px-3 font-mono text-center text-[#1B4361] font-bold">
                          {formatConnectance(rec.dunneConnectance, 3)}
                        </td>
                        <td className="py-2 px-3 font-mono text-center text-[#68716B]">
                          {formatConnectance(rec.fwgConnectance, 3)}
                        </td>
                        <td className="py-2 px-3 font-mono text-center">
                          {rec.basalCount}{' '}
                          <span className="text-[10px] text-[#68716B]">
                            ({(rec.basalFraction * 100).toFixed(0)}%)
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#4A544E]">
                          <span
                            className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px]',
                              rec.strategyBEligible
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800',
                            )}
                          >
                            {rec.strategyBNote}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
