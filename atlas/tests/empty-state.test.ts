import { describe, expect, it } from 'vitest'
import { emptyState, type Selection } from '../src/lib/filters.js'
import type { Initiative, Language } from '../src/schema/index.js'

const l = { id: 'x' } as Language
const sel = (over: Partial<Selection>): Selection =>
  ({ languages: [], initiatives: [], filteredOut: [], undatedInitiatives: 0, ...over })

describe('emptyState', () => {
  it('is nothing-matched only when all three collections are empty', () => {
    expect(emptyState(sel({}))).toBe('nothing-matched')
  })

  // The defect this function exists to prevent: filteredOut IS the finding, so
  // a non-empty filteredOut can never be "nothing matched".
  it('never says nothing-matched while filteredOut carries the finding', () => {
    expect(emptyState(sel({ filteredOut: [l] }))).toBe('no-work-but-languages')
  })

  it('reports no-work-but-languages when work is empty and languages remain', () => {
    expect(emptyState(sel({ languages: [], filteredOut: [l] }))).toBe('no-work-but-languages')
  })

  it('reports matched when there is work', () => {
    const i = { id: 'i' } as unknown as Initiative
    expect(emptyState(sel({ languages: [l], initiatives: [i] }))).toBe('matched')
  })
})
