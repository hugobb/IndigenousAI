// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import App from '../src/components/App.js'

// App now mounts MapView, which imports the real `maplibre-gl`. That module
// has browser-only side effects at import time (it calls
// `window.URL.createObjectURL` to set up its worker) and its `Map` needs a
// real WebGL context to construct — neither exists under jsdom. This is a
// smoke test for the heading only, so a minimal fake (as `useMap.test.tsx`
// already does for the same reason) is enough: nothing here ever fires the
// 'load' handler, so none of the map's real behaviour needs to work.
vi.mock('maplibre-gl', () => ({
  default: {
    Map: class {
      on(): void {}
      remove(): void {}
    },
  },
}))

afterEach(() => cleanup())

describe('App', () => {
  it('renders the atlas heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /atlas of indigenous language nlp/i })).toBeDefined()
  })
})
