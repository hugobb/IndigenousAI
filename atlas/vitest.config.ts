import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Tests do not go through `vite build`, so the flag `vite.config.ts` defines
  // has no value here. Tests are not a production build: the fixture is what
  // they exercise.
  define: { __ATLAS_ALLOW_FIXTURE__: 'true' },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    globals: false,
  },
})
