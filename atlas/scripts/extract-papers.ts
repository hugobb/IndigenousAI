import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PaperSchema, type Paper } from '../src/schema/paper.js'
import { summaryRoute } from './copy-summaries.js'
import { decodeEntities } from './lib/md.js'

/** `| 1 | [Title](summaries/slug.md) | Authors | 2025 | a, b |` */
const ROW = /^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(summaries\/([^)]+?)\.md\)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/

/** Anything that LOOKS like a numbered index row. Deliberately loose: it is
 *  the denominator against which `ROW`'s yield is checked, so a row `ROW`
 *  cannot parse — a `]` in a title, a `|` inside the themes cell — is counted
 *  here and named in the error rather than dropped in silence. */
const CANDIDATE_ROW = /^\|\s*(\d+)\s*\|/

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
  let candidates = 0
  const unparsed: string[] = []

  for (const line of overview.split('\n')) {
    const candidate = line.match(CANDIDATE_ROW)
    if (candidate) candidates += 1

    const m = line.match(ROW)
    if (!m) {
      if (candidate) unparsed.push(candidate[1] ?? '?')
      continue
    }
    const [, , title, id, authors, year, themes] = m
    if (!id || !title || !authors || !year) {
      unparsed.push(candidate?.[1] ?? '?')
      continue
    }
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
        // `summaryRoute`, never the string again: `copy-summaries.ts` decides
        // where a summary is PUBLISHED, and a second derivation that drifts by
        // one character turns every citation in the atlas into a 404 that
        // nothing else in the system can see.
        summary_url: summaryRoute(id),
      }),
    )
  }

  // Every numbered row in the index table must become a Paper. A row that
  // falls through silently loses a paper from the atlas and nobody finds out.
  if (out.length !== candidates) {
    throw new Error(
      `OVERVIEW.md: ${candidates} index row(s) but only ${out.length} parsed — ` +
        `row(s) ${unparsed.join(', ')} did not match the expected ` +
        '`| n | [Title](summaries/id.md) | Authors | Year | Themes |` shape',
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
