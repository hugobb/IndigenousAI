import { defineConfig } from '@playwright/test'

/** Drives `vite dev`, never `vite preview`: a built dist/ has
 *  __ATLAS_ALLOW_FIXTURE__ false and throws without a generated bundle, so the
 *  dev server is the only surface where this app has records to render. */
export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: false,
  use: { baseURL: 'http://localhost:5174' },
  webServer: {
    command: 'pnpm dev --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
