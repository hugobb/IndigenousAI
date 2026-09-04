import { describe, expect, it } from 'vitest'
import { emptyState, type Selection } from '../src/lib/filters.js'
import type { Initiative, Language } from '../src/schema/index.js'

const l = { id: 'x' } as Language
const sel = (over: Partial<Selection>): Selection => ({
  languages: [], initiatives: [], noMatchingWork: [],
  undatedInitiatives: 0, workFiltered: false, ...over,
})

describe('emptyState', () => {
  // Two collections now, not three: `noMatchingWork` is a SUBSET of
  // `languages`, so an empty `languages` forces it empty and a third clause
  // could never change the answer.
  it('is nothing-matched when neither a language nor an initiative survives', () => {
    expect(emptyState(sel({}))).toBe('nothing-matched')
  })

  // The defect this function exists to prevent: noMatchingWork IS the finding,
  // so a language carrying it can never be reported as "nothing matched".
  it('never says nothing-matched while noMatchingWork carries the finding', () => {
    expect(emptyState(sel({ languages: [l], noMatchingWork: [l] }))).toBe('no-work-but-languages')
  })

  // Previously this state was written `languages: [], filteredOut: [l]`, which
  // the new invariant makes unconstructable. The behaviour it was reaching for
  // is now the plain case: languages survived, no initiative did.
  it('reports no-work-but-languages when work is empty and languages remain', () => {
    expect(emptyState(sel({ languages: [l], noMatchingWork: [] }))).toBe('no-work-but-languages')
  })

  // The state SP1c parked: under a work filter the old `filteredOut` was
  // empty here, so this returned `matched` and no surface said anything at
  // all. It is now explained.
  it('reports no-work-but-languages even when every surviving language is workless', () => {
    expect(emptyState(sel({ languages: [l], noMatchingWork: [l], workFiltered: true })))
      .toBe('no-work-but-languages')
  })

  it('reports matched when there is work', () => {
    const i = { id: 'i' } as unknown as Initiative
    expect(emptyState(sel({ languages: [l], initiatives: [i] }))).toBe('matched')
  })
})
