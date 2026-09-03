import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MethodSchema, type Method } from '../src/schema/method.js'
import { resolveDataRegime } from './lib/data-regime.js'
import { decodeEntities } from './lib/md.js'

const SUBDIRS = [
  { dir: 'ml-techniques', category: 'ml' as const },
  { dir: 'process-techniques', category: 'process' as const },
]

/** `**Key:** value` on its own line, before the first `##` heading. */
function readHeaderField(body: string, key: string): string | null {
  const head = body.split(/^## /m)[0] ?? body
  const m = head.match(new RegExp(`^\\*\\*${key}:\\*\\*\\s*(.+)$`, 'm'))
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

function readTitle(body: string): string | null {
  const m = body.match(/^#\s+(.+)$/m)
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

export function extractMethods(techniquesRoot: string): Method[] {
  const out: Method[] = []
  for (const { dir, category } of SUBDIRS) {
    let files: string[]
    try {
      files = readdirSync(join(techniquesRoot, dir)).filter((f) => f.endsWith('.md'))
    } catch {
      continue
    }
    for (const file of files.sort()) {
      if (file === 'index.md') continue
      const path = join(techniquesRoot, dir, file)
      const body = readFileSync(path, 'utf8')

      // An index or stub page has no Category line. Skip rather than fail:
      // only docs that declare themselves techniques are techniques.
      if (readHeaderField(body, 'Category') === null) continue

      const id = basename(file, '.md')
      const name = readTitle(body)
      if (name === null) throw new Error(`${path}: no H1 title`)

      const note = readHeaderField(body, 'Data Regime')
      out.push(
        MethodSchema.parse({
          id,
          name,
          category,
          data_regime: resolveDataRegime(note),
          data_regime_note: note,
          applicable_languages: readHeaderField(body, 'Applicable Languages'),
          doc_url: `/${dir}/${id}/`,
        }),
      )
    }
  }
  return out
}

const OUT = fileURLToPath(new URL('../data/derived/methods.json', import.meta.url))
const REAL_ROOT = fileURLToPath(new URL('../../docs/docs', import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const methods = extractMethods(REAL_ROOT)
  mkdirSync(new URL('../data/derived/', import.meta.url), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(methods, null, 2)}\n`)
  console.log(`extract-methods: ${methods.length} methods -> data/derived/methods.json`)
}
