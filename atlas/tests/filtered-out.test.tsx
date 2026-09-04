// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import UnmappedList from '../src/components/UnmappedList.js'
import { LanguageSchema } from '../src/schema/index.js'

afterEach(() => cleanup())

const src = { kind: 'doc' as const, ref: 't', retrieved: null, quote: null }
const lang = (id: string, over: Record<string, unknown> = {}) =>
  LanguageSchema.parse({
    id, name: id, tier: 'indigenous', typology: [], endangerment: null, speakers: null,
    region: null, centre: { lat: 1, lon: 2, source: src, confidence: 'sourced' },
    caveat: null, status: 'verified', ...over,
  })

describe('the filtered-out group', () => {
  it('is absent when the filter removed nothing', () => {
    render(<UnmappedList languages={[lang('a')]} filteredOut={[]} onSelect={vi.fn()} />)
    expect(screen.queryByTestId('group-filtered-out')).toBeNull()
  })

  // Spec F1: filtering to ASR must not make Choctaw disappear — it must make
  // Choctaw say it has no ASR work.
  it('names each language that matched but has no matching work', () => {
    render(<UnmappedList languages={[lang('a')]} filteredOut={[lang('choctaw')]} onSelect={vi.fn()} />)
    const group = screen.getByTestId('group-filtered-out')
    expect(group.textContent).toContain('choctaw')
    expect(group.textContent).toContain('1')
  })

  it('keeps a filtered-out language selectable', () => {
    const onSelect = vi.fn()
    render(<UnmappedList languages={[]} filteredOut={[lang('choctaw')]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /choctaw/i }))
    expect(onSelect).toHaveBeenCalledWith('choctaw')
  })

  it('still shows the two groups it had before', () => {
    render(
      <UnmappedList
        languages={[
          lang('nocentre', { centre: null }),
          lang('rough', { centre: { lat: 1, lon: 2, source: src, confidence: 'approximate' } }),
        ]}
        filteredOut={[]} onSelect={vi.fn()}
      />,
    )
    expect(screen.getByTestId('group-not-mapped')).toBeDefined()
    expect(screen.getByTestId('group-approximate')).toBeDefined()
  })

  // A zero-count heading is not information, and at
  // `?region=africa&application=asr` two of them stacked above the group that
  // carried the actual finding.
  it('suppresses a group that has nothing in it rather than heading it with a zero', () => {
    render(
      <UnmappedList
        languages={[lang('mapped')]}
        filteredOut={[lang('choctaw')]} onSelect={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('group-not-mapped')).toBeNull()
    expect(screen.queryByTestId('group-approximate')).toBeNull()
    expect(screen.getByTestId('group-filtered-out')).toBeDefined()
  })
})
