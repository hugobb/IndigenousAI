import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Tests do not go through `vite build`, so the flag `vite.config.ts` defines
  // has no value here. Tests are not a production build: the fixture is what
  // they exercise.
  define: { __ATLAS_ALLOW_FIXTURE__: 'true' },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // `pnpm test` stays offline and fast. tests/deploy-output.test.ts shells out
    // to scripts/build-site.sh, which runs `pip install` and `pnpm install`, so
    // it is excluded here and run only by `pnpm test:site` (which CI's site job
    // calls). That script needs its own config, vitest.site.config.ts: a
    // command-line `--exclude` ADDS to this list rather than replacing it, so
    // no flag can reach a file excluded here.
    exclude: [...configDefaults.exclude, 'tests/deploy-output.test.ts'],
    environment: 'node',
    globals: false,
  },
})
