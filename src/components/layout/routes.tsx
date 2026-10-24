import {
  BookOpenCheck,
  Compass,
  FlaskConical,
  GitCompareArrows,
  Globe2,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

/* ============================================================================
 * routes — the six canonical top-level destinations matching the visual reference:
 * 1. Overview (Page 1)
 * 2. Explorer (Page 2 — Authoritative reference)
 * 3. Experiment Studio (Page 3)
 * 4. Insights & Compare
 * 5. Conservation Atlas
 * 6. Data Library
 * Plus Methodology & Validation (accessible via header help icon ? and #/methodology).
 * ========================================================================== */

export type RouteId =
  | 'overview'
  | 'explore'
  | 'experiment'
  | 'scenario'
  | 'compare'
  | 'conservation'
  | 'library'
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
    label: 'Overview',
    legacyName: 'Overview',
    heading: 'Ecosystem Overview',
    icon: <LayoutDashboard size={16} />,
    description: 'Key information, visual summaries and insights for the selected network',
    tag: 'Start',
  },
  {
    id: 'explore',
    label: 'Explorer',
    legacyName: 'Explore food web',
    heading: 'Food Web Explorer',
    icon: <Compass size={16} />,
    description: 'Visualise and explore species interactions in ecological networks',
    tag: 'Graph',
  },
  {
    id: 'experiment',
    label: 'Experiment Studio',
    legacyName: 'Scenario analysis',
    heading: 'Experiment Studio',
    icon: <FlaskConical size={16} />,
    description: 'Run what-if scenarios to explore how changes affect the food web',
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
    id: 'conservation',
    label: 'Conservation Atlas',
    legacyName: 'Conservation Atlas',
    heading: 'Conservation Atlas',
    icon: <Globe2 size={16} />,
    description: 'Trophic level distributions, ecosystem biomes & empirical research profiles',
    tag: 'Atlas',
  },
  {
    id: 'library',
    label: 'Data Library',
    legacyName: 'Dataset library',
    heading: 'Data Library',
    icon: <BookOpenCheck size={16} />,
    description: 'Verified research networks, illustrative demos & CSV/JSON import',
    tag: 'Library',
  },
  {
    id: 'methodology',
    label: 'Methodology',
    legacyName: 'Methodology & validation',
    heading: 'Methodology & validation',
    icon: <ShieldAlert size={16} />,
    description: 'Scientific definitions, cascade logic & live browser test runner',
    tag: 'Verify',
  },
]

const ROUTE_ALIASES: Record<string, RouteId> = {
  overview: 'overview',
  explore: 'explore',
  explorer: 'explore',
  workspace: 'explore',
  experiment: 'experiment',
  studio: 'experiment',
  scenario: 'experiment',
  analytics: 'experiment',
  compare: 'compare',
  insights: 'compare',
  benchmark: 'compare',
  conservation: 'conservation',
  atlas: 'conservation',
  library: 'library',
  datasets: 'library',
  data: 'library',
  methodology: 'methodology',
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
    if (globalThis.location) globalThis.location.hash = `#/${next}`
    setRoute(next)
  }

  return [route, navigate]
}
