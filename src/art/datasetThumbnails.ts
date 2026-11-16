/* ============================================================================
 * datasetThumbnails — Curated, distinct visual thumbnails for all datasets.
 *
 * Each research dataset and demo dataset has a dedicated, scientifically
 * accurate landscape illustration reflecting its ecosystem and field setting.
 * ========================================================================== */

import type { EcosystemCategory } from '../core/types'

export const DATASET_THUMBNAILS: Record<string, string> = {
  // 6 Verified Empirical Research Datasets
  'RES-FW-A': '/assets/datasets/res-fw-a.jpg',
  'RES-FW-B': '/assets/datasets/res-fw-b.jpg',
  'RES-TER-C': '/assets/datasets/res-ter-c.jpg',
  'RES-TER-D': '/assets/datasets/res-ter-d.jpg',
  'MAR-TATOOSH-1': '/assets/datasets/mar-tatoosh-1.jpg',
  'MAR-YTHAN-1': '/assets/datasets/mar-ythan-1.jpg',

  // 6 Illustrative Demo Lab Networks
  'FW-POND-A': '/assets/datasets/fw-pond-a.jpg',
  'FW-LAKE-B': '/assets/datasets/fw-lake-b.jpg',
  'TER-GRASS-A': '/assets/datasets/ter-grassland-a.jpg',
  'TER-GRASSLAND-A': '/assets/datasets/ter-grassland-a.jpg',
  'TER-FOREST-B': '/assets/datasets/ter-forest-b.jpg',
  'MAR-COAST-A': '/assets/datasets/mar-coast-a.jpg',
  'MAR-OPEN-B': '/assets/datasets/mar-open-b.jpg',

  // Internal test fixtures
  'VALIDATION-FOODWEB-6': '/assets/datasets/fw-pond-a.jpg',
  'VALIDATION-CHAIN-4': '/assets/datasets/ter-forest-b.jpg',
}

/** Geographic field site label for research and demo networks */
export const DATASET_LOCATIONS: Record<string, string> = {
  'RES-FW-A': 'Wuhan Mesocosm Facility, China',
  'RES-FW-B': 'Wuhan Mesocosm Facility, China',
  'RES-TER-C': 'Barro Colorado Island, Panama',
  'RES-TER-D': 'Palmyra Atoll, Central Pacific',
  'MAR-TATOOSH-1': 'Tatoosh Island, Washington, USA',
  'MAR-YTHAN-1': 'Ythan Estuary, Aberdeenshire, Scotland',
  'FW-POND-A': 'Temperate freshwater pond habitat',
  'FW-LAKE-B': 'Boreal deep lake ecosystem',
  'TER-GRASS-A': 'Temperate prairie grassland',
  'TER-GRASSLAND-A': 'Temperate prairie grassland',
  'TER-FOREST-B': 'Deciduous oak-hazel woodland',
  'MAR-COAST-A': 'Temperate rocky kelp coastline',
  'MAR-OPEN-B': 'Pelagic open ocean biome',
}

export function getDatasetThumbnail(id?: string | null, ecosystem?: EcosystemCategory): string {
  if (id && DATASET_THUMBNAILS[id]) {
    return DATASET_THUMBNAILS[id]
  }
  if (ecosystem === 'freshwater') return '/assets/datasets/res-fw-b.jpg'
  if (ecosystem === 'marine') return '/assets/datasets/mar-tatoosh-1.jpg'
  if (ecosystem === 'terrestrial') return '/assets/datasets/res-ter-c.jpg'
  return '/hero-ecosystem.webp'
}

export function getDatasetLocation(id?: string | null, fallback?: string): string {
  if (id && DATASET_LOCATIONS[id]) {
    return DATASET_LOCATIONS[id]
  }
  return fallback || 'Field research site'
}
