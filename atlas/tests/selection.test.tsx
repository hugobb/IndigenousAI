// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
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
})
