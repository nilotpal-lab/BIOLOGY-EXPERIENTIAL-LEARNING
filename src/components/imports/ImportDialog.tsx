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
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  countIssues,
  importNetwork,
  LARGE_FILE_THRESHOLDS,
} from '../../core/dataValidation'
import { validateGraphIntegrity } from '../../core/graphModel'
import {
  ECOSYSTEM_CATEGORIES,
  ECOSYSTEM_LABEL,
  type EcosystemCategory,
  type ImportPreview,
  type ValidationIssue,
} from '../../core/types'
import {
  Badge,
  Field,
  SelectInput,
  TextArea,
  TextInput,
  cn,
} from '../ui/primitives'

/* ============================================================================
 * ImportDialog — The Scientific Dataset Import Flow & Example Format Guide
 *
 * Implements the verified import pipeline with a crystal-clear Example Format
 * guide showing:
 * 1. Feeding Links table (source = food, target = consumer)
 * 2. Species Nodes table with valid trophic roles
 * 3. One-click sample templates download & copyable snippets
 * 4. In-browser local validation and repair before replacing active dataset
 * ========================================================================== */

type Format = 'csv' | 'json'

export const SAMPLE_NODES_CSV = `id,name,trophic_role,scientific_name,icon_key
phytoplankton,Phytoplankton,producer,Nitzschia closterium,phytoplankton
eelgrass,Eelgrass,producer,Zostera marina,macrophytes
cordgrass,Smooth Cordgrass,producer,Spartina alterniflora,macrophytes
benthic_algae,Benthic Microalgae,producer,Navicula arenaria,phytoplankton
zooplankton,Estuarine Copepods,primary-consumer,Acartia tonsa,zooplankton
grass_shrimp,Marsh Grass Shrimp,primary-consumer,Palaemonetes pugio,invertebrate
eastern_oyster,Eastern Oyster,primary-consumer,Crassostrea virginica,bivalve
ribbed_mussel,Atlantic Ribbed Mussel,primary-consumer,Geukensia demissa,bivalve
mummichog,Mummichog Killifish,secondary-consumer,Fundulus heteroclitus,fish
blue_crab,Atlantic Blue Crab,secondary-consumer,Callinectes sapidus,crustacean
atlantic_menhaden,Atlantic Menhaden,secondary-consumer,Brevoortia tyrannus,fish
striped_bass,Striped Bass,secondary-consumer,Morone saxatilis,fish
great_blue_heron,Great Blue Heron,apex-predator,Ardea herodias,bird
osprey,Western Osprey,apex-predator,Pandion haliaetus,bird`

export const SAMPLE_EDGES_CSV = `source,target,relationship
phytoplankton,zooplankton,grazing
phytoplankton,eastern_oyster,filter-feeding
phytoplankton,ribbed_mussel,filter-feeding
phytoplankton,atlantic_menhaden,filter-feeding
benthic_algae,grass_shrimp,herbivory
benthic_algae,mummichog,grazing
benthic_algae,eastern_oyster,filter-feeding
eelgrass,grass_shrimp,herbivory
cordgrass,grass_shrimp,detritivory
zooplankton,mummichog,predation
zooplankton,atlantic_menhaden,predation
zooplankton,blue_crab,predation
grass_shrimp,mummichog,predation
grass_shrimp,blue_crab,predation
grass_shrimp,great_blue_heron,predation
eastern_oyster,blue_crab,predation
ribbed_mussel,blue_crab,predation
mummichog,blue_crab,predation
mummichog,striped_bass,predation
mummichog,great_blue_heron,predation
atlantic_menhaden,striped_bass,predation
atlantic_menhaden,osprey,predation
blue_crab,striped_bass,predation
blue_crab,great_blue_heron,predation
striped_bass,great_blue_heron,predation
striped_bass,osprey,predation`

export const SAMPLE_JSON = `{
  "name": "Chesapeake Estuarine Marsh Food Web",
  "ecosystem": "marine",
  "summary": "Mid-Atlantic coastal estuarine salt-marsh ecosystem documenting trophic pathways among cordgrass, bivalves, crustaceans, forage fish, and top wading/raptor predators.",
  "provenance": {
    "citation": "Baird D, Ulanowicz RE. (1989). The seasonal dynamics of the Chesapeake Bay ecosystem. Ecological Monographs 59(4):329-364.",
    "origin": "Chesapeake Bay Ecological Monitoring Program",
    "license": "CC0 1.0 Universal",
    "node_unit": "species"
  },
  "nodes": [
    { "id": "phytoplankton", "name": "Phytoplankton", "trophic_role": "producer", "scientific_name": "Nitzschia closterium", "icon_key": "phytoplankton" },
    { "id": "eelgrass", "name": "Eelgrass", "trophic_role": "producer", "scientific_name": "Zostera marina", "icon_key": "macrophytes" },
    { "id": "cordgrass", "name": "Smooth Cordgrass", "trophic_role": "producer", "scientific_name": "Spartina alterniflora", "icon_key": "macrophytes" },
    { "id": "benthic_algae", "name": "Benthic Microalgae", "trophic_role": "producer", "scientific_name": "Navicula arenaria", "icon_key": "phytoplankton" },
    { "id": "zooplankton", "name": "Estuarine Copepods", "trophic_role": "primary-consumer", "scientific_name": "Acartia tonsa", "icon_key": "zooplankton" },
    { "id": "grass_shrimp", "name": "Marsh Grass Shrimp", "trophic_role": "primary-consumer", "scientific_name": "Palaemonetes pugio", "icon_key": "invertebrate" },
    { "id": "eastern_oyster", "name": "Eastern Oyster", "trophic_role": "primary-consumer", "scientific_name": "Crassostrea virginica", "icon_key": "bivalve" },
    { "id": "ribbed_mussel", "name": "Atlantic Ribbed Mussel", "trophic_role": "primary-consumer", "scientific_name": "Geukensia demissa", "icon_key": "bivalve" },
    { "id": "mummichog", "name": "Mummichog Killifish", "trophic_role": "secondary-consumer", "scientific_name": "Fundulus heteroclitus", "icon_key": "fish" },
    { "id": "blue_crab", "name": "Atlantic Blue Crab", "trophic_role": "secondary-consumer", "scientific_name": "Callinectes sapidus", "icon_key": "crustacean" },
    { "id": "atlantic_menhaden", "name": "Atlantic Menhaden", "trophic_role": "secondary-consumer", "scientific_name": "Brevoortia tyrannus", "icon_key": "fish" },
    { "id": "striped_bass", "name": "Striped Bass", "trophic_role": "secondary-consumer", "scientific_name": "Morone saxatilis", "icon_key": "fish" },
    { "id": "great_blue_heron", "name": "Great Blue Heron", "trophic_role": "apex-predator", "scientific_name": "Ardea herodias", "icon_key": "bird" },
    { "id": "osprey", "name": "Western Osprey", "trophic_role": "apex-predator", "scientific_name": "Pandion haliaetus", "icon_key": "bird" }
  ],
  "edges": [
    { "source": "phytoplankton", "target": "zooplankton", "relationship": "grazing" },
    { "source": "phytoplankton", "target": "eastern_oyster", "relationship": "filter-feeding" },
    { "source": "phytoplankton", "target": "ribbed_mussel", "relationship": "filter-feeding" },
    { "source": "phytoplankton", "target": "atlantic_menhaden", "relationship": "filter-feeding" },
    { "source": "benthic_algae", "target": "grass_shrimp", "relationship": "herbivory" },
    { "source": "benthic_algae", "target": "mummichog", "relationship": "grazing" },
    { "source": "benthic_algae", "target": "eastern_oyster", "relationship": "filter-feeding" },
    { "source": "eelgrass", "target": "grass_shrimp", "relationship": "herbivory" },
    { "source": "cordgrass", "target": "grass_shrimp", "relationship": "detritivory" },
    { "source": "zooplankton", "target": "mummichog", "relationship": "predation" },
    { "source": "zooplankton", "target": "atlantic_menhaden", "relationship": "predation" },
    { "source": "zooplankton", "target": "blue_crab", "relationship": "predation" },
    { "source": "grass_shrimp", "target": "mummichog", "relationship": "predation" },
    { "source": "grass_shrimp", "target": "blue_crab", "relationship": "predation" },
    { "source": "grass_shrimp", "target": "great_blue_heron", "relationship": "predation" },
    { "source": "eastern_oyster", "target": "blue_crab", "relationship": "predation" },
    { "source": "ribbed_mussel", "target": "blue_crab", "relationship": "predation" },
    { "source": "mummichog", "target": "blue_crab", "relationship": "predation" },
    { "source": "mummichog", "target": "striped_bass", "relationship": "predation" },
    { "source": "mummichog", "target": "great_blue_heron", "relationship": "predation" },
    { "source": "atlantic_menhaden", "target": "striped_bass", "relationship": "predation" },
    { "source": "atlantic_menhaden", "target": "osprey", "relationship": "predation" },
    { "source": "blue_crab", "target": "striped_bass", "relationship": "predation" },
    { "source": "blue_crab", "target": "great_blue_heron", "relationship": "predation" },
    { "source": "striped_bass", "target": "great_blue_heron", "relationship": "predation" },
    { "source": "striped_bass", "target": "osprey", "relationship": "predation" }
  ]
}`

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

export function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (preview: ImportPreview) => void
}) {
  // The dialog unmounts when closed, which used to wipe every typed field
  // (QA breaker: "metadata vanishes if the dialog is closed and reopened").
  // The draft now survives close/reopen via localStorage and is cleared on
  // a completed import or explicit reset.
  const draft = (() => {
    try {
      return JSON.parse(window.localStorage.getItem('fwg-import-draft') || '{}') as Record<string, unknown>
    } catch {
      return {} as Record<string, unknown>
    }
  })()
  const draftStr = (key: string, fallback = ''): string => (typeof draft[key] === 'string' ? (draft[key] as string) : fallback)

  const [format, setFormat] = useState<Format>(draftStr('format') === 'json' ? 'json' : 'csv')
  const [exampleTab, setExampleTab] = useState<'links' | 'nodes' | 'json'>('links')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [nodesText, setNodesText] = useState(draftStr('nodesText'))
  const [edgesText, setEdgesText] = useState(draftStr('edgesText'))
  const [jsonText, setJsonText] = useState(draftStr('jsonText'))
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [nodeFileName, setNodeFileName] = useState<string | undefined>(undefined)
  const [edgeFileName, setEdgeFileName] = useState<string | undefined>(undefined)
  const [datasetName, setDatasetName] = useState(draftStr('datasetName'))
  const [ecosystem, setEcosystem] = useState<EcosystemCategory>(
    draft.ecosystem === 'terrestrial' || draft.ecosystem === 'marine' ? (draft.ecosystem as EcosystemCategory) : 'freshwater',
  )
  const [citation, setCitation] = useState(draftStr('citation'))
  const [origin, setOrigin] = useState(draftStr('origin'))
  const [sourceUrl, setSourceUrl] = useState(draftStr('sourceUrl'))
  const [license, setLicense] = useState(draftStr('license'))
  const [nodeUnit, setNodeUnit] = useState(draftStr('nodeUnit'))
  const [repair, setRepair] = useState(draft.repair === true)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const payload = JSON.stringify({ format, nodesText, edgesText, jsonText, datasetName, ecosystem, citation, origin, sourceUrl, license, nodeUnit, repair })
    try {
      window.localStorage.setItem('fwg-import-draft', payload)
    } catch {
      // Storage may be unavailable (private mode); the dialog still works,
      // the draft just does not survive a close/reopen.
    }
  }, [open, format, nodesText, edgesText, jsonText, datasetName, ecosystem, citation, origin, sourceUrl, license, nodeUnit, repair])

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem('fwg-import-draft')
    } catch {
      // Non-fatal: see the persistence comment above.
    }
  }, [])

  useEffect(() => {
    if (open) firstFieldRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const reset = () => {
    setNodesText('')
    setEdgesText('')
    setJsonText('')
    setFileName(undefined)
    setNodeFileName(undefined)
    setEdgeFileName(undefined)
    setPreview(null)
    setRepair(false)
    clearDraft()
  }

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const loadExampleIntoForm = () => {
    setFormat('csv')
    setNodesText(SAMPLE_NODES_CSV)
    setEdgesText(SAMPLE_EDGES_CSV)
    setNodeFileName('sample-nodes-estuary.csv')
    setEdgeFileName('sample-links-estuary.csv')
    setFileName('sample-nodes-estuary.csv + sample-links-estuary.csv')
    setDatasetName('Chesapeake Estuarine Marsh Food Web')
    setEcosystem('marine')
    setCitation('Baird D, Ulanowicz RE. (1989). The seasonal dynamics of the Chesapeake Bay ecosystem. Ecological Monographs 59(4):329-364.')
    setOrigin('Chesapeake Bay Ecological Monitoring Program')
    setSourceUrl('https://doi.org/10.2307/1941367')
    setLicense('CC0 1.0 Universal')
    setNodeUnit('individual species')
    setPreview(null)
  }

  const looksLikeNodes = (text: string, name?: string) =>
    /(^|\n)\s*(id|species_id|node_id|taxon|species)\s*,/i.test(text) || (name ? /node|species|taxa/i.test(name) : false)
  const looksLikeEdges = (text: string, name?: string) =>
    /(^|\n)\s*(source|prey|food|from)\s*,/i.test(text) || (name ? /edge|link|interaction/i.test(name) : false)

  const handleNodeFileUpload = async (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    const text = await file.text()
    setNodesText(text)
    setNodeFileName(file.name)
    setFormat('csv')
    if (!datasetName) setDatasetName(file.name.replace(/[-_]?(nodes?|species|taxa)\.csv$/i, '').replace(/\.[^.]+$/, ''))
    setPreview(null)
  }

  const handleEdgeFileUpload = async (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    const text = await file.text()
    setEdgesText(text)
    setEdgeFileName(file.name)
    setFormat('csv')
    if (!datasetName) setDatasetName(file.name.replace(/[-_]?(links?|edges?|interactions?)\.csv$/i, '').replace(/\.[^.]+$/, ''))
    setPreview(null)
  }

  const clearNodeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNodesText('')
    setNodeFileName(undefined)
    setPreview(null)
  }

  const clearEdgeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEdgesText('')
    setEdgeFileName(undefined)
    setPreview(null)
  }

  const readFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const next: { name: string; text: string }[] = []
    for (const file of Array.from(files)) {
      const text = await file.text()
      next.push({ name: file.name, text })
    }
    const jsonEntry = next.find((entry) => entry.name.toLowerCase().endsWith('.json'))
    if (jsonEntry) {
      setFileName(jsonEntry.name)
      setJsonText(jsonEntry.text)
      setFormat('json')
      if (!datasetName) setDatasetName(jsonEntry.name.replace(/\.[^.]+$/, ''))
      setPreview(null)
      return
    }
    const csvEntries = next.filter(
      (entry) => entry.name.toLowerCase().endsWith('.csv') || entry.text.includes(',') || entry.text.trim().length > 0,
    )

    if (csvEntries.length >= 2) {
      setFormat('csv')
      const [first, second] = csvEntries
      if (looksLikeNodes(first.text, first.name) && looksLikeEdges(second.text, second.name)) {
        setNodesText(first.text)
        setNodeFileName(first.name)
        setEdgesText(second.text)
        setEdgeFileName(second.name)
        setFileName(`${first.name} + ${second.name}`)
      } else if (looksLikeEdges(first.text, first.name) && looksLikeNodes(second.text, second.name)) {
        setEdgesText(first.text)
        setEdgeFileName(first.name)
        setNodesText(second.text)
        setNodeFileName(second.name)
        setFileName(`${second.name} + ${first.name}`)
      } else {
        setNodesText(first.text)
        setNodeFileName(first.name)
        setEdgesText(second.text)
        setEdgeFileName(second.name)
        setFileName(`${first.name} + ${second.name}`)
      }
      if (!datasetName) setDatasetName(first.name.replace(/[-_]?(nodes?|links?|edges?|species)\.csv$/i, '').replace(/\.[^.]+$/, ''))
      setPreview(null)
    } else if (csvEntries.length === 1) {
      const entry = csvEntries[0]
      setFormat('csv')
      if (looksLikeEdges(entry.text, entry.name)) {
        setEdgesText(entry.text)
        setEdgeFileName(entry.name)
        setFileName(entry.name)
      } else {
        setNodesText(entry.text)
        setNodeFileName(entry.name)
        setFileName(entry.name)
      }
      if (!datasetName) setDatasetName(entry.name.replace(/[-_]?(nodes?|links?|edges?|species)\.csv$/i, '').replace(/\.[^.]+$/, ''))
      setPreview(null)
    }
  }

  const runValidation = (nextRepair = repair) => {
    const isCsv = format === 'csv'
    let effectiveUrl = sourceUrl.trim()
    if (effectiveUrl && !/^(https?:\/\/|doi:|10\.\d{4,9}\/)/i.test(effectiveUrl)) {
      if (/^(www\.|[a-zA-Z0-9.-]+\.(org|edu|gov|com|net|io|ac\.uk))/i.test(effectiveUrl)) {
        effectiveUrl = `https://${effectiveUrl}`
      }
    }

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
      sourceUrl: effectiveUrl || undefined,
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

    const url = effectiveUrl.trim()
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

  if (!open) return null

  const counts = preview ? countIssues(preview.issues) : null
  const blocking = preview?.blocked ?? false

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#122A23]/50 backdrop-blur-xs p-3 sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        className="relative w-full max-w-4xl rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 sm:p-7 shadow-xl space-y-6 my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E6DC] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-[#E8EDE0] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#35563B]">
                Data Intake Studio
              </span>
            </div>
            <h2 id="import-dialog-title" className="font-serif text-2xl font-bold text-[#202B27]">
              Import Food Web Dataset
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#68716B]">
              Files are parsed and validated strictly in this browser. Nothing is uploaded to any remote server.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F2E9] text-[#68716B] hover:bg-[#E5E6DC] hover:text-[#202B27] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* =====================================================================
            1. Clear Example Format Section (Prominently Highlighted)
            ===================================================================== */}
        <div className="rounded-2xl border border-[#E5E6DC] bg-[#F7F6EF] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Table size={16} className="text-[#35563B]" />
                <h3 className="font-serif text-base font-bold text-[#202B27]">
                  Example Data Format Guide
                </h3>
              </div>
              <p className="text-xs text-[#68716B]">
                Your food web data should follow this clean schema for feeding interactions and species nodes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadExampleIntoForm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8EDE0] px-3 py-1.5 text-xs font-semibold text-[#35563B] hover:bg-[#35563B] hover:text-white transition-colors cursor-pointer"
              >
                <Sparkles size={13} />
                Load Example into Form
              </button>
            </div>
          </div>

          {/* Example Format Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E5E6DC] pb-2">
            <button
              type="button"
              onClick={() => setExampleTab('links')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                exampleTab === 'links'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'bg-[#FCFBF7] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
              )}
            >
              1. Feeding Links (Link CSV)
            </button>
            <button
              type="button"
              onClick={() => setExampleTab('nodes')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                exampleTab === 'nodes'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'bg-[#FCFBF7] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
              )}
            >
              2. Species Nodes (Node CSV)
            </button>
            <button
              type="button"
              onClick={() => setExampleTab('json')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                exampleTab === 'json'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'bg-[#FCFBF7] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
              )}
            >
              3. Single JSON Network
            </button>
          </div>

          {/* Example Tab 1: Feeding Links CSV */}
          {exampleTab === 'links' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#35563B]/20 bg-[#E8EDE0]/50 p-3 text-xs text-[#263D2D]">
                <strong className="font-semibold text-[#35563B]">Link Direction Rule:</strong> In FoodWebGuard,{' '}
                <code className="font-mono font-bold text-[#35563B]">source</code> is always the food/prey organism, and{' '}
                <code className="font-mono font-bold text-[#35563B]">target</code> is always the consumer/predator organism (energy flows from source to target).
              </div>

              {/* Visual Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-[#FCFBF7]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E6DC] bg-[#F0F2E9] text-[10px] font-bold uppercase tracking-wider text-[#68716B]">
                      <th className="py-2 pl-3 pr-2">Food / Prey (<code className="font-mono text-[#35563B]">source</code>)</th>
                      <th className="py-2 pr-3">Consumer / Predator (<code className="font-mono text-[#35563B]">target</code>)</th>
                      <th className="py-2 pr-3">Interaction (<code className="font-mono">relationship</code>)</th>
                      <th className="py-2 pr-3">Ecological Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E6DC]/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-2 pl-3 pr-2 text-[#35563B] font-semibold">macrophytes</td>
                      <td className="py-2 pr-3 text-[#263D2D] font-semibold">snail</td>
                      <td className="py-2 pr-3 text-[#68716B]">herbivory</td>
                      <td className="py-2 pr-3 font-sans text-xs text-[#68716B]">Freshwater Snail eats Macrophytes</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 text-[#35563B] font-semibold">snail</td>
                      <td className="py-2 pr-3 text-[#263D2D] font-semibold">carp</td>
                      <td className="py-2 pr-3 text-[#68716B]">predation</td>
                      <td className="py-2 pr-3 font-sans text-xs text-[#68716B]">Common Carp eats Freshwater Snail</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 text-[#35563B] font-semibold">carp</td>
                      <td className="py-2 pr-3 text-[#263D2D] font-semibold">pike</td>
                      <td className="py-2 pr-3 text-[#68716B]">predation</td>
                      <td className="py-2 pr-3 font-sans text-xs text-[#68716B]">Northern Pike preys on Common Carp</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 text-[#35563B] font-semibold">pike</td>
                      <td className="py-2 pr-3 text-[#263D2D] font-semibold">grey_heron</td>
                      <td className="py-2 pr-3 text-[#68716B]">predation</td>
                      <td className="py-2 pr-3 font-sans text-xs text-[#68716B]">Grey Heron preys on Northern Pike</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 text-[#35563B] font-semibold">zooplankton</td>
                      <td className="py-2 pr-3 text-[#263D2D] font-semibold">perch</td>
                      <td className="py-2 pr-3 text-[#68716B]">predation</td>
                      <td className="py-2 pr-3 font-sans text-xs text-[#68716B]">European Perch feeds on Zooplankton</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#68716B]">
                  Required headers: <code className="font-mono text-[#263D2D]">source,target</code> (synonyms: <code className="font-mono">food,consumer</code> or <code className="font-mono">prey,predator</code>).
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SAMPLE_EDGES_CSV, 'edges')}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] px-2.5 py-1 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] cursor-pointer"
                  >
                    {copiedKey === 'edges' ? <Check size={12} className="text-[#35563B]" /> : <Copy size={12} />}
                    {copiedKey === 'edges' ? 'Copied' : 'Copy CSV Text'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBlob('sample_feeding_links.csv', SAMPLE_EDGES_CSV)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#35563B] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#263D2D] cursor-pointer shadow-xs"
                  >
                    <Download size={12} />
                    Download Link CSV Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Example Tab 2: Species Nodes CSV */}
          {exampleTab === 'nodes' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#35563B]/20 bg-[#E8EDE0]/50 p-3 text-xs text-[#263D2D]">
                <strong className="font-semibold text-[#35563B]">Accepted Trophic Roles:</strong>{' '}
                <span className="inline-flex items-center gap-1.5 flex-wrap font-mono text-[11px] mt-1">
                  <span className="rounded bg-[#B5D39A]/40 px-1.5 py-0.5 text-[#263D2D]">producer</span>
                  <span className="rounded bg-[#91BFE0]/40 px-1.5 py-0.5 text-[#1E4C73]">primary-consumer</span>
                  <span className="rounded bg-[#F3D98B]/40 px-1.5 py-0.5 text-[#735A12]">secondary-consumer</span>
                  <span className="rounded bg-[#F1B36F]/40 px-1.5 py-0.5 text-[#7D4507]">tertiary-consumer</span>
                  <span className="rounded bg-[#EF9A88]/40 px-1.5 py-0.5 text-[#732717]">apex-predator</span>
                  <span className="rounded bg-[#E5E6DC] px-1.5 py-0.5 text-[#4A544E]">basal-group</span>
                </span>
              </div>

              {/* Visual Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-[#FCFBF7]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E6DC] bg-[#F0F2E9] text-[10px] font-bold uppercase tracking-wider text-[#68716B]">
                      <th className="py-2 pl-3 pr-2">Node ID (<code className="font-mono text-[#35563B]">id</code>)</th>
                      <th className="py-2 pr-3">Common Name (<code className="font-mono text-[#35563B]">name</code>)</th>
                      <th className="py-2 pr-3">Trophic Role (<code className="font-mono">trophic_role</code>)</th>
                      <th className="py-2 pr-3">Scientific Name (<code className="font-mono">scientific_name</code>)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E6DC]/60 text-xs">
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-mono text-[11px] text-[#35563B] font-semibold">grey_heron</td>
                      <td className="py-2 pr-3 font-semibold text-[#202B27]">Grey Heron</td>
                      <td className="py-2 pr-3"><span className="rounded bg-[#EF9A88]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#732717]">apex-predator</span></td>
                      <td className="py-2 pr-3 italic text-[#68716B]">Ardea cinerea</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-mono text-[11px] text-[#35563B] font-semibold">pike</td>
                      <td className="py-2 pr-3 font-semibold text-[#202B27]">Northern Pike</td>
                      <td className="py-2 pr-3"><span className="rounded bg-[#F1B36F]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#734507]">tertiary-consumer</span></td>
                      <td className="py-2 pr-3 italic text-[#68716B]">Esox lucius</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-mono text-[11px] text-[#35563B] font-semibold">carp</td>
                      <td className="py-2 pr-3 font-semibold text-[#202B27]">Common Carp</td>
                      <td className="py-2 pr-3"><span className="rounded bg-[#F3D98B]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#735A12]">secondary-consumer</span></td>
                      <td className="py-2 pr-3 italic text-[#68716B]">Cyprinus carpio</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-mono text-[11px] text-[#35563B] font-semibold">snail</td>
                      <td className="py-2 pr-3 font-semibold text-[#202B27]">Freshwater Snail</td>
                      <td className="py-2 pr-3"><span className="rounded bg-[#91BFE0]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#1E4C73]">primary-consumer</span></td>
                      <td className="py-2 pr-3 italic text-[#68716B]">Lymnaea stagnalis</td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-mono text-[11px] text-[#35563B] font-semibold">macrophytes</td>
                      <td className="py-2 pr-3 font-semibold text-[#202B27]">Macrophytes</td>
                      <td className="py-2 pr-3"><span className="rounded bg-[#B5D39A]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#263D2D]">producer</span></td>
                      <td className="py-2 pr-3 italic text-[#68716B]">Potamogeton crispus</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#68716B]">
                  Required headers: <code className="font-mono text-[#263D2D]">id,name</code>. Optional: <code className="font-mono">trophic_role,scientific_name,description</code>.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SAMPLE_NODES_CSV, 'nodes')}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] px-2.5 py-1 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] cursor-pointer"
                  >
                    {copiedKey === 'nodes' ? <Check size={12} className="text-[#35563B]" /> : <Copy size={12} />}
                    {copiedKey === 'nodes' ? 'Copied' : 'Copy CSV Text'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBlob('sample_species_nodes.csv', SAMPLE_NODES_CSV)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#35563B] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#263D2D] cursor-pointer shadow-xs"
                  >
                    <Download size={12} />
                    Download Node CSV Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Example Tab 3: Single JSON Network */}
          {exampleTab === 'json' && (
            <div className="space-y-3">
              <pre className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] p-3.5 font-mono text-[11px] leading-relaxed text-[#263D2D]">
                {SAMPLE_JSON}
              </pre>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#68716B]">
                  Must include root <code className="font-mono text-[#263D2D]">nodes</code> and <code className="font-mono text-[#263D2D]">edges</code> arrays.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SAMPLE_JSON, 'json')}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7] px-2.5 py-1 text-xs font-medium text-[#202B27] hover:bg-[#F0F2E9] cursor-pointer"
                  >
                    {copiedKey === 'json' ? <Check size={12} className="text-[#35563B]" /> : <Copy size={12} />}
                    {copiedKey === 'json' ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBlob('sample_foodweb.json', SAMPLE_JSON, 'application/json')}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#35563B] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#263D2D] cursor-pointer shadow-xs"
                  >
                    <Download size={12} />
                    Download JSON Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            2. Format Selection & File Upload Dropzone
            ===================================================================== */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormat('csv')
                setPreview(null)
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
                format === 'csv'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'bg-[#FCFBF7] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
              )}
            >
              <FileSpreadsheet size={15} />
              CSV Files (Node CSV + Link CSV)
            </button>
            <button
              type="button"
              onClick={() => {
                setFormat('json')
                setPreview(null)
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
                format === 'json'
                  ? 'bg-[#35563B] text-white shadow-xs'
                  : 'bg-[#FCFBF7] text-[#68716B] border border-[#E5E6DC] hover:bg-[#F0F2E9]',
              )}
            >
              <FileJson size={15} />
              JSON Single-File Network
            </button>
          </div>

          {/* Visual Dropzones */}
          {format === 'csv' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Slot 1: Species Nodes CSV */}
                <div
                  className={cn(
                    'relative rounded-2xl border-2 border-dashed p-4 transition-all text-center group cursor-pointer',
                    nodesText.trim()
                      ? 'border-[#35563B] bg-[#E8EDE0]/40'
                      : 'border-[#899B78]/40 bg-[#F7F6EF] hover:border-[#35563B] hover:bg-[#E8EDE0]/20',
                  )}
                >
                  <input
                    ref={firstFieldRef}
                    type="file"
                    accept=".csv"
                    onChange={(event) => {
                      setPreview(null)
                      void handleNodeFileUpload(event.target.files)
                      event.target.value = ''
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Upload Species Nodes CSV"
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-105',
                        nodesText.trim() ? 'bg-[#35563B] text-white' : 'bg-[#E8EDE0] text-[#35563B]',
                      )}
                    >
                      {nodesText.trim() ? <Check size={18} /> : <FileSpreadsheet size={18} />}
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-[#202B27]">
                      1. Species Nodes CSV
                    </h4>
                    <p className="mt-0.5 text-[11px] text-[#68716B]">
                      {nodeFileName
                        ? nodeFileName
                        : nodesText.trim()
                        ? 'Species data entered'
                        : 'Click to browse or drop CSV file'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold',
                          nodesText.trim()
                            ? 'bg-[#35563B] text-white'
                            : 'bg-[#FCFBF7] border border-[#E5E6DC] text-[#68716B]',
                        )}
                      >
                        {nodesText.trim()
                          ? `✓ ${Math.max(0, nodesText.trim().split('\n').filter(Boolean).length - 1)} species loaded`
                          : 'No file chosen'}
                      </span>
                      {nodesText.trim() ? (
                        <button
                          type="button"
                          onClick={clearNodeFile}
                          className="relative z-20 rounded-full bg-[#E5E6DC] p-0.5 text-[#68716B] hover:bg-[#C84B31] hover:text-white transition-colors"
                          title="Clear nodes file"
                        >
                          <X size={12} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Slot 2: Feeding Links CSV */}
                <div
                  className={cn(
                    'relative rounded-2xl border-2 border-dashed p-4 transition-all text-center group cursor-pointer',
                    edgesText.trim()
                      ? 'border-[#35563B] bg-[#E8EDE0]/40'
                      : 'border-[#899B78]/40 bg-[#F7F6EF] hover:border-[#35563B] hover:bg-[#E8EDE0]/20',
                  )}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(event) => {
                      setPreview(null)
                      void handleEdgeFileUpload(event.target.files)
                      event.target.value = ''
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Upload Feeding Links CSV"
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-105',
                        edgesText.trim() ? 'bg-[#35563B] text-white' : 'bg-[#E8EDE0] text-[#35563B]',
                      )}
                    >
                      {edgesText.trim() ? <Check size={18} /> : <FileSpreadsheet size={18} />}
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-[#202B27]">
                      2. Feeding Links CSV
                    </h4>
                    <p className="mt-0.5 text-[11px] text-[#68716B]">
                      {edgeFileName
                        ? edgeFileName
                        : edgesText.trim()
                        ? 'Link data entered'
                        : 'Click to browse or drop CSV file'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold',
                          edgesText.trim()
                            ? 'bg-[#35563B] text-white'
                            : 'bg-[#FCFBF7] border border-[#E5E6DC] text-[#68716B]',
                        )}
                      >
                        {edgesText.trim()
                          ? `✓ ${Math.max(0, edgesText.trim().split('\n').filter(Boolean).length - 1)} links loaded`
                          : 'No file chosen'}
                      </span>
                      {edgesText.trim() ? (
                        <button
                          type="button"
                          onClick={clearEdgeFile}
                          className="relative z-20 rounded-full bg-[#E5E6DC] p-0.5 text-[#68716B] hover:bg-[#C84B31] hover:text-white transition-colors"
                          title="Clear links file"
                        >
                          <X size={12} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-file dropzone option */}
              <div className="relative rounded-xl border border-dashed border-[#899B78]/30 bg-[#F7F6EF] py-2 px-3 text-center hover:border-[#35563B] transition-all cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".csv,.json"
                  onChange={(event) => {
                    setPreview(null)
                    void readFiles(event.target.files)
                    event.target.value = ''
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Or drop both CSV files together"
                />
                <span className="text-[11px] text-[#68716B]">
                  💡 <strong>Drag & Drop Shortcut:</strong> You can also select or drop both CSV files together into this area at once.
                </span>
              </div>

              {/* Status Alert Banner */}
              {nodesText.trim() && !edgesText.trim() && (
                <div className="flex items-center gap-2 rounded-xl border border-[#F1B36F]/40 bg-[#FFF8EE] p-3 text-xs text-[#7D4507]">
                  <AlertTriangle size={15} className="text-[#F1B36F] shrink-0" />
                  <span>
                    <strong>Species Nodes file loaded!</strong> Now please select or drop your <strong>Feeding Links CSV</strong> in Slot 2 above to complete the network.
                  </span>
                </div>
              )}

              {!nodesText.trim() && edgesText.trim() && (
                <div className="flex items-center gap-2 rounded-xl border border-[#F1B36F]/40 bg-[#FFF8EE] p-3 text-xs text-[#7D4507]">
                  <AlertTriangle size={15} className="text-[#F1B36F] shrink-0" />
                  <span>
                    <strong>Feeding Links file loaded!</strong> Now please select or drop your <strong>Species Nodes CSV</strong> in Slot 1 above to define species names.
                  </span>
                </div>
              )}

              {nodesText.trim() && edgesText.trim() && (
                <div className="flex items-center gap-2 rounded-xl border border-[#35563B]/30 bg-[#E8EDE0]/50 p-3 text-xs text-[#263D2D]">
                  <CheckCircle2 size={15} className="text-[#35563B] shrink-0" />
                  <span>
                    <strong>Both CSV files loaded successfully!</strong> Click <strong>"Validate and preview"</strong> below to inspect your dataset.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Single JSON Dropzone */
            <div
              className={cn(
                'relative rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer group',
                jsonText.trim()
                  ? 'border-[#35563B] bg-[#E8EDE0]/40'
                  : 'border-[#899B78]/40 bg-[#F7F6EF] hover:border-[#35563B] hover:bg-[#E8EDE0]/20',
              )}
            >
              <input
                ref={firstFieldRef}
                type="file"
                accept=".json"
                onChange={(event) => {
                  setPreview(null)
                  void readFiles(event.target.files)
                  event.target.value = ''
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Click or drag JSON file here to upload"
              />
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-105',
                    jsonText.trim() ? 'bg-[#35563B] text-white' : 'bg-[#E8EDE0] text-[#35563B]',
                  )}
                >
                  {jsonText.trim() ? <Check size={22} /> : <Upload size={22} />}
                </div>
                <h4 className="mt-3 font-serif text-base font-bold text-[#202B27]">
                  {fileName ? fileName : 'Upload Single JSON Network'}
                </h4>
                <p className="mt-1 text-xs text-[#68716B]">
                  {jsonText.trim()
                    ? 'JSON network file loaded. Click "Validate and preview" below.'
                    : 'Click to browse or drag & drop your standalone .json network file here'}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-mono',
                      jsonText.trim()
                        ? 'bg-[#35563B] text-white font-bold'
                        : 'bg-[#FCFBF7] border border-[#E5E6DC] text-[#68716B]',
                    )}
                  >
                    {jsonText.trim() ? '✓ JSON Loaded' : 'No file chosen'}
                  </span>
                  {jsonText.trim() ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setJsonText('')
                        setFileName(undefined)
                        setPreview(null)
                      }}
                      className="relative z-20 rounded-full bg-[#E5E6DC] p-1 text-[#68716B] hover:bg-[#C84B31] hover:text-white transition-colors"
                      title="Clear JSON file"
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </div>
                <span className="mt-2 text-[10px] font-mono text-[#899B78]">
                  Supports: .json (up to {LARGE_FILE_THRESHOLDS.nodes} species nodes)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            3. Metadata & Dataset Attribution
            ===================================================================== */}
        <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-xs space-y-3">
          <h3 className="font-serif text-sm font-bold text-[#202B27]">
            Dataset Metadata &amp; Provenance
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

            <Field label="Ecosystem Category" hint="Assigned in the Data Library and comparative benchmarks.">
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

            <Field label="Source Citation" hint="Without a citation, marked 'Research source pending'.">
              <TextInput
                value={citation}
                maxLength={400}
                placeholder="Author (year). Publication Title. Journal."
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
                placeholder="e.g. CC-BY-4.0, CC0, or Academic Open Access"
                onChange={(event) => setLicense(event.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* =====================================================================
            4. Direct Paste Area (Required by unit test ui.test.tsx)
            ===================================================================== */}
        {format === 'csv' ? (
          <details className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-xs">
            <summary className="cursor-pointer text-xs font-semibold text-[#202B27]">
              Or paste the file contents instead of uploading
            </summary>
            <div className="mt-3 pt-3 border-t border-[#E5E6DC] grid gap-3 sm:grid-cols-2">
              <Field label="Node CSV">
                <TextArea
                  rows={6}
                  value={nodesText}
                  onChange={(event) => setNodesText(event.target.value)}
                  placeholder={'id,name,trophic_role\nalgae,Algae,producer\nzooplankton,Zooplankton,primary-consumer'}
                  className="font-mono text-xs"
                />
              </Field>
              <Field label="Link CSV (source = food, target = consumer)">
                <TextArea
                  rows={6}
                  value={edgesText}
                  onChange={(event) => setEdgesText(event.target.value)}
                  placeholder={'source,target\nalgae,zooplankton'}
                  className="font-mono text-xs"
                />
              </Field>
            </div>
          </details>
        ) : (
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-xs">
            <Field label="JSON network file contents">
              <TextArea
                rows={8}
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                placeholder='{ "nodes": [...], "edges": [...] }'
                className="font-mono text-xs"
              />
            </Field>
          </div>
        )}

        {/* =====================================================================
            5. Validation Action Bar & Repair Toggle
            ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E6DC] bg-[#F7F6EF] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => runValidation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#35563B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#263D2D] transition-colors cursor-pointer"
            >
              <Upload size={14} />
              Validate and preview
            </button>

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] px-3.5 py-2 text-xs font-medium text-[#68716B] hover:bg-[#F0F2E9] hover:text-[#202B27] transition-colors cursor-pointer"
            >
              Clear
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
              Repair supported issues (exclude links with undefined endpoints, keep the first duplicate node)
            </span>
          </label>
        </div>

        {/* =====================================================================
            6. Validation Report & Data-Cleaning Preview
            ===================================================================== */}
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

            {/* Issues List */}
            <div
              className={cn(
                'rounded-2xl border p-4 shadow-xs',
                blocking ? 'border-[#C84B31]/30 bg-[#FDF0ED]/50' : 'border-[#E5E6DC] bg-[#FCFBF7]',
              )}
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#202B27]">
                Validation Report
              </p>
              <IssueList issues={preview.issues} />
            </div>

            {/* Cleaning Report */}
            {preview.report ? (
              <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-xs">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#202B27]">
                  Data-Cleaning Report
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                  {[
                    ['Input nodes', preview.report.inputNodeCount],
                    ['Input link records', preview.report.inputEdgeCount],
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

            {/* Parsed Nodes & Edges Preview */}
            {preview.dataset ? (
              <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#202B27]">
                    Preview — {preview.dataset.nodes.length} nodes, {preview.dataset.edges.length} links (Status:{' '}
                    {preview.dataset.sourceStatus === 'research-pending'
                      ? 'Research source pending'
                      : 'Research source provided, validation pending'}
                    )
                  </p>
                </div>

                <div className="max-h-48 overflow-auto rounded-xl border border-[#E5E6DC]">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E6DC] bg-[#F7F6EF] text-[10px] font-bold uppercase tracking-wider text-[#68716B]">
                        <th className="py-2 pl-3 pr-2">Node ID</th>
                        <th className="py-2 pr-2">Common Name</th>
                        <th className="py-2 pr-2">Trophic Role</th>
                        <th className="py-2 pr-2">Evidence Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E6DC]/60 font-mono text-[11px]">
                      {preview.dataset.nodes.slice(0, 10).map((node) => (
                        <tr key={node.id}>
                          <td className="py-1.5 pl-3 pr-2 text-[#35563B] font-semibold">{node.id}</td>
                          <td className="py-1.5 pr-2 font-sans text-xs text-[#202B27]">{node.name}</td>
                          <td className="py-1.5 pr-2 text-[#68716B]">{node.trophicRole}</td>
                          <td className="py-1.5 pr-2 text-[#899B78]">{node.roleEvidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-[#68716B]">
                  Link preview: {preview.dataset.edges.slice(0, 6).map((edge) => `${edge.source} → ${edge.target}`).join(', ')}
                  {preview.dataset.edges.length > 6 ? ` … (${preview.dataset.edges.length} links in total)` : ''}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Dialog Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E6DC] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] px-4 py-2 text-xs font-medium text-[#68716B] hover:bg-[#F0F2E9] hover:text-[#202B27] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!preview?.dataset}
            onClick={() => {
              if (preview?.dataset) {
                onImport(preview)
                reset()
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#35563B] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#263D2D] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Upload size={14} />
            Import dataset
          </button>
        </div>
      </div>
    </div>
  )
}
