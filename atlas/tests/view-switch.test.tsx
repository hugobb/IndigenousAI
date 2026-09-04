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

  it('reports the chosen view', () => {
    const onChange = vi.fn()
    render(<ViewSwitch view="map" counts={{ initiatives: 4, languages: 5 }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /initiatives/i }))
    expect(onChange).toHaveBeenCalledWith('initiatives')
  })
})
