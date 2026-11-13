import type { FoodWebNode } from './types'

/* ============================================================================
 * rules — the documented, explicit eligibility rule.
 *
 * Keeping this in one place means the UI, the metrics module and the cascade
 * algorithm can never drift apart, and the Methodology screen can quote the
 * exact rule the program applied (Master Build Prompt §4.4, §9.1, §11 Case 17).
 * ========================================================================== */

export interface StructuralEligibility {
  /** Is the node eligible for structural secondary removal? */
  eligible: boolean
  /** Shown to the user whenever the answer matters. */
  reason: string
}

/**
 * STRUCTURAL FOOD-SOURCE-LOSS RULE (quoted in the Methodology screen):
 *
 * This is a STRUCTURAL simulation rule, not a biological classification of the
 * species involved and not an extinction forecast. A surviving node is eligible
 * for secondary (cascade) removal when ALL of:
 *  1. it had at least one recorded incoming food-source link in the BASELINE;
 *  2. it has ZERO recorded incoming food-source links in the current scenario;
 *  3. it has not already been removed.
 *
 * Trophic role and role evidence are reported for context and are NEVER used to
 * gate the rule. A node whose role is marked `roleEvidence: "unknown"` is treated
 * exactly like any other node: the calculation is based on the recorded
 * source-to-consumer edges, not on an unverified role label. Making eligibility
 * depend on verified roles would silently disable the cascade for large parts of
 * datasets such as MAR-TATOOSH-1, whose roles are all inferred.
 *
 * A node that had zero incoming links in the baseline is never eligible, so
 * producers and basal groups (which have no recorded food source by definition)
 * are excluded by condition 1 alone rather than by a role special case.
 */
export function structuralLossEligibility(
  node: FoodWebNode,
  baselineIncoming: number,
  remainingIncoming: number,
): StructuralEligibility {
  if (baselineIncoming < 1) {
    return {
      eligible: false,
      reason:
        'No recorded incoming food-source link in the baseline, so this node cannot have lost one. The structural rule does not apply.',
    }
  }

  if (remainingIncoming > 0) {
    return {
      eligible: false,
      reason: `Still has ${remainingIncoming} recorded incoming food-source link(s), so it is not food-source depleted under the structural rule.`,
    }
  }

  return {
    eligible: true,
    reason:
      `Had ${baselineIncoming} recorded food-source link(s) in the baseline and has none remaining. ` +
      `Eligible under the structural rule, which uses recorded edges only (reported role: ${node.trophicRole}, ` +
      `role evidence: ${node.roleEvidence}; role does not gate the calculation).`,
  }
}
