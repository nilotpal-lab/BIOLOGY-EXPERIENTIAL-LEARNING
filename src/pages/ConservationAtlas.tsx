import { BookOpenCheck, ArrowRight, Info } from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardHeading, Button, Badge, StatusBadge } from '../components/ui/primitives'
import { ECOSYSTEM_LABEL, type EcosystemCategory } from '../core/types'
import { useAppState } from '../state/AppState'
import type { RouteId } from '../components/layout/Shell'

/* ============================================================================
 * ConservationAtlas — Destination 5 in FoodWebGuard.
 *
 * Provides a structured comparative atlas across ecological biomes:
 * - Marine, Freshwater, and Terrestrial research networks.
 * - Trophic layer compositions and empirical dataset profiles.
 * - Strict adherence to scientific honesty: purely structural data, no fake
 *   population forecasts or unsupported conservation classifications.
 * ========================================================================== */

export function ConservationAtlas({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { datasets, dataset, selectDataset } = useAppState()

  const researchDatasets = useMemo(
    () => datasets.filter((d) => d.sourceStatus === 'research-verified' && !d.userProvided),
    [datasets],
  )

  const biomes: { type: EcosystemCategory; title: string; desc: string; color: string }[] = [
    {
      type: 'marine',
      title: 'Marine & Estuarine Webs',
      desc: 'Pelagic, intertidal, and estuarine communities characterized by high connectance and complex food chains.',
      color: 'border-cyan-200 bg-cyan-50/50',
    },
    {
      type: 'freshwater',
      title: 'Freshwater Lakes & Ponds',
      desc: 'Pond mesocosms and lake ecosystems sensitive to basal nutrient shifts and consumer removals.',
      color: 'border-emerald-200 bg-emerald-50/50',
    },
    {
      type: 'terrestrial',
      title: 'Terrestrial & Forest Webs',
      desc: 'Tropical forests and grassland systems containing large species richness and specialized feeding links.',
      color: 'border-amber-200 bg-amber-50/50',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* =====================================================================
          1. EDITORIAL BANNER (Lora Typography + Botanical Artwork)
          ===================================================================== */}
      <div className="relative rounded-2xl border border-[#E5E6DC] bg-[#FCFBF7] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 space-y-1.5 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#35563B]">
              Ecosystem Biome Atlas
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#202B27] tracking-tight">
              Conservation Atlas
            </h1>
            <p className="text-xs sm:text-[13px] text-[#68716B] max-w-2xl leading-relaxed">
              Explore documented trophic structures, empirical research biomes, and data provenance across marine, freshwater and terrestrial food webs.
            </p>
          </div>

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

      {/* Studio Tab Navigation (Counterpart to Multi-Ecosystem Comparison) */}
      <div className="flex items-center gap-2 border-b border-[#E5E6DC] pb-1">
        <button
          type="button"
          onClick={() => onNavigate('compare')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer bg-white text-[#68716B] border-[#E5E6DC] hover:text-[#202B27] hover:bg-[#F7F6EF]"
        >
          <span>Multi-Ecosystem Comparison</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer bg-[#35563B] text-white border-[#35563B] shadow-xs"
        >
          <span>Conservation Biome Atlas</span>
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#68716B]">
          Documented empirical research networks organized by ecological biome.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<BookOpenCheck size={14} />}
            onClick={() => onNavigate('library')}
            className="text-xs h-8 border-[#E5E6DC] text-[#202B27] hover:bg-[#F7F6EF]"
          >
            Data Library
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<ArrowRight size={14} />}
            onClick={() => onNavigate('explore')}
            className="bg-[#35563B] hover:bg-[#263D2D] text-white text-xs h-8 font-semibold shadow-xs"
          >
            Explore Active Web
          </Button>
        </div>
      </div>

      {/* Biome Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {biomes.map((b) => {
          const count = datasets.filter((d) => d.ecosystem === b.type).length
          return (
            <div key={b.type} className={`rounded-2xl border p-4.5 shadow-2xs space-y-2 ${b.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#202B27]">
                  {b.title}
                </span>
                <Badge tone="neutral">{count} Networks</Badge>
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#68716B]">{b.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Verified Empirical Research Network Profiles */}
      <Card>
        <CardHeading
          title="Verified Empirical Research Networks"
          subtitle="All networks re-derived from peer-reviewed source repositories (Dryad CC0 1.0) with audited links and citations."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {researchDatasets.map((entry) => {
            const isCurrent = entry.id === dataset?.id
            return (
              <div
                key={entry.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-[#35563B] bg-[#E8EDE0]/50 ring-1 ring-[#35563B] shadow-xs'
                    : 'border-[#E5E6DC] bg-white hover:border-[#899B78]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-[#202B27]">{entry.name}</span>
                    <Badge tone="neutral">{ECOSYSTEM_LABEL[entry.ecosystem]}</Badge>
                  </div>
                  <p className="text-[11px] text-[#68716B] line-clamp-2 leading-relaxed">
                    {entry.summary}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-[#202B27] pt-1">
                    <span>{entry.nodes.length} Species</span>
                    <span className="text-[#E5E6DC]">·</span>
                    <span>{entry.edges.length} Feeding Links</span>
                  </div>
                  <div className="pt-2 border-t border-[#E5E6DC] text-[10.5px] text-[#68716B]">
                    <p className="truncate">Source: {entry.provenance.origin}</p>
                    <p className="truncate">License: {entry.provenance.license ?? 'CC0 1.0'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#E5E6DC]">
                  <StatusBadge status={entry.sourceStatus} />
                  <Button
                    size="sm"
                    variant={isCurrent ? 'outline' : 'primary'}
                    onClick={() => {
                      selectDataset(entry.id)
                      onNavigate('explore')
                    }}
                    className={`text-xs h-7 px-2.5 font-semibold ${
                      isCurrent
                        ? 'border-[#35563B] text-[#35563B] hover:bg-[#E8EDE0]'
                        : 'bg-[#35563B] text-white hover:bg-[#263D2D]'
                    }`}
                  >
                    {isCurrent ? 'Loaded in Explorer' : 'Load in Explorer'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Scientific Caveat Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 flex items-start gap-3">
        <Info size={17} className="text-amber-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">Conservation Modeling Scope & Disclosures</p>
          <p className="text-[11.5px] leading-relaxed text-amber-900/90">
            This atlas presents static structural topologies of recorded empirical food webs.
            In accordance with ecological network science principles, structural node/link counts
            and cascade susceptibility rankings represent topological bounds, not dynamic
            population forecasts, real-world extinction predictions, or formal IUCN conservation statuses.
          </p>
        </div>
      </div>
    </div>
  )
}
