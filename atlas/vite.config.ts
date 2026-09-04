import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const BUNDLE = fileURLToPath(new URL('./src/data/atlas.json', import.meta.url))

/** `command` is Vite's own build-vs-serve discriminator: it is 'serve' only for
 *  `vite dev`/`vite preview`'s dev server and 'build' for every `vite build`,
 *  including `--mode development` and any ambient NODE_ENV. `import.meta.env.PROD`
 *  follows NODE_ENV and so could be flipped from the outside — which is exactly
 *  how an invented fixture became a deployable `dist/`. Nothing in the
 *  environment can flip `command`. */
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'atlas-require-real-bundle',
      buildStart(): void {
        if (command !== 'build') return
        // Escape hatch for CI compile-only verification and type-checking, where
        // the point is to prove the app compiles, not to ship it. Never set this
        // for a build whose output is deployed.
        if (process.env['ATLAS_ALLOW_NO_BUNDLE'] === '1') return
        if (existsSync(BUNDLE)) return
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
}))
