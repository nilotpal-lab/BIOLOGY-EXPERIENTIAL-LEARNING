import { useState } from 'react'
import { ImportDialog } from './components/imports/ImportDialog'
import { Shell } from './components/layout/Shell'
import { useHashRoute } from './components/layout/routes'
import { CompareResults } from './pages/CompareResults'
import { DatasetLibraryPage } from './pages/DatasetLibraryPage'
import { Explore } from './pages/Explore'
import { Methodology } from './pages/Methodology'
import { Overview } from './pages/Overview'
import { ScenarioAnalysis } from './pages/ScenarioAnalysis'
import { AppStateProvider, useAppState } from './state/AppState'

/**
 * Routed — the canonical top-level destinations:
 * 1. Overview (Home landing page)
 * 2. Explorer (Interactive topology, disturbance simulation & cascade timeline)
 * 3. Experiment Studio (All-species sensitivity ranking & Dunne R50 attacks)
 * 4. Compare Results (Cross-ecosystem comparative analytics)
 * 5. Dataset Library (Verified research networks & custom data intake)
 * 6. Methodology (Formulas, scientific rules & live in-browser test runner)
 *
 * Custom data intake is handled by the ImportDialog.
 */
function Routed() {
  const [route, navigate] = useHashRoute()
  const { addImportedDataset, setNotice } = useAppState()
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <Shell route={route} onNavigate={navigate} onOpenImport={() => setImportOpen(true)}>
        {route === 'overview' ? <Overview onNavigate={navigate} onOpenImport={() => setImportOpen(true)} /> : null}
        {route === 'explore' ? <Explore onNavigate={navigate} /> : null}
        {route === 'experiment' ? <ScenarioAnalysis onNavigate={navigate} /> : null}
        {route === 'compare' ? <CompareResults onNavigate={navigate} /> : null}
        {route === 'library' ? (
          <DatasetLibraryPage onNavigate={navigate} onOpenImport={() => setImportOpen(true)} />
        ) : null}
        {route === 'methodology' ? <Methodology /> : null}
      </Shell>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(preview) => {
          if (!preview.dataset) {
            setNotice({
              tone: 'danger',
              title: 'Import blocked',
              message:
                'The dataset could not be imported because validation found blocking problems. The currently loaded dataset and any existing result are unchanged.',
            })
            return
          }
          addImportedDataset(preview.dataset)
          const report = preview.report
          setNotice({
            tone: report?.outstandingWarnings.length ? 'warning' : 'success',
            title: 'Dataset imported',
            message: report
              ? `"${preview.dataset.name}" was imported with ${report.acceptedNodeCount} node(s) and ${report.acceptedEdgeCount} link(s). ${report.duplicateEdgesRemoved} duplicate link(s) removed, ${report.selfLinksExcluded} self-link(s) excluded, ${report.invalidEdgesExcluded} invalid link(s) excluded. Status: ${preview.dataset.sourceStatus === 'research-pending' ? 'Research source pending' : 'Research source provided, validation pending'} — never verified automatically. It is now the active network — open the Explorer to work with it.`
              : `"${preview.dataset.name}" was imported. It is now the active network — open the Explorer to work with it.`,
          })
          setImportOpen(false)
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <Routed />
    </AppStateProvider>
  )
}
