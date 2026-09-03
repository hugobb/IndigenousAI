import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PaperSchema, type Paper } from '../src/schema/paper.js'
import { decodeEntities } from './lib/md.js'

/** `| 1 | [Title](summaries/slug.md) | Authors | 2025 | a, b |` */
const ROW = /^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(summaries\/([^)]+?)\.md\)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/

function readVenue(reviewRoot: string, id: string): string | null {
  const path = join(reviewRoot, 'summaries', `${id}.md`)
  if (!existsSync(path)) return null
  const head = readFileSync(path, 'utf8').split(/^---$/m)[0] ?? ''
  const m = head.match(/^\*\*Venue:\*\*\s*(.+)$/m)
  // The 5 `**Citation:**`-form summaries fall through to null deliberately.
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

export function extractPapers(reviewRoot: string): Paper[] {
  const overview = readFileSync(join(reviewRoot, 'OVERVIEW.md'), 'utf8')
  const out: Paper[] = []
  const seen = new Set<string>()

  for (const line of overview.split('\n')) {
    const m = line.match(ROW)
    if (!m) continue
    const [, , title, id, authors, year, themes] = m
    if (!id || !title || !authors || !year) continue
    if (seen.has(id)) throw new Error(`OVERVIEW.md: duplicate paper id ${id}`)
    seen.add(id)

    out.push(
      PaperSchema.parse({
        id,
        title: decodeEntities(title.trim()),
        authors: authors.trim(),
        year: Number(year.trim()),
        venue: readVenue(reviewRoot, id),
        themes: (themes ?? '').split(',').map((t) => t.trim()).filter(Boolean),
        summary_url: `litterature_review/summaries/${id}.md`,
      }),
    )
  }
  return out
}

const OUT = fileURLToPath(new URL('../data/derived/papers.json', import.meta.url))
const REAL_ROOT = fileURLToPath(new URL('../../litterature_review', import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const papers = extractPapers(REAL_ROOT)
  mkdirSync(new URL('../data/derived/', import.meta.url), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(papers, null, 2)}\n`)
  console.log(`extract-papers: ${papers.length} papers -> data/derived/papers.json`)
}
