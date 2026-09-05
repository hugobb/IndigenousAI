// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Field from '../src/components/Field.js'

afterEach(() => cleanup())

// `LanguagePanel`/`InitiativePanel` always pre-join arrays into strings (or
// pass `null`) before handing children to `Field`, so none of their tests in
// `panels.test.tsx` ever exercise the raw-empty-array branch of `Field`
// itself. That branch is exactly the one the isEmpty rule calls out as easy
// to miss, so it gets its own direct test here rather than staying
// unverified.
describe('Field', () => {
  it('renders "not recorded" for null children', () => {
    render(<Field label="L" testId="f">{null}</Field>)
    expect(within(screen.getByTestId('f')).getByText(/not recorded/i)).toBeDefined()
  })

  it('renders "not recorded" for undefined children', () => {
    render(<Field label="L" testId="f">{undefined}</Field>)
    expect(within(screen.getByTestId('f')).getByText(/not recorded/i)).toBeDefined()
  })

  it('renders "not recorded" for an empty string', () => {
    render(<Field label="L" testId="f">{''}</Field>)
    expect(within(screen.getByTestId('f')).getByText(/not recorded/i)).toBeDefined()
  })

  it('renders "not recorded" for an empty array', () => {
    render(<Field label="L" testId="f">{[]}</Field>)
    expect(within(screen.getByTestId('f')).getByText(/not recorded/i)).toBeDefined()
  })

  // `aside` exists precisely so a control can sit in a field WITHOUT counting
  // as the field's value. Folded into `children` it would make every field
  // carrying a control look non-empty, and a null value would silently lose
  // its "not recorded" — the one thing this component exists to guarantee.
  it('does not let an aside stand in for a missing value', () => {
    render(<Field label="L" testId="f" aside={<button type="button">source</button>}>{null}</Field>)
    const row = screen.getByTestId('f')
    expect(within(row).getByText(/not recorded/i)).toBeDefined()
    expect(within(row).getByRole('button')).toBeDefined()
  })

  it('renders the aside after the value, inside the same dd', () => {
    render(<Field label="L" testId="f" aside={<button type="button">source</button>}>Cree</Field>)
    const dd = screen.getByTestId('f').querySelector('dd')
    expect(dd?.textContent).toBe('Creesource')
  })

  it('renders real content as-is, not as "not recorded"', () => {
    render(<Field label="L" testId="f">Cree</Field>)
    const row = screen.getByTestId('f')
    expect(within(row).getByText('Cree')).toBeDefined()
    expect(within(row).queryByText(/not recorded/i)).toBeNull()
  })
})
