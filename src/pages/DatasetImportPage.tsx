import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Info,
  Sparkles,
  Table,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import {
  countIssues,
  importNetwork,
  LARGE_FILE_THRESHOLDS,
} from '../core/dataValidation'
import { validateGraphIntegrity } from '../core/graphModel'
import {
  ECOSYSTEM_CATEGORIES,
  ECOSYSTEM_LABEL,
  type EcosystemCategory,
  type ImportPreview,
  type ValidationIssue,
} from '../core/types'
import {
  Badge,
  Field,
  SelectInput,
  TextArea,
  TextInput,
  cn,
} from '../components/ui/primitives'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/routes'
import { SAMPLE_EDGES_CSV, SAMPLE_JSON, SAMPLE_NODES_CSV } from '../components/imports/ImportDialog'

/* ============================================================================
 * DatasetImportPage — Dedicated Full-Page Scientific Data Intake Studio
 *
 * Implements the verified import pipeline with a crystal-clear Example Format
 * guide showing:
 * 1. Feeding Links table (source = food, target = consumer)
 * 2. Species Nodes table with valid trophic roles
 * 3. One-click sample templates download & copyable snippets
 * 4. In-browser local validation and repair before replacing active dataset
 * ========================================================================== */

function downloadBlob(filename: string, content: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const SEVERITY_ICON = {
  error: <AlertTriangle size={13} className="text-[#C84B31]" aria-hidden="true" />,
  warning: <AlertTriangle size={13} className="text-[#F1B36F]" aria-hidden="true" />,
  info: <Info size={13} className="text-[#899B78]" aria-hidden="true" />,
} as const

function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-[#35563B]">
        <CheckCircle2 size={14} aria-hidden="true" /> No problems found in the uploaded data.
      </p>
    )
  }
  return (
    <ul className="space-y-1.5">
      {issues.map((issue, index) => (
        <li key={`${issue.code}-${index}`} className="flex gap-2 text-xs leading-relaxed">
          <span className="mt-0.5">{SEVERITY_ICON[issue.severity]}</span>
          <span className="text-[#68716B]">
            <span className="mr-1.5 font-mono text-[10px] font-bold uppercase text-[#263D2D] bg-[#E8EDE0] px-1.5 py-0.5 rounded">
              {issue.code}
            </span>
            {issue.message}
            {issue.fixable && issue.severity === 'error' ? (
              <span className="ml-1 text-[#899B78] font-medium">
                (This can be auto-repaired by checking "Repair supported issues" below).
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function DatasetImportPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { addImportedDataset, setNotice } = useAppState()
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [exampleTab, setExampleTab] = useState<'links' | 'nodes' | 'json'>('links')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [pasteExpanded, setPasteExpanded] = useState(false)

  const [nodesText, setNodesText] = useState('')
  const [edgesText, setEdgesText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [datasetName, setDatasetName] = useState('')
  const [ecosystem, setEcosystem] = useState<EcosystemCategory>('freshwater')
  const [citation, setCitation] = useState('')
  const [origin, setOrigin] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [license, setLicense] = useState('')
  const [nodeUnit, setNodeUnit] = useState('')
  const [repair, setRepair] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const loadExampleIntoForm = () => {
    setFormat('csv')
    setNodesText(SAMPLE_NODES_CSV)
    setEdgesText(SAMPLE_EDGES_CSV)
    setDatasetName('Freshwater Pond Survey (Example)')
    setEcosystem('freshwater')
    setCitation('Freshwater Ecological Survey (2024). Ecological Monographs.')
    setOrigin('Freshwater Biological Association')
    setLicense('CC-BY-4.0')
    setNodeUnit('individual species')
    setPasteExpanded(true)
    setPreview(null)
  }

  const readFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const next: string[] = []
    for (const file of Array.from(files)) {
      const text = await file.text()
      next.push(`${file.name}\u0000${text}`)
    }
    const jsonEntry = next.find((entry) => entry.split('\u0000')[0].toLowerCase().endsWith('.json'))
    if (jsonEntry) {
      const [name, text] = jsonEntry.split('\u0000')
      setFileName(name)
      setJsonText(text)
      setFormat('json')
      if (!datasetName) setDatasetName(name.replace(/\.[^.]+$/, ''))
      return
    }
    const csvEntries = next
      .map((entry) => entry.split('\u0000'))
      .filter(([, text]) => text.includes(',') || text.trim().length > 0)
    if (csvEntries[0]) {
      setFileName(csvEntries[0][0])
      setFormat('csv')
      const [first, second] = csvEntries
      const looksLikeNodes = (text: string) => /(^|\n)\s*id\s*,/i.test(text)
      if (looksLikeNodes(first[1])) {
        setNodesText(first[1])
        if (second) setEdgesText(second[1])
      } else if (second && looksLikeNodes(second[1])) {
        setNodesText(second[1])
        setEdgesText(first[1])
      } else {
        setNodesText(first[1])
        if (second) setEdgesText(second[1])
      }
      if (!datasetName) setDatasetName(first[0].replace(/\.[^.]+$/, ''))
    }
  }

  const runValidation = (nextRepair = repair) => {
    const isCsv = format === 'csv'
    const result = importNetwork({
      format,
      nodesText: isCsv ? nodesText : undefined,
      edgesText: isCsv ? edgesText : undefined,
      jsonText: isCsv ? undefined : jsonText,
      fileName: isCsv ? (fileName?.toLowerCase().endsWith('.json') ? undefined : fileName) : fileName,
      datasetName: datasetName || undefined,
      ecosystem,
      citation: citation || undefined,
      origin: origin || undefined,
      sourceUrl: sourceUrl || undefined,
      license: license || undefined,
      nodeUnit: nodeUnit || undefined,
      options: {
        invalidEdgePolicy: nextRepair ? 'exclude' : 'block',
        duplicateNodePolicy: nextRepair ? 'keep-first' : 'block',
        selfLinkPolicy: 'exclude',
      },
    })

    let next: ImportPreview
    if (result.dataset) {
      const extra = validateGraphIntegrity(result.dataset).filter(
        (issue) => issue.severity !== 'info',
      )
      const known = new Set(result.issues.map((issue) => issue.code))
      const additions = extra.filter((issue) => !known.has(issue.code))
      next = { ...result, issues: [...result.issues, ...additions] }
    } else {
      next = result
    }

    const url = sourceUrl.trim()
    if (url && !/^(https?:\/\/|doi:|10\.\d{4,9}\/)/i.test(url)) {
      next = {
        ...next,
        issues: [
          ...next.issues,
          {
            severity: 'warning',
            code: 'METADATA_URL_UNUSUAL',
            message:
              'The Source URL or DOI does not start with "https://", "http://", "doi:" or a DOI prefix like "10.1234/". Check that it is a working address.',
          },
        ],
      }
    }

    setPreview(next)
  }

  const toggleRepair = (value: boolean) => {
    setRepair(value)
    if (preview) runValidation(value)
  }

  const handleImport = () => {
    if (!preview?.dataset) return
    addImportedDataset(preview.dataset)
    const report = preview.report
    setNotice({
      tone: report?.outstandingWarnings.length ? 'warning' : 'success',
      title: 'Dataset imported',
      message: report
        ? `"${preview.dataset.name}" was imported with ${report.acceptedNodeCount} node(s) and ${report.acceptedEdgeCount} link(s). It is now the active network — open the Explorer to work with it.`
        : `"${preview.dataset.name}" was imported. It is now the active network — open the Explorer to work with it.`,
    })
    onNavigate('explore')
  }

  const counts = preview ? countIssues(preview.issues) : null
  const blocking = preview?.blocked ?? false

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================================
          1. Hero Banner with Nature Artwork
          ===================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-6 sm:p-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 max-w-[420px] pointer-events-none opacity-25 sm:opacity-40 overflow-hidden">
          <img
            src="/hero-ecosystem.jpg"
            alt="Freshwater ecosystem"
            className="h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8EDE0] px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#35563B]">
              <Upload size={13} className="text-[#35563B]" />
              Custom Research Pipeline
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#263D2D]">
            Dataset Import Studio
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#68716B] leading-relaxed">
            Import custom food webs using your own CSV or JSON files. Review the required schemas below, download starter templates, or load an example dataset with one click.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadExampleIntoForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#35563B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#263D2D] transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              Load Sample Dataset into Form
            </button>
            <button
              type="button"
              onClick={() => downloadBlob('sample_feeding_links.csv', SAMPLE_EDGES_CSV)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] px-3.5 py-2 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] transition-colors cursor-pointer"
            >
              <Download size={13} className="text-[#35563B]" />
              Download Link CSV Template
            </button>
            <button
              type="button"
              onClick={() => downloadBlob('sample_species_nodes.csv', SAMPLE_NODES_CSV)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] px-3.5 py-2 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] transition-colors cursor-pointer"
            >
              <Download size={13} className="text-[#35563B]" />
              Download Node CSV Template
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. Example Format Guide (Prominently Highlighted)
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E6DC] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Table size={18} className="text-[#35563B]" />
              <h2 className="font-serif text-xl font-bold text-[#202B27]">
                Example Data Format Guide
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#68716B]">
              FoodWebGuard requires standard directed link and node structures for mathematical graph calculation.
            </p>
          </div>

          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F7F6EF] p-1 rounded-xl border border-[#E5E6DC]">
            <button
              type="button"
              onClick={() => setExampleTab('links')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                exampleTab === 'links'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              1. Feeding Links (Link CSV)
            </button>
            <button
              type="button"
              onClick={() => setExampleTab('nodes')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                exampleTab === 'nodes'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              2. Species Nodes (Node CSV)
            </button>
            <button
              type="button"
              onClick={() => setExampleTab('json')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                exampleTab === 'json'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              3. JSON Network Schema
            </button>
          </div>
        </div>

        {/* Example Tab 1: Feeding Links CSV */}
        {exampleTab === 'links' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#35563B]/20 bg-[#E8EDE0]/60 p-3.5 text-xs text-[#263D2D]">
              <strong className="font-bold text-[#35563B]">Link Direction Principle:</strong> Every directed edge represents trophic flow from food to consumer. In your CSV, <code className="font-mono font-bold text-[#35563B]">source</code> is the prey/food organism, and <code className="font-mono font-bold text-[#35563B]">target</code> is the predator/consumer organism.
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E6DC] bg-[#E8EDE0]/70 text-[10px] font-bold uppercase tracking-wider text-[#263D2D]">
                    <th className="py-2.5 pl-4 pr-3">Food / Prey (<code className="font-mono text-[#35563B]">source</code>)</th>
                    <th className="py-2.5 pr-3">Consumer / Predator (<code className="font-mono text-[#35563B]">target</code>)</th>
                    <th className="py-2.5 pr-3">Interaction (<code className="font-mono">relationship</code>)</th>
                    <th className="py-2.5 pr-4">Ecological Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6DC]/60 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 text-[#35563B] font-semibold">macrophytes</td>
                    <td className="py-2.5 pr-3 text-[#202B27] font-semibold">snail</td>
                    <td className="py-2.5 pr-3 text-[#68716B]">herbivory</td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-[#68716B]">Freshwater Snail eats Aquatic Macrophytes</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 text-[#35563B] font-semibold">snail</td>
                    <td className="py-2.5 pr-3 text-[#202B27] font-semibold">carp</td>
                    <td className="py-2.5 pr-3 text-[#68716B]">predation</td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-[#68716B]">Common Carp consumes Freshwater Snail</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 text-[#35563B] font-semibold">carp</td>
                    <td className="py-2.5 pr-3 text-[#202B27] font-semibold">pike</td>
                    <td className="py-2.5 pr-3 text-[#68716B]">predation</td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-[#68716B]">Northern Pike preys on Common Carp</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 text-[#35563B] font-semibold">pike</td>
                    <td className="py-2.5 pr-3 text-[#202B27] font-semibold">grey_heron</td>
                    <td className="py-2.5 pr-3 text-[#68716B]">predation</td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-[#68716B]">Grey Heron preys on Northern Pike</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 text-[#35563B] font-semibold">zooplankton</td>
                    <td className="py-2.5 pr-3 text-[#202B27] font-semibold">perch</td>
                    <td className="py-2.5 pr-3 text-[#68716B]">predation</td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-[#68716B]">European Perch feeds on Zooplankton</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#68716B]">
                Required CSV column headers: <code className="font-mono text-[#263D2D]">source,target</code>. Optional: <code className="font-mono">relationship,source_note</code>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(SAMPLE_EDGES_CSV, 'edges-page')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] px-3 py-1.5 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] cursor-pointer"
                >
                  {copiedKey === 'edges-page' ? <Check size={13} className="text-[#35563B]" /> : <Copy size={13} />}
                  {copiedKey === 'edges-page' ? 'Copied to Clipboard' : 'Copy CSV Text'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlob('sample_feeding_links.csv', SAMPLE_EDGES_CSV)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#35563B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#263D2D] cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  Download Link CSV Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Example Tab 2: Species Nodes CSV */}
        {exampleTab === 'nodes' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#35563B]/20 bg-[#E8EDE0]/60 p-3.5 text-xs text-[#263D2D]">
              <strong className="font-bold text-[#35563B]">Supported Trophic Roles:</strong>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="rounded-md bg-[#B5D39A]/40 px-2 py-0.5 text-[#263D2D]">producer</span>
                <span className="rounded-md bg-[#91BFE0]/40 px-2 py-0.5 text-[#1E4C73]">primary-consumer</span>
                <span className="rounded-md bg-[#F3D98B]/40 px-2 py-0.5 text-[#735A12]">secondary-consumer</span>
                <span className="rounded-md bg-[#F1B36F]/40 px-2 py-0.5 text-[#7D4507]">tertiary-consumer</span>
                <span className="rounded-md bg-[#EF9A88]/40 px-2 py-0.5 text-[#732717]">apex-predator</span>
                <span className="rounded-md bg-[#E5E6DC] px-2 py-0.5 text-[#4A544E]">basal-group</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E6DC] bg-[#E8EDE0]/70 text-[10px] font-bold uppercase tracking-wider text-[#263D2D]">
                    <th className="py-2.5 pl-4 pr-3">Node ID (<code className="font-mono text-[#35563B]">id</code>)</th>
                    <th className="py-2.5 pr-3">Common Name (<code className="font-mono text-[#35563B]">name</code>)</th>
                    <th className="py-2.5 pr-3">Trophic Role (<code className="font-mono">trophic_role</code>)</th>
                    <th className="py-2.5 pr-4">Scientific Name (<code className="font-mono">scientific_name</code>)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6DC]/60 text-xs">
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 font-mono text-[11px] text-[#35563B] font-semibold">grey_heron</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#202B27]">Grey Heron</td>
                    <td className="py-2.5 pr-3"><span className="rounded bg-[#EF9A88]/30 px-2 py-0.5 font-mono text-[10px] text-[#732717]">apex-predator</span></td>
                    <td className="py-2.5 pr-4 italic text-[#68716B]">Ardea cinerea</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 font-mono text-[11px] text-[#35563B] font-semibold">pike</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#202B27]">Northern Pike</td>
                    <td className="py-2.5 pr-3"><span className="rounded bg-[#F1B36F]/30 px-2 py-0.5 font-mono text-[10px] text-[#734507]">tertiary-consumer</span></td>
                    <td className="py-2.5 pr-4 italic text-[#68716B]">Esox lucius</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 font-mono text-[11px] text-[#35563B] font-semibold">carp</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#202B27]">Common Carp</td>
                    <td className="py-2.5 pr-3"><span className="rounded bg-[#F3D98B]/30 px-2 py-0.5 font-mono text-[10px] text-[#735A12]">secondary-consumer</span></td>
                    <td className="py-2.5 pr-4 italic text-[#68716B]">Cyprinus carpio</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 font-mono text-[11px] text-[#35563B] font-semibold">snail</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#202B27]">Freshwater Snail</td>
                    <td className="py-2.5 pr-3"><span className="rounded bg-[#91BFE0]/30 px-2 py-0.5 font-mono text-[10px] text-[#1E4C73]">primary-consumer</span></td>
                    <td className="py-2.5 pr-4 italic text-[#68716B]">Lymnaea stagnalis</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-4 pr-3 font-mono text-[11px] text-[#35563B] font-semibold">macrophytes</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#202B27]">Macrophytes</td>
                    <td className="py-2.5 pr-3"><span className="rounded bg-[#B5D39A]/30 px-2 py-0.5 font-mono text-[10px] text-[#263D2D]">producer</span></td>
                    <td className="py-2.5 pr-4 italic text-[#68716B]">Potamogeton crispus</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#68716B]">
                Required CSV column headers: <code className="font-mono text-[#263D2D]">id,name</code>. Optional: <code className="font-mono">trophic_role,scientific_name,description</code>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(SAMPLE_NODES_CSV, 'nodes-page')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] px-3 py-1.5 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] cursor-pointer"
                >
                  {copiedKey === 'nodes-page' ? <Check size={13} className="text-[#35563B]" /> : <Copy size={13} />}
                  {copiedKey === 'nodes-page' ? 'Copied to Clipboard' : 'Copy CSV Text'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlob('sample_species_nodes.csv', SAMPLE_NODES_CSV)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#35563B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#263D2D] cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  Download Node CSV Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Example Tab 3: JSON Network Schema */}
        {exampleTab === 'json' && (
          <div className="space-y-4">
            <pre className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4 font-mono text-xs leading-relaxed text-[#263D2D]">
              {SAMPLE_JSON}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#68716B]">
                JSON structure requires root <code className="font-mono text-[#263D2D]">nodes</code> and <code className="font-mono text-[#263D2D]">edges</code> arrays.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(SAMPLE_JSON, 'json-page')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] px-3 py-1.5 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] cursor-pointer"
                >
                  {copiedKey === 'json-page' ? <Check size={13} className="text-[#35563B]" /> : <Copy size={13} />}
                  {copiedKey === 'json-page' ? 'Copied to Clipboard' : 'Copy JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlob('sample_foodweb.json', SAMPLE_JSON, 'application/json')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#35563B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#263D2D] cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  Download JSON Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          3. Upload & Import Interactive Console
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Dropzone & Metadata */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#202B27]">
              Step 1: Upload Data Files
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormat('csv')
                  setPreview(null)
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                  format === 'csv'
                    ? 'bg-[#35563B] text-white shadow-xs'
                    : 'bg-[#F7F6EF] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
                )}
              >
                <FileSpreadsheet size={14} />
                CSV Files (Nodes + Links)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('json')
                  setPreview(null)
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                  format === 'json'
                    ? 'bg-[#35563B] text-white shadow-xs'
                    : 'bg-[#F7F6EF] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
                )}
              >
                <FileJson size={14} />
                JSON Single Network File
              </button>
            </div>

            {/* Dropzone */}
            <div className="relative rounded-2xl border-2 border-dashed border-[#899B78]/40 bg-[#F7F6EF] p-8 text-center hover:border-[#35563B] hover:bg-[#E8EDE0]/30 transition-all cursor-pointer group">
              <input
                type="file"
                multiple
                accept=".csv,.json"
                onChange={(event) => {
                  setPreview(null)
                  void readFiles(event.target.files)
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Click or drag files here to upload"
              />
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8EDE0] text-[#35563B] group-hover:scale-110 transition-transform shadow-xs">
                  <Upload size={22} />
                </div>
                <h4 className="mt-3 font-serif text-base font-bold text-[#202B27]">
                  {fileName ? fileName : 'Upload Dataset Files'}
                </h4>
                <p className="mt-1 text-xs text-[#68716B]">
                  {fileName
                    ? 'File loaded. Review the metadata and click "Validate and Preview".'
                    : 'Drag & drop CSV/JSON files here or click to browse'}
                </p>
                <span className="mt-2 rounded-full bg-[#FCFBF7] border border-[#E5E6DC] px-3 py-1 text-[11px] font-mono text-[#899B78]">
                  Supports .csv and .json (up to {LARGE_FILE_THRESHOLDS.nodes} nodes)
                </span>
              </div>
            </div>

            {/* Direct Paste Area (Required for testing and manual input) */}
            <div className="rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-3.5">
              <button
                type="button"
                onClick={() => setPasteExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-[#202B27] cursor-pointer"
              >
                <span>Or paste the file contents instead of uploading</span>
                <span className="text-[11px] font-medium text-[#35563B]">
                  {pasteExpanded ? 'Collapse paste fields ▲' : 'Expand paste fields ▼'}
                </span>
              </button>

              {pasteExpanded && (
                <div className="mt-3 pt-3 border-t border-[#E5E6DC] space-y-3">
                  {format === 'csv' ? (
                    <>
                      <Field label="Node CSV">
                        <TextArea
                          rows={5}
                          value={nodesText}
                          onChange={(event) => setNodesText(event.target.value)}
                          placeholder={'id,name,trophic_role\nalgae,Algae,producer\nzooplankton,Zooplankton,primary-consumer'}
                          className="font-mono text-xs"
                        />
                      </Field>
                      <Field label="Link CSV (source = food, target = consumer)">
                        <TextArea
                          rows={5}
                          value={edgesText}
                          onChange={(event) => setEdgesText(event.target.value)}
                          placeholder={'source,target\nalgae,zooplankton'}
                          className="font-mono text-xs"
                        />
                      </Field>
                    </>
                  ) : (
                    <Field label="JSON network file contents">
                      <TextArea
                        rows={8}
                        value={jsonText}
                        onChange={(event) => setJsonText(event.target.value)}
                        placeholder='{ "nodes": [...], "edges": [...] }'
                        className="font-mono text-xs"
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dataset Metadata */}
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-xs space-y-3">
            <h3 className="font-serif text-base font-bold text-[#202B27]">
              Step 2: Metadata &amp; Provenance
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dataset Name">
                <TextInput
                  value={datasetName}
                  maxLength={80}
                  placeholder="e.g. Freshwater Pond (Survey 2024)"
                  onChange={(event) => setDatasetName(event.target.value)}
                />
              </Field>

              <Field label="Ecosystem Category">
                <SelectInput
                  value={ecosystem}
                  onChange={(event) => setEcosystem(event.target.value as EcosystemCategory)}
                >
                  {ECOSYSTEM_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {ECOSYSTEM_LABEL[category]}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Source Citation" hint="Without citation, marked 'Research source pending'.">
                <TextInput
                  value={citation}
                  maxLength={400}
                  placeholder="Author (year). Journal article or dataset report."
                  onChange={(event) => setCitation(event.target.value)}
                />
              </Field>

              <Field label="Origin / Archive Repository">
                <TextInput
                  value={origin}
                  maxLength={200}
                  placeholder="e.g. GlobalWeb, EcoBase, Dryad or Zenodo"
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </Field>

              <Field label="Source URL or DOI">
                <TextInput
                  value={sourceUrl}
                  maxLength={400}
                  placeholder="https://doi.org/... or https://..."
                  onChange={(event) => setSourceUrl(event.target.value)}
                />
              </Field>

              <Field label="Licence / Reuse Terms">
                <TextInput
                  value={license}
                  maxLength={200}
                  placeholder="e.g. CC-BY-4.0, CC0, or Academic"
                  onChange={(event) => setLicense(event.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Right Column: Validation, Cleaning Report & Live Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#202B27]">
              Step 3: Validation &amp; Activation
            </h3>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => runValidation()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#35563B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#263D2D] transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  Validate and preview
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#202B27] cursor-pointer">
                <input
                  type="checkbox"
                  checked={repair}
                  onChange={(event) => toggleRepair(event.target.checked)}
                  disabled={!preview}
                  className="h-4 w-4 rounded accent-[#35563B] cursor-pointer"
                />
                <span className="font-medium">
                  Repair supported issues
                </span>
              </label>
            </div>

            {/* Validation State Display */}
            {preview ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold font-mono',
                      blocking ? 'bg-[#FDF0ED] text-[#C84B31]' : 'bg-[#E8EDE0] text-[#35563B]',
                    )}
                  >
                    {blocking ? 'Import blocked' : 'Ready to import'}
                  </span>
                  {counts ? (
                    <>
                      <Badge tone="danger">{counts.errors} errors</Badge>
                      <Badge tone="highlight">{counts.warnings} warnings</Badge>
                      <Badge tone="neutral">{counts.info} notes</Badge>
                    </>
                  ) : null}
                </div>

                <div
                  className={cn(
                    'rounded-xl border p-4 shadow-xs',
                    blocking ? 'border-[#C84B31]/30 bg-[#FDF0ED]/50' : 'border-[#E5E6DC] bg-[#F7F6EF]',
                  )}
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#202B27]">
                    Validation Report
                  </p>
                  <IssueList issues={preview.issues} />
                </div>

                {preview.report ? (
                  <div className="rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-4 shadow-xs">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#202B27]">
                      Data-Cleaning Decisions
                    </p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                      {[
                        ['Accepted nodes', preview.report.acceptedNodeCount],
                        ['Accepted links', preview.report.acceptedEdgeCount],
                        ['Duplicate links removed', preview.report.duplicateEdgesRemoved],
                        ['Self-links excluded', preview.report.selfLinksExcluded],
                        ['Invalid links excluded', preview.report.invalidEdgesExcluded],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between gap-2 border-b border-[#E5E6DC]/50 pb-1">
                          <dt className="text-[#68716B]">{label}</dt>
                          <dd className="font-mono font-bold text-[#202B27]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                {/* Parsed Nodes & Edges Preview Table */}
                {preview.dataset ? (
                  <div className="rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-xs space-y-3">
                    <p className="text-xs font-bold text-[#202B27]">
                      Parsed Preview: {preview.dataset.nodes.length} nodes, {preview.dataset.edges.length} links
                    </p>

                    <div className="max-h-48 overflow-auto rounded-lg border border-[#E5E6DC]">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E5E6DC] bg-[#F7F6EF] text-[10px] font-bold uppercase tracking-wider text-[#68716B]">
                            <th className="py-2 pl-3 pr-2">ID</th>
                            <th className="py-2 pr-2">Common Name</th>
                            <th className="py-2 pr-2">Trophic Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E6DC]/60 font-mono text-[11px]">
                          {preview.dataset.nodes.slice(0, 8).map((node) => (
                            <tr key={node.id}>
                              <td className="py-1.5 pl-3 pr-2 text-[#35563B] font-semibold">{node.id}</td>
                              <td className="py-1.5 pr-2 font-sans text-xs text-[#202B27]">{node.name}</td>
                              <td className="py-1.5 pr-2 text-[#68716B]">{node.trophicRole}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={handleImport}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#35563B] px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#263D2D] transition-colors cursor-pointer"
                    >
                      <Upload size={16} />
                      Activate Dataset &amp; Open Explorer
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-8 text-center text-xs text-[#68716B]">
                Upload or paste your data files above, then click <strong>"Validate and preview"</strong> to review the structural integrity of your food web.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
