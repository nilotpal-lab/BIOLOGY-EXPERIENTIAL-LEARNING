import cytoscape, { type Core, type ElementDefinition, type EventObject } from 'cytoscape'
import { Maximize2, Minus, Plus, RotateCcw, Waypoints } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ROLE_LEGEND, STATE_LEGEND } from '../../art/roleColours'
import { speciesIconDataUri } from '../../art/speciesIcons'
import { computeLayeredLayout } from '../../core/layout'
import { TROPHIC_ROLE_LABEL, type FoodWebGraph as FoodWebGraphModel } from '../../core/types'
import { Button, IconButton, cn } from '../ui/primitives'
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
}: FoodWebGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cyRef = useRef<Core | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [ready, setReady] = useState(false)

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
      layout: { name: 'preset', positions: layoutPositions, fit: true, padding: 36 },
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
        cyRef.current.fit?.(undefined, 36)
      }
    }
    const frameId = requestAnimationFrame(fitGraph)
    const t1 = setTimeout(fitGraph, 100)
    const t2 = setTimeout(fitGraph, 350)

    // ResizeObserver ensures Cytoscape canvas matches container bounding box
    // during side panel toggles, orientation changes, or responsive layouts.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const ro = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize?.()
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          cyRef.current?.fit?.(undefined, 36)
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
          if (highlightLinks) {
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
    highlightLinks,
    highlightedLinkSourceId,
    removedKey,
    removedNodeIds,
    searchQuery,
    selectedNodeId,
  ])

  /** Re-apply the deterministic layout without touching the dataset. */
  const resetLayout = () => {
    const cy = cyRef.current
    if (!cy) return
    cy.layout({ name: 'preset', positions: layoutPositions, fit: true, padding: 56 }).run()
  }

  const zoomBy = (factor: number) => {
    const cy = cyRef.current
    if (!cy) return
    const next = Math.min(3.2, Math.max(0.25, cy.zoom() * factor))
    cy.zoom({ level: next, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
  }

  const hasNodes = graph.nodes.length > 0

  return (
    <div className={cn('relative flex min-h-0 flex-col', className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-fg-faint">
          Arrow direction: <span className="text-secondary">food source → consumer</span>. Drag to pan, scroll to
          zoom, click a node to inspect it.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" icon={<Waypoints size={14} />} onClick={resetLayout}>
            Reset layout
          </Button>
          <IconButton label="Zoom in" icon={<Plus size={15} />} onClick={() => zoomBy(1.25)} />
          <IconButton label="Zoom out" icon={<Minus size={15} />} onClick={() => zoomBy(0.8)} />
          <IconButton
            label="Zoom to fit the whole network"
            icon={<Maximize2 size={15} />}
            onClick={() => cyRef.current?.fit(undefined, 56)}
          />
          <IconButton
            label="Reset zoom and centre the network"
            icon={<RotateCcw size={15} />}
            onClick={() => {
              cyRef.current?.zoom(1)
              cyRef.current?.center()
            }}
          />
        </div>
      </div>

      <div className="relative min-h-[460px] flex-1 overflow-hidden rounded-xl border border-line-soft fwg-graph-surface">
        <div
          ref={containerRef}
          role="application"
          aria-label={`Interactive food web for ${graph.datasetId}. ${graph.nodes.length} nodes and ${graph.edges.length} recorded feeding links. Links point from the food organism to the consumer. Use the species list beside the graph to select a node with the keyboard.`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        {!hasNodes ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-fg-muted">
            No network is loaded, so there is nothing to draw. Load a demo network or import a dataset.
          </div>
        ) : null}
        {!ready && hasNodes ? (
          <p className="absolute inset-x-0 bottom-3 text-center text-[12px] text-fg-faint">
            Preparing the network view…
          </p>
        ) : null}

        {tooltip ? (
          <div
            role="status"
            className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 rounded-lg border border-line-soft bg-surface-2/95 px-2.5 py-2 text-[11px] shadow-lg backdrop-blur"
            style={{ left: tooltip.x, top: Math.max(4, tooltip.y - 66) }}
          >
            <p className="font-semibold text-fg">{tooltip.label}</p>
            {tooltip.lines.map((line) => (
              <p key={line} className="text-fg-muted">
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
