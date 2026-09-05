// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/components/App.js'

// A fake MapLibre rich enough to replay one real interaction: fire 'load', then
// fire the click handler the hook registered on the initiative layer. That is
// the only way to open an InitiativePanel under jsdom, and without it the
// interaction between the two entry points cannot be tested at all.
const { FakeMap, instances } = vi.hoisted(() => {
  class FakeMap {
    handlers: Record<string, (e?: unknown) => void> = {}
    on(event: string, a: unknown, b?: unknown): void {
      if (typeof b === 'function') this.handlers[`${event}:${String(a)}`] = b as () => void
      else if (typeof a === 'function') this.handlers[event] = a as () => void
    }
    // Real MapLibre's `once` fires the handler at most one time and then
    // detaches it; nothing in this suite fires 'idle', so the fake only
    // needs to accept the registration without throwing.
    once(event: string, handler: () => void): void {
      this.handlers[event] = handler
    }
    addSource(): void {}
    addLayer(): void {}
    getSource(): { setData: () => void } {
      return { setData: () => {} }
    }
    setFilter(): void {}
    remove(): void {}
  }
  return { FakeMap, instances: [] as InstanceType<typeof FakeMap>[] }
})

vi.mock('maplibre-gl', () => ({
  default: {
    Map: class extends FakeMap {
      constructor() {
        super()
        instances.push(this)
      }
    },
  },
}))

afterEach(() => {
  cleanup()
  instances.length = 0
})

const clickInitiativePin = (id: string): void => {
  const map = instances[0]
  expect(map).toBeDefined()
  act(() => {
    map!.handlers['load']?.()
    map!.handlers['click:initiative-site']?.({ features: [{ properties: { id } }] })
  })
}

describe('selection', () => {
  it('opens an initiative panel from a pin click', () => {
    render(<App />)
    clickInitiativePin('fixture-ongoing')
    expect(screen.getByLabelText('Initiative: Ongoing Initiative')).toBeDefined()
  })

  it('closes the open initiative when a language is chosen from the unmapped list', () => {
    // The regression: UnmappedList was handed the bare `setLanguageId`, so the
    // list opened a language panel BESIDE a stale initiative panel — two
    // unrelated records presented as one reading. The map path cleared it; the
    // list path did not.
    render(<App />)
    clickInitiativePin('fixture-ongoing')
    act(() => {
      screen.getByRole('button', { name: 'Unmapped Language' }).click()
    })
    expect(screen.getByLabelText('Language: Unmapped Language')).toBeDefined()
    expect(screen.queryByLabelText('Initiative: Ongoing Initiative')).toBeNull()
  })

  // Seam review (Task 8), routed observation from Task 4. A disclosure opened
  // on one record stayed open when the reader moved to another — and only for
  // SOME fields, because a `SourcedField` whose new record has no source
  // unmounts and loses its state while its neighbours keep theirs. Provenance
  // the reader did not ask to see, on a record they did not open it for, in a
  // set that varies by which other fields happen to be sourced.
  it('opens the next record with its disclosures closed, not with the last one\'s', () => {
    window.history.replaceState({}, '', '/?lang=fixture-conflict')
    render(<App />)
    const toggle = screen.getByTestId('source-field-centre')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(screen.getByTestId('source-field-centre').getAttribute('aria-expanded')).toBe('true')

    act(() => {
      // Named twice in the rail — once as approximately located, once as
      // workless — which is the point of the two cards. Either opens it.
      screen.getAllByRole('button', { name: 'Approximate Centre Language' })[0]!.click()
    })
    expect(screen.getByLabelText('Language: Approximate Centre Language')).toBeDefined()
    expect(screen.getByTestId('source-field-centre').getAttribute('aria-expanded')).toBe('false')
    // And the body is genuinely unmounted, not merely hidden.
    expect(screen.getByTestId('source-body-field-centre').textContent).toBe('')
  })
})
