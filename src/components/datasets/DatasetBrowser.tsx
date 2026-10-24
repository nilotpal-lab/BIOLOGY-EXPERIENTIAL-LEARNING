import {
  ChevronDown,
  Database,
  Download,
  FlaskConical,
  FolderSearch,
  GitCompareArrows,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { RESEARCH_SLOTS, RESEARCH_SLOT_SUMMARY } from '../../data/datasetRegistry'
import { downloadArtifact, edgesExportCsv, nodesExportCsv } from '../../core/exportUtils'
import {
  ECOSYSTEM_LABEL,
  SOURCE_STATUS_LABEL,
  SOURCE_STATUS_TONE,
  type EcosystemCategory,
  type FoodWebDataset,
} from '../../core/types'
import { Badge, Button, Card, CardHeading, MonoId, SelectInput, StatusBadge, TextInput, cn } from '../ui/primitives'

/* ============================================================================
 * DatasetBrowser — the two dataset categories, kept visibly separate (Mockup 05).
 *
 * Research library (bundled empirical networks) is presented first.
 * Demo Lab (illustrative teaching models) is kept strictly separate.
 * Features searchable and ecosystem-filterable library, compact cards with
 * progressive disclosure for provenance, and "How verification works" summary.
 * ========================================================================== */

export function DatasetRow({
  dataset,
  selected,
  onSelect,
  onRemove,
  compareSelected,
  onToggleCompare,
  showCompare = false,
}: {
  dataset: FoodWebDataset
  selected: boolean
  onSelect: (id: string) => void
  onRemove?: (id: string) => void
  compareSelected?: boolean
  onToggleCompare?: (id: string) => void
  showCompare?: boolean
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <li
      className={cn(
        'rounded-xl border p-3.5 transition-colors',
        selected ? 'border-primary bg-primary/[0.06] shadow-2xs' : 'border-line-soft bg-surface hover:border-line hover:bg-surface-2',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-fg">
            {dataset.name}
            {selected ? <Badge tone="primary">Loaded</Badge> : null}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{ECOSYSTEM_LABEL[dataset.ecosystem]}</Badge>
            <StatusBadge status={dataset.sourceStatus} />
            <Badge tone="neutral">
              {dataset.nodes.length} nodes · {dataset.edges.length} links
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant={selected ? 'outline' : 'primary'} onClick={() => onSelect(dataset.id)}>
            {selected ? 'Reload baseline' : 'Load network'}
          </Button>
          {showCompare && onToggleCompare ? (
            <Button
              size="sm"
              variant={compareSelected ? 'secondary' : 'ghost'}
              icon={<GitCompareArrows size={13} />}
              aria-pressed={compareSelected}
              onClick={() => onToggleCompare(dataset.id)}
            >
              {compareSelected ? 'In comparison' : 'Compare'}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            icon={<Download size={13} />}
            onClick={() => downloadArtifact(nodesExportCsv(dataset))}
            title={`Export ${dataset.name} nodes as CSV`}
            aria-label={`Export nodes CSV for ${dataset.name}`}
          >
            Nodes (CSV)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Download size={13} />}
            onClick={() => downloadArtifact(edgesExportCsv(dataset))}
            title={`Export ${dataset.name} links as CSV`}
            aria-label={`Export links CSV for ${dataset.name}`}
          >
            Links (CSV)
          </Button>
          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:text-primary-hover px-2 py-1 transition-colors"
          >
            <span>{detailsOpen ? 'Hide details' : 'View details'}</span>
            <ChevronDown size={13} className={cn('transition-transform', detailsOpen && 'rotate-180')} />
          </button>
          {onRemove && dataset.userProvided ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={13} />}
              onClick={() => onRemove(dataset.id)}
              aria-label={`Remove imported dataset ${dataset.name} from this browser`}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{dataset.summary}</p>

      {/* Progressive disclosure for provenance & citations */}
      {detailsOpen ? (
        <dl className="mt-2.5 grid gap-x-4 gap-y-1 rounded-xl border border-line-soft bg-surface-2 p-2.5 text-[11.5px] sm:grid-cols-2">
          <div>
            <dt className="inline text-fg-faint">Node unit: </dt>
            <dd className="inline text-fg font-medium">{dataset.provenance.nodeUnit}</dd>
          </div>
          <div>
            <dt className="inline text-fg-faint">Origin: </dt>
            <dd className="inline text-fg font-medium">{dataset.provenance.origin}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="inline text-fg-faint">Citation: </dt>
            <dd className="inline text-fg font-medium">{dataset.provenance.citation}</dd>
          </div>
          <div>
            <dt className="inline text-fg-faint">License: </dt>
            <dd className="inline text-fg font-medium">{dataset.provenance.license ?? 'Not specified'}</dd>
          </div>
          <div>
            <dt className="inline text-fg-faint">Source URL: </dt>
            <dd className="inline text-fg font-medium">{dataset.provenance.sourceUrl ?? 'Not specified'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="inline text-fg-faint">Dataset id: </dt>
            <dd className="inline">
              <MonoId>{dataset.id}</MonoId>
            </dd>
          </div>
        </dl>
      ) : null}
    </li>
  )
}

export function DatasetBrowser({
  demoDatasets,
  researchDatasets,
  importedDatasets,
  selectedId,
  onSelect,
  onRemove,
  onOpenImport,
  compareIds,
  onToggleCompare,
  showCompare,
}: {
  demoDatasets: FoodWebDataset[]
  /** Bundled research networks: source-validated, with citation and reuse terms recorded. */
  researchDatasets: FoodWebDataset[]
  importedDatasets: FoodWebDataset[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onOpenImport: () => void
  compareIds: string[]
  onToggleCompare: (id: string) => void
  showCompare?: boolean
}) {
  const [search, setSearch] = useState('')
  const [ecosystemFilter, setEcosystemFilter] = useState<EcosystemCategory | 'all'>('all')

  const filterFn = useCallback(
    (d: FoodWebDataset) => {
      if (ecosystemFilter !== 'all' && d.ecosystem !== ecosystemFilter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.ecosystem.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q)
      )
    },
    [ecosystemFilter, search],
  )

  const filteredResearch = useMemo(() => researchDatasets.filter(filterFn), [researchDatasets, filterFn])
  const filteredDemo = useMemo(() => demoDatasets.filter(filterFn), [demoDatasets, filterFn])
  const filteredImported = useMemo(() => importedDatasets.filter(filterFn), [importedDatasets, filterFn])

  const totalLoaded = filteredResearch.length + filteredDemo.length + filteredImported.length

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar matching mockup 05 */}
      <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
            />
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search networks, ecosystems, or species..."
              aria-label="Search networks"
              className="pl-8 text-[12.5px] h-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg p-1"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="library-eco-filter" className="text-[11.5px] font-medium text-fg-faint whitespace-nowrap">
                Ecosystem:
              </label>
              <SelectInput
                id="library-eco-filter"
                value={ecosystemFilter}
                onChange={(e) => setEcosystemFilter(e.target.value as EcosystemCategory | 'all')}
                className="h-8 py-1 text-[12px]"
                aria-label="Filter library by ecosystem"
              >
                <option value="all">All ecosystems</option>
                <option value="freshwater">Freshwater</option>
                <option value="terrestrial">Terrestrial</option>
                <option value="marine">Marine</option>
              </SelectInput>
            </div>

            <span className="text-[12px] font-medium text-fg-muted whitespace-nowrap">
              {totalLoaded} networks
            </span>
          </div>
        </div>
      </div>

      {/* Subsection A: Research library (Bundled networks) — Displayed FIRST */}
      <Card>
        <CardHeading
          icon={<Database size={16} />}
          title="Research library — bundled empirical networks"
          subtitle="Documented sources converted into the FoodWebGuard schema. Available on a fresh start without manual import. Each one carries its citation, reuse terms, cleaning decisions and the checks completed against the source archive."
        />
        {filteredResearch.length ? (
          <ul className="space-y-2">
            {filteredResearch.map((dataset) => (
              <DatasetRow
                key={dataset.id}
                dataset={dataset}
                selected={dataset.id === selectedId}
                onSelect={onSelect}
                compareSelected={compareIds.includes(dataset.id)}
                onToggleCompare={onToggleCompare}
                showCompare={showCompare}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-soft p-4 text-center text-[12.5px] text-fg-muted">
            No research networks match the selected filters.
          </p>
        )}
      </Card>

      {/* Subsection B: Demo networks — Illustrative teaching models, kept separate */}
      <Card>
        <CardHeading
          icon={<FlaskConical size={16} />}
          title="Demo Lab — illustrative teaching networks"
          subtitle="Working, simplified teaching examples. Six networks, two per ecosystem category, marked as illustrative so their results are never read as evidence about real ecosystems."
        />
        {filteredDemo.length ? (
          <ul className="space-y-2">
            {filteredDemo.map((dataset) => (
              <DatasetRow
                key={dataset.id}
                dataset={dataset}
                selected={dataset.id === selectedId}
                onSelect={onSelect}
                compareSelected={compareIds.includes(dataset.id)}
                onToggleCompare={onToggleCompare}
                showCompare={showCompare}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-soft p-4 text-center text-[12.5px] text-fg-muted">
            No demo networks match the selected filters.
          </p>
        )}
      </Card>

      {/* Subsection C: User-imported networks */}
      <Card>
        <CardHeading
          icon={<Upload size={16} />}
          title="Your imported networks"
          subtitle="Datasets you imported are stored in this browser only, are never uploaded to any service, and may not be available on another device. Download anything you need to keep."
          actions={
            <Button variant="outline" size="sm" icon={<Upload size={13} />} onClick={onOpenImport}>
              Import CSV or JSON
            </Button>
          }
        />
        {filteredImported.length ? (
          <ul className="space-y-2">
            {filteredImported.map((dataset) => (
              <DatasetRow
                key={dataset.id}
                dataset={dataset}
                selected={dataset.id === selectedId}
                onSelect={onSelect}
                onRemove={onRemove}
                compareSelected={compareIds.includes(dataset.id)}
                onToggleCompare={onToggleCompare}
                showCompare={showCompare}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-soft px-4 py-6 text-center text-[13px] text-fg-muted">
            {importedDatasets.length === 0
              ? 'No imported datasets yet. Use “Import CSV or JSON” to load a documented food web, and the validator will report every problem it finds before anything is loaded.'
              : 'No imported datasets match the selected filters.'}
          </p>
        )}
      </Card>

      {/* Subsection D: How verification works (3 steps) matching mockup 05 */}
      <Card>
        <CardHeading
          icon={<ShieldCheck size={16} />}
          title="How verification works"
          subtitle="Every research dataset is checked in three steps before it is marked as verified."
        />
        <div className="grid gap-3 sm:grid-cols-3 text-[12.5px]">
          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
              1
            </span>
            <div>
              <p className="font-semibold text-fg">Source file</p>
              <p className="mt-0.5 text-fg-muted leading-relaxed">
                We use the original published data file from the specified source archive.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
              2
            </span>
            <div>
              <p className="font-semibold text-fg">Conversion checks</p>
              <p className="mt-0.5 text-fg-muted leading-relaxed">
                We validate nodes, links, direction, filtering and counts against the source.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
              3
            </span>
            <div>
              <p className="font-semibold text-fg">Citation and reuse terms</p>
              <p className="mt-0.5 text-fg-muted leading-relaxed">
                We record the dataset citation and check the documented reuse terms.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Research library curation tracker                                          */
/* -------------------------------------------------------------------------- */

export function ResearchSlotsPanel({
  verifiedCount,
  onOpenImport,
}: {
  verifiedCount: number
  onOpenImport: () => void
}) {
  const grouped: Record<EcosystemCategory, typeof RESEARCH_SLOTS> = {
    freshwater: RESEARCH_SLOTS.filter((slot) => slot.ecosystem === 'freshwater'),
    terrestrial: RESEARCH_SLOTS.filter((slot) => slot.ecosystem === 'terrestrial'),
    marine: RESEARCH_SLOTS.filter((slot) => slot.ecosystem === 'marine'),
  }

  return (
    <Card>
      <CardHeading
        icon={<FolderSearch size={16} />}
        title="Research dataset library — curation status"
        subtitle="The target is six documented research networks, two per ecosystem category. Each slot shows the network it carries and the checks that were actually completed; a slot is only marked “Research source verified” when its source, conversion, citation and reuse terms have all been checked. No provenance is invented anywhere in this application."
        actions={
          <Button variant="outline" size="sm" icon={<Upload size={13} />} onClick={onOpenImport}>
            Import a research dataset
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge tone="verified">{verifiedCount} verified</Badge>
        <Badge tone="neutral">{RESEARCH_SLOT_SUMMARY.bundled} sourced</Badge>
        <Badge tone={RESEARCH_SLOT_SUMMARY.pending ? 'pending' : 'verified'}>
          {RESEARCH_SLOT_SUMMARY.pending} source pending
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {(Object.keys(grouped) as EcosystemCategory[]).map((ecosystem) => (
          <div key={ecosystem} className="rounded-xl border border-line-soft bg-surface-2 p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-fg">
              <Database size={13} aria-hidden="true" className="text-primary" />
              {ECOSYSTEM_LABEL[ecosystem]}
              <span className="text-fg-faint">
                ({grouped[ecosystem].filter((slot) => slot.bundledDatasetId).length} of{' '}
                {grouped[ecosystem].length} sourced)
              </span>
            </p>
            <ul className="mt-2 space-y-2">
              {grouped[ecosystem].map((slot) => (
                <li key={slot.slotId} className="rounded-lg border border-line-soft p-2">
                  <p className="text-[12px] font-medium text-fg">{slot.workingTitle}</p>
                  <p className="mt-0.5">
                    <Badge tone={SOURCE_STATUS_TONE[slot.status]}>
                      {SOURCE_STATUS_LABEL[slot.status]}
                    </Badge>
                    {slot.bundledDatasetId ? (
                      <span className="ml-1.5">
                        <MonoId>{slot.bundledDatasetId}</MonoId>
                      </span>
                    ) : null}
                  </p>
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-[11px] text-fg-muted hover:text-fg">
                      {slot.status === 'research-verified'
                        ? 'Verification record and sources'
                        : 'Outstanding steps and candidate sources'}
                    </summary>
                    {slot.outstanding.length ? (
                      <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] text-fg-faint">
                        {slot.outstanding.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-1 text-[11px] text-fg-faint">
                        No outstanding steps: source, conversion, citation and reuse checks are complete.
                      </p>
                    )}
                    {slot.verifiedChecks?.length ? (
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-fg-faint">
                        {slot.verifiedChecks.map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                    ) : null}
                    <ul className="mt-1.5 space-y-1 text-[11px] text-fg-faint">
                      {slot.candidateSources.map((source) => (
                        <li key={source.label}>
                          <a
                            className="text-primary underline-offset-2 hover:underline"
                            href={source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {source.label}
                          </a>{' '}
                          — {source.note}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  )
}
