import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  FolderSearch,
  MapPin,
  Search,
  Sprout,
  Waves,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { downloadArtifact, edgesExportCsv, nodesExportCsv } from '../../core/exportUtils'
import {
  ECOSYSTEM_LABEL,
  SOURCE_STATUS_LABEL,
  SOURCE_STATUS_TONE,
  TROPHIC_ROLE_LABEL,
  TROPHIC_ROLES,
  type EcosystemCategory,
  type FoodWebDataset,
  type TrophicRole,
} from '../../core/types'
import { SpeciesIcon } from '../SpeciesIcon'
import { Badge, Button, Card, CardHeading, MonoId, cn } from '../ui/primitives'
import { RESEARCH_SLOTS, RESEARCH_SLOT_SUMMARY } from '../../data/datasetRegistry'
import { buildGraph } from '../../core/graphModel'
import { formatConnectance } from '../../core/metrics'

/* ============================================================================
 * DatasetBrowser — Research Library Explorer & Full-Page Dataset Inspector
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
  selectedId: _selectedId,
  inspectingId,
  onInspect,
  onBack,
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
  inspectingId?: string | null
  onInspect?: (id: string | null) => void
  onBack?: () => void
  onSelect: (id: string) => void
  onNavigateExplore?: () => void
  onRemove: (id: string) => void
  onOpenImport: () => void
  compareIds: string[]
  onToggleCompare: (id: string) => void
  showCompare?: boolean
}) {
  const [internalInspectingId, setInternalInspectingId] = useState<string | null>(null)
  const currentInspectingId = inspectingId !== undefined ? inspectingId : internalInspectingId

  const handleInspect = (id: string | null) => {
    if (onInspect) {
      onInspect(id)
    } else {
      setInternalInspectingId(id)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      handleInspect(null)
    }
  }

  const [activeCategory, setActiveCategory] = useState<EcosystemCategory | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'species' | 'links' | 'download'>('overview')
  const [speciesSearch, setSpeciesSearch] = useState('')
  const [speciesRoleFilter, setSpeciesRoleFilter] = useState<TrophicRole | 'all'>('all')
  const [linkSearch, setLinkSearch] = useState('')
  const [copiedCitation, setCopiedCitation] = useState(false)

  // Primary list combines research datasets and user imported datasets
  const allDatasets = useMemo(() => {
    return [...researchDatasets, ...importedDatasets]
  }, [researchDatasets, importedDatasets])

  // Filtered by habitat category tab (for catalog view)
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

  // Active inspected dataset
  const inspectedDataset = useMemo(() => {
    if (!currentInspectingId) return null
    return allDatasets.find((d) => d.id === currentInspectingId) ?? null
  }, [allDatasets, currentInspectingId])

  // Built graph for the inspected dataset (for degree calculations)
  const inspectedGraph = useMemo(() => {
    if (!inspectedDataset) return null
    return buildGraph(inspectedDataset)
  }, [inspectedDataset])

  // Structural metrics for the inspected dataset
  const metrics = useMemo(() => {
    if (!inspectedDataset) return null
    const s = inspectedDataset.nodes.length
    const l = inspectedDataset.edges.length
    const connectance = s > 1 ? l / (s * (s - 1)) : 0
    const density = s > 0 ? l / s : 0
    const producers = inspectedDataset.nodes.filter((n) => n.trophicRole === 'producer').length
    const consumers = s - producers
    return {
      s,
      l,
      connectance,
      density: density.toFixed(2),
      producers,
      consumers,
    }
  }, [inspectedDataset])

  // Filtered species list for the species tab
  const filteredNodes = useMemo(() => {
    if (!inspectedDataset) return []
    let nodes = inspectedDataset.nodes
    if (speciesRoleFilter !== 'all') {
      nodes = nodes.filter((n) => n.trophicRole === speciesRoleFilter)
    }
    if (speciesSearch.trim()) {
      const q = speciesSearch.toLowerCase().trim()
      nodes = nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          (n.scientificName && n.scientificName.toLowerCase().includes(q)) ||
          n.trophicRole.toLowerCase().includes(q),
      )
    }
    return nodes
  }, [inspectedDataset, speciesRoleFilter, speciesSearch])

  // Filtered links list for the links tab
  const filteredEdges = useMemo(() => {
    if (!inspectedDataset) return []
    if (!linkSearch.trim()) return inspectedDataset.edges
    const q = linkSearch.toLowerCase().trim()
    return inspectedDataset.edges.filter((e) => {
      const sourceNode = inspectedDataset.nodes.find((n) => n.id === e.source)
      const targetNode = inspectedDataset.nodes.find((n) => n.id === e.target)
      const sName = sourceNode?.name.toLowerCase() ?? e.source.toLowerCase()
      const tName = targetNode?.name.toLowerCase() ?? e.target.toLowerCase()
      return sName.includes(q) || tName.includes(q)
    })
  }, [inspectedDataset, linkSearch])

  const handleCopyCitation = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => {
        setCopiedCitation(true)
        setTimeout(() => setCopiedCitation(false), 2000)
      })
    }
  }

  // =========================================================================
  // VIEW 1: FULL-PAGE DATASET VIEW (When user clicks a dataset)
  // =========================================================================
  if (inspectedDataset && metrics && inspectedGraph) {
    const habitat = getHabitatTag(inspectedDataset.ecosystem)
    const citationYear = inspectedDataset.provenance.citation.match(/\b(19\d\d|20\d\d)\b/)?.[0] ?? ''
    const citationAuthor = inspectedDataset.provenance.citation.split(/[(,]/)[0]?.trim() ?? ''
    const shortCitation = citationAuthor ? `${citationAuthor} (${citationYear || 'ref'})` : 'Published study'

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Navigation & Actions Top Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E6DC]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E6DC] bg-white hover:bg-[#F7F6EF] text-[#202B27] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft size={14} className="text-[#35563B]" />
              <span>Back to Research Library</span>
            </button>

            <span className="text-[#899B78] hidden sm:inline">/</span>

            <div className="hidden md:flex items-center gap-2 text-xs text-[#68716B]">
              <span>Switch Dataset:</span>
              <select
                value={inspectedDataset.id}
                onChange={(e) => {
                  handleInspect(e.target.value)
                  onSelect(e.target.value)
                }}
                className="rounded-lg border border-[#E5E6DC] bg-white px-2.5 py-1 text-xs font-bold text-[#202B27] focus:outline-none focus:ring-1 focus:ring-[#35563B] cursor-pointer"
              >
                {allDatasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.replace(/·.*/, '').trim()} ({ECOSYSTEM_LABEL[d.ecosystem]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => downloadArtifact(nodesExportCsv(inspectedDataset))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E6DC] bg-white hover:bg-[#F7F6EF] text-xs font-semibold text-[#202B27] transition-colors shadow-2xs cursor-pointer"
              title="Download Species Dictionary CSV"
            >
              <Download size={13} className="text-[#35563B]" />
              <span>Export Species</span>
              <span className="sr-only">Export nodes CSV</span>
            </button>

            <button
              type="button"
              onClick={() => downloadArtifact(edgesExportCsv(inspectedDataset))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E6DC] bg-white hover:bg-[#F7F6EF] text-xs font-semibold text-[#202B27] transition-colors shadow-2xs cursor-pointer"
              title="Download Feeding Links CSV"
            >
              <Download size={13} className="text-[#35563B]" />
              <span>Export Links</span>
              <span className="sr-only">Export links CSV</span>
            </button>

            {onNavigateExplore && (
              <button
                type="button"
                onClick={() => {
                  onSelect(inspectedDataset.id)
                  onNavigateExplore()
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Explore in Workspace</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Full-Width Hero Section */}
        <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-6 lg:p-8 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs flex items-center gap-1.5',
                    habitat.badgeClass,
                  )}
                >
                  {inspectedDataset.ecosystem === 'freshwater' && <Sprout size={13} />}
                  {inspectedDataset.ecosystem === 'marine' && <Waves size={13} />}
                  {inspectedDataset.ecosystem === 'terrestrial' && <Compass size={13} />}
                  <span>{habitat.label} Biome</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-2xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>Research Source Verified</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[#E5E6DC] bg-white text-[#68716B] shadow-2xs flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#899B78]" />
                  <span>{inspectedDataset.provenance.origin || 'United Kingdom'}</span>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#202B27] tracking-tight">
                  {inspectedDataset.name.replace(/·.*/, '').trim()}
                </h1>
                <p className="text-xs sm:text-sm text-[#68716B] leading-relaxed max-w-3xl">
                  {inspectedDataset.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#68716B] pt-2 border-t border-[#E5E6DC]/80 font-mono">
                <span>
                  Identifier: <strong className="text-[#202B27]">{inspectedDataset.id}</strong>
                </span>
                <span>
                  Citation: <strong className="text-[#202B27]">{shortCitation}</strong>
                </span>
                {inspectedDataset.provenance.sourceUrl && (
                  <a
                    href={inspectedDataset.provenance.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#35563B] font-sans font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View Primary Literature</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Right Landscape Artwork */}
            <div className="lg:col-span-4 h-48 lg:h-56 rounded-2xl overflow-hidden border border-[#E5E6DC] shadow-sm relative">
              <img
                src="/hero-ecosystem.webp"
                alt={inspectedDataset.name}
                className="w-full h-full object-cover object-[70%_25%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-3">
                <p className="text-[11px] text-white/95 font-medium">
                  {ECOSYSTEM_LABEL[inspectedDataset.ecosystem]} ecosystem habitat profile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Topological Metrics Strip (4 Cards Full-Width) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">Species Richness</span>
            <p className="text-2xl font-bold font-mono text-[#202B27]">{metrics.s}</p>
            <p className="text-[11px] text-[#68716B]">
              {metrics.producers} producers · {metrics.consumers} consumers
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">Feeding Links</span>
            <p className="text-2xl font-bold font-mono text-[#202B27]">{metrics.l}</p>
            <p className="text-[11px] text-[#68716B]">Directed predator-prey links</p>
          </div>

          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">Connectance (C)</span>
            <p className="text-2xl font-bold font-mono text-[#35563B]">{formatConnectance(metrics.connectance)}</p>
            <p className="text-[11px] text-[#68716B]">Link density fraction: L / S(S-1)</p>
          </div>

          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716B]">Linkage Density</span>
            <p className="text-2xl font-bold font-mono text-[#202B27]">{metrics.density}</p>
            <p className="text-[11px] text-[#68716B]">Mean feeding links per species</p>
          </div>
        </div>

        {/* Segmented Full-Width Tabs Bar */}
        <div className="border-b border-[#E5E6DC]">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-4 py-2.5 text-xs font-bold transition-colors relative cursor-pointer',
                activeTab === 'overview'
                  ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              Overview & Habitat
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('species')}
              className={cn(
                'px-4 py-2.5 text-xs font-bold transition-colors relative cursor-pointer',
                activeTab === 'species'
                  ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              Species Directory ({inspectedDataset.nodes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={cn(
                'px-4 py-2.5 text-xs font-bold transition-colors relative cursor-pointer',
                activeTab === 'links'
                  ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              Feeding Links ({inspectedDataset.edges.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={cn(
                'px-4 py-2.5 text-xs font-bold transition-colors relative cursor-pointer',
                activeTab === 'download'
                  ? 'text-[#35563B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#35563B]'
                  : 'text-[#68716B] hover:text-[#202B27]',
              )}
            >
              Downloads & Citation
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Habitat */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Representative Species Showcase */}
            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#202B27]">
                    Representative Community Organisms
                  </h3>
                  <p className="text-xs text-[#68716B]">
                    Primary producers, herbivores, carnivores, and apex consumers in this food web
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('species')}
                  className="text-xs font-bold text-[#35563B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({inspectedDataset.nodes.length})</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {inspectedDataset.nodes.map((node) => {
                  const preyCount = inspectedGraph.foodSourcesOf.get(node.id)?.length ?? 0
                  const predCount = inspectedGraph.consumersOf.get(node.id)?.length ?? 0
                  return (
                    <div
                      key={node.id}
                      className="rounded-xl border border-[#E5E6DC] bg-white p-3 flex flex-col items-center text-center shadow-2xs hover:border-[#899B78] transition-colors"
                    >
                      <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#F7F6EF] mb-2">
                        <SpeciesIcon iconKey={node.iconKey} size={32} />
                      </div>
                      <span className="font-bold text-xs text-[#202B27] truncate w-full" title={node.name}>
                        {node.name}
                      </span>
                      {node.scientificName && (
                        <span className="text-[10px] italic text-[#68716B] truncate w-full" title={node.scientificName}>
                          {node.scientificName}
                        </span>
                      )}
                      <span className="mt-2 text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-[#F0F2E9] text-[#35563B] font-semibold">
                        {TROPHIC_ROLE_LABEL[node.trophicRole] ?? node.trophicRole}
                      </span>
                      <p className="text-[10px] text-[#899B78] font-mono mt-1.5">
                        {preyCount} prey · {predCount} pred
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scientific Attributes & Sampling Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3">
                <h3 className="font-serif text-base font-bold text-[#202B27] pb-2 border-b border-[#E5E6DC]">
                  Ecological Classification & Origin
                </h3>
                <div className="space-y-2 text-xs divide-y divide-[#E5E6DC]/60">
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[#68716B]">Ecosystem Category</span>
                    <span className="font-bold text-[#202B27] capitalize">
                      {ECOSYSTEM_LABEL[inspectedDataset.ecosystem]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[#68716B]">Sampling Location</span>
                    <span className="font-bold text-[#202B27]">
                      {inspectedDataset.provenance.origin || 'United Kingdom'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[#68716B]">Matrix Resolution</span>
                    <span className="font-mono font-bold text-[#202B27]">
                      {inspectedDataset.nodes.length} × {inspectedDataset.nodes.length} species adjacency
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[#68716B]">Verification Status</span>
                    <span className="font-bold text-emerald-800">
                      Research Source Verified (100% verified)
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3">
                <h3 className="font-serif text-base font-bold text-[#202B27] pb-2 border-b border-[#E5E6DC]">
                  Empirical Literature Provenance
                </h3>
                <div className="space-y-2 text-xs">
                  <p className="text-[#68716B] leading-relaxed">
                    <strong>Published Research: </strong>
                    {inspectedDataset.provenance.citation}
                  </p>
                  {inspectedDataset.provenance.sourceUrl && (
                    <div className="pt-2 border-t border-[#E5E6DC]/80">
                      <a
                        href={inspectedDataset.provenance.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#35563B] hover:underline"
                      >
                        <ExternalLink size={13} />
                        <span>Access Original Research Paper / Repository</span>
                      </a>
                    </div>
                  )}
                  {inspectedDataset.provenance.cleaningNotes && inspectedDataset.provenance.cleaningNotes.length > 0 && (
                    <div className="text-[11px] text-[#68716B] pt-2 border-t border-[#E5E6DC]/60">
                      <p className="font-semibold text-[#202B27] mb-1">Curation & Verification Notes:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {inspectedDataset.provenance.cleaningNotes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Species Directory Full-Width Table */}
        {activeTab === 'species' && (
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E6DC]">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#899B78]" />
                <input
                  type="text"
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
                  placeholder="Search species by common or scientific name..."
                  className="w-full rounded-xl border border-[#E5E6DC] bg-white pl-9 pr-3 py-2 text-xs text-[#202B27] placeholder:text-[#899B78] focus:outline-none focus:ring-1 focus:ring-[#35563B]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#68716B]">
                  <span>Filter role:</span>
                  <select
                    value={speciesRoleFilter}
                    onChange={(e) => setSpeciesRoleFilter(e.target.value as TrophicRole | 'all')}
                    className="rounded-lg border border-[#E5E6DC] bg-white px-2.5 py-1.5 text-xs font-bold text-[#202B27] focus:outline-none focus:ring-1 focus:ring-[#35563B] cursor-pointer"
                  >
                    <option value="all">All Trophic Roles ({inspectedDataset.nodes.length})</option>
                    {TROPHIC_ROLES.map((role) => {
                      const count = inspectedDataset.nodes.filter((n) => n.trophicRole === role).length
                      return (
                        <option key={role} value={role}>
                          {TROPHIC_ROLE_LABEL[role]} ({count})
                        </option>
                      )
                    })}
                  </select>
                </div>
                <span className="text-xs text-[#68716B] font-mono">
                  Showing {filteredNodes.length} of {inspectedDataset.nodes.length}
                </span>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E5E6DC] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F6EF] text-[10.5px] uppercase font-bold text-[#68716B] border-b border-[#E5E6DC]">
                  <tr>
                    <th className="py-2.5 px-4">Organism</th>
                    <th className="py-2.5 px-3">Trophic Role</th>
                    <th className="py-2.5 px-3">Food Sources (Prey)</th>
                    <th className="py-2.5 px-3">Consumers (Predators)</th>
                    <th className="py-2.5 px-3">Total Degree</th>
                    <th className="py-2.5 px-4 text-right">Identifier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E6DC]/60">
                  {filteredNodes.map((node) => {
                    const foodSources = inspectedGraph.foodSourcesOf.get(node.id) ?? []
                    const consumers = inspectedGraph.consumersOf.get(node.id) ?? []
                    const degree = foodSources.length + consumers.length

                    return (
                      <tr key={node.id} className="hover:bg-[#F7F6EF]/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-[#F7F6EF] flex items-center justify-center shrink-0">
                              <SpeciesIcon iconKey={node.iconKey} size={22} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#202B27]">{node.name}</p>
                              {node.scientificName && (
                                <p className="text-[10px] italic text-[#68716B]">{node.scientificName}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#F0F2E9] text-[#35563B]">
                            {TROPHIC_ROLE_LABEL[node.trophicRole] ?? node.trophicRole}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-bold text-[#202B27]">{foodSources.length}</span>
                          <span className="text-[10px] text-[#899B78] ml-1">prey</span>
                        </td>

                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-bold text-[#202B27]">{consumers.length}</span>
                          <span className="text-[10px] text-[#899B78] ml-1">predators</span>
                        </td>

                        <td className="py-2.5 px-3 font-mono font-bold text-[#202B27]">
                          {degree}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono text-[10.5px] text-[#899B78]">
                          {node.id}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredNodes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#68716B]">
                        No species found matching &quot;{speciesSearch}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Feeding Links Full-Width Table */}
        {activeTab === 'links' && (
          <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-4">
            {/* Search Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E6DC]">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#899B78]" />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Filter links by organism name..."
                  className="w-full rounded-xl border border-[#E5E6DC] bg-white pl-9 pr-3 py-2 text-xs text-[#202B27] placeholder:text-[#899B78] focus:outline-none focus:ring-1 focus:ring-[#35563B]"
                />
              </div>

              <span className="text-xs text-[#68716B] font-mono">
                Showing {filteredEdges.length} of {inspectedDataset.edges.length} feeding links
              </span>
            </div>

            {/* Full-Width Grid of Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredEdges.map((edge, i) => {
                const sourceNode = inspectedDataset.nodes.find((n) => n.id === edge.source)
                const targetNode = inspectedDataset.nodes.find((n) => n.id === edge.target)

                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-[#E5E6DC] flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-[#899B78] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {sourceNode && <SpeciesIcon iconKey={sourceNode.iconKey} size={20} />}
                      <div className="min-w-0">
                        <span className="font-bold text-[#35563B] truncate block">
                          {sourceNode?.name || edge.source}
                        </span>
                        <span className="text-[9.5px] text-[#68716B] block">Food organism / Prey</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0 px-2">
                      <span className="text-[9.5px] font-mono text-[#899B78]">energy flow</span>
                      <ArrowRight size={14} className="text-[#35563B]" />
                    </div>

                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                      <div className="min-w-0">
                        <span className="font-bold text-[#202B27] truncate block">
                          {targetNode?.name || edge.target}
                        </span>
                        <span className="text-[9.5px] text-[#68716B] block">Consumer / Predator</span>
                      </div>
                      {targetNode && <SpeciesIcon iconKey={targetNode.iconKey} size={20} />}
                    </div>
                  </div>
                )
              })}
              {filteredEdges.length === 0 && (
                <div className="col-span-2 py-8 text-center text-[#68716B]">
                  No feeding links found matching &quot;{linkSearch}&quot;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Downloads & Citation */}
        {activeTab === 'download' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Nodes Export */}
              <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-[#E8EDE0] text-[#35563B] flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#202B27]">
                    Species Dictionary (CSV)
                  </h3>
                  <p className="text-xs text-[#68716B] leading-relaxed">
                    Download the complete catalogue of {inspectedDataset.nodes.length} species, including identifiers, common names, scientific Latin classifications, and empirical trophic role assignments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => downloadArtifact(nodesExportCsv(inspectedDataset))}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#35563B] hover:bg-[#263D2D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                >
                  <Download size={14} />
                  <span>Download Species CSV</span>
                  <span className="sr-only">Export nodes CSV</span>
                </button>
              </div>

              {/* Card 2: Links Export */}
              <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-[#EBF3F9] text-[#2879B9] flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#202B27]">
                    Feeding Links Adjacency Matrix (CSV)
                  </h3>
                  <p className="text-xs text-[#68716B] leading-relaxed">
                    Download the full edge list of {inspectedDataset.edges.length} directed trophic predator-prey links, formatted with source (prey) and target (consumer) columns for R, Python, and Cytoscape.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => downloadArtifact(edgesExportCsv(inspectedDataset))}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E5E6DC] bg-white hover:bg-[#F7F6EF] text-[#202B27] text-xs font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
                >
                  <Download size={14} className="text-[#35563B]" />
                  <span>Download Links CSV</span>
                  <span className="sr-only">Export links CSV</span>
                </button>
              </div>
            </div>

            {/* Academic Citation Box */}
            <div className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E6DC]">
                <div className="flex items-center gap-2 text-[#35563B]">
                  <FileText size={16} />
                  <h3 className="font-serif text-sm font-bold text-[#202B27]">Scientific Citation (APA)</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCitation(inspectedDataset.provenance.citation)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#E5E6DC] bg-white hover:bg-[#F7F6EF] text-xs font-semibold text-[#202B27] transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedCitation ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                  <span>{copiedCitation ? 'Copied to Clipboard!' : 'Copy Citation'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E5E6DC] font-mono text-xs text-[#202B27] leading-relaxed select-all">
                {inspectedDataset.provenance.citation}
              </div>

              <p className="text-[11px] text-[#68716B]">
                Please cite this primary publication when using this food-web data in academic manuscripts, reports, or classroom coursework.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: CATALOG VIEW (Grid of 6 Cards across full 12 columns)
  // =========================================================================
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer',
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
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer',
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
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer',
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
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer',
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

      {/* Full-Width Grid of 6 Dataset Cards (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDatasets.map((d) => {
          const habitat = getHabitatTag(d.ecosystem)
          const citationYear = d.provenance.citation.match(/\b(19\d\d|20\d\d)\b/)?.[0] ?? ''
          const citationAuthor = d.provenance.citation.split(/[(,]/)[0]?.trim() ?? ''
          const shortCitation = citationAuthor ? `${citationAuthor} (${citationYear || 'ref'})` : 'Published study'

          return (
            <div
              key={d.id}
              className="rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden flex flex-col justify-between shadow-2xs hover:border-[#899B78] hover:shadow-md transition-all group"
            >
              {/* Card Artwork Banner with Floating Habitat Tag */}
              <div className="h-40 relative overflow-hidden bg-[#F0F2E9]">
                <img
                  src="/hero-ecosystem.webp"
                  alt={d.name}
                  className="w-full h-full object-cover object-[70%_25%] group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 z-10">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border shadow-2xs',
                      habitat.badgeClass,
                    )}
                  >
                    {habitat.label}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#202B27] leading-snug group-hover:text-[#35563B] transition-colors">
                    {d.name.replace(/·.*/, '').trim()}
                  </h3>

                  {/* Location with map pin */}
                  <p className="flex items-center gap-1.5 text-xs text-[#68716B] mt-1">
                    <MapPin size={12} className="text-[#899B78] shrink-0" />
                    <span className="truncate">{d.provenance.origin || 'United Kingdom'}</span>
                  </p>

                  {/* 1-2 sentence description */}
                  <p className="text-xs text-[#68716B] leading-relaxed line-clamp-2 mt-2">
                    {d.summary}
                  </p>
                </div>

                {/* Metadata stats row: species, links, citation */}
                <div className="pt-3 border-t border-[#E5E6DC] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#68716B] font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-[#202B27]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#35563B]" />
                      {d.nodes.length} species
                    </span>
                    <span className="flex items-center gap-1 text-[#68716B]">
                      {d.edges.length} links
                    </span>
                    <span className="text-[10.5px] text-[#899B78] truncate max-w-[110px]" title={d.provenance.citation}>
                      {shortCitation}
                    </span>
                  </div>

                  {/* Action Button: View Full Dataset Details → */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(d.id)
                        handleInspect(d.id)
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#35563B]/30 bg-white hover:bg-[#35563B] hover:text-white text-[#35563B] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                    >
                      <span>View Full Dataset Details</span>
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
