import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockState } from './ui.mockState'

/* ============================================================================
 * Integration tests through the interface the user actually uses.
 *
 * These mount the real application and click real controls. Cytoscape.js is
 * replaced by a stub because jsdom has no canvas, but the stub records which
 * visual classes the graph received, so scenario state reaching the graph is
 * still verified.
 * ========================================================================== */

vi.mock('cytoscape', async () => {
  const mod = await import('./cytoscapeMock')
  const { mockState: state } = await import('./ui.mockState')
  return { default: mod.createCytoscapeMock(state) }
})

async function renderApp(route: string) {
  globalThis.location.hash = `#/${route}`
  const App = (await import('../App')).default
  return render(<App />)
}

const user = () => userEvent.setup()

beforeEach(() => {
  mockState.nodes = []
  mockState.edges = []
  mockState.destroyed = false
  globalThis.localStorage.clear()
  globalThis.location.hash = '#/overview'
})

describe('Overview', () => {
  it('shows real dataset counts, the verification status and an honest empty state', async () => {
    await renderApp('overview')

    expect(screen.getAllByText('FoodWebGuard').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/Comparative food-web disruption and vulnerability analysis/).length,
    ).toBeGreaterThan(0)
    // Six illustrative networks, plus six source-verified research networks.
    expect(screen.getByText('Demo networks').parentElement?.textContent).toContain('6')
    expect(screen.getByText('Verified research').parentElement?.textContent).toContain('6')
    expect(screen.getByText(/No scenario has been saved in this browser yet/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open the first demo network/ })).toBeTruthy()
    expect(screen.getAllByText(/Structural disruption, not extinction/).length).toBeGreaterThan(0)
  })

  it('opens and interacts with the Help & Feature Guide tutorial modal', async () => {
    await renderApp('overview')

    // Find Help & Feature Guide buttons on landing page
    const guideButtons = screen.getAllByRole('button', { name: /Help & Feature Guide|Open Feature Guide & Tutorial/ })
    expect(guideButtons.length).toBeGreaterThan(0)

    // Open guide modal
    await user().click(guideButtons[0])

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(screen.getByText('FoodWebGuard Navigation & Feature Guide')).toBeTruthy()

    // Tab 1: Goal Finder is active by default
    expect(screen.getByText(/Goal Finder \("I want to\.\.\."\)/)).toBeTruthy()
    expect(screen.getByText('Visualize species feeding links and trophic levels')).toBeTruthy()

    // Switch to Tab 2: Step-by-Step Research Tutorial
    const tutorialTab = screen.getByRole('button', { name: /Step-by-Step Research Tutorial/ })
    await user().click(tutorialTab)
    expect(screen.getByText('Recommended Research Workflow:')).toBeTruthy()
    expect(screen.getByText('Step 1')).toBeTruthy()
    expect(screen.getByText('Select an Ecosystem')).toBeTruthy()
    expect(screen.getByText('Step 5')).toBeTruthy()
    expect(screen.getByText('Rank Keystones & Test Network Robustness')).toBeTruthy()

    // Switch to Tab 3: Complete Window Directory
    const directoryTab = screen.getByRole('button', { name: /Complete Window Directory/ })
    await user().click(directoryTab)
    expect(screen.getByText('Full Feature Reference:')).toBeTruthy()
    expect(screen.getAllByText('Interactive Explorer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Simulation Laboratory').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Experiment Studio').length).toBeGreaterThan(0)

    // Close modal
    const closeBtn = screen.getByRole('button', { name: 'Close guide modal' })
    await user().click(closeBtn)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Explore workspace', () => {
  it('lists the loaded network species and inspects a selected one', async () => {
    await renderApp('explore')

    expect(screen.getByText('Interactive food web')).toBeTruthy()
    expect(mockState.nodes.length).toBe(12) // FW-POND-A node count
    expect(mockState.edges.length).toBe(17)

    await user().click(screen.getByRole('button', { name: /^Pond snail/ }))

    expect(screen.getByText('Recorded food sources')).toBeTruthy()
    expect(screen.getAllByText(/Pondweed/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Leaf litter/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Select this species for simulation/ })).toBeTruthy()
  })

  it('reports an honest empty state when a search matches nothing', async () => {
    await renderApp('explore')

    await user().type(screen.getByLabelText('Search species'), 'zzzz')
    expect(screen.getByText('No matching species')).toBeTruthy()

    await user().click(screen.getByRole('button', { name: /Clear filters/ }))
    expect(screen.queryByText('No matching species')).toBeNull()
  })

  it('runs a direct removal and reports real metrics plus an explanation', async () => {
    await renderApp('explore')

    await user().click(screen.getByRole('button', { name: /^Minnow/ }))
    await user().click(screen.getByRole('button', { name: /Run direct removal/ }))

    // FW-POND-A: the minnow has two recorded food sources and two consumers, so
    // four of the 17 links are removed (23.5% loss).
    expect(screen.getByText('Links remaining')).toBeTruthy()
    expect(screen.getAllByText(/13\s*of\s*17/).length).toBeGreaterThan(0)
    expect(screen.getByText('23.5%')).toBeTruthy()
    expect(screen.getByText('What changed?')).toBeTruthy()
    expect(screen.getByText(/deleted 4 feeding link\(s\)/)).toBeTruthy()
    // The removed node stays in the layout as a faded reference.
    expect(mockState.idsWithClass('removed')).toContain('minnow')
  })

  it('loads bundled research networks and never leaks the previous scenario (Workflow B)', async () => {
    await renderApp('explore')

    await user().click(screen.getByRole('button', { name: /^Minnow/ }))
    await user().click(screen.getByRole('button', { name: /Run direct removal/ }))
    expect(screen.getByText('Links remaining')).toBeTruthy()
    expect(mockState.idsWithClass('removed')).toContain('minnow')

    // Switching networks rebuilds the graph from the new dataset and clears the
    // previous result, selection and removal highlights.
    await user().selectOptions(screen.getByLabelText('Loaded network'), 'MAR-TATOOSH-1')
    await waitFor(() => expect(mockState.nodes.length).toBe(110))
    expect(mockState.edges.length).toBe(869)
    expect(screen.queryByText('Links remaining')).toBeNull()
    expect(mockState.idsWithClass('removed')).toEqual([])

    await user().selectOptions(screen.getByLabelText('Loaded network'), 'RES-FW-A')
    await waitFor(() => expect(mockState.nodes.length).toBe(11))
    expect(mockState.edges.length).toBe(18)
    expect(screen.queryByText('Links remaining')).toBeNull()
    expect(mockState.idsWithClass('removed')).toEqual([])

    await user().selectOptions(screen.getByLabelText('Loaded network'), 'RES-FW-B')
    await waitFor(() => expect(mockState.nodes.length).toBe(14))
    expect(mockState.edges.length).toBe(39)
    expect(screen.queryByText('Links remaining')).toBeNull()

    await user().selectOptions(screen.getByLabelText('Loaded network'), 'RES-TER-D')
    await waitFor(() => expect(mockState.nodes.length).toBe(57))
    expect(mockState.edges.length).toBe(98)

    await user().selectOptions(screen.getByLabelText('Loaded network'), 'MAR-YTHAN-1')
    await waitFor(() => expect(mockState.nodes.length).toBe(87))
    expect(mockState.edges.length).toBe(373)
    expect(screen.queryByText('Links remaining')).toBeNull()

    // A scenario run on the new baseline is computed from that baseline only.
    await user().type(screen.getByLabelText('Search species'), 'Carcinus maenas')
    await user().click(screen.getByRole('button', { name: /^Carcinus maenas/ }))
    await user().click(screen.getByRole('button', { name: /Run direct removal/ }))
    expect(screen.getByText('What changed?')).toBeTruthy()
    await user().click(screen.getAllByRole('button', { name: /Reset simulation/ })[0])
    await waitFor(() => expect(screen.queryByText('What changed?')).toBeNull())
    expect(mockState.nodes.length).toBe(87)
  })

  it('reproduces the manual fixture expectations through the interface', async () => {
    await renderApp('explore')

    await user().selectOptions(screen.getByLabelText('Loaded network'), 'VALIDATION-FOODWEB-6')
    expect(mockState.nodes.length).toBe(6)
    expect(mockState.edges.length).toBe(6)

    await user().click(screen.getByRole('button', { name: /^Small fish/ }))
    await user().click(screen.getByRole('button', { name: /Run direct removal/ }))

    // Hand-checked expectation: 3 of 6 links remain, so link loss is 50.0%.
    expect(screen.getAllByText('50.0%').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/3\s*of\s*6/).length).toBeGreaterThan(0)
    // Heron lost its only recorded food source, so the graph shows the stronger
    // "food depleted" state for it rather than the plain "directly affected" one.
    expect(mockState.idsWithClass('depleted')).toContain('heron')
    // Direct mode must not remove the affected consumer.
    expect(mockState.idsWithClass('removed')).toEqual(['small_fish'])

    // Switching mode clears the other mode's result instead of mixing them.
    await user().click(screen.getByRole('radio', { name: /Direct removal \+ cascade/ }))
    expect(screen.queryAllByText('50.0%')).toEqual([])

    await user().click(screen.getByRole('button', { name: /Run cascade scenario/ }))
    await waitFor(() => {
      expect(screen.getAllByText(/Round 1/).length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText(/Heron/).length).toBeGreaterThan(0)
    expect(mockState.idsWithClass('removed')).toEqual(
      expect.arrayContaining(['small_fish', 'heron']),
    )
  })

  it('resets the simulation back to the baseline', async () => {
    await renderApp('explore')

    await user().click(screen.getByRole('button', { name: /^Minnow/ }))
    await user().click(screen.getByRole('button', { name: /Run direct removal/ }))
    expect(screen.getByText('What changed?')).toBeTruthy()

    await user().click(screen.getAllByRole('button', { name: /Reset simulation/ })[0])
    await waitFor(() => {
      expect(screen.queryByText('What changed?')).toBeNull()
    })
    expect(mockState.idsWithClass('removed')).toEqual([])
  })

  it('toggles presentation mode, displays precise metric chips, and manages results drawer', async () => {
    await renderApp('explore')

    // Click Presentation view
    await user().click(screen.getByRole('button', { name: /Presentation view/ }))
    expect(screen.getByText('Exit presentation view')).toBeTruthy()
    expect(screen.getByText('Untouched Baseline')).toBeTruthy()

    // Select a species and run scenario in presentation mode
    await user().click(screen.getByRole('button', { name: /Species list/ }))
    await user().click(screen.getByRole('button', { name: /Minnow/ }))
    await user().click(screen.getByRole('button', { name: /Simulate removal/ }))

    // Precise metric chips are visible
    expect(screen.getByText('Nodes remaining:')).toBeTruthy()
    expect(screen.getByText('Secondary removals:')).toBeTruthy()

    // Drawer expands and collapses
    await user().click(screen.getByRole('button', { name: /View metrics drawer/ }))
    expect(screen.getByText('Quantitative Results:')).toBeTruthy()

    // Exit presentation mode preserves state
    await user().click(screen.getByRole('button', { name: /Exit presentation view/ }))
    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeTruthy()
    expect(screen.getByText('What changed?')).toBeTruthy()
  })
})

describe('Scenario analysis', () => {
  it('runs every species independently and ranks them per metric', async () => {
    await renderApp('explore')
    await user().selectOptions(screen.getByLabelText('Loaded network'), 'VALIDATION-FOODWEB-6')
    await user().click(screen.getByRole('button', { name: 'Scenario analysis' }))

    await user().click(screen.getAllByRole('button', { name: /Analyse all species/ })[0])

    const table = await waitFor(
      () => {
        const found = screen
          .getAllByRole('table')
          .find((entry) => entry.textContent?.includes('Freshwater snail'))
        if (!found) throw new Error('ranking table not ready')
        return found
      },
      { timeout: 8000 },
    )

    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(7) // header + six species

    // Link loss: the snail and the small fish tie at rank 1 and are ordered
    // alphabetically, so a tie is shown as a tie.
    const firstRow = within(rows[1]).getAllByRole('cell')
    expect(firstRow[0].textContent).toBe('1')
    expect(firstRow[1].textContent).toContain('Freshwater snail')
    const secondRow = within(rows[2]).getAllByRole('cell')
    expect(secondRow[0].textContent).toBe('1')
    expect(secondRow[1].textContent).toContain('Small fish')

    // Switching the metric re-sorts with the other calculation.
    await user().click(screen.getByRole('tab', { name: /Directly affected/ }))
    const affectedTable = screen
      .getAllByRole('table')
      .find((entry) => entry.textContent?.includes('Freshwater snail'))
    const affectedRows = within(affectedTable as HTMLElement).getAllByRole('row')
    expect(within(affectedRows[1]).getAllByRole('cell')[1].textContent).toContain('Algae')
  })

  it('filters species rankings by search query and trophic role', async () => {
    await renderApp('explore')
    await user().selectOptions(screen.getByLabelText('Loaded network'), 'VALIDATION-FOODWEB-6')
    await user().click(screen.getByRole('button', { name: 'Scenario analysis' }))
    await user().click(screen.getAllByRole('button', { name: /Analyse all species/ })[0])

    const searchInput = await screen.findByLabelText('Filter ranked species')
    await user().type(searchInput, 'snail')

    expect(screen.getByText('Showing 1 of 6 species')).toBeTruthy()
    expect(screen.getByText('Freshwater snail')).toBeTruthy()
    expect(screen.queryByText('Small fish')).toBeNull()

    // Test clear
    await user().click(screen.getByLabelText('Clear species filter'))
    expect(screen.getByText('6 species ranked')).toBeTruthy()

    // Test trophic role filter
    await user().selectOptions(screen.getByLabelText('Filter rankings by trophic role'), 'producer')
    expect(screen.getByText('Algae')).toBeTruthy()
    expect(screen.queryByText('Freshwater snail')).toBeNull()

    // Test no matches
    await user().type(searchInput, 'nonexistent')
    expect(screen.getByText('No matching species')).toBeTruthy()
    await user().click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByText('6 species ranked')).toBeTruthy()
  })

  it('switches to Network Robustness Lab tab, computes R50, and displays extinction curves', async () => {
    await renderApp('experiment')
    const robustnessTab = screen.getByRole('button', { name: /Network Robustness Lab/ })
    await user().click(robustnessTab)

    expect(await screen.findByText(/Dunne Connectance/)).toBeTruthy()
    expect(screen.getByText(/Extinction Curves & Biodiversity Collapse/)).toBeTruthy()
    expect(screen.getByText(/Step-by-Step Removal Replay/)).toBeTruthy()
    expect(screen.getAllByText(/Strategy A/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Strategy D/).length).toBeGreaterThan(0)
  })
})

describe('Dataset library and import', () => {
  it('provides direct CSV export actions for nodes and links in the library', async () => {
    await renderApp('library')
    const nodesButtons = screen.getAllByRole('button', { name: /Export nodes CSV/ })
    const linksButtons = screen.getAllByRole('button', { name: /Export links CSV/ })
    expect(nodesButtons.length).toBeGreaterThan(0)
    expect(linksButtons.length).toBeGreaterThan(0)
    await user().click(nodesButtons[0])
    await user().click(linksButtons[0])
  })
  it('blocks an import whose links reference undefined nodes, then accepts a repaired import', async () => {
    await renderApp('library')

    await user().click(screen.getAllByRole('button', { name: /Import CSV or JSON/ })[0])
    const dialog = screen.getByRole('dialog')

    await user().click(within(dialog).getByText('Or paste the file contents instead of uploading'))
    await user().type(
      within(dialog).getByLabelText('Node CSV'),
      'id,name,trophic_role\nalgae,Algae,producer\nzooplankton,Zooplankton,primary-consumer',
    )
    await user().type(
      within(dialog).getByLabelText(/Link CSV/),
      'source,target\nalgae,zooplankton\nunknown_fish,zooplankton',
    )
    await user().click(within(dialog).getByRole('button', { name: /Validate and preview/ }))

    expect(await within(dialog).findByText('Import blocked')).toBeTruthy()
    expect(within(dialog).getAllByText(/unknown_fish/).length).toBeGreaterThan(0)
    expect(within(dialog).getByText(/refers to undefined node/)).toBeTruthy()

    // Repairing is an explicit user choice, and it is recorded in the report.
    await user().click(within(dialog).getByRole('checkbox', { name: /Repair supported issues/ }))
    expect(await within(dialog).findByText('Ready to import')).toBeTruthy()
    expect(within(dialog).getByText(/Invalid links excluded/)).toBeTruthy()

    await user().click(within(dialog).getByRole('button', { name: /Import dataset/ }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(screen.getByText(/was imported with 2 node/)).toBeTruthy()
  })

  it('reports the verified research slots and lists every bundled network', async () => {
    await renderApp('library')
    // All six slots now carry a bundled network and claim verification; nothing
    // claims a pending source and the copy is derived from the slot list.
    expect(screen.queryByText(/Research source pending/)).toBeNull()
    expect(screen.queryByText(/validation pending/)).toBeNull()
    expect(screen.getAllByText(/Research source verified/).length).toBeGreaterThanOrEqual(6)
    expect(screen.getByText(/How the research library is tracked/i)).toBeTruthy()
    // The bundled research networks are listed as real, loadable datasets.
    for (const name of [
      /Tatoosh/i,
      /Ythan Estuary/i,
      /Shallow-lake mesocosm/i,
      /Barro Colorado Island/i,
      /Palmyra Atoll/i,
    ]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
  })
})

describe('Methodology and validation', () => {
  it(
    'runs the validation suite in the browser and reports every check as passing',
    async () => {
      await renderApp('methodology')

      const summary = await waitFor(
        () => {
          const found = screen
            .getAllByText(/passed · \d+ failed · \d+ total/)
            .find((entry) => entry.textContent?.includes('0 failed'))
          if (!found) throw new Error('validation suite has not finished')
          return found
        },
        { timeout: 20000 },
      )
      expect(summary.textContent).toMatch(/^(\d+) passed · 0 failed · \1 total$/)

      // The specification inconsistency is disclosed on this screen.
      expect(screen.getByText(/remove Small fish/i)).toBeTruthy()
      expect(screen.getByText(/50\.0% link loss/)).toBeTruthy()
      // Metric definitions and the cascade rules are documented.
      expect(screen.getByText(/Simultaneous rounds/)).toBeTruthy()
      expect(screen.getByText(/Role is reported, not gated/)).toBeTruthy()
    },
    30000,
  )
})
