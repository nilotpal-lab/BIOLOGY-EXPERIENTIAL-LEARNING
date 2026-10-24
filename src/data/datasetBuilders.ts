import { makeEdgeId } from '../core/graphModel'
import type { FoodWebEdge } from '../core/types'

/**
 * Authoring helper for dataset files.
 *
 * Every edge is written as a `[foodSource, consumer]` tuple, which is impossible
 * to mis-order silently and always yields the mandated
 * `source = food organism, target = consumer` direction with a stable id.
 */
export function buildEdges(pairs: readonly (readonly [string, string])[]): FoodWebEdge[] {
  return pairs.map(([source, target]) => ({
    id: makeEdgeId(source, target),
    source,
    target,
  }))
}
