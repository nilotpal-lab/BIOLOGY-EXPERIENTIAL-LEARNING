import { Info, Upload } from 'lucide-react'
import { DatasetBrowser, ResearchSlotsPanel } from '../components/datasets/DatasetBrowser'
import { Badge, Callout, Card, CardHeading, Button } from '../components/ui/primitives'
import { BUILT_IN_RESEARCH_DATASETS, RESEARCH_SLOT_SUMMARY } from '../data/datasetRegistry'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/Shell'

/* ============================================================================
 * DatasetLibrary — the two dataset categories plus the import flow.
 * Demo data and research data are never mixed, and the research slots show real
 * curation status instead of pretending that published datasets are ready.
 * ========================================================================== */

export function DatasetLibraryPage({
  onNavigate,
  onOpenImport,
}: {
  onNavigate: (route: RouteId) => void
  onOpenImport: () => void
}) {
  const {
    datasets,
    demoDatasets,
    importedDatasets,
    dataset,
    selectDataset,
    removeImportedDataset,
    compareIds,
    toggleCompare,
  } = useAppState()

  const verified = datasets.filter((entry) => entry.sourceStatus === 'research-verified').length
  const pending = importedDatasets.filter(
    (entry) => entry.sourceStatus !== 'research-verified',
  ).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Food-Web Repository</span>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Research Library & Datasets</h1>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            Explore documented empirical networks and illustrative teaching models with full provenance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon={<Upload size={14} />} onClick={onOpenImport}>
            Import CSV or JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              selectDataset(demoDatasets[0]?.id ?? dataset?.id ?? '')
              onNavigate('explore')
            }}
          >
            Explore loaded network
          </Button>
        </div>
      </div>

      <Card>
        <CardHeading
          icon={<Info size={16} />}
          title="Dataset categories"
          subtitle="Two separate categories: working illustrative examples that can be used immediately, and the documented research library, where every bundled network has had its source, conversion, citation and reuse terms checked."
        />
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="primary">{datasets.length} datasets loaded in the app</Badge>
          <Badge tone="demo">{demoDatasets.length} illustrative demos</Badge>
          {pending ? <Badge tone="warning">{pending} imported, validation pending</Badge> : null}
          <Badge tone="verified">{verified} verified</Badge>
          <Badge tone={RESEARCH_SLOT_SUMMARY.pending ? 'pending' : 'verified'}>
            {RESEARCH_SLOT_SUMMARY.bundled} of {RESEARCH_SLOT_SUMMARY.total} research slots sourced ·{' '}
            {RESEARCH_SLOT_SUMMARY.pending} unsourced
          </Badge>
        </div>
      </Card>

      <Callout tone="info" title="How the research library is tracked">
        The project targets six documented research networks, two per ecosystem category.{' '}
        {RESEARCH_SLOT_SUMMARY.bundled} of the {RESEARCH_SLOT_SUMMARY.total} slots carry a sourced dataset and{' '}
        {RESEARCH_SLOT_SUMMARY.verified} are marked <strong>Research source verified</strong>: for each one the node and
        link sets have been re-derived from the committed source files, the link direction is quoted from the source
        documentation, and the citation and reuse terms were checked against the repository record. The two freshwater
        networks come from the same mesocosm experiment (Pond 1 and the control replicate Pond 47), which is stated in
        their provenance and is not presented as two independent ecosystems.
      </Callout>

      <ResearchSlotsPanel verifiedCount={verified} onOpenImport={onOpenImport} />

      <DatasetBrowser
        demoDatasets={demoDatasets}
        researchDatasets={BUILT_IN_RESEARCH_DATASETS}
        importedDatasets={importedDatasets}
        selectedId={dataset?.id ?? null}
        onSelect={(id) => {
          selectDataset(id)
          onNavigate('explore')
        }}
        onRemove={removeImportedDataset}
        onOpenImport={onOpenImport}
        compareIds={compareIds}
        onToggleCompare={toggleCompare}
        showCompare
      />

      <Callout tone="info" title="Where imported datasets are stored">
        Imported datasets are kept in this browser’s local storage only. They are never uploaded to any external
        service and they may not be available on another device or after clearing browsing data. Use the node
        list and link list downloads to keep a copy of anything you need.
      </Callout>
    </div>
  )
}
