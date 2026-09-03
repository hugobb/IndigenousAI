import { describe, expect, it } from 'vitest'
import { DATA_REGIMES, TIERS, RECORD_STATUS } from '../src/schema/vocab.js'

describe('vocabularies', () => {
  it('orders the data regime ladder from unconstrained to largest', () => {
    expect(DATA_REGIMES).toEqual(['any', 'zero', '<1k', '1k-10k', '10k+'])
  })

  it('has exactly two tiers', () => {
    expect(TIERS).toEqual(['indigenous', 'adjacent'])
  })

  it('can represent a reviewed-and-excluded record', () => {
    expect(RECORD_STATUS).toContain('rejected')
  })
})
