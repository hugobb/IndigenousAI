import { describe, expect, it } from 'vitest'
import { locationConfidence } from '../src/lib/confidence.js'

describe('locationConfidence', () => {
  it('reports a sourced location', () => {
    expect(locationConfidence({ confidence: 'sourced' })).toBe('sourced')
  })

  it('reports an approximate location', () => {
    expect(locationConfidence({ confidence: 'approximate' })).toBe('approximate')
  })

  it('reports absent for null', () => {
    expect(locationConfidence(null)).toBe('absent')
  })

  it('reports absent for undefined', () => {
    expect(locationConfidence(undefined)).toBe('absent')
  })
})
