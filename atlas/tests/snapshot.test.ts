import { describe, expect, it } from 'vitest'
import { snapshotDate } from '../src/lib/snapshot.js'

describe('snapshotDate', () => {
  it('renders an ISO instant as a plain calendar date', () => {
    expect(snapshotDate('2026-09-03T00:00:00.000Z')).toBe('2026-09-03')
  })

  it('leaves a value that is already a plain date alone', () => {
    expect(snapshotDate('2026-09-03')).toBe('2026-09-03')
  })

  // Midnight UTC is the previous day west of Greenwich. Reading the local
  // fields would make two readers cite different days from one stamped bundle.
  it('reads the stamp in UTC, not in the reader zone', () => {
    expect(snapshotDate('2026-01-01T00:30:00.000Z')).toBe('2026-01-01')
    expect(snapshotDate('2026-01-01T23:30:00.000Z')).toBe('2026-01-01')
  })

  it('pads month and day, so the string is always the same width', () => {
    expect(snapshotDate('2026-01-05T12:00:00.000Z')).toBe('2026-01-05')
  })

  // "Invalid Date" standing where the provenance should be is worse than the
  // raw stamp: the raw stamp is at least still evidence of what was built.
  it('returns an unparseable stamp verbatim rather than "Invalid Date"', () => {
    expect(snapshotDate('not a date')).toBe('not a date')
    expect(snapshotDate('')).toBe('')
  })
})
