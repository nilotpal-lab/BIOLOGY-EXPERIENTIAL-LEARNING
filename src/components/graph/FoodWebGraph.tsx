import cytoscape, { type Core, type ElementDefinition, type EventObject } from 'cytoscape'
import { Maximize2, Minus, Network, Plus, RotateCcw, Waypoints } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ROLE_LEGEND, STATE_LEGEND } from '../../art/roleColours'
import { speciesIconDataUri } from '../../art/speciesIcons'
import { computeLayeredLayout } from '../../core/layout'
import { TROPHIC_ROLE_LABEL, type FoodWebGraph as FoodWebGraphModel } from '../../core/types'
import { cn } from '../ui/primitives'
import { graphStyles } from './graphStyles'

/* ============================================================================
 * FoodWebGraph — the interactive network visualization (Prompt §5.2, §19).
 *
 * - Every link is drawn as a directed arrow from the FOOD ORGANISM to the
 *   CONSUMER, matching every algorithm, table and export in the application.
 * - Nodes are placed with a deterministic trophic-level layout, so running a
 *   scenario never rearranges the network.
 * - Removed nodes stay in place, faded and dashed, so the before/after
 *   comparison is visible rather than a layout jump. Removed links are hidden
 *   because they no longer exist in the scenario.
 * - Status is never communicated by colour alone: the legend, the tooltip and
 *   the results tables all carry text.
 * ========================================================================== */

interface TooltipState {
  x: number
  y: number
  label: string
  lines: string[]
}

export interface FoodWebGraphProps {
  graph: FoodWebGraphModel
  removedNodeIds: string[]
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  highlightedLinkSourceId?: string | null
  directlyAffectedIds?: string[]
  foodDepletedIds?: string[]
  highlightLinks?: boolean
  searchQuery?: string
  ghostBaseline?: boolean
  className?: string
  hideControls?: boolean
  hideLegend?: boolean
}

function buildElements(
  graph: FoodWebGraphModel,
  removed: Set<string>,
  ghostBaseline: boolean,
): ElementDefinition[] {
  const elements: ElementDefinition[] = []

  for (const node of graph.nodes) {
    const isRemoved = removed.has(node.id)
    // The role travels as a class (`role-producer` ...) so the simulation state
    // classes below it in the stylesheet always win; see graphStyles.ts.
    const roleClass = `role-${node.trophicRole}`
    const nodeData = {
      id: node.id,
      label: node.name,
      icon: speciesIconDataUri(node.iconKey),
      role: node.trophicRole,
      foodSources: graph.foodSourcesOf.get(node.id)?.length ?? 0,
      consumers: graph.consumersOf.get(node.id)?.length ?? 0,
    }

    if (isRemoved && !ghostBaseline) {
      // Faded reference state: the node stays in its place so the network does
      // not jump, but it is no longer part of the active scenario.
      elements.push({ data: nodeData, classes: `${roleClass} removed` })
      continue
    }
    elements.push({ data: nodeData, classes: roleClass })
  }

  for (const edge of graph.edges) {
    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
      },
      classes: 'link',
    })
  }

  return elements
}

export function FoodWebGraph({
  graph,
  removedNodeIds,
  selectedNodeId,
  onSelectNode,
  highlightedLinkSourceId = null,
  directlyAffectedIds = [],
  foodDepletedIds = [],
  highlightLinks = true,
  searchQuery = '',
  ghostBaseline = false,
  className,
  hideControls = false,
  hideLegend = false,
}: FoodWebGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cyRef = useRef<Core | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [ready, setReady] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'trophic' | 'force'>('trophic')
  const [showLabels, setShowLabels] = useState(true)
  const [linksHighlighted, setLinksHighlighted] = useState(highlightLinks)
  const [zoomLevel, setZoomLevel] = useState(1)

  const removedKey = removedNodeIds.join('|')
  const affectedKey = directlyAffectedIds.join('|')
  const depletedKey = foodDepletedIds.join('|')

  const layout = useMemo(() => computeLayeredLayout(graph), [graph])
  const layoutPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const [id, position] of layout.positions) positions[id] = position
    return positions
  }, [layout])

  /* ---- Create the instance when the dataset changes ---- */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setReady(false)
    const removed = new Set(removedNodeIds)
    const cy = cytoscape({
      container,
      elements: buildElements(graph, removed, ghostBaseline),
      style: graphStyles(),
      layout: { name: 'preset', positions: layoutPositions, fit: true, padding: 50 },
      wheelSensitivity: 0.22,
      minZoom: 0.1,
      maxZoom: 3.2,
      boxSelectionEnabled: false,
      autounselectify: false,
    })

    cyRef.current = cy
    setReady(true)

    // Ensure Cytoscape recalculates bounds and fits once container layout settles
    const fitGraph = () => {
      if (cyRef.current) {
        cyRef.current.resize?.()
        cyRef.current.fit?.(undefined, 50)
        setZoomLevel(cyRef.current.zoom())
      }
    }
    const frameId = requestAnimationFrame(fitGraph)
    const t1 = setTimeout(fitGraph, 100)
    const t2 = setTimeout(fitGraph, 350)

    cy.on('zoom', () => {
      if (cyRef.current) {
        setZoomLevel(cyRef.current.zoom())
      }
    })

    // ResizeObserver ensures Cytoscape canvas matches container bounding box
    // during side panel toggles, orientation changes, or responsive layouts.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const ro = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize?.()
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          cyRef.current?.fit?.(undefined, 50)
        }, 120)
      }
    })
    ro.observe(container)

    cy.on('tap', 'node', (event: EventObject) => {
      onSelectNode(event.target.id() as string)
    })
    cy.on('tap', (event: EventObject) => {
      if (event.target === cy) onSelectNode(null)
    })
    cy.on('mouseover', 'node', (event: EventObject) => {
      const node = event.target
      const role = String(node.data('role'))
      // Cytoscape returns a scalar when a single dimension is requested, which
      // the published typings do not express.
      const renderedX = node.renderedPosition('x') as unknown as number
      const renderedY = node.renderedPosition('y') as unknown as number
      setTooltip({
        x: renderedX,
        y: renderedY,
        label: String(node.data('label')),
        lines: [
          TROPHIC_ROLE_LABEL[role as keyof typeof TROPHIC_ROLE_LABEL] ?? role,
          `Recorded food sources: ${node.data('foodSources')}`,
          `Recorded consumers: ${node.data('consumers')}`,
          node.hasClass('removed') ? 'Status: removed in this scenario' : 'Status: present',
        ],
      })
      node.addClass('hovered')
    })
    cy.on('mouseout', 'node', (event: EventObject) => {
      event.target.removeClass('hovered')
      setTooltip(null)
    })

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(t1)
      clearTimeout(t2)
      if (resizeTimer) clearTimeout(resizeTimer)
      ro.disconnect()
      cy.destroy()
      cyRef.current = null
      setTooltip(null)
    }
    // The instance is rebuilt only when the dataset (and therefore the element
    // set, layout and icons) changes. Scenario state is applied as classes below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.datasetId])

  /* ---- Apply scenario, selection, search and ghost state as classes ---- */
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    const removed = new Set(removedNodeIds)
    const affected = new Set(directlyAffectedIds)
    const depleted = new Set(foodDepletedIds)
    const query = searchQuery.trim().toLowerCase()

    cy.batch(() => {
      cy.nodes().forEach((node) => {
        const id = node.id()
        node.removeClass('removed affected depleted dimmed ghost hovered')
        if (removed.has(id)) node.addClass(ghostBaseline ? 'ghost' : 'removed')
        else if (depleted.has(id)) node.addClass('depleted')
        else if (affected.has(id)) node.addClass('affected')

        if (query) {
          const label = String(node.data('label')).toLowerCase()
          if (!label.includes(query) && !id.toLowerCase().includes(query)) node.addClass('dimmed')
        }
      })

      cy.fit()
      cy.edges().forEach((edge) => {
        const source = edge.data('source') as string
        const target = edge.data('target') as string
        const sourceRemoved = removed.has(source)
        const targetRemoved = removed.has(target)
        edge.removeClass('hidden dimmed food-link consumer-link match')
        if (sourceRemoved || targetRemoved) edge.addClass('hidden')
      })

      // Unselect then reselect so the :selected style always matches state.
      cy.nodes().unselect()
      if (selectedNodeId) {
        const node = cy.getElementById(selectedNodeId)
        if (node.nonempty()) {
          node.select()
          if (linksHighlighted) {
            const touched = new Set<string>()
            node.incomers('edge').forEach((edge) => {
              edge.removeClass('hidden')
              edge.addClass('food-link')
              touched.add(edge.id())
            })
            node.outgoers('edge').forEach((edge) => {
              edge.removeClass('hidden')
              edge.addClass('consumer-link')
              touched.add(edge.id())
            })
            cy.fit()
      cy.edges().forEach((edge) => {
              if (!touched.has(edge.id()) && !edge.hasClass('hidden')) edge.addClass('dimmed')
            })
          }
        }
      }

      // A row selected from the ranking tables can focus the graph on its links.
      if (highlightedLinkSourceId) {
        const source = cy.getElementById(highlightedLinkSourceId)
        if (source.nonempty()) {
          source.outgoers('edge').forEach((edge) => {
            edge.removeClass('hidden dimmed')
            edge.addClass('consumer-link')
          })
        }
      }
    })
  }, [
    affectedKey,
    depletedKey,
    directlyAffectedIds,
    foodDepletedIds,
    ghostBaseline,
    linksHighlighted,
    highlightedLinkSourceId,
    removedKey,
    removedNodeIds,
    searchQuery,
    selectedNodeId,
  ])

  const handleLayoutChange = (nextMode: 'trophic' | 'force') => {
    setLayoutMode(nextMode)
    const cy = cyRef.current
    if (!cy) return
    if (nextMode === 'trophic') {
      cy.layout({ name: 'preset', positions: layoutPositions, fit: true, padding: 48, animate: true }).run()
    } else {
      cy.layout({ name: 'cose', animate: true, padding: 48, componentSpacing: 50, nodeOverlap: 20 }).run()
    }
  }

  const handleToggleLabels = () => {
    const next = !showLabels
    setShowLabels(next)
    const cy = cyRef.current
    if (!cy) return
    cy.batch(() => {
      cy.nodes().style('label', next ? 'data(label)' : '')
    })
  }

  const handleToggleHighlightLinks = () => {
    setLinksHighlighted((prev) => !prev)
  }

  /** Re-apply the deterministic layout without touching the dataset. */
  const resetLayout = () => {
    const cy = cyRef.current
    if (!cy) return
    setLayoutMode('trophic')
    cy.layout({ name: 'preset', positions: layoutPositions, fit: true, padding: 48 }).run()
    setZoomLevel(cy.zoom())
  }

  const zoomBy = (factor: number) => {
    const cy = cyRef.current
    if (!cy) return
    const next = Math.min(3.2, Math.max(0.25, cy.zoom() * factor))
    cy.zoom({ level: next, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
    setZoomLevel(next)
  }

  const hasNodes = graph.nodes.length > 0

  return (
    <div className={cn('relative flex min-h-0 flex-col', className)}>
      {/* Top Floating Graph Controls Toolbar (Matching Image 1 Reference) */}
      {!hideControls && (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#E5E6DC] bg-[#FCFBF7] p-2 shadow-2xs">
          {/* Layout Mode Selector (Trophic vs Force) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleLayoutChange('trophic')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                layoutMode === 'trophic'
                  ? 'bg-[#35563B] text-white shadow-2xs'
                  : 'border border-[#E5E6DC] bg-[#F7F6EF] text-[#68716B] hover:text-[#202B27] hover:bg-white',
              )}
            >
              <Waypoints size={13} />
              <span>Trophic Layout</span>
            </button>
            <button
              type="button"
              onClick={() => handleLayoutChange('force')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                layoutMode === 'force'
                  ? 'bg-[#35563B] text-white shadow-2xs'
                  : 'border border-[#E5E6DC] bg-[#F7F6EF] text-[#68716B] hover:text-[#202B27] hover:bg-white',
              )}
            >
              <Network size={13} />
              <span>Force Layout</span>
            </button>
          </div>

          {/* Center: Switches for Show Labels & Highlight Links */}
          <div className="flex items-center gap-4 text-xs font-medium text-[#202B27]">
            {/* Show Labels Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[#68716B]">Show Labels</span>
              <button
                type="button"
                role="switch"
                aria-checked={showLabels}
                aria-label="Toggle node labels"
                onClick={handleToggleLabels}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  showLabels ? 'bg-[#35563B]' : 'bg-[#E5E6DC]',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    showLabels ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Highlight Links Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[#68716B]">Highlight Links</span>
              <button
                type="button"
                role="switch"
                aria-checked={linksHighlighted}
                aria-label="Toggle link highlighting"
                onClick={handleToggleHighlightLinks}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  linksHighlighted ? 'bg-[#35563B]' : 'bg-[#E5E6DC]',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    linksHighlighted ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>

          {/* Right: Reset View & Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetLayout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E6DC] bg-[#F7F6EF] hover:bg-white hover:text-[#202B27] px-2.5 py-1.5 text-xs font-medium text-[#68716B] transition-colors shadow-2xs"
              title="Reset layout and center graph"
            >
              <RotateCcw size={13} />
              <span>Reset View</span>
            </button>

            {/* Visible caption so the −/+/fit icon buttons are not icon-only on touch */}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#68716B] select-none">
              Zoom
            </span>
            <div className="flex items-center rounded-lg border border-[#E5E6DC] bg-[#F7F6EF] px-1 py-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => zoomBy(0.8)}
                className="p-1 text-[#68716B] hover:text-[#35563B] transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <Minus size={13} />
              </button>
              <span className="min-w-[42px] px-1 text-center font-mono text-[11px] font-bold text-[#202B27] tabular-nums select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomBy(1.25)}
                className="p-1 text-[#68716B] hover:text-[#35563B] transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  cyRef.current?.fit(undefined, 48)
                  if (cyRef.current) setZoomLevel(cyRef.current.zoom())
                }}
                className="ml-1 border-l border-[#E5E6DC] p-1 pl-1.5 text-[#68716B] hover:text-[#35563B] transition-colors"
                title="Fit to canvas"
                aria-label="Fit to canvas"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0 overflow-hidden rounded-xl border border-[#E5E6DC] bg-[#F7F6EF]/50">
        <div
          ref={containerRef}
          role="application"
          aria-label={`Interactive food web for ${graph.datasetId}. ${graph.nodes.length} nodes and ${graph.edges.length} recorded feeding links. Links point from the food organism to the consumer. Use the species list beside the graph to select a node with the keyboard.`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        {!hasNodes ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-[#68716B]">
            No network is loaded, so there is nothing to draw. Load a demo network or import a dataset.
          </div>
        ) : null}
        {!ready && hasNodes ? (
          <p className="absolute inset-x-0 bottom-3 text-center text-[12px] text-[#68716B]">
            Preparing the network view…
          </p>
        ) : null}

        {/* Floating Bottom-Left Trophic Legend (Matching Image 1) */}
        {!hideLegend && (
          <div className="pointer-events-auto absolute bottom-3 left-3 z-10 rounded-xl border border-[#E5E6DC]/90 bg-[#FCFBF7]/95 p-2.5 sm:p-3 shadow-xs backdrop-blur-md space-y-1 sm:space-y-1.5 text-[10.5px] sm:text-[11px] max-h-[calc(100%-24px)] overflow-y-auto">
            <div className="flex items-center gap-2 font-medium text-[#202B27]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF9A88] border border-[#EF9A88]" />
              <span>Apex Predator</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[#202B27]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F1B36F] border border-[#F1B36F]" />
              <span>Tertiary Consumer</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[#202B27]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F3D98B] border border-[#F3D98B]" />
              <span>Secondary Consumer</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[#202B27]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#91BFE0] border border-[#91BFE0]" />
              <span>Primary Consumer</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[#202B27]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B5D39A] border border-[#B5D39A]" />
              <span>Primary Producer</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[#202B27]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C49A6C] border border-[#C49A6C]" />
              <span>Detritus</span>
            </div>
          </div>
        )}

        {tooltip ? (
          <div
            role="status"
            className="pointer-events-none absolute z-20 max-w-[220px] -translate-x-1/2 rounded-lg border border-[#E5E6DC] bg-[#FCFBF7]/95 px-2.5 py-2 text-[11px] shadow-lg backdrop-blur"
            style={{ left: tooltip.x, top: Math.max(4, tooltip.y - 66) }}
          >
            <p className="font-semibold text-[#202B27]">{tooltip.label}</p>
            {tooltip.lines.map((line) => (
              <p key={line} className="text-[#68716B]">
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Legend for role colours and simulation states. */
export function GraphLegend({ showLinks = true }: { showLinks?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          Recorded trophic role
        </p>
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
          {ROLE_LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ border: `2px solid ${item.colour}` }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          Simulation state
        </p>
        <ul className="space-y-1">
          {STATE_LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ border: `2px solid ${item.colour}` }}
              />
              <span className="font-medium text-fg">{item.label}</span> — {item.description}
            </li>
          ))}
        </ul>
        {showLinks ? (
          <p className="mt-1.5 text-[11px] text-fg-faint">
            Food link: <span className="font-medium text-[#2DD4BF]">teal</span>. Consumer link:{' '}
            <span className="font-medium text-[#818CF8]">periwinkle</span>. Removed links are hidden.
          </p>
        ) : null}
      </div>
    </div>
  )
}
