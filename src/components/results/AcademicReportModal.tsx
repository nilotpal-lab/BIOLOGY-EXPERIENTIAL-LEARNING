import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button, IconButton } from '../ui/primitives'
import { formatConnectance, formatPercent } from '../../core/metrics'
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

  const { baseline, scenario } = result
  const bConn = baseline.connectance.value
  const sConn = scenario.connectance.value
  const diffConn =
    bConn !== null && sConn !== null
      ? (sConn - bConn > 0 ? '+' : '') + (sConn - bConn).toFixed(4)
      : 'N/A'

  const modalContent = (
    <div id="academic-report-portal">
      <div className="academic-report-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
        <div className="academic-report-card relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
          {/* Modal Toolbar (hidden when printed) */}
          <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <FileText size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Academic Project Report</h3>
                <p className="text-[11.5px] text-slate-500">Ready for PDF export or submission slide attachment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
          <div id="academic-report-canvas" className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-slate-800 text-[13px] leading-relaxed">
          {/* Institutional Header */}
          <div className="border-b-2 border-emerald-900/80 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                  Biology for Engineers · Team 1 (CSE CE-SE)
                </p>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                  FoodWebGuard — Structural Disruption & Vulnerability Report
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Computational Ecological Food-Web Robustness & Secondary Cascade Assessment
                </p>
              </div>
              <div className="text-right sm:self-start">
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
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              1. Ecosystem & Provenance Documentation
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 text-[11px]">Dataset Name</p>
                <p className="font-semibold text-slate-900">{dataset.name}</p>
                <p className="text-[10px] text-slate-500">ID: {dataset.id}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Ecosystem Biome</p>
                <p className="font-semibold text-slate-900 capitalize">{dataset.ecosystem}</p>
                <p className="text-[10px] text-slate-500">Unit: {dataset.provenance.nodeUnit}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Source Status</p>
                <p className="font-semibold text-slate-900">
                  {dataset.sourceStatus === 'research-verified' ? 'Dryad Verified (CC0 1.0)' : 'Illustrative Demo'}
                </p>
                <p className="text-[10px] text-slate-500">Baseline: {dataset.nodes.length} nodes · {dataset.edges.length} links</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Empirical Citation</p>
                <p className="font-medium text-slate-800 line-clamp-2 text-[11px]" title={dataset.provenance.citation}>
                  {dataset.provenance.citation}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Experimental Perturbation Parameters */}
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              2. Experimental Simulation Parameters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-slate-500 text-[11px]">Targeted Organism</p>
                <p className="text-sm font-bold text-slate-900">{result.primaryNodeLabel}</p>
                <p className="text-[10.5px] text-slate-500">Node Identifier: {result.primaryNodeId}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-slate-500 text-[11px]">Simulation Mode</p>
                <p className="text-sm font-bold text-slate-900">
                  {result.mode === 'cascade' ? 'Direct Removal + Structural Cascade' : 'Direct Removal Only'}
                </p>
                <p className="text-[10.5px] text-slate-500">Deterministic topological rule applied</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-slate-500 text-[11px]">Direct Feeding Links Severed</p>
                <p className="text-sm font-bold text-rose-700">{result.directlyRemovedLinks.length} Links</p>
                <p className="text-[10.5px] text-slate-500">Incident edges connected to target</p>
              </div>
            </div>
          </section>

          {/* Section 3: Quantitative Structural Metrics Table */}
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              3. Quantitative Ecological Metrics Matrix
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Metric Description</th>
                    <th className="py-2.5 px-3 text-right">Baseline Value</th>
                    <th className="py-2.5 px-3 text-right">Post-Scenario Value</th>
                    <th className="py-2.5 px-3 text-right">Absolute / Relative Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3 font-medium">Species Richness (Node Count, N)</td>
                    <td className="py-2 px-3 text-right font-mono">{baseline.nodeCount}</td>
                    <td className="py-2 px-3 text-right font-mono">{scenario.nodeCount}</td>
                    <td className="py-2 px-3 text-right font-semibold text-rose-700 font-mono">
                      -{baseline.nodeCount - scenario.nodeCount} (-{formatPercent(scenario.removedPercentOfBaseline.value)})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Trophic Link Count (Edges, L)</td>
                    <td className="py-2 px-3 text-right font-mono">{baseline.linkCount}</td>
                    <td className="py-2 px-3 text-right font-mono">{scenario.linkCount}</td>
                    <td className="py-2 px-3 text-right font-semibold text-rose-700 font-mono">
                      -{baseline.linkCount - scenario.linkCount} (-{formatPercent(scenario.linkLossPercent.value)})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Network Directed Connectance (C = L / [N(N-1)])</td>
                    <td className="py-2 px-3 text-right font-mono">{formatConnectance(baseline.connectance.value)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatConnectance(scenario.connectance.value)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {diffConn}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Directly Affected Consumers (Lost ≥1 food link)</td>
                    <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                    <td className="py-2 px-3 text-right font-mono">{scenario.directlyAffectedConsumerIds.length}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-700 font-semibold">
                      {formatPercent((scenario.directlyAffectedConsumerIds.length / Math.max(1, baseline.nodeCount)) * 100)} of web
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Food-Depleted Consumers (Lost 100% food links)</td>
                    <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                    <td className="py-2 px-3 text-right font-mono">{scenario.foodDepletedConsumerIds.length}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-700 font-semibold">
                      {scenario.foodDepletedConsumerIds.length} qualifying
                    </td>
                  </tr>
                  {result.mode === 'cascade' && (
                    <>
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-medium">Secondary Removals (Cascade Extinctions)</td>
                        <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">{scenario.secondaryRemovals}</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700 font-semibold">
                          +{scenario.secondaryRemovals} beyond target
                        </td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-medium">Cascade Propagation Depth (Rounds)</td>
                        <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{scenario.cascadeDepth}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {scenario.cascadeDepth > 0 ? `${scenario.cascadeDepth} sequential round(s)` : '0 (no cascade)'}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Cascade Round History (if applicable) */}
          {result.mode === 'cascade' && result.rounds.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                4. Multi-Round Extinction Cascade History
              </h2>
              <div className="space-y-2">
                {result.rounds.map((round) => (
                  <div key={round.round} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60">
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
                          <span>
                            <strong className="text-slate-800">{rem.label}</strong> ({rem.role}): {rem.reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Scientific Caveats & Methodology Sign-off */}
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1 text-xs text-amber-950">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert size={14} className="text-amber-800" />
              <span>Scientific Caveats & Scope Disclosures</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              This simulation executes a purely structural/topological analysis based on recorded static feeding links.
              It does not model dynamic population abundances, metabolic scaling, or behavioral prey-switching.
              Secondary extinction indicates that an organism lost 100% of its recorded baseline food sources under the
              stated empirical dataset.
            </p>
          </section>

          {/* Footer Sign-off */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <p>FoodWebGuard · Biology for Engineers · Team 1</p>
            <p>Verified reproducible client-side execution</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
