import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Compass,
  Filter,
  FlaskConical,
  GitCompareArrows,
  Globe2,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Leaf,
  ListFilter,
  Menu,
  Network,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { ECOSYSTEM_LABEL } from '../../core/types'
import { computeBaselineMetrics } from '../../core/metrics'
import { computeTrophicLevels } from '../../core/layout'
import { SelectInput, cn } from '../ui/primitives'
import { useAppState } from '../../state/AppState'
import { type RouteId } from './routes'
import { EcosystemThumbnail } from './EcosystemThumbnail'
import { HeronCard } from './HeronCard'

/* ============================================================================
 * Shell — Authoritative Forest Green & Pale Sage application chrome.
 *
 * Implements the global layout matching 01_Overview.png and 02_Explorer_Master_Reference.png:
 * - Top Global Header: Logo, 6 canonical destinations, global search, help (?) & avatar.
 * - Left Contextual Sidebar: Current network dropdown, landscape thumbnail, quick stats
 *   (Species · Interactions · Trophic Levels), contextual sub-navigation, and inspirational Heron card.
 * - Responsive: Clean mobile sheet and desktop drawer support.
 * ========================================================================== */

export type { RouteId } from './routes'

// The 6 canonical top-level destinations
const MAIN_NAV_ITEMS: { id: RouteId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'explore', label: 'Explorer' },
  { id: 'experiment', label: 'Experiment Studio' },
  { id: 'compare', label: 'Insights & Compare' },
  { id: 'conservation', label: 'Conservation Atlas' },
  { id: 'library', label: 'Data Library' },
]

export function Shell({
  route,
  onNavigate,
  children,
}: {
  route: RouteId
  onNavigate: (route: RouteId) => void
  children: ReactNode
}) {
  const { dataset, datasets, graph, selectDataset, notice, setNotice } = useAppState()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const baseline = useMemo(() => (graph ? computeBaselineMetrics(graph) : null), [graph])

  const trophicLevelsCount = useMemo(() => {
    if (!graph) return 1
    const levels = computeTrophicLevels(graph)
    const max = Math.max(1, ...levels.values())
    return max + 1
  }, [graph])

  const navigate = (next: RouteId) => {
    setMobileMenuOpen(false)
    onNavigate(next)
  }

  // Global search looks across loaded networks (name, id, ecosystem, summary).
  // It loads the best match, points at the library for several matches, and
  // says clearly when nothing matches — it never silently does nothing.
  const submitSearch = () => {
    const query = searchQuery.trim()
    if (!query) {
      setNotice({
        tone: 'info',
        title: 'Search is empty',
        message: 'Type a network name, id or ecosystem (for example "Ythan", "pond" or "marine") and press Enter.',
      })
      return
    }
    const lower = query.toLowerCase()
    const matches = datasets.filter(
      (entry) =>
        entry.name.toLowerCase().includes(lower) ||
        entry.id.toLowerCase().includes(lower) ||
        entry.ecosystem.toLowerCase().includes(lower) ||
        entry.summary.toLowerCase().includes(lower),
    )
    if (matches.length === 1) {
      const match = matches[0]
      selectDataset(match.id)
      navigate('explore')
      setNotice({
        tone: 'success',
        title: 'Network loaded',
        message: `Search "${query}" matched one network: ${match.name}. It is now loaded in the Explorer.`,
      })
    } else if (matches.length > 1) {
      navigate('library')
      setNotice({
        tone: 'info',
        title: `${matches.length} networks match "${query}"`,
        message: 'Several loaded networks match the search. Use the library search to narrow them down.',
      })
    } else {
      setNotice({
        tone: 'warning',
        title: `No network matches "${query}"`,
        message:
          'The global search looks at network names, ids, ecosystems and summaries. To find a species inside the loaded network, use the species search in the Explorer.',
      })
    }
  }

  // Active top-nav mapping
  const activeNavId = useMemo<RouteId>(() => {
    if (route === 'overview') return 'overview'
    if (route === 'explore') return 'explore'
    if (route === 'experiment') return 'experiment'
    if (route === 'compare') return 'compare'
    if (route === 'conservation') return 'conservation'
    if (route === 'library') return 'library'
    return 'overview'
  }, [route])

  // Contextual Sub-Nav items depending on current route
  const subNavItems = useMemo(() => {
    if (route === 'overview' || route === 'explore') {
      return [
        {
          id: 'overview-sub',
          label: 'Overview',
          icon: <LayoutDashboard size={15} />,
          action: () => navigate('overview'),
          active: route === 'overview',
        },
        {
          id: 'network-view-sub',
          label: 'Network View',
          icon: <Network size={15} />,
          action: () => navigate('explore'),
          active: route === 'explore',
        },
        {
          id: 'species-list-sub',
          label: 'Species List',
          icon: <ListFilter size={15} />,
          action: () => navigate('explore'),
          active: false,
        },
        {
          id: 'scenario-analysis-sub',
          label: 'Scenario analysis',
          icon: <FlaskConical size={15} />,
          action: () => navigate('experiment'),
          active: false,
        },
        {
          id: 'trophic-levels-sub',
          label: 'Trophic Levels',
          icon: <Layers size={15} />,
          action: () => navigate('explore'),
          active: false,
        },
        {
          id: 'filters-search-sub',
          label: 'Filters & Search',
          icon: <Filter size={15} />,
          action: () => navigate('explore'),
          active: false,
        },
        {
          id: 'network-stats-sub',
          label: 'Network Statistics',
          icon: <BarChart3 size={15} />,
          action: () => navigate('compare'),
          active: false,
        },
      ]
    }

    if (route === 'experiment') {
      return [
        {
          id: 'experiment-studio-sub',
          label: 'Experiment Studio',
          icon: <FlaskConical size={15} />,
          action: () => navigate('experiment'),
          active: true,
        },
        {
          id: 'single-removal-sub',
          label: 'Species Removal',
          icon: <Compass size={15} />,
          action: () => navigate('explore'),
          active: false,
        },
        {
          id: 'compare-sub',
          label: 'Result Comparison',
          icon: <GitCompareArrows size={15} />,
          action: () => navigate('compare'),
          active: false,
        },
        {
          id: 'method-sub',
          label: 'Methodology Rules',
          icon: <ShieldAlert size={15} />,
          action: () => navigate('methodology'),
          active: false,
        },
      ]
    }

    if (route === 'compare') {
      return [
        {
          id: 'insights-sub',
          label: 'Insights & Compare',
          icon: <GitCompareArrows size={15} />,
          action: () => navigate('compare'),
          active: true,
        },
        {
          id: 'bench-overview-sub',
          label: 'Cross-Network Benchmark',
          icon: <Activity size={15} />,
          action: () => navigate('compare'),
          active: false,
        },
        {
          id: 'atlas-link-sub',
          label: 'Conservation Atlas',
          icon: <Globe2 size={15} />,
          action: () => navigate('conservation'),
          active: false,
        },
      ]
    }

    if (route === 'conservation') {
      return [
        {
          id: 'atlas-sub',
          label: 'Conservation Atlas',
          icon: <Globe2 size={15} />,
          action: () => navigate('conservation'),
          active: true,
        },
        {
          id: 'biomes-sub',
          label: 'Trophic Biomes',
          icon: <Layers size={15} />,
          action: () => navigate('conservation'),
          active: false,
        },
        {
          id: 'datasets-link-sub',
          label: 'Research Library',
          icon: <BookOpenCheck size={15} />,
          action: () => navigate('library'),
          active: false,
        },
      ]
    }

    // Default for library / methodology
    return [
      {
        id: 'library-sub',
        label: 'Data Library',
        icon: <BookOpenCheck size={15} />,
        action: () => navigate('library'),
        active: route === 'library',
      },
      {
        id: 'methodology-sub',
        label: 'Methodology & Tests',
        icon: <ShieldAlert size={15} />,
        action: () => navigate('methodology'),
        active: route === 'methodology',
      },
      {
        id: 'overview-return-sub',
        label: 'Return to Overview',
        icon: <LayoutDashboard size={15} />,
        action: () => navigate('overview'),
        active: false,
      },
    ]
  }, [route])

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#122A23] flex flex-col font-sans antialiased selection:bg-[#DDF2E9] selection:text-[#0F6B52]">
      {/* =====================================================================
          GLOBAL TOP NAVIGATION HEADER (Matching Reference Images 01 & 02)
          ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E5EAE7] bg-white shadow-2xs">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 max-w-[1720px] mx-auto">
          {/* Left Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('overview')}
              className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B52] rounded-xl p-1"
              title="FoodWebGuard — Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F6B52] text-white shadow-xs group-hover:bg-[#0D5A45] transition-colors">
                <Leaf size={19} className="fill-white" />
              </div>
              <span className="text-[17.5px] font-extrabold tracking-tight text-[#0E1622]">
                FoodWebGuard
              </span>
            </button>
          </div>

          {/* Center 6 Top-Level Destinations (Desktop) */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center space-x-1 h-full">
            {MAIN_NAV_ITEMS.map((item) => {
              const active = item.id === activeNavId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'h-full px-3.5 text-[13.5px] transition-colors relative flex items-center font-medium',
                    active
                      ? 'text-[#0F6B52] font-semibold border-b-2 border-[#0F6B52]'
                      : 'text-[#536960] hover:text-[#0F6B52] border-b-2 border-transparent',
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Right Controls: Global Search, Help (?), Avatar & Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Global Search Bar (Desktop) */}
            <div className="relative hidden md:block">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71837B]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch()
                }}
                placeholder="Search loaded networks by name..."
                aria-label="Search loaded networks by name"
                maxLength={120}
                className="w-56 xl:w-72 rounded-full border border-[#DCE7E1] bg-[#F4F8F5] pl-8.5 pr-3 py-1.5 text-xs text-[#122A23] placeholder:text-[#7A8E85] focus:border-[#0F6B52] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F6B52] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={submitSearch}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE7E1] bg-white text-[#536960] hover:bg-[#F4F8F5] hover:text-[#0F6B52] shadow-2xs transition-colors"
              title="Search loaded networks"
              aria-label="Submit search"
            >
              <Search size={14} />
            </button>

            {/* Methodology & Verification Help Icon (?) */}
            <button
              type="button"
              onClick={() => navigate('methodology')}
              title="Methodology, verification rules & test suite"
              aria-label="Methodology and verification rules"
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-full border border-[#DCE7E1] bg-white text-[#536960] hover:bg-[#F4F8F5] hover:text-[#0F6B52] shadow-2xs transition-colors',
                route === 'methodology' && 'border-[#0F6B52] text-[#0F6B52] bg-[#E8F5EE]',
              )}
            >
              <HelpCircle size={15} />
            </button>

            {/* User Avatar Pill */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A4D3E] text-white text-xs font-bold shadow-2xs select-none"
              title="Biology for Engineers · Team 1"
            >
              A
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-xl border border-[#DCE7E1] bg-white text-[#122A23] shadow-2xs"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5EAE7] bg-white p-4 space-y-2 shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#71837B] px-2 mb-1">
              Top Destinations
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {MAIN_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors',
                    item.id === activeNavId
                      ? 'bg-[#E8F5EE] text-[#0F6B52] font-semibold'
                      : 'text-[#536960] hover:bg-[#F4F8F5]',
                  )}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate('methodology')}
                className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-left text-[#536960] hover:bg-[#F4F8F5]"
              >
                Methodology & Tests
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Notice Banner (if any) */}
      {notice && (
        <div className="max-w-[1720px] w-full mx-auto px-4 lg:px-6 pt-3">
          <div
            role="status"
            className={cn(
              'flex items-start justify-between gap-3 rounded-2xl border p-3 text-xs shadow-2xs',
              notice.tone === 'danger'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : notice.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900',
            )}
          >
            <div>
              <p className="font-bold">{notice.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed">{notice.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN BODY LAYOUT: Left Contextual Sidebar + Flexible Content Area
          ===================================================================== */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Left Contextual Sidebar (Authoritative Master Reference) */}
        <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col border-r border-[#E5EAE7] bg-[#F8FAF8] p-4 gap-4 overflow-y-auto max-h-[calc(100vh-64px)] sticky top-16">
          {/* 1. Current Network Dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="shell-network-select"
              className="text-[11px] font-semibold uppercase tracking-wider text-[#536960]"
            >
              Current Network
            </label>
            <div className="relative">
              <SelectInput
                id="shell-network-select"
                aria-label="Current Network"
                value={dataset?.id ?? ''}
                onChange={(e) => selectDataset(e.target.value)}
                className="w-full text-xs font-semibold text-[#0E1622] rounded-xl border border-[#DCE7E1] bg-white py-2 pl-3 pr-8 shadow-2xs"
              >
                {datasets.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} ({ECOSYSTEM_LABEL[entry.ecosystem]})
                    {entry.id.startsWith('VALIDATION') ? ' — validation fixture (internal test)' : ''}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>

          {/* 2. Dynamic Landscape Thumbnail */}
          {dataset && <EcosystemThumbnail ecosystem={dataset.ecosystem} />}

          {/* 3. Quick Stats Row: Species · Interactions · Trophic Levels */}
          {baseline && (
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#DCE7E1] bg-white p-2.5 text-center shadow-2xs">
              <div>
                <p className="text-sm font-extrabold text-[#0E1622] tabular-nums">
                  {baseline.nodeCount}
                </p>
                <p className="text-[10px] text-[#71837B]">Species</p>
              </div>
              <div className="border-x border-[#E5EAE7]">
                <p className="text-sm font-extrabold text-[#0E1622] tabular-nums">
                  {baseline.linkCount}
                </p>
                <p className="text-[10px] text-[#71837B]">Interactions</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#0E1622] tabular-nums">
                  {trophicLevelsCount}
                </p>
                <p
                  className="text-[10px] text-[#71837B]"
                  title="Trophic = feeding level. Counts feeding levels from producers (plants, level 1) up to top predators."
                >
                  Trophic Levels
                </p>
              </div>
            </div>
          )}

          {/* 4. Contextual Sub-Navigation */}
          <nav aria-label="Page section links" className="space-y-1">
            {subNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors',
                  item.active
                    ? 'bg-[#E8F5EE] text-[#0F6B52] font-semibold border-l-3 border-[#0F6B52] shadow-2xs'
                    : 'text-[#536960] hover:bg-white hover:text-[#0F6B52]',
                )}
              >
                <span className={item.active ? 'text-[#0F6B52]' : 'text-[#71837B]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* 5. Inspirational Artwork Card at Bottom */}
          <div className="mt-auto pt-2">
            <HeronCard />
          </div>
        </aside>

        {/* Main Flexible Content Area */}
        <main id="main-content" className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
