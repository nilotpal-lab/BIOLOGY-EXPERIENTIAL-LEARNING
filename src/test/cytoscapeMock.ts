/* ============================================================================
 * cytoscapeMock — a minimal stand-in for Cytoscape.js.
 *
 * jsdom has no canvas, so the visualization library cannot run for real in the
 * test environment. This mock implements only the API surface the graph
 * component uses, which lets the integration tests drive the REAL component
 * tree (state, selection, scenario running, tables) while keeping the render
 * assertions meaningful. The recorded class changes are exposed so tests can
 * check that scenario state actually reached the graph.
 * ========================================================================== */

interface FakeData {
  [key: string]: unknown
}

export interface FakeElement {
  id: string
  dataKeyed: FakeData
  classes: Set<string>
}

export interface CytoscapeMockState {
  nodes: FakeElement[]
  edges: FakeElement[]
  destroyed: boolean
  /** Ids of nodes currently carrying the given class. */
  idsWithClass(className: string): string[]
}

/** The subset of the element API the graph component relies on. */
export interface FakeCollection {
  length: number
  forEach(callback: (element: FakeCollection) => void): void
  removeClass(className?: string): FakeCollection
  addClass(className: string): FakeCollection
  hasClass(className: string): boolean
  id(): string | undefined
  data(key?: string): unknown
  nonempty(): boolean
  select(): FakeCollection
  unselect(): FakeCollection
  incomers(): FakeCollection
  outgoers(): FakeCollection
}

/**
 * cytoscape's `collection.forEach` yields singular elements that still carry the
 * full element API, so each item is wrapped in its own single-element
 * collection here to reproduce that behaviour.
 */
function makeCollection(items: FakeElement[]): FakeCollection {
  const collection: FakeCollection = {
    length: items.length,
    forEach(callback: (element: FakeCollection) => void) {
      items.forEach((item) => callback(makeCollection([item])))
    },
    removeClass(className?: string) {
      if (className) {
        for (const value of className.split(' ')) {
          items.forEach((item) => item.classes.delete(value))
        }
      } else {
        items.forEach((item) => item.classes.clear())
      }
      return collection
    },
    addClass(className: string) {
      for (const value of className.split(' ')) {
        items.forEach((item) => item.classes.add(value))
      }
      return collection
    },
    hasClass(className: string) {
      return items.some((item) => item.classes.has(className))
    },
    id() {
      return items[0]?.id
    },
    data(key?: string) {
      return key ? items[0]?.dataKeyed?.[key] : items[0]?.dataKeyed
    },
    nonempty() {
      return items.length > 0
    },
    select() {
      return collection
    },
    unselect() {
      return collection
    },
    incomers() {
      return makeCollection([])
    },
    outgoers() {
      return makeCollection([])
    },
  }
  return collection
}

/**
 * Creates the factory that replaces the real module's default export. Each call
 * records its element set into the shared mock state so tests can inspect it.
 */
export function createCytoscapeMock(state: CytoscapeMockState) {
  return function cytoscapeFactory(options: { elements?: unknown[] }) {
    const raw = (options?.elements ?? []) as { data?: FakeData; classes?: string }[]
    const nodes: FakeElement[] = []
    const edges: FakeElement[] = []

    for (const definition of raw) {
      const data = definition.data ?? {}
      const element: FakeElement = {
        id: String(data.id),
        dataKeyed: data,
        classes: new Set(definition.classes ? definition.classes.split(' ') : []),
      }
      if (typeof data.source === 'string') edges.push(element)
      else nodes.push(element)
    }

    state.nodes = nodes
    state.edges = edges

    const core = {
      on() {
        return core
      },
      off() {
        return core
      },
      batch(callback: () => void) {
        callback()
        return core
      },
      nodes: () => makeCollection(nodes),
      edges: () => makeCollection(edges),
      getElementById: (id: string) =>
        makeCollection([...nodes, ...edges].filter((element) => element.id === id)),
      layout: () => ({ run: () => undefined }),
      zoom: () => 1,
      fit: () => undefined,
      resize: () => core,
      center: () => undefined,
      width: () => 800,
      height: () => 600,
      destroy: () => {
        state.destroyed = true
      },
    }

    return core
  }
}

export function createMockState(): CytoscapeMockState {
  const state: CytoscapeMockState = {
    nodes: [],
    edges: [],
    destroyed: false,
    idsWithClass(className: string) {
      return state.nodes.filter((node) => node.classes.has(className)).map((node) => node.id)
    },
  }
  return state
}
