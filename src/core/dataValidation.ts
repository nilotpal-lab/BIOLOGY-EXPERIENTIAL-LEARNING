import Papa from 'papaparse'
import { makeEdgeId } from './graphModel'
import {
  NODE_TYPES,
  TROPHIC_ROLES,
  type CleaningReport,
  type EcosystemCategory,
  type FoodWebDataset,
  type FoodWebEdge,
  type FoodWebNode,
  type ImportPreview,
  type NodeType,
  type RoleProvenance,
  type TrophicRole,
  type ValidationIssue,
} from './types'

/* ============================================================================
 * dataValidation — the import path and every validation rule (Prompt §6).
 *
 * Parsing happens entirely in the browser. Nothing is uploaded anywhere.
 * A failed import NEVER replaces the currently loaded dataset: the caller only
 * commits a dataset when `blocked` is false.
 * ========================================================================== */

export const NODE_CSV_COLUMNS = [
  'id',
  'name',
  'scientific_name',
  'node_type',
  'trophic_role',
  'description',
  'icon_key',
] as const

export const EDGE_CSV_COLUMNS = ['source', 'target', 'relationship', 'source_note'] as const

export const REQUIRED_NODE_COLUMNS = ['id', 'name'] as const
export const REQUIRED_EDGE_COLUMNS = ['source', 'target'] as const

/** Guard rails so a very large file cannot freeze the tab unnoticed. */
export const LARGE_FILE_THRESHOLDS = { nodes: 2000, edges: 20000 } as const

export const SUPPORTED_EXTENSIONS = ['.csv', '.json'] as const

export interface ImportOptions {
  /**
   * 'block' (default) refuses the import while any link has an undefined
   * endpoint. 'exclude' removes those links and records how many were dropped.
   */
  invalidEdgePolicy?: 'block' | 'exclude'
  /** Duplicate node ids are blocked unless the user keeps the first record. */
  duplicateNodePolicy?: 'block' | 'keep-first'
  /** Self-links are always excluded from the primary analysis. */
  selfLinkPolicy?: 'exclude'
}

export interface ImportInput {
  /** Raw CSV text for the node table. */
  nodesText?: string
  /** Raw CSV text for the directed edge list. */
  edgesText?: string
  /** Raw JSON text for a single-file network. */
  jsonText?: string
  /** Original file name, used to reject unsupported extensions. */
  fileName?: string
  datasetName?: string
  ecosystem?: EcosystemCategory
  citation?: string
  origin?: string
  sourceUrl?: string
  license?: string
  nodeUnit?: string
  options?: ImportOptions
}

interface RawRecord {
  [key: string]: string | undefined
}

function emptyReport(): CleaningReport {
  return {
    inputNodeCount: 0,
    inputEdgeCount: 0,
    acceptedNodeCount: 0,
    acceptedEdgeCount: 0,
    duplicateEdgesRemoved: 0,
    selfLinksExcluded: 0,
    invalidEdgesExcluded: 0,
    inferredMetadata: [],
    outstandingWarnings: [],
  }
}

function baseProvenance(input: ImportInput, cleaningNotes: string[]) {
  const hasSource = Boolean(input.origin?.trim() || input.citation?.trim())
  return {
    origin: input.origin?.trim() || 'Not provided',
    citation: input.citation?.trim() || 'Not provided',
    sourceUrl: input.sourceUrl?.trim() || null,
    license: input.license?.trim() || null,
    version: 'Imported in this browser session',
    nodeUnit: input.nodeUnit?.trim() || 'Not provided',
    cleaningNotes,
    // An imported file is never treated as a verified research dataset on the
    // strength of the upload alone (Prompt §6.3).
    validationStatus: hasSource
      ? ('research-provided-validation-pending' as const)
      : ('research-pending' as const),
    retrievedOn: new Date().toISOString().slice(0, 10),
  }
}

/* -------------------------------------------------------------------------- */
/* Field normalisation                                                        */
/* -------------------------------------------------------------------------- */

function pick(record: RawRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return undefined
}

const ROLE_ALIASES: Record<string, TrophicRole> = {
  'producer': 'producer',
  'basal': 'basal-group',
  'basal-group': 'basal-group',
  'basal group': 'basal-group',
  'primary-consumer': 'primary-consumer',
  'primary consumer': 'primary-consumer',
  'secondary-consumer': 'secondary-consumer',
  'secondary consumer': 'secondary-consumer',
  'apex-predator': 'apex-predator',
  'apex predator': 'apex-predator',
  'top-predator': 'apex-predator',
  'decomposer': 'decomposer',
  'omnivore': 'omnivore',
  'other': 'other',
}

export interface NormalisedRole {
  role: TrophicRole
  evidence: RoleProvenance
  warning?: string
}

/**
 * Trophic roles are only accepted when the written value maps onto one of the
 * documented roles. Ambiguous values such as a bare "consumer" are kept as
 * "other" with unknown evidence rather than guessed, and the declaration is
 * reported as a warning (Prompt §6.3, §11 Case 17).
 */
export function normaliseRole(raw: string | undefined): NormalisedRole {
  const value = (raw ?? '').trim().toLowerCase()
  if (!value) {
    return {
      role: 'other',
      evidence: 'unknown',
      warning:
        'No trophic role was supplied, so the role is marked unknown. The node is excluded from role-dependent cascade removal.',
    }
  }
  if ((TROPHIC_ROLES as readonly string[]).includes(value)) {
    return { role: value as TrophicRole, evidence: 'documented' }
  }
  const alias = ROLE_ALIASES[value]
  if (alias) {
    return {
      role: alias,
      evidence: 'inferred',
      warning: `Trophic role "${raw}" was normalised to "${alias}" and marked as inferred rather than documented.`,
    }
  }
  return {
    role: 'other',
    evidence: 'unknown',
    warning: `Trophic role "${raw}" is not one of the documented role values, so it was stored as "other" with unknown evidence.`,
  }
}

export function normaliseNodeType(raw: string | undefined): {
  nodeType: NodeType
  warning?: string
} {
  const value = (raw ?? '').trim().toLowerCase()
  if (!value) return { nodeType: 'species' }
  const kebab = value.replace(/[\s_]+/g, '-')
  if ((NODE_TYPES as readonly string[]).includes(kebab)) return { nodeType: kebab as NodeType }
  if (kebab === 'group' || kebab === 'trophicgroup' || kebab === 'aggregate') {
    return {
      nodeType: 'trophic-group',
      warning: `Node type "${raw}" was interpreted as a trophic group.`,
    }
  }
  return {
    nodeType: 'species',
    warning: `Node type "${raw}" is not recognised, so "species" was assumed. Correct the file if that is wrong.`,
  }
}

/* -------------------------------------------------------------------------- */
/* CSV parsing                                                                */
/* -------------------------------------------------------------------------- */

interface CsvParseResult {
  records: RawRecord[]
  fields: string[]
  issues: ValidationIssue[]
}

function parseCsv(text: string, label: string, required: readonly string[]): CsvParseResult {
  const issues: ValidationIssue[] = []
  const result = Papa.parse<RawRecord>(text.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  for (const error of result.errors.slice(0, 5)) {
    issues.push({
      severity: 'error',
      code: 'MALFORMED_CSV',
      message: `${label}: the file could not be parsed as CSV (${error.message}${error.row !== undefined ? ` near row ${error.row + 1}` : ''}).`,
      location: label,
    })
  }

  const fields = result.meta.fields ?? []
  const missing = required.filter((column) => !fields.includes(column))
  if (missing.length) {
    issues.push({
      severity: 'error',
      code: 'MISSING_COLUMNS',
      message: `${label}: required column(s) missing: ${missing.join(', ')}. Required columns are ${required.join(', ')}.`,
      location: label,
    })
  }

  return { records: (result.data ?? []) as RawRecord[], fields, issues }
}

/* -------------------------------------------------------------------------- */
/* Core assembly                                                              */
/* -------------------------------------------------------------------------- */

interface AssembleInput {
  rawNodes: RawRecord[]
  rawEdges: RawRecord[]
  label: string
  options: ImportOptions
}

function assemble({ rawNodes, rawEdges, label, options }: AssembleInput) {
  const issues: ValidationIssue[] = []
  const report = emptyReport()
  const invalidEdgePolicy = options.invalidEdgePolicy ?? 'block'
  const duplicateNodePolicy = options.duplicateNodePolicy ?? 'block'

  report.inputNodeCount = rawNodes.length
  report.inputEdgeCount = rawEdges.length

  /* ---- Nodes ---- */
  const nodes: FoodWebNode[] = []
  const seenNodeIds = new Set<string>()
  let duplicateNodeCount = 0
  let nodesMissingIcon = 0

  rawNodes.forEach((record, index) => {
    const location = `${label} node row ${index + 2}` // +2 accounts for the header row
    const id = pick(record, 'id', 'node_id', 'nodeid')
    const name = pick(record, 'name', 'label', 'common_name')

    if (!id) {
      issues.push({
        severity: 'error',
        code: 'NODE_MISSING_ID',
        message: `${location}: the node has no id. Every node needs a stable unique id.`,
        location,
        fixable: true,
      })
      return
    }
    if (seenNodeIds.has(id)) {
      duplicateNodeCount += 1
      issues.push({
        severity: duplicateNodePolicy === 'block' ? 'error' : 'warning',
        code: 'DUPLICATE_NODE_ID',
        message: `${location}: duplicate node id "${id}".${duplicateNodePolicy === 'block' ? ' Import is blocked until this is resolved or you choose to keep the first record.' : ' Only the first record was kept.'}`,
        location,
        nodeId: id,
        fixable: duplicateNodePolicy === 'block',
      })
      // Either way the duplicate record is not added: under 'block' the import
      // is refused, under 'keep-first' only the first record is kept.
      return
    }
    if (!name) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_NAME',
        message: `${location}: node "${id}" has no name. The id is displayed instead, and the node is marked as missing a name.`,
        location,
        nodeId: id,
      })
    }

    const role = normaliseRole(pick(record, 'trophic_role', 'role', 'trophic_role_'))
    if (role.warning) {
      issues.push({
        severity: 'warning',
        code: 'ROLE_NORMALISED',
        message: `${location}: ${role.warning}`,
        location,
        nodeId: id,
      })
    }

    const nodeType = normaliseNodeType(pick(record, 'node_type', 'type'))
    if (nodeType.warning) {
      issues.push({
        severity: 'warning',
        code: 'NODE_TYPE_NORMALISED',
        message: `${location}: ${nodeType.warning}`,
        location,
        nodeId: id,
      })
    }

    const iconKey = pick(record, 'icon_key', 'icon', 'iconkey')
    if (!iconKey) {
      nodesMissingIcon += 1
    }

    seenNodeIds.add(id)

    nodes.push({
      id,
      name: name ?? id,
      scientificName: pick(record, 'scientific_name', 'scientificname', 'scientific name') ?? null,
      nodeType: nodeType.nodeType,
      trophicRole: role.role,
      roleEvidence: role.evidence,
      description: pick(record, 'description', 'notes') ?? '',
      iconKey: iconKey ?? 'fallback',
      habitat: pick(record, 'habitat') ?? null,
      sourceNote: pick(record, 'source_note', 'source', 'citation') ?? null,
      originalId: pick(record, 'original_id', 'originalid') ?? null,
    })
  })

  if (duplicateNodeCount > 0) {
    report.inferredMetadata.push(
      `${duplicateNodeCount} duplicate node record(s) ${duplicateNodePolicy === 'block' ? 'were detected' : 'were removed by keeping the first record'}.`,
    )
  }
  if (nodesMissingIcon > 0) {
    issues.push({
      severity: 'info',
      code: 'ICON_KEY_MISSING',
      message: `${nodesMissingIcon} node(s) have no icon_key. A neutral fallback illustration is used; this does not affect any calculation.`,
    })
    report.inferredMetadata.push(
      `${nodesMissingIcon} node(s) were assigned the neutral fallback illustration key.`,
    )
  }

  /* ---- Edges ---- */
  const edges: FoodWebEdge[] = []
  const seenEdgeKeys = new Set<string>()
  let duplicateEdgesRemoved = 0
  let selfLinksExcluded = 0
  let invalidEdgesExcluded = 0
  let invalidEdgesBlocking = 0

  rawEdges.forEach((record, index) => {
    const location = `${label} link row ${index + 2}`
    const source = pick(record, 'source', 'food', 'food_source', 'prey')
    const target = pick(record, 'target', 'consumer', 'predator')

    if (!source || !target) {
      issues.push({
        severity: 'error',
        code: 'EDGE_MISSING_ENDPOINT',
        message: `${location}: both "source" (the food organism) and "target" (the consumer) are required.`,
        location,
        fixable: true,
      })
      invalidEdgesBlocking += 1
      return
    }

    if (source === target) {
      selfLinksExcluded += 1
      issues.push({
        severity: 'warning',
        code: 'SELF_LINK',
        message: `${location}: self-link "${source} -> ${target}" was excluded from the primary analysis and recorded in this cleaning report.`,
        location,
        edgeId: makeEdgeId(source, target),
        fixable: false,
      })
      return
    }

    const unknownSource = !seenNodeIds.has(source)
    const unknownTarget = !seenNodeIds.has(target)
    if (unknownSource || unknownTarget) {
      const offending = [unknownSource ? source : null, unknownTarget ? target : null]
        .filter(Boolean)
        .join(', ')
      if (invalidEdgePolicy === 'block') {
        invalidEdgesBlocking += 1
        issues.push({
          severity: 'error',
          code: 'UNKNOWN_EDGE_ENDPOINT',
          message: `${location}: link "${source} -> ${target}" refers to undefined node(s): ${offending}. Add those nodes, fix the spelling, or explicitly exclude this link.`,
          location,
          edgeId: makeEdgeId(source, target),
          fixable: true,
        })
        return
      }
      invalidEdgesExcluded += 1
      issues.push({
        severity: 'warning',
        code: 'UNKNOWN_EDGE_ENDPOINT_EXCLUDED',
        message: `${location}: link "${source} -> ${target}" was excluded because it refers to undefined node(s): ${offending}.`,
        location,
        edgeId: makeEdgeId(source, target),
      })
      return
    }

    const key = makeEdgeId(source, target)
    if (seenEdgeKeys.has(key)) {
      duplicateEdgesRemoved += 1
      issues.push({
        severity: 'warning',
        code: 'DUPLICATE_EDGE',
        message: `${location}: duplicate link "${source} -> ${target}". The deduplication policy keeps the first occurrence so feeding-link counts are not inflated.`,
        location,
        edgeId: key,
      })
      return
    }
    seenEdgeKeys.add(key)

    edges.push({
      id: key,
      source,
      target,
      relationship: pick(record, 'relationship', 'link_type', 'type') ?? null,
      sourceNote: pick(record, 'source_note', 'note', 'citation') ?? null,
    })
  })

  if (duplicateEdgesRemoved > 0) {
    report.inferredMetadata.push(
      `${duplicateEdgesRemoved} duplicate link(s) were removed by the keep-first deduplication policy, so they do not inflate feeding-link counts.`,
    )
  }
  if (selfLinksExcluded > 0) {
    report.inferredMetadata.push(
      `${selfLinksExcluded} self-link(s) were excluded from the primary analysis and are recorded above.`,
    )
  }

  report.acceptedNodeCount = nodes.length
  report.acceptedEdgeCount = edges.length
  report.duplicateEdgesRemoved = duplicateEdgesRemoved
  report.selfLinksExcluded = selfLinksExcluded
  report.invalidEdgesExcluded = invalidEdgesExcluded

  /* ---- Network-level rules ---- */
  if (nodes.length === 0) {
    issues.push({
      severity: 'error',
      code: 'EMPTY_NETWORK',
      message: `${label}: the dataset contains no nodes, so there is no network to analyse.`,
    })
  } else if (edges.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'NO_LINKS',
      message: `${label}: the dataset has ${nodes.length} node(s) but no feeding links. The network will load, but link loss is not applicable and structural analysis is limited.`,
    })
    report.outstandingWarnings.push('No feeding links were recorded, so structural analysis is limited.')
  }

  if (nodes.length > LARGE_FILE_THRESHOLDS.nodes || edges.length > LARGE_FILE_THRESHOLDS.edges) {
    issues.push({
      severity: 'warning',
      code: 'LARGE_DATASET',
      message: `This dataset is large (${nodes.length} nodes, ${edges.length} links). "Analyse all species" may take a while to finish.`,
    })
    report.outstandingWarnings.push('Large dataset: full-species analysis may be slow.')
  }

  report.outstandingWarnings.push(
    ...issues
      .filter((issue) => issue.severity === 'warning')
      .map((issue) => issue.message)
      .slice(0, 12),
  )

  const blocked =
    issues.some((issue) => issue.severity === 'error') ||
    invalidEdgesBlocking > 0 ||
    (duplicateNodePolicy === 'block' && duplicateNodeCount > 0)

  return { nodes, edges, issues, report, blocked }
}

function finalise(args: {
  input: ImportInput
  nodes: FoodWebNode[]
  edges: FoodWebEdge[]
  issues: ValidationIssue[]
  report: CleaningReport
  blocked: boolean
}): ImportPreview {
  const { input, nodes, edges, issues, report, blocked } = args

  const citationProvided = Boolean(input.citation?.trim() || input.origin?.trim())
  if (!citationProvided) {
    issues.push({
      severity: 'warning',
      code: 'MISSING_CITATION',
      message:
        'No source citation or origin was provided. The dataset can still be used as a user-provided dataset, but it will NOT be marked as a verified research dataset.',
    })
  }

  const dataset: FoodWebDataset | null = blocked
    ? null
    : {
        id: `USER-${Date.now().toString(36).toUpperCase()}`,
        name: input.datasetName?.trim() || input.fileName?.replace(/\.[^.]+$/, '') || 'Imported dataset',
        ecosystem: input.ecosystem ?? 'freshwater',
        summary:
          input.sourceUrl?.trim()
            ? `User-imported network. Source: ${input.sourceUrl.trim()}`
            : 'User-imported network. No source URL was provided.',
        isDemo: false,
        sourceStatus:
          citationProvided ? 'research-provided-validation-pending' : 'research-pending',
        userProvided: true,
        provenance: baseProvenance(input, [
          'Imported through the FoodWebGuard import dialog; parsed and validated in the browser.',
          `Accepted ${report.acceptedNodeCount} node(s) and ${report.acceptedEdgeCount} link(s) from ${report.inputNodeCount} node record(s) and ${report.inputEdgeCount} link record(s).`,
          'Deduplication policy: keep the first occurrence of a repeated source -> target link.',
          'Self-links are excluded from the primary analysis by default.',
          `Accepted edge endpoints are validated against the node table${
            report.invalidEdgesExcluded > 0
              ? `; ${report.invalidEdgesExcluded} link(s) with undefined endpoints were excluded at the user's request`
              : ''
          }.`,
          'FoodWebGuard never changes a dataset to "Research source verified" automatically.',
        ]),
        nodes,
        edges,
      }

  return { dataset, issues, report, blocked }
}

/* -------------------------------------------------------------------------- */
/* Public entry points                                                        */
/* -------------------------------------------------------------------------- */

function checkExtension(input: ImportInput): ValidationIssue | null {
  const name = input.fileName
  if (!name) return null
  const lower = name.toLowerCase()
  if (SUPPORTED_EXTENSIONS.some((extension) => lower.endsWith(extension))) return null
  return {
    severity: 'error',
    code: 'UNSUPPORTED_FILE_TYPE',
    message: `"${name}" is not a supported file type. Upload a CSV node file plus a CSV link file, or a JSON network file.`,
    fixable: false,
  }
}

/** Validate a CSV node file + CSV edge file pair. */
export function importFromCsv(input: ImportInput): ImportPreview {
  const issues: ValidationIssue[] = []
  const extensionIssue = checkExtension(input)
  if (extensionIssue) issues.push(extensionIssue)

  const nodesText = input.nodesText ?? ''
  const edgesText = input.edgesText ?? ''
  if (!nodesText.trim() || !edgesText.trim()) {
    issues.push({
      severity: 'error',
      code: 'EMPTY_FILE',
      message: 'Both a node CSV file and a link CSV file are required.',
    })
    return { dataset: null, issues, report: null, blocked: true }
  }

  const nodeParse = parseCsv(nodesText, 'Node file', REQUIRED_NODE_COLUMNS)
  const edgeParse = parseCsv(edgesText, 'Link file', REQUIRED_EDGE_COLUMNS)
  issues.push(...nodeParse.issues, ...edgeParse.issues)

  const hasColumnError = [...nodeParse.issues, ...edgeParse.issues].some(
    (issue) => issue.code === 'MISSING_COLUMNS' || issue.code === 'MALFORMED_CSV',
  )
  const hasHeaderOnly =
    nodeParse.records.length === 0 &&
    edgeParse.records.length === 0 &&
    !hasColumnError

  if (hasHeaderOnly) {
    issues.push({
      severity: 'error',
      code: 'EMPTY_FILE',
      message: 'The uploaded files contain headers but no data rows.',
    })
    return { dataset: null, issues, report: null, blocked: true }
  }

  const assembled = assemble({
    rawNodes: nodeParse.records,
    rawEdges: edgeParse.records,
    label: 'CSV import',
    options: input.options ?? {},
  })

  return finalise({
    input,
    nodes: assembled.nodes,
    edges: assembled.edges,
    issues: [...issues, ...assembled.issues],
    report: assembled.report,
    blocked: assembled.blocked || hasColumnError || Boolean(extensionIssue),
  })
}

/** Validate a single JSON network file. */
export function importFromJson(input: ImportInput): ImportPreview {
  const issues: ValidationIssue[] = []
  const extensionIssue = checkExtension(input)
  if (extensionIssue) issues.push(extensionIssue)

  const text = input.jsonText ?? ''
  if (!text.trim()) {
    issues.push({
      severity: 'error',
      code: 'EMPTY_FILE',
      message: 'The JSON file is empty.',
    })
    return { dataset: null, issues, report: null, blocked: true }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return {
      dataset: null,
      issues: [
        ...issues,
        {
          severity: 'error',
          code: 'MALFORMED_JSON',
          message: `The file is not valid JSON. ${
            error instanceof Error ? error.message : 'Parsing failed.'
          }`,
        },
      ],
      report: null,
      blocked: true,
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      dataset: null,
      issues: [
        ...issues,
        {
          severity: 'error',
          code: 'JSON_SHAPE',
          message:
            'The JSON root must be an object with "nodes" and "edges" arrays. See the documented schema in the import dialog.',
        },
      ],
      report: null,
      blocked: true,
    }
  }

  const root = parsed as Record<string, unknown>
  const rawNodesRaw = root.nodes
  const rawEdgesRaw = root.edges ?? root.links

  if (!Array.isArray(rawNodesRaw) || !Array.isArray(rawEdgesRaw)) {
    return {
      dataset: null,
      issues: [
        ...issues,
        {
          severity: 'error',
          code: 'MISSING_COLLECTIONS',
          message:
            'The JSON object must contain an array named "nodes" and an array named "edges" (or "links").',
        },
      ],
      report: null,
      blocked: true,
    }
  }

  const toRecord = (value: unknown): RawRecord => {
    if (!value || typeof value !== 'object') return {}
    const output: RawRecord = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === null || entry === undefined) continue
      output[key.toLowerCase()] = String(entry)
    }
    return output
  }

  const assembled = assemble({
    rawNodes: rawNodesRaw.map(toRecord),
    rawEdges: rawEdgesRaw.map(toRecord),
    label: 'JSON import',
    options: input.options ?? {},
  })

  const meta = (root.provenance ?? root.metadata ?? {}) as Record<string, unknown>
  const mergedInput: ImportInput = {
    ...input,
    datasetName: input.datasetName?.trim() || (typeof root.name === 'string' ? root.name : undefined),
    ecosystem:
      input.ecosystem ??
      (typeof root.ecosystem === 'string'
        ? (root.ecosystem.toLowerCase() as EcosystemCategory)
        : undefined),
    citation:
      input.citation?.trim() ||
      (typeof meta.citation === 'string' ? meta.citation : undefined),
    origin: input.origin?.trim() || (typeof meta.origin === 'string' ? meta.origin : undefined),
    sourceUrl:
      input.sourceUrl?.trim() ||
      (typeof meta.sourceUrl === 'string' ? meta.sourceUrl : typeof meta.source_url === 'string' ? meta.source_url : undefined),
    license:
      input.license?.trim() || (typeof meta.license === 'string' ? meta.license : undefined),
    nodeUnit:
      input.nodeUnit?.trim() ||
      (typeof meta.nodeUnit === 'string' ? meta.nodeUnit : typeof meta.node_unit === 'string' ? meta.node_unit : undefined),
  }

  return finalise({
    input: mergedInput,
    nodes: assembled.nodes,
    edges: assembled.edges,
    issues: [...issues, ...assembled.issues],
    report: assembled.report,
    blocked: assembled.blocked || Boolean(extensionIssue),
  })
}

/** Dispatch on the supplied text so the UI can hand over whatever was dropped. */
export function importNetwork(input: ImportInput): ImportPreview {
  if (input.jsonText || input.fileName?.toLowerCase().endsWith('.json')) {
    return importFromJson(input)
  }
  return importFromCsv(input)
}

/** Human-readable count of blocking errors, used in the dialog header. */
export function countIssues(issues: ValidationIssue[]) {
  return {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
    info: issues.filter((issue) => issue.severity === 'info').length,
  }
}
