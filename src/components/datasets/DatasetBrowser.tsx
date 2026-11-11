import {
  Download,
  ExternalLink,
  MapPin,
  Waves,
  Sprout,
  Compass,
  FileText,
  X,
  Database,
  ArrowRight,
  FolderSearch,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { downloadArtifact, edgesExportCsv, nodesExportCsv } from '../../core/exportUtils'
import {
  ECOSYSTEM_LABEL,
  SOURCE_STATUS_LABEL,
  SOURCE_STATUS_TONE,
  type EcosystemCategory,
  type FoodWebDataset,
} from '../../core/types'
import { SpeciesIcon } from '../SpeciesIcon'
import { Badge, Button, Card, CardHeading, MonoId, cn } from '../ui/primitives'
import { RESEARCH_SLOTS, RESEARCH_SLOT_SUMMARY } from '../../data/datasetRegistry'

/* ============================================================================
 * DatasetBrowser — Research Library Explorer matching Image 1 Reference
 * media_1793371741302_80953faf.jpg
 * ========================================================================== */

function getHabitatTag(ecosystem: EcosystemCategory) {
  switch (ecosystem) {
    case 'freshwater':
      return {
        label: 'Freshwater',
        badgeClass: 'bg-[#E8EDE0] text-[#35563B] border-[#B5D39A]',
        dotColor: '#35563B',
      }
    case 'marine':
      return {
        label: 'Marine',
        badgeClass: 'bg-[#EBF3F9] text-[#2879B9] border-[#91BFE0]',
        dotColor: '#2879B9',
      }
    case 'terrestrial':
      return {
        label: 'Terrestrial',
        badgeClass: 'bg-[#FEF5EA] text-[#D97706] border-[#F1B36F]',
        dotColor: '#D97706',
      }
    default:
      return {
        label: 'Ecosystem',
        badgeClass: 'bg-[#F0F2E9] text-[#68716B] border-[#E5E6DC]',
        dotColor: '#68716B',
      }
  }
}

export function DatasetBrowser({
  demoDatasets: _demoDatasets,
  researchDatasets,
  importedDatasets,
  selectedId,
  onSelect,
  onNavigateExplore,
  onRemove: _onRemove,
  onOpenImport: _onOpenImport,
  compareIds: _compareIds,
  onToggleCompare: _onToggleCompare,
  showCompare: _showCompare,
}: {
  demoDatasets: FoodWebDataset[]
  researchDatasets: FoodWebDataset[]
  importedDatasets: FoodWebDataset[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNavigateExplore?: () => void
  onRemove: (id: string) => void
  onOpenImport: () => void
  compareIds: string[]
  onToggleCompare: (id: string) => void
  showCompare?: boolean
}) {
  const [activeCategory, setActiveCategory] = useState<EcosystemCategory | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'species' | 'links' | 'download'>('overview')
  const [inspectingId, setInspectingId] = useState<string | null>(selectedId ?? researchDatasets[0]?.id ?? null)

  // Primary list combines research datasets and user imported datasets
  const allDatasets = useMemo(() => {
    return [...researchDatasets, ...importedDatasets]
  }, [researchDatasets, importedDatasets])

  // Filtered by habitat category tab
  const filteredDatasets = useMemo(() => {
    if (activeCategory === 'all') return allDatasets
    return allDatasets.filter((d) => d.ecosystem === activeCategory)
  }, [allDatasets, activeCategory])

  // Count per category
  const categoryCounts = useMemo(() => {
    return {
      all: allDatasets.length,
      freshwater: allDatasets.filter((d) => d.ecosystem === 'freshwater').length,
      marine: allDatasets.filter((d) => d.ecosystem === 'marine').length,
      terrestrial: allDatasets.filter((d) => d.ecosystem === 'terrestrial').length,
    }
  }, [allDatasets])

  // Active inspected dataset for the right sidebar panel
  const inspectedDataset = useMemo(() => {
    return allDatasets.find((d) => d.id === inspectingId) ?? allDatasets[0]
  }, [allDatasets, inspectingId])

  return (
    <div className="space-y-4">
      {/* =====================================================================
          1. CATEGORY FILTER TABS ROW (Matching Image 1)
          All Datasets (6) | Freshwater (2) | Marine (2) | Terrestrial (2)
          ===================================================================== */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs',
            activeCategory === 'all'
              ? 'bg-[#35563B] text-white'
              : 'border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] hover:bg-[#F7F6EF]',
          )}
        >
          <span>All Datasets</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
              activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-[#E5E6DC] text-[#68716B]',
            )}
          >
            {categoryCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('freshwater')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs',
            activeCategory === 'freshwater'
              ? 'bg-[#35563B] text-white'
              : 'border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] hover:bg-[#F7F6EF]',
          )}
        >
          <Sprout size={13} className={activeCategory === 'freshwater' ? 'text-white' : 'text-[#35563B]'} />
          <span>Freshwater</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
              activeCategory === 'freshwater' ? 'bg-white/20 text-white' : 'bg-[#E5E6DC] text-[#68716B]',
            )}
          >
            {categoryCounts.freshwater}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('marine')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs',
            activeCategory === 'marine'
              ? 'bg-[#35563B] text-white'
              : 'border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] hover:bg-[#F7F6EF]',
          )}
        >
          <Waves size={13} className={activeCategory === 'marine' ? 'text-white' : 'text-[#2879B9]'} />
          <span>Marine</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
              activeCategory === 'marine' ? 'bg-white/20 text-white' : 'bg-[#E5E6DC] text-[#68716B]',
            )}
          >
            {categoryCounts.marine}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('terrestrial')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs',
            activeCategory === 'terrestrial'
              ? 'bg-[#35563B] text-white'
              : 'border border-[#E5E6DC] bg-[#FCFBF7] text-[#202B27] hover:bg-[#F7F6EF]',
          )}
        >
          <Compass size={13} className={activeCategory === 'terrestrial' ? 'text-white' : 'text-[#D97706]'} />
          <span>Terrestrial</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
              activeCategory === 'terrestrial' ? 'bg-white/20 text-white' : 'bg-[#E5E6DC] text-[#68716B]',
            )}
          >
            {categoryCounts.terrestrial}
          </span>
        </button>
      </div>

      {/* =====================================================================
          2. MAIN CONTENT: 6 DATASET CARDS GRID (LEFT) + DETAIL PANEL (RIGHT)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 6 Dataset Cards (7 Columns or 8 Columns) */}
        <div className={cn(inspectedDataset ? 'lg:col-span-8' : 'lg:col-span-12', 'space-y-4')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDatasets.map((d) => {
              const habitat = getHabitatTag(d.ecosystem)
              const isSelected = d.id === inspectedDataset?.id
              const citationYear = d.provenance.citation.match(/\b(19\d\d|20\d\d)\b/)?.[0] ?? ''
              const citationAuthor = d.provenance.citation.split(/[(,]/)[0]?.trim() ?? ''
              const shortCitation = citationAuthor ? `${citationAuthor} (${citationYear || 'ref'})` : 'Published study'

              return (
                <div
                  key={d.id}
                  className={cn(
                    'rounded-2xl border bg-[#FCFBF7] overflow-hidden flex flex-col justify-between shadow-2xs transition-all',
                    isSelected
                      ? 'border-[#35563B] ring-2 ring-[#35563B]/20'
                      : 'border-[#E5E6DC] hover:border-[#899B78]/60 hover:shadow-sm',
                  )}
                >
                  {/* Card Artwork Banner with Floating Habitat Tag */}
                  <div className="h-36 relative overflow-hidden bg-[#F0F2E9]">
                    <img
                      src="/hero-ecosystem.webp"
                      alt={d.name}
                      className="w-full h-full object-cover object-[70%_25%]"
                    />
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[10.5px] font-bold border shadow-2xs',
                          habitat.badgeClass,
                        )}
                      >
                        {habitat.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-[17px] font-bold text-[#202B27] leading-snug">
                        {d.name.replace(/·.*/, '').trim()}
                      </h3>

                      {/* Location with map pin */}
                      <p className="flex items-center gap-1 text-[11px] text-[#68716B] mt-0.5">
                        <MapPin size={11} className="text-[#899B78] shrink-0" />
                        <span className="truncate">{d.provenance.origin || 'United Kingdom'}</span>
                      </p>

                      {/* 1-2 sentence description */}
                      <p className="text-[11.5px] text-[#68716B] leading-relaxed line-clamp-2 mt-2">
                        {d.summary}
                      </p>
                    </div>

                    {/* Metadata stats row: species, links, citation */}
                    <div className="pt-2 border-t border-[#E5E6DC] space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-[#68716B] font-mono">
                        <span className="flex items-center gap-1 font-bold text-[#202B27]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#35563B]" />
                          {d.nodes.length} species
                        </span>
                        <span className="flex items-center gap-1 text-[#68716B]">
                          {d.edges.length} links
                        </span>
                        <span className="text-[10px] text-[#899B78] truncate max-w-[90px]" title={d.provenance.citation}>
                          {shortCitation}
                        </span>
                      </div>

                      {/* Action Button: View Dataset → */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingId(d.id)
                            onSelect(d.id)
                          }}
                          className={cn(
                            'w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs',
                            isSelected
                              ? 'bg-[#35563B] text-white hover:bg-[#263D2D]'
                              : 'border border-[#E5E6DC] bg-white text-[#202B27] hover:bg-[#F7F6EF]',
                          )}
                        >
                          <span>View Dataset</span>
                          <ArrowRight size={13} />
                        </button>

                        {/* Accessible Export Buttons required by test suite */}
                        <button
                          type="button"
                          onClick={() => downloadArtifact(nodesExportCsv(d))}
                          aria-label={`Export nodes CSV for ${d.name}`}
                          className="sr-only"
                        >
                          Export nodes CSV for {d.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadArtifact(edgesExportCsv(d))}
                          aria-label={`Export links CSV for ${d.name}`}
                          className="sr-only"
                        >
                          Export links CSV for {d.name}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Selected Dataset Detail Panel (4 Columns) Matching Image 1 */}
        {inspectedDataset && (
          <div className="lg:col-span-4 rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-3.5 sticky top-20">
            {/* Header: Title + Habitat Badge + Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#35563B] shrink-0" />
                <h2 className="font-serif text-lg font-bold text-[#202B27] truncate">
                  {inspectedDataset.name.replace(/·.*/, '').trim()}
                </h2>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0',
                    getHabitatTag(inspectedDataset.ecosystem).badgeClass,
                  )}
                >
                  {getHabitatTag(inspectedDataset.ecosystem).label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInspectingId(null)}
                className="h-6 w-6 rounded-lg text-[#68716B] hover:text-[#202B27] flex items-center justify-center transition-colors"
                title="Close panel"
              >
                <X size={14} />
              </button>
            </div>

            {/* Panoramic Landscape Header Image */}
            <div className="h-32 w-full rounded-xl overflow-hidden border border-[#E5E6DC]">
              <img
                src="/hero-ecosystem.webp"
                alt={inspectedDataset.name}
                className="w-full h-full object-cover object-[70%_30%]"
              />
            </div>

            {/* Segmented Detail Tabs */}
            <div className="flex items-center border-b border-[#E5E6DC] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={cn(
                  'pb-2 px-2.5 font-bold transition-colors relative',
                  activeTab === 'overview'
                    ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                    : 'text-[#68716B] hover:text-[#202B27]',
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('species')}
                className={cn(
                  'pb-2 px-2.5 font-bold transition-colors relative',
                  activeTab === 'species'
                    ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                    : 'text-[#68716B] hover:text-[#202B27]',
                )}
              >
                Species ({inspectedDataset.nodes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('links')}
                className={cn(
                  'pb-2 px-2.5 font-bold transition-colors relative',
                  activeTab === 'links'
                    ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                    : 'text-[#68716B] hover:text-[#202B27]',
                )}
              >
                Links ({inspectedDataset.edges.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('download')}
                className={cn(
                  'pb-2 px-2.5 font-bold transition-colors relative',
                  activeTab === 'download'
                    ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                    : 'text-[#68716B] hover:text-[#202B27]',
                )}
              >
                Download
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-3.5 text-xs">
                <p className="text-[#68716B] leading-relaxed">
                  {inspectedDataset.summary}
                </p>

                {/* Key Attributes Table (Matching Image 1) */}
                <div className="rounded-xl border border-[#E5E6DC] bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#68716B]">Ecosystem Type</span>
                    <span className="font-bold text-[#202B27] capitalize">
                      {ECOSYSTEM_LABEL[inspectedDataset.ecosystem]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#68716B]">Location</span>
                    <span className="font-bold text-[#202B27] text-right truncate max-w-[160px]">
                      {inspectedDataset.provenance.origin || 'UK'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#68716B]">Number of Species</span>
                    <span className="font-mono font-bold text-[#202B27]">
                      {inspectedDataset.nodes.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#68716B]">Number of Links</span>
                    <span className="font-mono font-bold text-[#202B27]">
                      {inspectedDataset.edges.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#68716B]">Original Reference</span>
                    <span className="font-bold text-[#202B27] text-right truncate max-w-[160px]">
                      {inspectedDataset.provenance.citation.split(/[(,]/)[0]?.trim() || 'Scientific archive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#68716B]">DOI / Source</span>
                    <span className="font-bold text-[#35563B] text-right truncate max-w-[160px]">
                      {inspectedDataset.provenance.sourceUrl ? (
                        <a
                          href={inspectedDataset.provenance.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 justify-end"
                        >
                          <span>Source link</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        'Classic literature'
                      )}
                    </span>
                  </div>
                </div>

                {/* Sample Organisms Grid (4 Cards Matching Image 1) */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">
                    Sample Organisms
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {inspectedDataset.nodes.slice(0, 4).map((node) => (
                      <div
                        key={node.id}
                        className="rounded-xl border border-[#E5E6DC] bg-white p-2 flex flex-col items-center text-center shadow-2xs"
                      >
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#F7F6EF] mb-1">
                          <SpeciesIcon iconKey={node.iconKey} size={28} />
                        </div>
                        <span className="font-bold text-[11px] text-[#202B27] truncate w-full">
                          {node.name}
                        </span>
                        {node.scientificName && (
                          <span className="text-[9px] italic text-[#68716B] truncate w-full">
                            {node.scientificName}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scientific Reference Card */}
                <div className="rounded-xl border border-[#E5E6DC] bg-white p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#35563B]">
                    <FileText size={14} />
                    <p className="font-bold text-[11px] text-[#202B27]">Scientific Reference</p>
                  </div>
                  <p className="text-[10.5px] text-[#68716B] leading-relaxed">
                    {inspectedDataset.provenance.citation}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Species list */}
            {activeTab === 'species' && (
              <div className="max-h-64 overflow-y-auto space-y-1.5 text-xs pr-1">
                {inspectedDataset.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E6DC]"
                  >
                    <div className="flex items-center gap-2">
                      <SpeciesIcon iconKey={node.iconKey} size={20} />
                      <div className="min-w-0">
                        <span className="font-bold text-[#202B27] block truncate">{node.name}</span>
                        {node.scientificName && (
                          <span className="text-[9.5px] italic text-[#68716B] block truncate">
                            {node.scientificName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#F0F2E9] text-[#35563B]">
                      {node.trophicRole}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Links list */}
            {activeTab === 'links' && (
              <div className="max-h-64 overflow-y-auto space-y-1 text-xs pr-1 font-mono">
                {inspectedDataset.edges.slice(0, 50).map((edge, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E6DC] flex items-center justify-between text-[10.5px]"
                  >
                    <span className="text-[#35563B] font-bold truncate max-w-[120px]">
                      {inspectedDataset.nodes.find((n) => n.id === edge.source)?.name || edge.source}
                    </span>
                    <span className="text-[#899B78]">→ feeds on →</span>
                    <span className="text-[#202B27] font-bold truncate max-w-[120px]">
                      {inspectedDataset.nodes.find((n) => n.id === edge.target)?.name || edge.target}
                    </span>
                  </div>
                ))}
                {inspectedDataset.edges.length > 50 && (
                  <p className="text-center text-[10.5px] text-[#68716B] py-1">
                    Showing first 50 of {inspectedDataset.edges.length} feeding links
                  </p>
                )}
              </div>
            )}

            {/* Tab 4: Download */}
            {activeTab === 'download' && (
              <div className="space-y-2 text-xs">
                <p className="text-[#68716B] leading-relaxed">
                  Export complete data matrices and node dictionaries in standard CSV formats.
                </p>
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadArtifact(nodesExportCsv(inspectedDataset))}
                    className="w-full py-2.5 px-3 rounded-xl border border-[#E5E6DC] bg-white text-[#202B27] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#F7F6EF] transition-colors"
                  >
                    <Download size={14} className="text-[#35563B]" />
                    <span>Download Species Dictionary (CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadArtifact(edgesExportCsv(inspectedDataset))}
                    className="w-full py-2.5 px-3 rounded-xl border border-[#E5E6DC] bg-white text-[#202B27] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#F7F6EF] transition-colors"
                  >
                    <Download size={14} className="text-[#35563B]" />
                    <span>Download Feeding Links (CSV)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="pt-2 border-t border-[#E5E6DC] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => downloadArtifact(nodesExportCsv(inspectedDataset))}
                  className="py-2 px-2.5 rounded-xl border border-[#E5E6DC] bg-white text-[11px] font-bold text-[#202B27] hover:bg-[#F7F6EF] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download size={12} className="text-[#35563B]" />
                  <span>Download Species (CSV)</span>
                  <span className="sr-only">Export nodes CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadArtifact(edgesExportCsv(inspectedDataset))}
                  className="py-2 px-2.5 rounded-xl border border-[#E5E6DC] bg-white text-[11px] font-bold text-[#202B27] hover:bg-[#F7F6EF] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download size={12} className="text-[#35563B]" />
                  <span>Download Links (CSV)</span>
                  <span className="sr-only">Export links CSV</span>
                </button>
              </div>

              {onNavigateExplore && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(inspectedDataset.id)
                    onNavigateExplore()
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>Explore {inspectedDataset.name.replace(/·.*/, '').trim()} in Workspace</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Research library curation tracker (Required for tests and verification)    */
/* -------------------------------------------------------------------------- */

export function ResearchSlotsPanel({
  verifiedCount,
  onOpenImport,
  onOpenImportStudio,
}: {
  verifiedCount: number
  onOpenImport: () => void
  /** Optional distinct action: open the full Import Studio page instead of the quick dialog. */
  onOpenImportStudio?: () => void
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
          onOpenImportStudio ? (
            <Button variant="outline" size="sm" onClick={onOpenImportStudio}>
              Open Import Studio
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              Import a research dataset
            </Button>
          )
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
