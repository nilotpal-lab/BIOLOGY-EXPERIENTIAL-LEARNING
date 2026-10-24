import { describe, expect, it } from 'vitest'
import { runRankingChecks, runValidationSuite } from '../core/validationSuite'

/* ============================================================================
 * The Methodology screen renders the suite below. If any check ever fails, this
 * test fails too, so the screen can never silently report a green result.
 * ========================================================================== */

describe('in-app validation suite', () => {
  const report = runValidationSuite()

  it('runs a meaningful number of checks', () => {
    expect(report.total).toBeGreaterThan(40)
  })

  it('passes every check', () => {
    const failures = report.checks
      .filter((entry) => !entry.passed)
      .map((entry) => `${entry.group} / ${entry.name}: expected ${entry.expected}, computed ${entry.actual}`)
    expect(failures).toEqual([])
    expect(report.failed).toBe(0)
  })

  it('keeps the specification-inconsistency note attached to its check', () => {
    const noteCheck = report.checks.find((entry) => entry.note?.includes('specification states 2 links lost'))
    expect(noteCheck).toBeDefined()
    expect(noteCheck?.passed).toBe(true)
  })
})

describe('in-app ranking checks', () => {
  it('passes every ranking check', async () => {
    const checks = await runRankingChecks()
    const failures = checks
      .filter((entry) => !entry.passed)
      .map((entry) => `${entry.name}: expected ${entry.expected}, computed ${entry.actual}`)
    expect(failures).toEqual([])
  })
})
