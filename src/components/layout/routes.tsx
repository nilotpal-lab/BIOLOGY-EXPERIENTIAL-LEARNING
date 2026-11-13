import {
  BookOpenCheck,
  Compass,
  FlaskConical,
  GitCompareArrows,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

/* ============================================================================
 * routes — the canonical top-level destinations:
 * 1. Overview (Home)
 * 2. Explorer (Food Web Graph, Disturbance Simulation & Cascade Timeline)
 * 3. Experiment Studio (All-Species Sensitivity & Dunne R50)
 * 4. Insights & Compare (Cross-Ecosystem Analytics)
 * 5. Data Library (Verified Research Networks, Demos & CSV/JSON Import)
 * 6. Methodology & Validation (Scientific Definitions & Live Test Suite)
 * Legacy routes (simulation, timeline, features, conservation, import) are
 * automatically mapped to their canonical destination.
 * ========================================================================== */

export type RouteId =
  | 'overview'
  | 'features'
  | 'explore'
  | 'simulation'
  | 'timeline'
  | 'experiment'
  | 'scenario'
  | 'compare'
  | 'conservation'
  | 'library'
  | 'import'
  | 'methodology'

export interface RouteItem {
  id: RouteId
  label: string
  legacyName: string
  heading: string
  icon: ReactNode
  description: string
  tag?: string
}

export const ROUTES: RouteItem[] = [
  {
    id: 'overview',
    label: 'Home',
    legacyName: 'Overview',
    heading: 'Ecosystem Overview',
    icon: <LayoutDashboard size={16} />,
    description: 'Explore real food webs, simulate disturbances and understand ecosystems',
    tag: 'Start',
  },
  {
    id: 'explore',
    label: 'Explore & Simulate',
    legacyName: 'Food Web Explorer',
    heading: 'Food Web Explorer & Simulation Laboratory',
    icon: <Compass size={16} />,
    description: 'Visualise species interactions, simulate removals & track cascade timelines',
    tag: 'Graph',
  },
  {
    id: 'experiment',
    label: 'Experiment Studio',
    legacyName: 'Scenario analysis',
    heading: 'Experiment Studio',
    icon: <FlaskConical size={16} />,
    description: 'Run automated all-species sensitivity ranking and Dunne et al. R50 attacks',
    tag: 'Simulate',
  },
  {
    id: 'compare',
    label: 'Insights & Compare',
    legacyName: 'Compare results',
    heading: 'Insights & Compare',
    icon: <GitCompareArrows size={16} />,
    description: 'Cross-network distributions, comparative metrics & ecosystem ranges',
    tag: 'Compare',
  },
  {
    id: 'library',
    label: 'Data Library',
    legacyName: 'Dataset library',
    heading: 'Data Library',
    icon: <BookOpenCheck size={16} />,
    description: 'Verified research networks, illustrative demos & CSV/JSON intake studio',
    tag: 'Library',
  },
  {
    id: 'methodology',
    label: 'Methodology & Validation',
    legacyName: 'Methodology & validation',
    heading: 'Methodology & validation',
    icon: <ShieldAlert size={16} />,
    description: 'Scientific definitions, cascade logic & live browser test runner',
    tag: 'Verify',
  },
]

const ROUTE_ALIASES: Record<string, RouteId> = {
  home: 'overview',
  overview: 'overview',
  features: 'overview',
  feature: 'overview',
  explore: 'explore',
  explorer: 'explore',
  workspace: 'explore',
  simulation: 'explore',
  simulate: 'explore',
  lab: 'explore',
  timeline: 'explore',
  'cascade-timeline': 'explore',
  cascades: 'explore',
  experiment: 'experiment',
  studio: 'experiment',
  scenario: 'experiment',
  analytics: 'experiment',
  compare: 'compare',
  insights: 'compare',
  benchmark: 'compare',
  conservation: 'compare',
  atlas: 'compare',
  library: 'library',
  datasets: 'library',
  data: 'library',
  import: 'library',
  'dataset-import': 'library',
  upload: 'library',
  methodology: 'methodology',
  about: 'methodology',
  verify: 'methodology',
}

export function useHashRoute(): [RouteId, (route: RouteId) => void] {
  const parse = (): RouteId => {
    const raw = globalThis.location?.hash.replace(/^#\/?/, '').toLowerCase() ?? ''
    const aliased = ROUTE_ALIASES[raw]
    if (aliased) return aliased
    const match = ROUTES.find((route) => route.id === raw)
    return match?.id ?? 'overview'
  }

  const [route, setRoute] = useState<RouteId>(parse)

  useEffect(() => {
    const onHashChange = () => setRoute(parse())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (next: RouteId) => {
    const canonical = ROUTE_ALIASES[next] ?? next
    if (globalThis.location) globalThis.location.hash = `#/${canonical}`
    setRoute(canonical)
  }

  return [route, navigate]
}
