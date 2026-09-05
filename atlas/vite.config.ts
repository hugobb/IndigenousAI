import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const BUNDLE = fileURLToPath(new URL('./src/data/atlas.json', import.meta.url))

/** `command` is Vite's own build-vs-serve discriminator: it is 'serve' only for
 *  `vite dev`/`vite preview`'s dev server and 'build' for every `vite build`,
 *  including `--mode development` and any ambient NODE_ENV. `import.meta.env.PROD`
 *  follows NODE_ENV and so could be flipped from the outside — which is exactly
 *  how an invented fixture became a deployable `dist/`. Nothing in the
 *  environment can flip `command`.
 *
 *  `vite preview` was checked and is not a hole: it does report
 *  `command: 'serve'`, but it only serves the already-built static files in
 *  `dist/` and never re-runs `define`, so what it shows is whatever
 *  `__ATLAS_ALLOW_FIXTURE__: false` was baked into the bundle at BUILD time.
 *  The fixture cannot re-enter through it. */
export default defineConfig(({ command }) => {
  // Resolved from the real config rather than assumed to be ./dist, so a build
  // run with `--outDir` (tests/build-artifact.test.ts does exactly that) cannot
  // make the gate below delete somebody else's directory.
  let outDir = fileURLToPath(new URL('./dist', import.meta.url))

  return {
    plugins: [
      react(),
      {
        name: 'atlas-require-real-bundle',
        configResolved(config: { root: string; build: { outDir: string } }): void {
          outDir = resolve(config.root, config.build.outDir)
        },
        buildStart(): void {
          if (command !== 'build') return
          // Escape hatch for CI compile-only verification and type-checking, where
          // the point is to prove the app compiles, not to ship it. Never set this
          // for a build whose output is deployed.
          if (process.env['ATLAS_ALLOW_NO_BUNDLE'] === '1') return
          if (existsSync(BUNDLE)) return
          // Vite empties `outDir` when it writes output, not before `buildStart`,
          // so throwing here leaves a `dist/` from an earlier successful compile
          // sitting on disk. It is gitignored, so this is a local and CI-cache
          // risk rather than a repo one — but a deploy step that ignores exit
          // codes would happily upload that stale artifact, which is the one
          // outcome this gate exists to prevent. A build that must not ship
          // leaves nothing behind that could be shipped.
          rmSync(outDir, { recursive: true, force: true })
          throw new Error(
            'atlas: refusing to build without src/data/atlas.json.\n' +
              'Run `pnpm build:data` to generate it. That command exits non-zero while any\n' +
              'record is still `status: draft`, which is the point: only human-reviewed\n' +
              'records may ship. Set ATLAS_ALLOW_NO_BUNDLE=1 only to verify that the app\n' +
              'compiles — the resulting dist/ must never be deployed.',
          )
        },
      },
    ],
    define: { __ATLAS_ALLOW_FIXTURE__: JSON.stringify(command === 'serve') },
    build: { outDir: 'dist' },
    // Served from /atlas/ on the deployed origin (spec D1): one project, one
    // build, one origin, so the atlas's root-relative links INTO the guide
    // (`/ml-techniques/<id>/`, and after Task 5 `/summaries/<id>/`) resolve by
    // construction rather than by a rewrite rule that fails as a silent 404.
    base: '/atlas/',
  }
})
