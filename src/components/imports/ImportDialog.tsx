import { AlertTriangle, CheckCircle2, FileJson, FileSpreadsheet, Info, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  countIssues,
  EDGE_CSV_COLUMNS,
  importNetwork,
  LARGE_FILE_THRESHOLDS,
  NODE_CSV_COLUMNS,
  REQUIRED_EDGE_COLUMNS,
  REQUIRED_NODE_COLUMNS,
  SUPPORTED_EXTENSIONS,
} from '../../core/dataValidation'
import { validateGraphIntegrity } from '../../core/graphModel'
import {
  ECOSYSTEM_CATEGORIES,
  ECOSYSTEM_LABEL,
  TROPHIC_ROLES,
  type EcosystemCategory,
  type ImportPreview,
  type ValidationIssue,
} from '../../core/types'
import {
  Badge,
  Button,
  Callout,
  Field,
  SelectInput,
  TextArea,
  TextInput,
  cn,
} from '../ui/primitives'

/* ============================================================================
 * ImportDialog — the import flow (Prompt §6.2).
 *
 * Parse locally → validate → preview nodes, links, warnings and metadata →
 * let the user repair supported issues or cancel → import only after validation.
 * A failed import NEVER replaces the currently loaded dataset, because the
 * preview only carries a dataset when it is not blocked.
 * ========================================================================== */

type Format = 'csv' | 'json'

const SEVERITY_ICON = {
  error: <AlertTriangle size={13} className="text-danger" aria-hidden="true" />,
  warning: <AlertTriangle size={13} className="text-highlight" aria-hidden="true" />,
  info: <Info size={13} className="text-fg-faint" aria-hidden="true" />,
} as const

function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-secondary">
        <CheckCircle2 size={13} aria-hidden="true" /> No problems found in the uploaded files.
      </p>
    )
  }
  return (
    <ul className="space-y-1.5">
      {issues.map((issue, index) => (
        <li key={`${issue.code}-${index}`} className="flex gap-2 text-[12px] leading-relaxed">
          <span className="mt-0.5">{SEVERITY_ICON[issue.severity]}</span>
          <span className="text-fg-muted">
            <span className="mr-1 font-mono text-[10px] uppercase text-fg-faint">{issue.code}</span>
            {issue.message}
            {issue.fixable && issue.severity === 'error' ? (
              <span className="ml-1 text-fg-faint">This can be excluded explicitly, or fixed in the file.</span>
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
  const [format, setFormat] = useState<Format>('csv')
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
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

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

  const reset = useCallback(() => {
    setNodesText('')
    setEdgesText('')
    setJsonText('')
    setFileName(undefined)
    setPreview(null)
    setRepair(false)
  }, [])

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
      // The larger table is assumed to be the node list and the other the links.
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
    // Only the active format's inputs are passed. Stale text from the other
    // tab must never leak into validation — otherwise, for example, an empty
    // JSON paste on the JSON tab would be reported with the CSV error wording.
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

    // A structural second opinion on the accepted network, so the preview shows
    // the same integrity checks the graph model will rely on.
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

    // Metadata is never silently trusted: a Source URL or DOI that does not
    // look like one is surfaced as a warning instead of being stored quietly.
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
              'The Source URL or DOI does not start with "https://", "http://", "doi:" or a DOI prefix like "10.1234/". It is stored exactly as typed — check it is a working link or DOI.',
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#122A23]/40 backdrop-blur-xs p-3 sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        className="fwg-card w-full max-w-3xl p-4 sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="import-dialog-title" className="text-base font-semibold text-fg">
              Import a food-web dataset
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
              Files are parsed and validated entirely in this browser. Nothing is uploaded to any service, and
              the currently loaded dataset is only replaced after a successful validation.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close import dialog">
            <X size={16} />
          </Button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button
            variant={format === 'csv' ? 'primary' : 'outline'}
            icon={<FileSpreadsheet size={14} />}
            onClick={() => {
              setFormat('csv')
              setPreview(null)
            }}
          >
            CSV node file + CSV link file
          </Button>
          <Button
            variant={format === 'json' ? 'primary' : 'outline'}
            icon={<FileJson size={14} />}
            onClick={() => {
              setFormat('json')
              setPreview(null)
            }}
          >
            JSON network file
          </Button>
        </div>

        <Callout tone="info" className="mb-3" title="Link direction is mandatory">
          In every file, <strong>source is the food organism and target is the consumer</strong>. For example{' '}
          <code className="font-mono text-[11px]">algae,zooplankton</code> means zooplankton consumes algae. Links
          are never reversed during import or display.
        </Callout>

        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-line-soft bg-surface-2 p-2.5">
            <p className="text-[11px] font-medium text-fg-muted">Node file columns</p>
            <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-fg-faint">
              {NODE_CSV_COLUMNS.join(', ')}
            </p>
            <p className="mt-1 text-[11px] text-fg-faint">
              Required: {REQUIRED_NODE_COLUMNS.join(', ')}. All other columns are optional.
            </p>
            <p className="mt-1 text-[11px] text-fg-faint">
              <span className="font-mono">trophic_role</span> accepts:{' '}
              {TROPHIC_ROLES.join(', ')}. Unknown values are normalised to{' '}
              <span className="font-mono">other</span> and reported as a warning.
            </p>
          </div>
          <div className="rounded-xl border border-line-soft bg-surface-2 p-2.5">
            <p className="text-[11px] font-medium text-fg-muted">Link file columns</p>
            <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-fg-faint">
              {EDGE_CSV_COLUMNS.join(', ')}
            </p>
            <p className="mt-1 text-[11px] text-fg-faint">
              Required: {REQUIRED_EDGE_COLUMNS.join(', ')}. Nodes must exist for both endpoints.
            </p>
          </div>
        </div>

        {format === 'json' ? (
          <details className="mb-3 rounded-xl border border-line-soft bg-surface-2 p-2.5">
            <summary className="cursor-pointer text-[12px] font-medium text-fg-muted">
              Documented JSON schema
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-soft p-2.5 font-mono text-[10.5px] leading-relaxed text-fg-muted">
{`{
  "name": "Woodland network",
  "ecosystem": "terrestrial",
  "provenance": {
    "citation": "Author (year). Title. Journal.",
    "origin": "Publisher or repository",
    "source_url": "https://…",
    "license": "CC-BY-4.0",
    "node_unit": "species" | "trophic groups"
  },
  "nodes": [
    { "id": "oak", "name": "Oak", "node_type": "species",
      "trophic_role": "producer", "icon_key": "oak",
      "description": "…", "scientific_name": null }
  ],
  "edges": [ { "source": "oak", "target": "aphid", "relationship": "herbivory" } ]
}`}
            </pre>
            <p className="mt-1.5 text-[11px] text-fg-faint">
              The root must be an object with a <code className="font-mono">nodes</code> array and an{' '}
              <code className="font-mono">edges</code> (or <code className="font-mono">links</code>) array. Field
              names may be snake_case or camelCase.
            </p>
          </details>
        ) : null}

        <div className="mb-3 grid gap-3">
          <Field
            label="Files (CSV node + CSV link, or a single JSON file)"
            hint={`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}. Very large files (over ${LARGE_FILE_THRESHOLDS.nodes} nodes or ${LARGE_FILE_THRESHOLDS.edges} links) are accepted but flagged, because a full-species analysis will be slow.`}
          >
            <input
              ref={firstFieldRef}
              type="file"
              multiple
              accept=".csv,.json"
              onChange={(event) => {
                setPreview(null)
                void readFiles(event.target.files)
              }}
              className="fwg-field w-full px-3 py-2 text-[12px] text-fg-muted"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dataset name">
              <TextInput
                value={datasetName}
                maxLength={80}
                placeholder="e.g. North pond, 2019 survey"
                onChange={(event) => setDatasetName(event.target.value)}
              />
            </Field>
            <Field
              label="Ecosystem category"
              hint="The import is filed under this ecosystem in the Data Library. Freshwater is pre-selected — change it if your network is terrestrial or marine."
            >
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
            <Field label="Source citation" hint="Without a citation the dataset is stored as “Research source pending” and is never marked verified.">
              <TextInput
                value={citation}
                maxLength={400}
                placeholder="Author (year). Title. Journal."
                onChange={(event) => setCitation(event.target.value)}
              />
            </Field>
            <Field label="Origin / repository">
              <TextInput
                value={origin}
                maxLength={200}
                placeholder="Publisher, repository or archive"
                onChange={(event) => setOrigin(event.target.value)}
              />
            </Field>
            <Field label="Source URL or DOI">
              <TextInput
                value={sourceUrl}
                maxLength={400}
                placeholder="https://… or 10.xxxx/…"
                onChange={(event) => setSourceUrl(event.target.value)}
              />
            </Field>
            <Field label="Licence or reuse conditions">
              <TextInput
                value={license}
                maxLength={200}
                placeholder="e.g. CC-BY-4.0, or “Not provided”"
                onChange={(event) => setLicense(event.target.value)}
              />
            </Field>
            <Field label="Node unit" hint="State whether nodes are individual species or aggregated trophic groups.">
              <TextInput
                value={nodeUnit}
                maxLength={120}
                placeholder="e.g. individual species"
                onChange={(event) => setNodeUnit(event.target.value)}
              />
            </Field>
          </div>

          {format === 'csv' ? (
            <details className="rounded-xl border border-line-soft bg-surface-2 p-2.5">
              <summary className="cursor-pointer text-[12px] font-medium text-fg-muted">
                Or paste the file contents instead of uploading
              </summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Node CSV">
                  <TextArea
                    rows={5}
                    value={nodesText}
                    onChange={(event) => setNodesText(event.target.value)}
                    placeholder={'id,name,trophic_role\n…'}
                    className="font-mono text-[11px]"
                  />
                </Field>
                <Field label="Link CSV (source = food, target = consumer)">
                  <TextArea
                    rows={5}
                    value={edgesText}
                    onChange={(event) => setEdgesText(event.target.value)}
                    placeholder={'source,target\n…'}
                    className="font-mono text-[11px]"
                  />
                </Field>
              </div>
            </details>
          ) : (
            <Field label="JSON network file contents">
              <TextArea
                rows={6}
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                placeholder='{ "nodes": [...], "edges": [...] }'
                className="font-mono text-[11px]"
              />
            </Field>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={<Upload size={14} />} onClick={() => runValidation()}>
            Validate and preview
          </Button>
          <Button variant="ghost" onClick={reset}>
            Clear
          </Button>
          <label className="flex items-center gap-1.5 text-[12px] text-fg-muted">
            <input
              type="checkbox"
              checked={repair}
              onChange={(event) => toggleRepair(event.target.checked)}
              disabled={!preview}
              className="accent-[#0F6B52]"
            />
            Repair supported issues (exclude links with undefined endpoints, keep the first duplicate node)
          </label>
        </div>

        {preview ? (
          <div className="mb-3 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={blocking ? 'danger' : 'secondary'}>
                {blocking ? 'Import blocked' : 'Ready to import'}
              </Badge>
              {counts ? (
                <>
                  <Badge tone="danger">{counts.errors} errors</Badge>
                  <Badge tone="highlight">{counts.warnings} warnings</Badge>
                  <Badge tone="neutral">{counts.info} notes</Badge>
                </>
              ) : null}
            </div>

            <div className={cn('rounded-xl border p-3', blocking ? 'border-danger/40 bg-danger/[0.06]' : 'border-line-soft bg-surface-2')}>
              <p className="mb-2 text-[12px] font-medium text-fg">Validation report</p>
              <IssueList issues={preview.issues} />
            </div>

            {preview.report ? (
              <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
                <p className="mb-2 text-[12px] font-medium text-fg">Data-cleaning report</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-3">
                  {[
                    ['Input nodes', preview.report.inputNodeCount],
                    ['Input link records', preview.report.inputEdgeCount],
                    ['Accepted nodes', preview.report.acceptedNodeCount],
                    ['Accepted links', preview.report.acceptedEdgeCount],
                    ['Duplicate links removed', preview.report.duplicateEdgesRemoved],
                    ['Self-links excluded', preview.report.selfLinksExcluded],
                    ['Invalid links excluded', preview.report.invalidEdgesExcluded],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between gap-2">
                      <dt className="text-fg-faint">{label}</dt>
                      <dd className="tabular-nums text-fg">{value}</dd>
                    </div>
                  ))}
                </dl>
                {preview.report.inferredMetadata.length ? (
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-fg-muted">Documented decisions</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-fg-faint">
                      {preview.report.inferredMetadata.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {preview.dataset ? (
              <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
                <p className="mb-2 text-[12px] font-medium text-fg">
                  Preview — {preview.dataset.nodes.length} nodes, {preview.dataset.edges.length} links, status{' '}
                  {preview.dataset.sourceStatus === 'research-pending'
                    ? 'Research source pending'
                    : 'Research source provided, validation pending'}
                </p>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-line-soft text-left text-fg-faint">
                        <th className="py-1 pr-2">Node id</th>
                        <th className="py-1 pr-2">Name</th>
                        <th className="py-1 pr-2">Role</th>
                        <th className="py-1 pr-2">Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.dataset.nodes.slice(0, 12).map((node) => (
                        <tr key={node.id} className="border-b border-line-soft/50">
                          <td className="py-1 pr-2 font-mono text-[10px]">{node.id}</td>
                          <td className="py-1 pr-2">{node.name}</td>
                          <td className="py-1 pr-2 text-fg-muted">{node.trophicRole}</td>
                          <td className="py-1 pr-2 text-fg-muted">{node.roleEvidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.dataset.nodes.length > 12 ? (
                    <p className="mt-1 text-[11px] text-fg-faint">
                      Showing the first 12 of {preview.dataset.nodes.length} nodes. The full dataset is used after
                      import.
                    </p>
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] text-fg-faint">
                  Link preview: {preview.dataset.edges.slice(0, 6).map((edge) => `${edge.source} → ${edge.target}`).join(', ')}
                  {preview.dataset.edges.length > 6 ? ` … (${preview.dataset.edges.length} total)` : ''}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Upload size={14} />}
            disabled={!preview?.dataset}
            onClick={() => {
              if (preview?.dataset) {
                onImport(preview)
                reset()
              }
            }}
          >
            Import dataset
          </Button>
        </div>
        {blocking ? (
          <p className="mt-2 text-right text-[11px] text-danger">
            Fix the blocking errors, or choose to exclude the offending records, before importing. The currently
            loaded dataset is untouched.
          </p>
        ) : null}
      </div>
    </div>
  )
}
