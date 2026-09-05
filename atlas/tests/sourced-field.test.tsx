// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import SourcedField from '../src/components/SourcedField.js'
import * as sourcedFieldModule from '../src/components/SourcedField.js'
import type { Source } from '../src/schema/index.js'

afterEach(() => cleanup())

const url: Source = { kind: 'url', ref: 'https://example.org/x', retrieved: '2026-09-03', quote: 'nine thousand' }
const doc: Source = { kind: 'doc', ref: 'data/REVIEW-QUEUE.md', retrieved: null, quote: null }

describe('SourcedField', () => {
  it('renders no disclosure when the field carries no source', () => {
    render(<SourcedField label="Family" testId="field-family" source={null}>Muskogean</SourcedField>)
    expect(screen.queryByTestId('source-field-family')).toBeNull()
  })

  it('renders a disclosure when it does, collapsed by default', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    const toggle = screen.getByTestId('source-field-speakers')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText(/example\.org/)).toBeNull()
  })

  it('names the disclosure after its field, so several on one panel differ', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    expect(screen.getByRole('button', { name: /source for speakers/i })).toBeDefined()
  })

  it('reveals kind, ref, retrieved and quote on expand', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const body = screen.getByTestId('source-body-field-speakers')
    expect(body.textContent).toMatch(/url/i)
    expect(body.textContent).toContain('https://example.org/x')
    expect(body.textContent).toContain('2026-09-03')
    expect(body.textContent).toContain('nine thousand')
  })

  it('linkifies a url ref', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const a = screen.getByRole('link', { name: /example\.org/ })
    expect(a.getAttribute('href')).toBe('https://example.org/x')
  })

  // A doc ref is a repo path, not a resource. An anchor would invent one.
  it('does NOT linkify a doc or paper ref', () => {
    render(<SourcedField label="Centre" testId="field-centre" source={doc}>0, 0</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-centre'))
    expect(screen.getByTestId('source-body-field-centre').textContent).toContain('data/REVIEW-QUEUE.md')
    expect(screen.queryByRole('link')).toBeNull()
  })

  // The schema requires `retrieved` only for url sources, so its absence on a
  // doc source is correct — not unknown. "not recorded" would be false here.
  it('omits retrieved rather than calling it not recorded', () => {
    render(<SourcedField label="Centre" testId="field-centre" source={doc}>0, 0</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-centre'))
    const body = screen.getByTestId('source-body-field-centre')
    expect(body.textContent).not.toMatch(/not recorded/i)
    expect(body.textContent).not.toMatch(/retrieved/i)
  })

  it('still renders the field value itself', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    expect(screen.getByTestId('field-speakers').textContent).toContain('9,600')
  })

  // If the toggle goes through `children`, `isEmpty` sees a non-empty node and
  // the words disappear from a field that has no value.
  it('still says "not recorded" for a null value that carries a source', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>{null}</SourcedField>)
    expect(screen.getByTestId('field-speakers').textContent).toMatch(/not recorded/i)
    expect(screen.getByTestId('source-field-speakers')).toBeDefined()
  })

  // A field can show more than one figure — speakers keeps disagreeing counts
  // rather than picking one — so the disclosure takes a LIST, as data. This is
  // what makes a second, hand-built disclosure component unnecessary, which is
  // what lets the module keep one private (see the export-surface guard below).
  it('attributes each figure to its own source when given a list', () => {
    render(
      <SourcedField
        label="Speakers" testId="field-speakers"
        source={[{ source: url, figure: '9,600' }, { source: doc, figure: '300' }]}
      >
        9,600
      </SourcedField>,
    )
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const body = screen.getByTestId('source-body-field-speakers')
    expect(body.textContent).toContain('9,600')
    expect(body.textContent).toContain('https://example.org/x')
    expect(body.textContent).toContain('300')
    expect(body.textContent).toContain('data/REVIEW-QUEUE.md')
  })

  // "No source, no toggle" only means "this field structurally cannot have a
  // source" if a toggle is NEVER rendered empty. An empty list is no source.
  it('renders no disclosure for an empty list of sources', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={[]}>9,600</SourcedField>)
    expect(screen.queryByTestId('source-field-speakers')).toBeNull()
  })
})

// Fix round 1. `Field.aside` exists so a control can sit in a field without
// counting as its value; through `children` instead, `isEmpty` sees a
// non-empty node and a null-valued field silently loses its "not recorded".
// Comments saying "use aside" did not make that unreachable: a caller holding
// a disclosure component could still route it through `children` —
// `<Field testId="f">{null}<SourceDisclosure …/></Field>` renders a `<dd>`
// reading only "source". So the module exports NO way to build a disclosure.
// This is the guard on that door: re-exporting `SourceDisclosure` (or
// `SourceLine`) to make such a call site compile fails here.
describe('the SourcedField module surface', () => {
  it('exports nothing a caller could route through children instead of aside', () => {
    expect(Object.keys(sourcedFieldModule).sort()).toEqual(['default'])
  })
})
