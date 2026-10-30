import { Upload, Database } from 'lucide-react'
import { DatasetBrowser, ResearchSlotsPanel } from '../components/datasets/DatasetBrowser'
import { BUILT_IN_RESEARCH_DATASETS } from '../data/datasetRegistry'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/Shell'

/* ============================================================================
 * Research Library Page (DatasetLibraryPage)
 * Matching Reference Image: media_1793371741302_80953faf.jpg
 *
 * Full provenance, verified research networks, and custom dataset import.
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

  return (
    <div className="space-y-5 max-w-[1780px] mx-auto pb-8">
      {/* =====================================================================
          1. EDITORIAL BANNER (Lora Typography + Botanical Artwork)
          Matching Image 1 Reference
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Text */}
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 space-y-1.5 z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#202B27] tracking-tight">
              Research Library
            </h1>
            <p className="text-xs sm:text-[13px] text-[#68716B] max-w-2xl leading-relaxed">
              Explore six real-world food-web datasets from published scientific research. Each dataset includes species
              information, feeding relationships and original research references.
            </p>
          </div>

          {/* Botanical landscape artwork */}
          <div className="lg:col-span-4 h-36 lg:h-full relative overflow-hidden flex items-center justify-end">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FCFBF7] via-[#FCFBF7]/50 to-transparent z-1 lg:w-32 pointer-events-none" />
            <img
              src="/hero-freshwater-artwork.png"
              alt="Freshwater ecosystem botanical illustration"
              className="h-full w-full object-cover object-[80%_25%] max-h-44"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN RESEARCH BROWSER & DATASET DETAIL PANEL (Image 1)
          ===================================================================== */}
      <DatasetBrowser
        demoDatasets={demoDatasets}
        researchDatasets={BUILT_IN_RESEARCH_DATASETS}
        importedDatasets={importedDatasets}
        selectedId={dataset?.id ?? null}
        onSelect={(id) => {
          selectDataset(id)
        }}
        onNavigateExplore={() => onNavigate('explore')}
        onRemove={removeImportedDataset}
        onOpenImport={onOpenImport}
        compareIds={compareIds}
        onToggleCompare={toggleCompare}
        showCompare
      />

      {/* =====================================================================
          3. CURATION TRACKER & SCIENTIFIC VERIFICATION (Required for tests & rigor)
          ===================================================================== */}
      <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#35563B]" />
            <h2 className="text-sm font-bold text-[#202B27]">Scientific Curation & Provenance Tracker</h2>
          </div>
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E6DC] bg-white text-xs font-bold text-[#202B27] hover:bg-[#F7F6EF] transition-colors shadow-2xs"
          >
            <Upload size={13} />
            <span>Import CSV or JSON</span>
          </button>
        </div>

        <div className="rounded-xl border border-[#E5E6DC] bg-white p-3.5 text-xs text-[#68716B] leading-relaxed">
          <p className="font-bold text-[#202B27] mb-1">How the research library is tracked</p>
          <p>
            The project targets six documented research networks, two per ecosystem category. Every slot carries a sourced
            dataset marked <strong className="text-[#35563B]">Research source verified</strong>: for each one the node and link
            sets have been re-derived from committed source files, the link direction is confirmed from source documentation,
            and the citation and reuse terms are checked against repository records. The two freshwater networks come from the
            same mesocosm experiment (Pond 1 and the control replicate Pond 47), which is explicitly stated in their provenance.
          </p>
        </div>

        <ResearchSlotsPanel verifiedCount={verified} onOpenImport={onOpenImport} />
      </div>
    </div>
  )
}
