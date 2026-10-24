import { chainFixture, validationFixture } from './fixtures'
import { demoDatasets } from './demoDatasets'
import { MAR_TATOOSH_1 } from './research/MAR-TATOOSH-1'
import { MAR_YTHAN_1 } from './research/MAR-YTHAN-1'
import { RES_FW_A } from './research/FW-A'
import { RES_FW_B } from './research/FW-B'
import { RES_TER_C } from './research/TER-C'
import { RES_TER_D } from './research/TER-D'
import type { EcosystemCategory, FoodWebDataset, SourceStatus, ScenarioMode } from '../core/types'

/* ============================================================================
 * datasetRegistry — metadata and loading for every dataset the app knows about.
 *
 * Two clearly separated categories (Prompt §2.1):
 *   1. Demo Lab        — illustrative teaching examples, explicitly labelled.
 *   2. Research library — documented sources, with an honest curation tracker.
 *                     Research datasets are bundled here as built-in datasets so
 *                     they are available on a fresh application start without
 *                     manual import or browser-local storage. They are kept
 *                     strictly separate from the illustrative demo datasets.
 * ========================================================================== */

export const DEMO_LAB_DATASETS: FoodWebDataset[] = demoDatasets

export const VALIDATION_DATASETS: FoodWebDataset[] = [validationFixture, chainFixture]

/**
 * Ordered by ecosystem so the library reads freshwater → terrestrial → marine.
 * Every entry is produced by a committed converter from committed source files
 * (src/data/research/convert-*.mjs) and re-derived independently by the tests.
 */
export const BUILT_IN_RESEARCH_DATASETS: FoodWebDataset[] = [
  RES_FW_A,
  RES_FW_B,
  RES_TER_C,
  RES_TER_D,
  MAR_TATOOSH_1,
  MAR_YTHAN_1,
]

export const BUILT_IN_DATASETS: FoodWebDataset[] = [
  ...DEMO_LAB_DATASETS,
  ...VALIDATION_DATASETS,
  ...BUILT_IN_RESEARCH_DATASETS,
]

export function getBuiltInDataset(id: string): FoodWebDataset | undefined {
  return BUILT_IN_DATASETS.find((dataset) => dataset.id === id)
}

const CANDIDATE_REPOSITORIES = {
  globalweb: {
    label: 'GlobalWeb archive',
    url: 'https://github.com/globalbioticinteractions/globalwebdb',
    note: 'Archived food-web data. Individual datasets still have to be screened for ecosystem category, link direction and reuse conditions.',
  },
  ecobase: {
    label: 'EcoBase',
    url: 'https://ecobase.ecopath.org/',
    note: 'Published Ecopath ecosystem models with accompanying metadata and citations. Model diets are not always stored as simple directed feeding links.',
  },
  zenodo: {
    label: 'Zenodo',
    url: 'https://zenodo.org/',
    note: 'Published food-web datasets with DOIs. Each record must be checked for licence and for whether nodes are species or trophic groups.',
  },
} as const

function pendingSlot(slotId: string, ecosystem: EcosystemCategory, workingTitle: string): ResearchSlot {
  return {
    slotId,
    ecosystem,
    workingTitle,
    status: 'research-pending',
    outstanding: [
      'Select a specific, documented dataset for this slot.',
      'Confirm the ecosystem category and the node unit (species or trophic group).',
      'Normalise every link to food source -> consumer.',
      'Record citation, source URL or DOI, licence and reuse conditions.',
      'Run the in-app import validation and resolve every error and warning.',
      'Recalculate baseline node, link and connectance values and compare with the source.',
      'Only then change the source status to "Research source verified".',
    ],
    candidateSources: [
      CANDIDATE_REPOSITORIES.globalweb,
      CANDIDATE_REPOSITORIES.ecobase,
      CANDIDATE_REPOSITORIES.zenodo,
    ],
  }
}

/**
 * Six target slots, two per ecosystem category. Every slot now points at a
 * bundled, source-validated network; the checks that were completed are listed
 * on each slot so the claim can be audited without leaving the application.
 */
export const RESEARCH_SLOTS: ResearchSlot[] = [
  {
    ...pendingSlot('RES-FW-1', 'freshwater', 'Freshwater research network 1'),
    status: 'research-verified',
    bundledDatasetId: 'RES-FW-A',
    outstanding: [],
    verifiedChecks: [
      'Source files committed verbatim (source-fw-pond1/{nodes,properties,trophic.links}.csv) from Dryad doi:10.5061/dryad.866t1g1zj, FoodwebMetadata/communities/Pond1 (Pondcode WI1).',
      'Node and link counts re-derived from those tables by the test suite: 11 nodes, 18 unique resource -> consumer links.',
      'Direction confirmed from the archive README: resource is the food, consumer is the consumer of the food.',
      'Citation recorded: Zhang P, Zhang H, Xu J (2024), Dryad doi:10.5061/dryad.866t1g1zj, related article doi:10.1111/gcb.70114.',
      'Reuse terms confirmed on the Dryad record: CC0 1.0.',
    ],
    candidateSources: [
      {
        label: 'Dryad dataset deposition',
        url: 'https://doi.org/10.5061/dryad.866t1g1zj',
        note: 'Multiple stressors simplify freshwater food webs. Pond 1 community used for RES-FW-A.',
      },
    ],
  },
  {
    ...pendingSlot('RES-FW-2', 'freshwater', 'Freshwater research network 2'),
    status: 'research-verified',
    bundledDatasetId: 'RES-FW-B',
    outstanding: [],
    verifiedChecks: [
      'Second freshwater network: Pond47 (Pondcode C6, unheated untreated control) from the same archive, committed verbatim in source-fw-pond47/.',
      'Node and link counts re-derived from those tables by the test suite: 14 nodes, 39 unique resource -> consumer links.',
      'Relationship to RES-FW-A stated explicitly: a replicate network instance from the same 48-pond experiment, not an independent ecosystem or study.',
      'Citation recorded: Zhang P, Zhang H, Xu J (2024), Dryad doi:10.5061/dryad.866t1g1zj; reuse terms CC0 1.0.',
    ],
    candidateSources: [
      {
        label: 'Dryad dataset deposition',
        url: 'https://doi.org/10.5061/dryad.866t1g1zj',
        note: 'Same archive as RES-FW-A; 48 documented pond communities plus treatment-summed aggregates.',
      },
    ],
  },
  {
    ...pendingSlot('RES-TER-1', 'terrestrial', 'Terrestrial research network 1'),
    status: 'research-verified',
    bundledDatasetId: 'RES-TER-C',
    outstanding: [],
    verifiedChecks: [
      'Source files committed verbatim (source-ter-c/{Insect+data.csv,TidyTrait.csv}) from Dryad doi:10.5061/dryad.230j5ch.',
      'Filter reproduced from the source itself: 471 observed records, 322 with IncludeInFoodWeb=Yes, 131 with an explicit exclusion reason, 18 with an empty flag that are absent from the authors\' FW.csv.',
      'Accepted pair set equals the authors\' FW.csv exactly; 322 unique plant -> insect links, no duplicates, no self-links, no missing endpoints.',
      'Node identities re-derived: 141 host-plant species (TidyTrait Codigo -> Plant_species19 + Family) and 254 insect species; 395 nodes in total.',
      'Direction confirmed: the plant is the food and the insect is the seed predator, so each link is plant -> insect.',
      'Citation recorded: Gripenberg S et al. (2019), Dryad doi:10.5061/dryad.230j5ch, related article doi:10.1111/ele.13359; reuse terms CC0 1.0.',
    ],
    candidateSources: [
      {
        label: 'Dryad dataset deposition',
        url: 'https://doi.org/10.5061/dryad.230j5ch',
        note: 'A highly-resolved food web for insect seed predators in a species-rich tropical forest. Source used for RES-TER-C.',
      },
      {
        label: 'Associated code repository',
        url: 'https://github.com/jcdterry/BCI_Seed_Predator',
        note: 'Analysis code associated with the BCI seed-predation dataset (linked from the archive README).',
      },
    ],
  },
  {
    ...pendingSlot('RES-TER-2', 'terrestrial', 'Terrestrial research network 2'),
    status: 'research-verified',
    bundledDatasetId: 'RES-TER-D',
    outstanding: [],
    verifiedChecks: [
      'Source files committed verbatim (source-ter-d/{pred_prey_sizes_DNAinteractions.csv,Predator_IDs.csv}) from Dryad doi:10.25349/D9M038.',
      'Record counts match the deposit abstract: 305 predator-prey interaction records from 173 individual predators of nine species.',
      'Aggregated network re-derived: 98 unique prey-family -> predator-species links over 48 prey families and 9 predator species (57 nodes).',
      'Defect found and corrected during verification: the earlier 609-link version had read zero-read rows of the rarefied taxonomic table, including non-diet assignments such as Hominidae and Muridae. Only detected records (reads >= 1) are links.',
      'Direction confirmed: prey -> predator, per the gut-content DNA methods in the archive README.',
      'Citation recorded: Miller-ter Kuile A et al. (2022), Dryad doi:10.25349/D9M038, related article doi:10.1002/ecy.3634; reuse terms CC0 1.0.',
    ],
    candidateSources: [
      {
        label: 'Dryad dataset deposition',
        url: 'https://doi.org/10.25349/D9M038',
        note: 'Palmyra Atoll terrestrial invertebrate predator-prey network. Source used for RES-TER-D.',
      },
      {
        label: 'Associated article',
        url: 'https://doi.org/10.1002/ecy.3634',
        note: 'Miller-ter Kuile et al. (2021) Ecology. Cited for methods and context.',
      },
    ],
  },
  {
    ...pendingSlot('RES-MAR-1', 'marine', 'Marine research network 1'),
    status: 'research-verified',
    bundledDatasetId: 'MAR-TATOOSH-1',
    outstanding: [],
    verifiedChecks: [
      'Trophic matrix committed verbatim (TatooshTrophic.txt, 110 x 110) from Dryad doi:10.5061/dryad.39jv1.',
      'All 869 feeding links re-derived from the matrix by the test suite; +1 at row i, column j means column j is eaten by row i, i.e. j -> i.',
      'Node identities come from the committed Tatoosh taxonomy extract; no role is claimed because the matrix does not annotate roles (roleEvidence: unknown).',
      'Citation recorded: Wootton JT, Sander EL, Allesina S (2016), Dryad doi:10.5061/dryad.39jv1, related article doi:10.1371/journal.pcbi.1004330.',
      'Reuse terms confirmed on the Dryad record: CC0 1.0.',
    ],
    candidateSources: [
      {
        label: 'Dryad dataset deposition',
        url: 'https://doi.org/10.5061/dryad.39jv1',
        note: 'Tatoosh Island trophic matrix and taxonomy. Source used for MAR-TATOOSH-1.',
      },
      {
        label: 'Related article',
        url: 'https://doi.org/10.1371/journal.pcbi.1004330',
        note: 'Wootton, Sander & Allesina (2016) PLoS Computational Biology. Cited for context.',
      },
    ],
  },
  {
    ...pendingSlot('RES-MAR-2', 'marine', 'Marine research network 2'),
    status: 'research-verified',
    bundledDatasetId: 'MAR-YTHAN-1',
    outstanding: [],
    verifiedChecks: [
      'Matrix committed verbatim (source-mar-ythan/ythan_spnames.csv, 92 x 92) from Dryad doi:10.5061/dryad.1mv20r6.',
      'Matrix orientation taken from the Dryad usage notes, not guessed: "predator names given in the first row and prey names given in the first column"; a 1 is a feeding link, so each cell is prey -> predator.',
      'Normalisation re-derived and counted: 417 marked cells, 395 unique pairs after collapsing duplicate labels, 19 links involving the non-taxon label "na" and 3 self-links excluded, leaving 87 nodes and 373 links.',
      'Trophic roles come from the archive\'s own FeedingMode column in full_data.csv (extract committed as ythan_feeding_modes.csv); labels without a trait row stay roleEvidence unknown.',
      'Citation recorded: Cirtwill AR, Eklöf A (2019), Dryad doi:10.5061/dryad.1mv20r6, related article doi:10.1111/ele.12955; underlying Ythan web Cohen et al. (2009) PNAS doi:10.1073/pnas.0910582106. Reuse terms CC0 1.0.',
      'Ecosystem note: the source presents all six webs as marine; the Ythan is tidal estuarine and is filed under marine on that authority, with the caveat recorded in its provenance.',
    ],
    candidateSources: [
      {
        label: 'Dryad dataset deposition',
        url: 'https://doi.org/10.5061/dryad.1mv20r6',
        note: 'Six well-resolved marine food webs plus traits. Ythan Estuary matrix used for MAR-YTHAN-1.',
      },
      {
        label: 'Related article',
        url: 'https://doi.org/10.1111/ele.12955',
        note: 'Cirtwill & Eklöf (2018) Ecology Letters, "Feeding environment and other traits shape species\' roles in marine food webs".',
      },
    ],
  },
]

/**
 * Real curation progress, derived from the slot list so the UI can never
 * hard-code a stale "all six slots pending" claim (Prompt §7.3, §12).
 */
export const RESEARCH_SLOT_SUMMARY = {
  total: RESEARCH_SLOTS.length,
  pending: RESEARCH_SLOTS.filter((slot) => slot.status === 'research-pending').length,
  bundled: RESEARCH_SLOTS.filter((slot) => Boolean(slot.bundledDatasetId)).length,
  verified: RESEARCH_SLOTS.filter((slot) => slot.status === 'research-verified').length,
}

/* ---- Persistence to browser localStorage (Prompt §15.3) ---- */

export function loadImportedDatasets(): FoodWebDataset[] {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('foodwebguard-imported-datasets')
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.datasets || []
  } catch {
    return []
  }
}

export function loadLastAnalysis(): LastAnalysisSummary | null {
  try {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('foodwebguard-last-analysis')
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function saveImportedDatasets(datasets: FoodWebDataset[]): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem('foodwebguard-imported-datasets', JSON.stringify({ datasets }))
  } catch {
    // non-fatal per Prompt §15.3
  }
}

export function saveLastAnalysis(summary: LastAnalysisSummary): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem('foodwebguard-last-analysis', JSON.stringify(summary))
  } catch {
    // non-fatal per Prompt §15.3
  }
}

export interface LastAnalysisSummary {
  datasetId: string
  datasetName: string
  mode: ScenarioMode
  primaryNodeLabel: string
  linkLossPercent: number | null
  secondaryRemovals: number
  at: string
}

export interface ResearchSlot {
  slotId: string
  ecosystem: EcosystemCategory
  workingTitle: string
  status: SourceStatus
  /** Remaining steps. Empty for a verified slot. */
  outstanding: string[]
  /** What was actually checked, for verified slots. */
  verifiedChecks?: string[]
  bundledDatasetId?: string
  candidateSources: { label: string; url: string; note?: string }[]
}
