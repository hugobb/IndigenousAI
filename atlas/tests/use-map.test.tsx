// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PointCollection } from '../src/map/layers.js'
import { useMap, type MapData, type MapHandlers } from '../src/map/useMap.js'

// `vi.mock` factories are hoisted above imports, so the fake class must be
// created through `vi.hoisted` rather than declared as a plain top-level
// `class` — referencing it directly from the factory would hit the TDZ.
const { FakeMap, instances } = vi.hoisted(() => {
  class FakeMap {
    options: unknown
    handlers: Record<string, (e?: unknown) => void> = {}
    sources: Record<string, { data: unknown; setData: (d: unknown) => void }> = {}
    filters: Record<string, unknown> = {}
    removeCalls = 0

    constructor(options: unknown) {
      this.options = options
    }

    on(event: string, a: unknown, b?: unknown): void {
      if (typeof b === 'function') {
        this.handlers[`${event}:${String(a)}`] = b as (e?: unknown) => void
      } else if (typeof a === 'function') {
        this.handlers[event] = a as (e?: unknown) => void
      }
    }

    addSource(id: string, src: { data: unknown }): void {
      const setData = vi.fn((d: unknown) => {
        const entry = this.sources[id]
        if (entry) entry.data = d
      })
      this.sources[id] = { data: src.data, setData }
    }

    getSource(id: string): { data: unknown; setData: (d: unknown) => void } | undefined {
      return this.sources[id]
    }

    addLayer(): void {}

    setFilter(layerId: string, filter: unknown): void {
      this.filters[layerId] = filter
    }

    isStyleLoaded(): boolean {
      return true
    }

    remove(): void {
      this.removeCalls += 1
    }
  }

  return { FakeMap, instances: [] as InstanceType<typeof FakeMap>[] }
})

vi.mock('maplibre-gl', () => ({
  default: {
    Map: class extends FakeMap {
      constructor(options: unknown) {
        super(options)
        instances.push(this)
      }
    },
  },
}))

afterEach(() => {
  cleanup()
  instances.length = 0
})

const languages: PointCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'cree',
      properties: { id: 'cree', name: 'Cree', tier: 'core', confidence: 'sourced' },
      geometry: { type: 'Point', coordinates: [-90, 50] },
    },
  ],
}

const initiatives: PointCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'masakhane',
      properties: {
        id: 'masakhane',
        name: 'Masakhane',
        tier: 'core',
        kind: 'community',
        confidence: 'sourced',
        started: '2018',
        ended: null,
      },
      geometry: { type: 'Point', coordinates: [20, 5] },
    },
  ],
}

function Harness(props: { data: MapData; handlers: MapHandlers }): React.JSX.Element {
  const container = useRef<HTMLDivElement | null>(null)
  useMap(container, props.data, props.handlers)
  return <div ref={container} />
}

const handlers: MapHandlers = {
  onSelectLanguage: vi.fn(),
  onSelectInitiative: vi.fn(),
}

describe('useMap', () => {
  it('does not drop the first data population when the style loads after mount', () => {
    const data: MapData = { languages, initiatives, selectedLanguageId: null }
    render(<Harness data={data} handlers={handlers} />)

    const instance = instances[0]
    expect(instance).toBeDefined()

    // Before 'load' fires, the style isn't ready: no sources exist yet, so
    // nothing has been populated with the real data.
    expect(instance!.sources[Object.keys(instance!.sources)[0] ?? '']).toBeUndefined()

    // Fire the load callback the hook registered — this is what a real
    // MapLibre instance does asynchronously once the style/tiles resolve.
    instance!.handlers['load']?.()

    // The regression: without re-syncing inside 'load', the sources stay at
    // their initial EMPTY value forever, since the data effect already ran
    // and won't run again for the same `data` identity.
    const languageSource = instance!.getSource('language-fields')
    const initiativeSource = instance!.getSource('initiative-sites')
    expect(languageSource?.setData).toHaveBeenCalledWith(languages)
    expect(initiativeSource?.setData).toHaveBeenCalledWith(initiatives)
  })

  it('removes the map instance on unmount', () => {
    const data: MapData = { languages, initiatives, selectedLanguageId: null }
    const { unmount } = render(<Harness data={data} handlers={handlers} />)
    const instance = instances[0]
    instance!.handlers['load']?.()

    unmount()

    expect(instance!.removeCalls).toBe(1)
  })
})
