import { configDefaults, defineConfig } from 'vitest/config'

/** The config `pnpm test:site` runs, and nothing else.
 *
 *  tests/deploy-output.test.ts is excluded from vitest.config.ts so `pnpm test`
 *  stays offline and fast — it shells out to scripts/build-site.sh, which runs
 *  `pip install` and `pnpm install`. A command-line `--exclude` cannot reach it
 *  back: in vitest 2 the flag ADDS to the config's exclude list rather than
 *  replacing it, so `vitest run --exclude … tests/deploy-output.test.ts` reports
 *  "No test files found". Hence a second config rather than a flag.
 *
 *  Standalone rather than merged from vitest.config.ts on purpose: `mergeConfig`
 *  concatenates arrays, so the exclusion would follow it here and this file
 *  would find nothing to run either. */
export default defineConfig({
  test: {
    include: ['tests/deploy-output.test.ts'],
    exclude: [...configDefaults.exclude],
    environment: 'node',
    globals: false,
  },
})
