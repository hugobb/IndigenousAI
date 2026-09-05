import { defineConfig } from '@playwright/test'

/** Drives `vite dev`, never `vite preview`: a built dist/ has
 *  __ATLAS_ALLOW_FIXTURE__ false and throws without a generated bundle, so the
 *  dev server is the only surface where this app has records to render. */
export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: false,
  // `vite.config.ts` sets `base: '/atlas/'` — the app is served under /atlas/ on
  // the deployed origin and, identically, by `vite dev`. The origin root is a
  // 404 there, so both the readiness probe and every `page.goto` below name the
  // real path the app has rather than the one it used to have.
  use: { baseURL: 'http://localhost:5174' },
  webServer: {
    command: 'pnpm dev --port 5174 --strictPort',
    url: 'http://localhost:5174/atlas/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
