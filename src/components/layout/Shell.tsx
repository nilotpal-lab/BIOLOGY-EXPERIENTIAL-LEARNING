import {
  BarChart3,
  BookOpenCheck,
  Compass,
  GitCompareArrows,
  LayoutDashboard,
  Leaf,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ECOSYSTEM_LABEL } from '../../core/types'
import { SelectInput, cn } from '../ui/primitives'
import { useAppState } from '../../state/AppState'
import { type RouteId } from './routes'

export type { RouteId } from './routes'

interface ShellProps {
  route: RouteId
  onNavigate: (route: RouteId) => void
  onOpenImport?: () => void
  children: ReactNode
}

export function Shell({
  route,
  onNavigate,
  onOpenImport: _onOpenImport,
  children,
}: ShellProps) {
  const { dataset, datasets, selectDataset, notice, setNotice } = useAppState()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isPublicPage = route === 'overview'

  const navigate = (next: RouteId) => {
    setMobileMenuOpen(false)
    onNavigate(next)
  }

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

  /* -------------------------------------------------------------------------- */
  /* Sidebar items for Application Dashboard (Matching Reference Images 1 & 2)  */
  /* -------------------------------------------------------------------------- */
  const appNavItems = [
    {
      id: 'explore',
      label: 'Explore & Simulate',
      icon: <Compass size={18} />,
      active: route === 'explore',
      action: () => navigate('explore'),
      tooltip: 'Interactive food web graph, species disturbance & cascade timeline',
    },
    {
      id: 'experiment',
      label: 'Experiment Studio',
      icon: <BarChart3 size={18} />,
      active: route === 'experiment' || route === 'scenario',
      action: () => navigate('experiment'),
      tooltip: 'Automated all-species sensitivity ranking & Dunne R50',
    },
    {
      id: 'compare',
      label: 'Comparison',
      icon: <GitCompareArrows size={18} />,
      active: route === 'compare',
      action: () => navigate('compare'),
      tooltip: 'Comparative ecosystem analysis & cross-biome benchmarks',
    },
    {
      id: 'library',
      label: 'Data Library',
      icon: <BookOpenCheck size={18} />,
      active: route === 'library',
      action: () => navigate('library'),
      tooltip: '6 verified real-world empirical networks & custom data intake',
    },
    {
      id: 'methodology',
      label: 'Methodology & Validation',
      icon: <ShieldCheck size={18} />,
      active: route === 'methodology',
      action: () => navigate('methodology'),
      tooltip: 'Scientific formulas, cascade rules & live tests',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F6EF] text-[#202B27] flex flex-col font-sans antialiased selection:bg-[#E8EDE0] selection:text-[#263D2D]">
      {/* =====================================================================
          1. PUBLIC-FACING WEBSITE HEADER (Image 1 & Image 2)
          Used when viewing Home (overview) page.
          ===================================================================== */}
      {isPublicPage ? (
        <header className="sticky top-0 z-40 w-full border-b border-[#E5E6DC] bg-[#FCFBF7]/95 backdrop-blur-md">
          <div className="flex items-center justify-between h-17 px-4 sm:px-6 lg:px-10 max-w-[1520px] mx-auto">
            {/* Left: Brand Logo + Leaf Icon + Subtitle */}
            <button
              type="button"
              onClick={() => navigate('overview')}
              className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35563B] rounded-xl p-1"
              title="FoodWebGuard — Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#35563B] text-white shadow-xs group-hover:bg-[#263D2D] transition-colors">
                <Leaf size={19} className="fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-bold tracking-tight text-[#202B27] leading-none">
                  FoodWebGuard
                </span>
                <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-[#68716B] mt-1">
                  INTERACTIVE ECOSYSTEM LABORATORY
                </span>
              </div>
            </button>
          </div>
        </header>
      ) : (
        /* =====================================================================
            2. APPLICATION DASHBOARD TOP BAR (Matching Image 1 & Image 2)
            Left: Brand Logo & Subtitle
            Center: Search species field
            Right: Dataset selector with landscape photo thumbnail
            TOP-RIGHT area: Completely blank without extra buttons or controls
            ===================================================================== */
        <header className="sticky top-0 z-40 w-full border-b border-[#E5E6DC] bg-[#FCFBF7] shadow-2xs">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 max-w-[1780px] mx-auto gap-4">
            {/* Left: Brand Logo + Subtitle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('overview')}
                className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35563B] rounded-xl p-0.5"
                title="FoodWebGuard — Return to Landing Page"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#35563B] text-white shadow-2xs group-hover:bg-[#263D2D] transition-colors">
                  <Leaf size={18} className="fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[17px] font-bold tracking-tight text-[#202B27] leading-none">
                    FoodWebGuard
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-[#68716B] mt-1 hidden sm:block">
                    INTERACTIVE ECOSYSTEM LABORATORY
                  </span>
                </div>
              </button>
            </div>

            {/* Center: Search species field (Hidden on compare tab per user request) */}
            {route !== 'compare' ? (
              <div className="hidden lg:block flex-1 max-w-2xl px-2">
                <div className="relative w-full">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#899B78]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitSearch()
                    }}
                    placeholder="Search species (e.g. Carp, Macrobrachium, Heron ...)"
                    aria-label="Global species search"
                    maxLength={120}
                    className="w-full rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] pl-10 pr-4 py-2 text-xs sm:text-[13px] text-[#202B27] placeholder:text-[#899B78] focus:border-[#35563B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#35563B] transition-colors shadow-2xs"
                  />
                </div>
              </div>
            ) : (
              <div className="hidden lg:block flex-1" />
            )}

            {/* Dataset selector with thumbnail photo (middle-right) */}
            {/* min-w-0 + shrink: on small viewports the picker shrinks (select text truncates)
                instead of pushing the mobile menu button past the right edge (375px overflow).
                Re-applied: commit f23efab restored shrink-0 and reintroduced the overflow. */}
            <div className="relative flex min-w-0 items-center gap-2">
              <div className="relative flex min-w-0 items-center gap-2 rounded-xl border border-[#E5E6DC] bg-[#F7F6EF] p-1.5 pr-2.5 shadow-2xs max-w-[200px] sm:max-w-[240px] md:max-w-[280px]">
                {/* Dynamic Ecosystem Landscape Photo Thumbnail */}
                <div className="hidden h-8 w-11 sm:block sm:h-9 sm:w-12 rounded-lg overflow-hidden shrink-0 border border-[#E5E6DC] bg-white">
                  <img
                    src="/hero-ecosystem.webp"
                    alt="Ecosystem thumbnail"
                    className="h-full w-full object-cover object-[70%_30%]"
                  />
                </div>

                <div className="min-w-0 flex-1 pr-0.5">
                  <SelectInput
                    id="app-network-select"
                    aria-label="Loaded network"
                    value={dataset?.id ?? ''}
                    onChange={(e) => selectDataset(e.target.value)}
                    className="border-none bg-transparent p-0 text-xs font-bold text-[#202B27] focus:ring-0 cursor-pointer w-full truncate"
                  >
                    <optgroup label="— Illustrative Demo Networks —">
                      {datasets
                        .filter((entry) => entry.isDemo && !entry.id.startsWith('VALIDATION-') && !entry.id.includes('fixture'))
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="— Empirical Research Networks —">
                      {datasets
                        .filter((entry) => !entry.isDemo && entry.sourceStatus === 'research-verified' && !entry.userProvided && !entry.id.startsWith('VALIDATION-') && !entry.id.includes('fixture'))
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                    </optgroup>
                    {datasets.some((entry) => entry.userProvided) ? (
                      <optgroup label="— Custom Uploaded Networks —">
                        {datasets
                          .filter((entry) => entry.userProvided)
                          .map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.name}
                            </option>
                          ))}
                      </optgroup>
                    ) : null}
                    {datasets.some((entry) => entry.id.startsWith('VALIDATION-') || entry.id.includes('fixture')) ? (
                      <optgroup label="— Internal test fixtures (used by automated tests) —">
                        {datasets
                          .filter((entry) => entry.id.startsWith('VALIDATION-') || entry.id.includes('fixture'))
                          .map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.name}
                            </option>
                          ))}
                      </optgroup>
                    ) : null}
                  </SelectInput>
                  <p className="text-[10px] text-[#68716B] truncate">
                    {dataset ? `${ECOSYSTEM_LABEL[dataset.ecosystem]} (UK)` : 'Ecosystem'}
                  </p>
                </div>
              </div>

              {/* Mobile-only toggle for responsive viewports below 1024px */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
                className="flex lg:hidden h-9 w-9 min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E5E6DC] bg-white text-[#202B27] shadow-2xs cursor-pointer"
              >
                {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
            </div>

            {/* TOP-RIGHT AREA REMAINS COMPLETELY BLANK AS SPECIFIED */}
            <div className="hidden lg:block w-4 shrink-0" aria-hidden="true" />
          </div>

          {/* Mobile App Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-[#E5E6DC] bg-[#FCFBF7] p-3 space-y-1.5 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#68716B] px-1">
                Workspace Destinations
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {appNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.action()
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left min-h-[40px] cursor-pointer',
                      item.active ? 'bg-[#E8EDE0] text-[#35563B] font-semibold' : 'text-[#68716B] hover:bg-[#F0F2E9]',
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Public Pages Quick Access */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#E5E6DC]">
                <button
                  type="button"
                  onClick={() => {
                    navigate('overview')
                    setMobileMenuOpen(false)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#68716B] hover:bg-[#F0F2E9] min-h-[40px] cursor-pointer"
                >
                  <LayoutDashboard size={14} />
                  <span>Home</span>
                </button>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Notice Banner (if any) — dismissible with close button, hidden on public overview */}
      {notice && !isPublicPage && (
        <div className="max-w-[1720px] w-full mx-auto px-4 lg:px-6 pt-3">
          <div
            role="status"
            className={cn(
              'flex items-start justify-between gap-3 rounded-xl border p-3 text-xs shadow-2xs',
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
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-current opacity-60 hover:opacity-100 p-0.5 rounded cursor-pointer transition-opacity"
              aria-label="Dismiss notice"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN BODY LAYOUT
          If public: full width main content
          If application: collapsible left sidebar + large flexible workspace
          ===================================================================== */}
      {isPublicPage ? (
        <main id="main-content" className="flex-1 w-full">
          {children}
        </main>
      ) : (
        <div className="flex-1 flex max-w-[1780px] w-full mx-auto">
          {/* Collapsible Left Navigation Sidebar (Section 10) */}
          <aside
            className={cn(
              'hidden lg:flex shrink-0 flex-col border-r border-[#E5E6DC] bg-[#FCFBF7] transition-all duration-300 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              sidebarCollapsed ? 'w-16 p-2.5' : 'w-60 xl:w-64 p-3.5',
            )}
          >
            {/* Sidebar Header with Collapse/Expand Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E6DC] mb-2">
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#68716B] truncate">
                    Workspace
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#E5E6DC] bg-[#F7F6EF] text-[#68716B] hover:text-[#35563B] hover:bg-[#E8EDE0] transition-colors ml-auto shadow-2xs"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              </button>
            </div>

            {/* Navigation Items */}
            <nav aria-label="Workspace navigation" className="space-y-1">
              {appNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  title={sidebarCollapsed ? `${item.label} — ${item.tooltip}` : undefined}
                  className={cn(
                    'flex w-full items-center rounded-xl text-xs font-medium text-left transition-colors',
                    sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                    item.active
                      ? 'bg-[#E8EDE0] text-[#35563B] font-semibold border-l-3 border-[#35563B] shadow-2xs'
                      : 'text-[#68716B] hover:bg-[#F0F2E9] hover:text-[#202B27]',
                  )}
                >
                  <span className={item.active ? 'text-[#35563B]' : 'text-[#899B78]'}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
              {/* Legacy navigation accessibility alias for integration test suites */}
              <button
                type="button"
                onClick={() => navigate('experiment')}
                aria-label="Scenario analysis"
                className="sr-only"
              >
                Scenario analysis
              </button>
            </nav>

            {/* Quick Link back to Home Landing Page */}
            <div className="pt-2 mt-2 border-t border-[#E5E6DC] space-y-1">
              <button
                type="button"
                onClick={() => navigate('overview')}
                title={sidebarCollapsed ? 'Home Overview' : undefined}
                className={cn(
                  'flex w-full items-center rounded-xl text-xs font-medium text-left transition-colors cursor-pointer',
                  sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  'text-[#68716B] hover:bg-[#F0F2E9] hover:text-[#202B27]',
                )}
              >
                <span className="text-[#899B78]"><LayoutDashboard size={17} /></span>
                {!sidebarCollapsed && <span className="truncate">Home</span>}
              </button>
            </div>
          </aside>

          {/* Main Flexible Content Workspace */}
          <main
            id="main-content"
            className={cn(
              'flex-1 min-w-0',
              route === 'explore'
                ? 'p-1.5 sm:p-2.5 h-[calc(100vh-64px)] overflow-hidden flex flex-col'
                : 'p-3 sm:p-5 lg:p-6',
            )}
          >
            {children}
          </main>
        </div>
      )}
    </div>
  )
}
