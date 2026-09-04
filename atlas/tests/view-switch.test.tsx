// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ViewSwitch from '../src/components/ViewSwitch.js'

afterEach(() => cleanup())

describe('ViewSwitch', () => {
  it('offers all three views and marks the current one', () => {
    render(<ViewSwitch view="languages" counts={{ initiatives: 4, languages: 5 }} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /^map$/i }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: /languages \(5\)/i }).getAttribute('aria-pressed')).toBe('true')
  })

  it('shows the row count each table would hold', () => {
    render(<ViewSwitch view="map" counts={{ initiatives: 4, languages: 5 }} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /initiatives \(4\)/i })).toBeDefined()
  })

  // Important 2 (review round 1, applies verbatim from the brief here too):
  // clicking one button and asserting that button's view lets `onChange` be
  // implemented as a constant `'initiatives'` and still pass. Click a second,
  // different button and assert that call distinctly.
  it('reports the chosen view', () => {
    const onChange = vi.fn()
    render(<ViewSwitch view="map" counts={{ initiatives: 4, languages: 5 }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /initiatives/i }))
    expect(onChange).toHaveBeenLastCalledWith('initiatives')
    fireEvent.click(screen.getByRole('button', { name: /^languages/i }))
    expect(onChange).toHaveBeenLastCalledWith('languages')
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
