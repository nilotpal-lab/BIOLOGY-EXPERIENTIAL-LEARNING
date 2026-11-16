import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, FileText, CheckCircle2, ShieldAlert, Sparkles, Scale, Info, Check } from 'lucide-react'
import { Button, IconButton } from '../ui/primitives'
import { formatConnectance } from '../../core/metrics'
import { buildGraph } from '../../core/graphModel'
import { runCascadeScenario, runDirectRemovalScenario } from '../../core/scenarios'
import type { FoodWebDataset, ScenarioResult } from '../../core/types'

/* ============================================================================
 * AcademicReportModal — formal academic summary sheet & printable report.
 *
 * Designed specifically for presentation decks, project evaluations, and PDF
 * submission in 'Biology for Engineers'.
 * Invokes window.print() with tailored @media print rules.
 * Portals directly into document.body to ensure zero print-clipping by app shell.
 * ========================================================================== */

export interface AcademicReportModalProps {
  isOpen: boolean
  onClose: () => void
  dataset: FoodWebDataset
  result: ScenarioResult
}

export function AcademicReportModal({
  isOpen,
  onClose,
  dataset,
  result,
}: AcademicReportModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('report-modal-open')
      return () => {
        document.body.classList.remove('report-modal-open')
      }
    }
  }, [isOpen])

  const graph = useMemo(() => buildGraph(dataset), [dataset])

  // Independently compute both Direct Removal and Cascade Mode results for side-by-side verification
  const directScenario = useMemo(
    () => (result.mode === 'direct' ? result : runDirectRemovalScenario(graph, dataset.name, result.primaryNodeId)),
    [graph, dataset.name, result],
  )
  const cascadeScenario = useMemo(
    () => (result.mode === 'cascade' ? result : runCascadeScenario(graph, dataset.name, result.primaryNodeId)),
    [graph, dataset.name, result],
  )

  const areIdentical = cascadeScenario.scenario.secondaryRemovals === 0

  // Identify any keystone species in this dataset that do trigger multi-round cascades
  const keystoneTriggers = useMemo(() => {
    const list: string[] = []
    for (const node of graph.nodes) {
      if (node.id === result.primaryNodeId) continue
      try {
        const res = runCascadeScenario(graph, dataset.name, node.id)
        if (res.scenario.secondaryRemovals > 0) {
          list.push(node.name)
        }
      } catch {}
      if (list.length >= 3) break
    }
    return list
  }, [graph, dataset.name, result.primaryNodeId])

  if (!isOpen) return null

  const handlePrint = () => {
    // Ensure full content is visible for printing by temporarily adjusting body styles
    const originalBodyOverflow = document.body.style.overflow
    const originalBodyHeight = document.body.style.height
    document.body.style.overflow = 'visible'
    document.body.style.height = 'auto'
    window.print()
    // Restore original styles after print
    document.body.style.overflow = originalBodyOverflow
    document.body.style.height = originalBodyHeight
  }

  const { baseline } = result
  const bConn = baseline.connectance.value
  const dConn = directScenario.scenario.connectance.value
  const cConn = cascadeScenario.scenario.connectance.value

  const diffConnDirect =
    bConn !== null && dConn !== null
      ? (dConn - bConn > 0 ? '+' : '') + (dConn - bConn).toFixed(4)
      : 'N/A'

  const diffConnCascade =
    bConn !== null && cConn !== null
      ? (cConn - bConn > 0 ? '+' : '') + (cConn - bConn).toFixed(4)
      : 'N/A'

  const modalContent = (
    <div id="academic-report-portal">
      <div className="academic-report-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
        <div className="academic-report-card relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden min-w-0">
          {/* Modal Toolbar (hidden when printed) */}
          <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 sm:px-5 py-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <FileText size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">Academic Project Report</h3>
                <p className="text-[11.5px] text-slate-500 truncate">Direct Removal vs. Cascade Extinction Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                icon={<Printer size={15} />}
                onClick={handlePrint}
                className="text-xs h-8 px-3"
              >
                Print / Save as PDF
              </Button>
              <IconButton label="Close report modal" icon={<X size={16} />} onClick={onClose} />
            </div>
          </div>

          {/* Printable Report Canvas */}
          <div id="academic-report-canvas" className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-800 text-[13px] leading-relaxed min-w-0">
            {/* Institutional Header */}
            <div className="border-b-2 border-emerald-900/80 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                    Biology for Engineers · Team 1 (CSE CE-SE)
                  </p>
                  <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight break-words">
                    FoodWebGuard — Structural Disruption & Vulnerability Report
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 break-words">
                    Computational Ecological Food-Web Robustness, Direct Severance & Secondary Cascade Assessment
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={12} /> Live Computed
                  </span>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    {new Date(result.computedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Provenance & Dataset Information */}
            <section className="space-y-2 min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                1. Ecosystem & Provenance Documentation
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs min-w-0">
                <div className="min-w-0">
                  <p className="text-slate-500 text-[11px]">Dataset Name</p>
                  <p className="font-semibold text-slate-900 break-words">{dataset.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">ID: {dataset.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-[11px]">Ecosystem Biome</p>
                  <p className="font-semibold text-slate-900 capitalize">{dataset.ecosystem}</p>
                  <p className="text-[10px] text-slate-500 break-words">Unit: {dataset.provenance.nodeUnit}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-[11px]">Source Status</p>
                  <p className="font-semibold text-slate-900">
                    {dataset.sourceStatus === 'research-verified' ? 'Dryad Verified (CC0 1.0)' : 'Illustrative Demo'}
                  </p>
                  <p className="text-[10px] text-slate-500">Baseline: {dataset.nodes.length} nodes · {dataset.edges.length} links</p>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-[11px]">Empirical Citation</p>
                  <p className="font-medium text-slate-800 line-clamp-2 text-[11px] break-words" title={dataset.provenance.citation}>
                    {dataset.provenance.citation}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Experimental Perturbation Parameters */}
            <section className="space-y-2 min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                2. Experimental Perturbation Parameters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                <div className="rounded-xl border border-slate-200 p-3 min-w-0">
                  <p className="text-slate-500 text-[11px]">Targeted Organism</p>
                  <p className="text-sm font-bold text-slate-900 break-words">{result.primaryNodeLabel}</p>
                  <p className="text-[10.5px] text-slate-500 truncate">ID: {result.primaryNodeId}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 min-w-0">
                  <p className="text-slate-500 text-[11px]">Active Explorer Mode</p>
                  <p className="text-sm font-bold text-slate-900">
                    {result.mode === 'cascade' ? 'Direct Removal + Structural Cascade' : 'Direct Removal Only'}
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    {result.mode === 'cascade' ? 'Propagates starvation to consumers with 0 prey' : 'Measures immediate broken connections'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 min-w-0">
                  <p className="text-slate-500 text-[11px]">Direct Feeding Links Severed</p>
                  <p className="text-sm font-bold text-rose-700">{result.directlyRemovedLinks.length} Links</p>
                  <p className="text-[10.5px] text-slate-500">Incident edges connected to target</p>
                </div>
              </div>
            </section>

            {/* Section 3: Comparative Analysis — Direct Removal vs. Cascade Extinction */}
            <section className="space-y-3 min-w-0">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Scale size={13} className="text-[#35563B]" />
                  <span>3. Comparative Ecological Matrix (Direct Removal vs. Cascade Mode)</span>
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  {areIdentical ? 'Equivalence Detected (0 Secondary Extinctions)' : 'Divergence Detected (Cascade Triggered)'}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Ecological Metric</th>
                      <th className="py-2.5 px-3 text-right">Baseline (L₀, N₀)</th>
                      <th className="py-2.5 px-3 text-right">Direct Removal</th>
                      <th className="py-2.5 px-3 text-right">Cascade Mode</th>
                      <th className="py-2.5 px-3 text-right">Comparative Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3 font-medium">Species Richness (Node Count, N)</td>
                      <td className="py-2 px-3 text-right font-mono">{baseline.nodeCount}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{directScenario.scenario.nodeCount}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{cascadeScenario.scenario.nodeCount}</td>
                      <td className="py-2 px-3 text-right font-semibold font-mono text-rose-700">
                        {cascadeScenario.scenario.secondaryRemovals === 0
                          ? 'Identical (0 secondary)'
                          : `-${cascadeScenario.scenario.secondaryRemovals} secondary loss`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium">Trophic Link Count (Edges, L)</td>
                      <td className="py-2 px-3 text-right font-mono">{baseline.linkCount}</td>
                      <td className="py-2 px-3 text-right font-mono">{directScenario.scenario.linkCount}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">{cascadeScenario.scenario.linkCount}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {directScenario.scenario.linkCount === cascadeScenario.scenario.linkCount
                          ? 'Identical link count'
                          : `-${directScenario.scenario.linkCount - cascadeScenario.scenario.linkCount} cascade links lost`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium">Directed Connectance (C = L / [N(N-1)])</td>
                      <td className="py-2 px-3 text-right font-mono">{formatConnectance(baseline.connectance.value)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatConnectance(dConn)} ({diffConnDirect})</td>
                      <td className="py-2 px-3 text-right font-mono">{formatConnectance(cConn)} ({diffConnCascade})</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {dConn === cConn ? 'Identical connectance' : `${((cConn ?? 0) - (dConn ?? 0)).toFixed(4)} shift`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium">Directly Affected Consumers</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono">{directScenario.scenario.directlyAffectedConsumerIds.length}</td>
                      <td className="py-2 px-3 text-right font-mono">{cascadeScenario.scenario.directlyAffectedConsumerIds.length}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">Same initial loss</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium">Food-Depleted Consumers (100% Prey Severed)</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700">
                        {directScenario.scenario.foodDepletedConsumerIds.length} (Flagged only)
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">
                        {cascadeScenario.scenario.foodDepletedConsumerIds.length} (Starved in cascade)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {cascadeScenario.scenario.foodDepletedConsumerIds.length === 0
                          ? '0 depleted in either mode'
                          : `${cascadeScenario.scenario.foodDepletedConsumerIds.length} transitioned to extinction`}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-900">Secondary Extinctions (Cascade Starvations)</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">0 (Mode does not propagate)</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                        {cascadeScenario.scenario.secondaryRemovals}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                        +{cascadeScenario.scenario.secondaryRemovals} beyond target
                      </td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-900">Cascade Propagation Depth (Sequential Rounds)</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">0 rounds</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {cascadeScenario.scenario.cascadeDepth} round(s)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {cascadeScenario.scenario.cascadeDepth > 0 ? `${cascadeScenario.scenario.cascadeDepth} sequential wave(s)` : '0 (immediate stabilization)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Independent Verification & Ecological Explanation Box */}
              <div className={`rounded-xl border p-4 text-xs space-y-1.5 ${areIdentical ? 'border-blue-200 bg-blue-50/70 text-blue-950' : 'border-rose-200 bg-rose-50/70 text-rose-950'}`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {areIdentical ? <Check size={15} className="text-blue-700 shrink-0" /> : <Sparkles size={15} className="text-rose-700 shrink-0" />}
                  <span className="text-sm">
                    {areIdentical
                      ? 'Scientific Verdict: Direct Removal and Cascade Reports are Structurally Identical'
                      : `Scientific Verdict: Cascade Mode Triggered ${cascadeScenario.scenario.secondaryRemovals} Additional Extinctions`}
                  </span>
                </div>
                <div className="leading-relaxed space-y-1">
                  {areIdentical ? (
                    <>
                      <p>
                        For <strong>{result.primaryNodeLabel}</strong>, both Direct Removal and Cascade Extinction produce the <strong>exact same numerical results</strong> ({cascadeScenario.scenario.nodeCount} of {baseline.nodeCount} species remaining).
                      </p>
                      <p className="text-[11.5px] text-blue-900/90">
                        <strong>Why did this happen?</strong> In ecological food webs, many predators possess <strong>dietary redundancy</strong> (they consume multiple different species). Under the empirical extinction rule, a consumer only starves if it loses <strong>100% of all recorded food sources</strong>. Because all surviving predators that fed on {result.primaryNodeLabel} had alternative prey options, <strong>zero secondary starvations occurred</strong>. Therefore, Cascade Mode produced zero additional removals, making its report look identical to Direct Removal.
                      </p>
                      {keystoneTriggers.length > 0 && (
                        <p className="text-[11.5px] text-blue-900/90 pt-1 font-medium">
                          💡 <em>Want to observe multi-round cascading collapses? Try selecting keystone species or basal producers in this network, such as <strong>{keystoneTriggers.join(', ')}</strong>.</em>
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        Removing <strong>{result.primaryNodeLabel}</strong> severed vital energy pathways. While Direct Removal only accounted for the initial targeted organism (-1 species), Cascade Mode reveals severe structural vulnerability:
                      </p>
                      <p className="text-[11.5px] text-rose-900/90">
                        <strong>{cascadeScenario.scenario.secondaryRemovals} dependent consumer(s)</strong> had no alternative prey in this food web and starved to death across <strong>{cascadeScenario.rounds.length} sequential round(s)</strong>.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Multi-Round Extinction Cascade History */}
            <section className="space-y-2 min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                4. Multi-Round Extinction Cascade History
              </h2>
              {cascadeScenario.rounds.length > 0 ? (
                <div className="space-y-2">
                  {cascadeScenario.rounds.map((round) => (
                    <div key={round.round} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 min-w-0">
                      <p className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Round {round.round}</span>
                        <span className="text-[11px] font-normal text-rose-700 font-semibold">
                          -{round.removals.length} secondary removal(s)
                        </span>
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                        {round.removals.map((rem) => (
                          <li key={rem.nodeId} className="flex items-start gap-1.5">
                            <span className="text-rose-600 font-bold">•</span>
                            <span className="break-words">
                              <strong className="text-slate-800">{rem.label}</strong> ({rem.role}): {rem.reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Info size={14} className="text-slate-500" />
                    <span>0 Propagation Rounds Recorded (Immediate Network Stabilization)</span>
                  </p>
                  <p className="text-[11.5px] leading-relaxed text-slate-500">
                    No surviving species met the criteria for secondary starvation in Round 1 because all dependent consumers retained at least one alternative food resource. The network stabilized immediately after the direct removal.
                  </p>
                </div>
              )}
            </section>

            {/* Section 5: Scientific Caveats & Methodology Sign-off */}
            <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1 text-xs text-amber-950 min-w-0">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert size={14} className="text-amber-800 shrink-0" />
                <span>Scientific Caveats & Scope Disclosures</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90 break-words">
                This simulation executes a purely structural/topological analysis based on recorded static feeding links.
                It does not model dynamic population abundances, metabolic scaling, or behavioral prey-switching.
                Secondary extinction indicates that an organism lost 100% of its recorded baseline food sources under the
                stated empirical dataset.
              </p>
            </section>

            {/* Footer Sign-off */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <p>FoodWebGuard · Biology for Engineers · Team 1</p>
              <p>Verified reproducible client-side topological analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
