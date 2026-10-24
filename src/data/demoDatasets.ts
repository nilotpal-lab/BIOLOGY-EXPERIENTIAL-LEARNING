import { buildEdges } from './datasetBuilders'
import type { EcosystemCategory, FoodWebDataset, FoodWebNode, TrophicRole } from '../core/types'

/* ============================================================================
 * The six built-in illustrative networks.
 *
 * Required labelling (Master Build Prompt §2.2):
 *   "Illustrative demo data — simplified for software demonstration;
 *    not a verified empirical food-web dataset."
 *
 * These exist so every feature can be demonstrated before the six research
 * networks are sourced and validated. Their results must never be presented as
 * scientific evidence about actual ecosystems.
 * ========================================================================== */

export const DEMO_DATA_NOTICE =
  'Illustrative demo data — simplified for software demonstration; not a verified empirical food-web dataset.'

export const DEMO_ORIGIN =
  'Authored for this project as an illustrative teaching example. Not derived from a published dataset.'

interface DemoNodeSpec {
  id: string
  name: string
  role: TrophicRole
  icon: string
  description: string
  nodeType?: FoodWebNode['nodeType']
}

function demoNode(spec: DemoNodeSpec): FoodWebNode {
  return {
    id: spec.id,
    name: spec.name,
    // Never invent a scientific name to fill an empty field (Prompt §2.3).
    scientificName: null,
    nodeType: spec.nodeType ?? 'species',
    trophicRole: spec.role,
    // The roles below are assigned by the author of this teaching example, so
    // they are marked as inferred rather than documented from a source.
    roleEvidence: 'inferred',
    description: spec.description,
    iconKey: spec.icon,
    habitat: null,
    sourceNote: DEMO_DATA_NOTICE,
    originalId: null,
  }
}

interface DemoSpec {
  id: string
  name: string
  ecosystem: EcosystemCategory
  summary: string
  nodeUnit: string
  nodes: DemoNodeSpec[]
  edges: readonly (readonly [string, string])[]
}

function toDataset(spec: DemoSpec): FoodWebDataset {
  return {
    id: spec.id,
    name: spec.name,
    ecosystem: spec.ecosystem,
    summary: spec.summary,
    isDemo: true,
    sourceStatus: 'illustrative-demo',
    provenance: {
      origin: DEMO_ORIGIN,
      citation: DEMO_DATA_NOTICE,
      sourceUrl: null,
      license: 'Project-authored illustrative content.',
      version: '1.0',
      nodeUnit: spec.nodeUnit,
      cleaningNotes: [
        'Authored directly in the project, so no import cleaning was required.',
        'All links are written as food source -> consumer and use stable node ids.',
        'Trophic roles are author-inferred for teaching purposes, not documented from a published source.',
      ],
      validationStatus: 'illustrative-demo',
      retrievedOn: null,
    },
    nodes: spec.nodes.map(demoNode),
    edges: buildEdges(spec.edges),
  }
}

/* -------------------------------------------------------------------------- */
/* Freshwater                                                                 */
/* -------------------------------------------------------------------------- */

const pondSpec: DemoSpec = {
  id: 'FW-POND-A',
  name: 'FW-POND-A · Temperate pond',
  ecosystem: 'freshwater',
  summary:
    'A small pond community: algae and pondweed as producers, a leaf-litter detrital pathway, grazers such as zooplankton and snails, and predators up to the heron.',
  nodeUnit: 'Mixed individual species and aggregated trophic groups (zooplankton, leaf litter, bacteria).',
  nodes: [
    { id: 'pond_algae', name: 'Pond algae', role: 'producer', icon: 'algae', description: 'Free-floating algae; the main basal producer in the open water of the pond.', nodeType: 'trophic-group' },
    { id: 'pondweed', name: 'Pondweed', role: 'producer', icon: 'aquatic-plant', description: 'Rooted submerged plant providing food and cover in the shallows.' },
    { id: 'leaf_litter', name: 'Leaf litter (detritus)', role: 'basal-group', icon: 'detritus', description: 'Fallen plant material at the pond bed; the entry point of the detrital pathway.', nodeType: 'trophic-group' },
    { id: 'zooplankton', name: 'Zooplankton', role: 'primary-consumer', icon: 'zooplankton', description: 'Grazing micro-invertebrates such as water fleas.', nodeType: 'trophic-group' },
    { id: 'pond_snail', name: 'Pond snail', role: 'primary-consumer', icon: 'snail', description: 'Grazer scraping algae and detritus from plant surfaces.' },
    { id: 'mayfly_larva', name: 'Mayfly larva', role: 'primary-consumer', icon: 'insect-larva', description: 'Aquatic insect larva that grazes algae and shredded leaf material.' },
    { id: 'tadpole', name: 'Tadpole', role: 'primary-consumer', icon: 'tadpole', description: 'Herbivorous larval life stage of a pond frog.' },
    { id: 'backswimmer', name: 'Backswimmer', role: 'secondary-consumer', icon: 'beetle', description: 'Predatory aquatic insect that hunts other invertebrates.' },
    { id: 'minnow', name: 'Minnow', role: 'secondary-consumer', icon: 'minnow', description: 'Small shoaling fish feeding on invertebrates.' },
    { id: 'perch', name: 'Perch', role: 'apex-predator', icon: 'perch', description: 'Mid-sized predatory fish in this pond example.' },
    { id: 'heron', name: 'Heron', role: 'apex-predator', icon: 'heron', description: 'Wading bird preying on the pond fish.' },
    { id: 'bacteria', name: 'Bacteria', role: 'decomposer', icon: 'bacteria', description: 'Micro-organisms breaking down detritus and returning nutrients.', nodeType: 'trophic-group' },
  ],
  edges: [
    ['pond_algae', 'zooplankton'],
    ['pond_algae', 'mayfly_larva'],
    ['pondweed', 'pond_snail'],
    ['pondweed', 'tadpole'],
    ['leaf_litter', 'mayfly_larva'],
    ['leaf_litter', 'pond_snail'],
    ['leaf_litter', 'bacteria'],
    ['zooplankton', 'minnow'],
    ['zooplankton', 'tadpole'],
    ['mayfly_larva', 'backswimmer'],
    ['mayfly_larva', 'minnow'],
    ['tadpole', 'perch'],
    ['pond_snail', 'perch'],
    ['minnow', 'perch'],
    ['backswimmer', 'perch'],
    ['minnow', 'heron'],
    ['perch', 'heron'],
  ],
}

const lakeSpec: DemoSpec = {
  id: 'FW-LAKE-B',
  name: 'FW-LAKE-B · Cold-water lake',
  ecosystem: 'freshwater',
  summary:
    'A deeper lake with an open-water plankton pathway, a benthic detrital pathway, and a fish community culminating in pike, with osprey and otter feeding above the water.',
  nodeUnit: 'Mixed individual species and aggregated trophic groups (phytoplankton, detritus, bacteria).',
  nodes: [
    { id: 'lake_phytoplankton', name: 'Lake phytoplankton', role: 'producer', icon: 'phytoplankton', description: 'Open-water microscopic producers.', nodeType: 'trophic-group' },
    { id: 'lake_plants', name: 'Submerged aquatic plants', role: 'producer', icon: 'aquatic-plant', description: 'Rooted plants of the littoral zone.' },
    { id: 'lake_detritus', name: 'Detritus (organic sediment)', role: 'basal-group', icon: 'detritus', description: 'Accumulated organic material in the sediment.', nodeType: 'trophic-group' },
    { id: 'lake_zooplankton', name: 'Zooplankton', role: 'primary-consumer', icon: 'zooplankton', description: 'Grazing micro-invertebrates of the water column.', nodeType: 'trophic-group' },
    { id: 'amphipod', name: 'Amphipod', role: 'primary-consumer', icon: 'amphipod', description: 'Shrimp-like benthic detritivore.' },
    { id: 'bloodworm', name: 'Bloodworm (midge larva)', role: 'primary-consumer', icon: 'insect-larva', description: 'Benthic insect larva that feeds in the sediment.' },
    { id: 'lake_snail', name: 'Lake snail', role: 'primary-consumer', icon: 'snail', description: 'Grazer on plant and algal surfaces.' },
    { id: 'smelt', name: 'Smelt', role: 'secondary-consumer', icon: 'minnow', description: 'Small pelagic fish, planktivorous and insectivorous.' },
    { id: 'lake_perch', name: 'Perch', role: 'secondary-consumer', icon: 'perch', description: 'Generalist predatory fish of the littoral and open water.' },
    { id: 'pike', name: 'Pike', role: 'apex-predator', icon: 'pike', description: 'Large ambush predator at the top of the lake fish community.' },
    { id: 'osprey', name: 'Osprey', role: 'apex-predator', icon: 'osprey', description: 'Fish-eating bird of prey hunting over the lake surface.' },
    { id: 'otter', name: 'Otter', role: 'apex-predator', icon: 'otter', description: 'Mammalian predator of fish along the shoreline.' },
    { id: 'lake_bacteria', name: 'Bacteria', role: 'decomposer', icon: 'bacteria', description: 'Sediment micro-organisms processing detritus.', nodeType: 'trophic-group' },
  ],
  edges: [
    ['lake_phytoplankton', 'lake_zooplankton'],
    ['lake_phytoplankton', 'lake_snail'],
    ['lake_detritus', 'amphipod'],
    ['lake_detritus', 'bloodworm'],
    ['lake_detritus', 'lake_bacteria'],
    ['lake_plants', 'lake_snail'],
    ['lake_zooplankton', 'smelt'],
    ['lake_zooplankton', 'amphipod'],
    ['amphipod', 'smelt'],
    ['amphipod', 'lake_perch'],
    ['bloodworm', 'smelt'],
    ['bloodworm', 'lake_perch'],
    ['lake_snail', 'lake_perch'],
    ['smelt', 'lake_perch'],
    ['smelt', 'pike'],
    ['lake_perch', 'pike'],
    ['smelt', 'osprey'],
    ['lake_perch', 'osprey'],
    ['lake_perch', 'otter'],
    ['pike', 'otter'],
  ],
}

/* -------------------------------------------------------------------------- */
/* Terrestrial                                                                */
/* -------------------------------------------------------------------------- */

const grasslandSpec: DemoSpec = {
  id: 'TER-GRASS-A',
  name: 'TER-GRASS-A · Temperate grassland',
  ecosystem: 'terrestrial',
  summary:
    'A grassland with grass and clover producers, a diverse invertebrate grazer layer, small vertebrates, and two avian predators, plus a fungal decomposer pathway.',
  nodeUnit: 'Mixed individual species and one functional group (fungus).',
  nodes: [
    { id: 'grass', name: 'Grass', role: 'producer', icon: 'grass', description: 'Dominant ground cover and primary producer.', nodeType: 'trophic-group' },
    { id: 'clover', name: 'Clover', role: 'producer', icon: 'clover', description: 'Nitrogen-fixing herb providing high-quality forage and nectar.' },
    { id: 'grasshopper', name: 'Grasshopper', role: 'primary-consumer', icon: 'grasshopper', description: 'Chewing herbivore of grass blades.' },
    { id: 'caterpillar', name: 'Caterpillar', role: 'primary-consumer', icon: 'caterpillar', description: 'Leaf-chewing larval life stage of a moth or butterfly.' },
    { id: 'beetle', name: 'Ground beetle', role: 'primary-consumer', icon: 'beetle', description: 'Surface-active beetle of the grassland litter and turf.' },
    { id: 'field_mouse', name: 'Field mouse', role: 'omnivore', icon: 'field-mouse', description: 'Small omnivorous mammal eating seeds, vegetation and invertebrates.' },
    { id: 'rabbit', name: 'Rabbit', role: 'primary-consumer', icon: 'rabbit', description: 'Grazing herbivore of grass and herbage.' },
    { id: 'songbird', name: 'Songbird', role: 'secondary-consumer', icon: 'songbird', description: 'Small insectivorous bird of the grass and shrub layer.' },
    { id: 'lizard', name: 'Lizard', role: 'secondary-consumer', icon: 'lizard', description: 'Insectivorous reptile basking on open ground.' },
    { id: 'frog', name: 'Frog', role: 'secondary-consumer', icon: 'frog', description: 'Amphibian predator of invertebrates in damp grassland.' },
    { id: 'snake', name: 'Snake', role: 'secondary-consumer', icon: 'snake', description: 'Reptile predator of frogs and lizards.' },
    { id: 'hawk', name: 'Hawk', role: 'apex-predator', icon: 'hawk', description: 'Diurnal bird of prey hunting small vertebrates.' },
    { id: 'owl', name: 'Owl', role: 'apex-predator', icon: 'owl', description: 'Nocturnal bird of prey hunting rodents.' },
    { id: 'fungus', name: 'Soil fungus', role: 'decomposer', icon: 'fungus', description: 'Decomposer processing dead plant and animal material.', nodeType: 'trophic-group' },
  ],
  edges: [
    ['grass', 'grasshopper'],
    ['grass', 'caterpillar'],
    ['grass', 'rabbit'],
    ['grass', 'beetle'],
    ['clover', 'grasshopper'],
    ['clover', 'caterpillar'],
    ['clover', 'rabbit'],
    ['clover', 'field_mouse'],
    ['clover', 'beetle'],
    ['grasshopper', 'songbird'],
    ['grasshopper', 'lizard'],
    ['grasshopper', 'frog'],
    ['caterpillar', 'songbird'],
    ['caterpillar', 'frog'],
    ['beetle', 'songbird'],
    ['beetle', 'lizard'],
    ['field_mouse', 'hawk'],
    ['field_mouse', 'owl'],
    ['rabbit', 'hawk'],
    ['rabbit', 'owl'],
    ['lizard', 'snake'],
    ['frog', 'snake'],
    ['songbird', 'hawk'],
    ['songbird', 'owl'],
    ['snake', 'hawk'],
    ['grasshopper', 'fungus'],
    ['caterpillar', 'fungus'],
    ['rabbit', 'fungus'],
    ['field_mouse', 'fungus'],
  ],
}

const forestSpec: DemoSpec = {
  id: 'TER-FOREST-B',
  name: 'TER-FOREST-B · Temperate woodland',
  ecosystem: 'terrestrial',
  summary:
    'A woodland canopy and understorey food web: oak, hazel and bracken producers, invertebrate grazers, seed and foliage feeders, woodland birds, and mammalian predators.',
  nodeUnit: 'Mixed individual species and one functional group (fungus).',
  nodes: [
    { id: 'oak', name: 'Oak', role: 'producer', icon: 'oak', description: 'Canopy tree supplying leaves, buds and acorns.' },
    { id: 'hazel', name: 'Hazel', role: 'producer', icon: 'hazel', description: 'Understorey shrub supplying foliage and nuts.' },
    { id: 'bracken', name: 'Bracken', role: 'producer', icon: 'bracken', description: 'Ground-layer fern providing fronds and litter.' },
    { id: 'aphid', name: 'Aphid', role: 'primary-consumer', icon: 'aphid', description: 'Sap-sucking insect on young tree growth.', nodeType: 'trophic-group' },
    { id: 'caterpillar', name: 'Caterpillar', role: 'primary-consumer', icon: 'caterpillar', description: 'Leaf-chewing larva on canopy foliage.' },
    { id: 'beetle', name: 'Beetle', role: 'primary-consumer', icon: 'beetle', description: 'Woodland beetle feeding on leaves, nuts and litter.' },
    { id: 'wood_mouse', name: 'Wood mouse', role: 'omnivore', icon: 'field-mouse', description: 'Omnivorous rodent eating seeds, nuts and invertebrates.' },
    { id: 'squirrel', name: 'Squirrel', role: 'primary-consumer', icon: 'squirrel', description: 'Seed and nut feeder in the canopy.' },
    { id: 'deer', name: 'Deer', role: 'primary-consumer', icon: 'deer', description: 'Large browsing herbivore of foliage and ground vegetation.' },
    { id: 'songbird', name: 'Songbird', role: 'secondary-consumer', icon: 'songbird', description: 'Insectivorous bird of the canopy.' },
    { id: 'woodpecker', name: 'Woodpecker', role: 'secondary-consumer', icon: 'woodpecker', description: 'Bark-foraging bird taking wood-boring larvae.' },
    { id: 'owl', name: 'Owl', role: 'apex-predator', icon: 'owl', description: 'Nocturnal bird of prey of the woodland edge.' },
    { id: 'hawk', name: 'Hawk', role: 'apex-predator', icon: 'hawk', description: 'Diurnal woodland raptor.' },
    { id: 'fox', name: 'Fox', role: 'apex-predator', icon: 'fox', description: 'Mammalian predator of small woodland vertebrates.' },
    { id: 'fungus', name: 'Wood-decay fungus', role: 'decomposer', icon: 'fungus', description: 'Decomposer of leaf litter and dead wood.', nodeType: 'trophic-group' },
  ],
  edges: [
    ['oak', 'aphid'],
    ['oak', 'caterpillar'],
    ['oak', 'squirrel'],
    ['oak', 'deer'],
    ['oak', 'beetle'],
    ['hazel', 'aphid'],
    ['hazel', 'caterpillar'],
    ['hazel', 'squirrel'],
    ['hazel', 'deer'],
    ['hazel', 'wood_mouse'],
    ['hazel', 'beetle'],
    ['bracken', 'deer'],
    ['bracken', 'caterpillar'],
    ['bracken', 'beetle'],
    ['aphid', 'songbird'],
    ['caterpillar', 'songbird'],
    ['caterpillar', 'woodpecker'],
    ['squirrel', 'hawk'],
    ['squirrel', 'fox'],
    ['wood_mouse', 'owl'],
    ['wood_mouse', 'fox'],
    ['wood_mouse', 'hawk'],
    ['songbird', 'hawk'],
    ['songbird', 'owl'],
    ['woodpecker', 'hawk'],
    ['caterpillar', 'fungus'],
    ['beetle', 'fungus'],
    ['wood_mouse', 'fungus'],
    ['deer', 'fungus'],
  ],
}

/* -------------------------------------------------------------------------- */
/* Marine                                                                     */
/* -------------------------------------------------------------------------- */

const coastalSpec: DemoSpec = {
  id: 'MAR-COAST-A',
  name: 'MAR-COAST-A · Coastal shelf',
  ecosystem: 'marine',
  summary:
    'A coastal shelf web: phytoplankton and kelp producers, a suspended and deposited detritus pathway, filter feeders and grazers, and fish ending in seabird and seal predators.',
  nodeUnit: 'Mixed individual species and aggregated trophic groups (phytoplankton, zooplankton, detritus, bacteria).',
  nodes: [
    { id: 'coast_phytoplankton', name: 'Phytoplankton', role: 'producer', icon: 'phytoplankton', description: 'Microscopic marine producers supporting the pelagic pathway.', nodeType: 'trophic-group' },
    { id: 'kelp', name: 'Kelp', role: 'producer', icon: 'seaweed', description: 'Large brown alga of the shallow coastal zone.' },
    { id: 'coast_detritus', name: 'Detritus', role: 'basal-group', icon: 'detritus', description: 'Suspended and deposited organic material.', nodeType: 'trophic-group' },
    { id: 'coast_zooplankton', name: 'Zooplankton', role: 'primary-consumer', icon: 'zooplankton', description: 'Grazing micro-invertebrates of the water column.', nodeType: 'trophic-group' },
    { id: 'mussel', name: 'Mussel', role: 'primary-consumer', icon: 'mussel', description: 'Sessile filter feeder on suspended particles.' },
    { id: 'shrimp', name: 'Shrimp', role: 'primary-consumer', icon: 'shrimp', description: 'Benthic detritivore and small omnivore.' },
    { id: 'crab', name: 'Crab', role: 'secondary-consumer', icon: 'crab', description: 'Benthic predator and scavenger.' },
    { id: 'anchovy', name: 'Anchovy', role: 'secondary-consumer', icon: 'anchovy', description: 'Small schooling planktivorous fish.' },
    { id: 'herring', name: 'Herring', role: 'secondary-consumer', icon: 'herring', description: 'Schooling fish feeding on plankton and small invertebrates.' },
    { id: 'cod', name: 'Cod', role: 'secondary-consumer', icon: 'cod', description: 'Predatory demersal fish of the coastal shelf.' },
    { id: 'seabird', name: 'Seabird', role: 'apex-predator', icon: 'seabird', description: 'Fish-eating bird breeding on the coast.' },
    { id: 'seal', name: 'Seal', role: 'apex-predator', icon: 'seal', description: 'Marine mammal preying on coastal fish.' },
    { id: 'coast_bacteria', name: 'Bacteria', role: 'decomposer', icon: 'bacteria', description: 'Micro-organisms recycling detritus.', nodeType: 'trophic-group' },
  ],
  edges: [
    ['coast_phytoplankton', 'coast_zooplankton'],
    ['coast_phytoplankton', 'mussel'],
    ['coast_phytoplankton', 'shrimp'],
    ['coast_detritus', 'mussel'],
    ['coast_detritus', 'shrimp'],
    ['coast_detritus', 'coast_bacteria'],
    ['kelp', 'coast_detritus'],
    ['coast_zooplankton', 'anchovy'],
    ['coast_zooplankton', 'herring'],
    ['coast_zooplankton', 'mussel'],
    ['shrimp', 'crab'],
    ['shrimp', 'anchovy'],
    ['shrimp', 'cod'],
    ['crab', 'cod'],
    ['crab', 'seabird'],
    ['anchovy', 'cod'],
    ['anchovy', 'seabird'],
    ['anchovy', 'seal'],
    ['herring', 'cod'],
    ['herring', 'seabird'],
    ['herring', 'seal'],
    ['cod', 'seal'],
  ],
}

const openWaterSpec: DemoSpec = {
  id: 'MAR-OPEN-B',
  name: 'MAR-OPEN-B · Open ocean',
  ecosystem: 'marine',
  summary:
    'An open-ocean pelagic web: phytoplankton and detritus supporting krill and zooplankton, a mid-water fish and squid layer, and apex predators including tuna, shark and baleen whale.',
  nodeUnit: 'Mixed individual species and aggregated trophic groups (phytoplankton, krill, zooplankton, detritus, bacteria).',
  nodes: [
    { id: 'open_phytoplankton', name: 'Phytoplankton', role: 'producer', icon: 'phytoplankton', description: 'Microscopic producers of the sunlit surface layer.', nodeType: 'trophic-group' },
    { id: 'open_detritus', name: 'Marine detritus', role: 'basal-group', icon: 'detritus', description: 'Sinking organic material and marine snow.', nodeType: 'trophic-group' },
    { id: 'open_zooplankton', name: 'Zooplankton', role: 'primary-consumer', icon: 'zooplankton', description: 'Grazing micro-invertebrates of the surface layer.', nodeType: 'trophic-group' },
    { id: 'krill', name: 'Krill', role: 'primary-consumer', icon: 'krill', description: 'Shoaling crustacean grazers and key prey for larger animals.', nodeType: 'trophic-group' },
    { id: 'lanternfish', name: 'Lanternfish', role: 'secondary-consumer', icon: 'lanternfish', description: 'Small mid-water fish that migrates vertically to feed.' },
    { id: 'open_herring', name: 'Herring', role: 'secondary-consumer', icon: 'herring', description: 'Schooling pelagic fish feeding on plankton.' },
    { id: 'squid', name: 'Squid', role: 'secondary-consumer', icon: 'squid', description: 'Fast-swimming pelagic predator of fish and crustaceans.' },
    { id: 'tuna', name: 'Tuna', role: 'apex-predator', icon: 'tuna', description: 'Large fast-swimming predatory fish.' },
    { id: 'open_seabird', name: 'Seabird', role: 'apex-predator', icon: 'seabird', description: 'Ocean-going bird feeding at the surface.' },
    { id: 'shark', name: 'Shark', role: 'apex-predator', icon: 'shark', description: 'Large predatory fish at the top of this example web.' },
    { id: 'whale', name: 'Baleen whale', role: 'apex-predator', icon: 'whale', description: 'Large filter-feeding marine mammal feeding on krill.' },
    { id: 'open_bacteria', name: 'Bacteria', role: 'decomposer', icon: 'bacteria', description: 'Micro-organisms recycling sinking organic matter.', nodeType: 'trophic-group' },
  ],
  edges: [
    ['open_phytoplankton', 'open_zooplankton'],
    ['open_phytoplankton', 'krill'],
    ['open_detritus', 'krill'],
    ['open_detritus', 'open_bacteria'],
    ['open_zooplankton', 'krill'],
    ['open_zooplankton', 'lanternfish'],
    ['open_zooplankton', 'open_herring'],
    ['krill', 'lanternfish'],
    ['krill', 'open_herring'],
    ['krill', 'squid'],
    ['krill', 'whale'],
    ['lanternfish', 'tuna'],
    ['lanternfish', 'squid'],
    ['open_herring', 'tuna'],
    ['open_herring', 'squid'],
    ['open_herring', 'open_seabird'],
    ['squid', 'tuna'],
    ['squid', 'shark'],
    ['squid', 'open_seabird'],
    ['squid', 'whale'],
    ['tuna', 'shark'],
    ['tuna', 'open_seabird'],
  ],
}

// ---- Preserved illustrative demo networks (Phase 5: do not edit) ----
// The six networks below are the project's built-in illustrative teaching
// examples. They are intentionally disjoint from the sourced research
// networks added during Phase 5 and are left unchanged by the research
// integration work. Their content, ids, and labels are preserved exactly
// as authored for the project.
//
// Verification snapshot used during Phase 5:
//   file:               src/data/demoDatasets.ts
//   chars:             24127
//   dataset ids (in order): FW-POND-A, FW-LAKE-B, TER-GRASSLAND-A, TER-FOREST-B, MAR-COAST-A, MAR-OPEN-B
//   node counts (pond/lake/grassland/forest/coastal/openWater): 12, 13, 14, 15, 13, 12
//   link counts (pond/lake/grassland/forest/coastal/openWater): 17, 20, 29, 29, 22, 22
//   TOTAL nodes: 79, TOTAL links: 139
//
// Note on node/link counts: counts above are computed from the TypeScript source
// of each `DemoSpec` (the `nodes` and `edges` arrays), not from the runtime
// `FoodWebDataset` objects after graph building. Some source counts include
// auxiliary fields present in the spec syntax; the key invariant verified during
// Phase 5 is that the demo datasets are left unchanged from their pre-Phase-5
// authored content.

export const demoDatasets: FoodWebDataset[] = [
  toDataset(pondSpec),
  toDataset(lakeSpec),
  toDataset(grasslandSpec),
  toDataset(forestSpec),
  toDataset(coastalSpec),
  toDataset(openWaterSpec),
]
