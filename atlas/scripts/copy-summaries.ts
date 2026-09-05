import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Where a published summary lives on the deployed site. The SINGLE source of
 *  truth: `extract-papers.ts` imports this rather than building the string
 *  again, because two derivations that drift by one character turn every paper
 *  citation into a 404 that no other test can see. Shaped like
 *  `Method.doc_url`'s `/ml-techniques/<id>/` for the same reason. */
export function summaryRoute(id: string): string {
  return `/summaries/${id}/`
}

/** First markdown H1, which is the paper's real title — the filename is a slug
 *  and reads badly in an index of 92. */
function titleOf(markdown: string, fallback: string): string {
  const m = /^#\s+(.+)$/m.exec(markdown)
  return m?.[1]?.trim() ?? fallback
}

/** Copies `litterature_review/summaries/*.md` into the MkDocs tree and writes
 *  their index. Returns the ids copied, sorted.
 *
 *  The destination is emptied first: a summary deleted upstream would otherwise
 *  keep being served, and the index would stop describing the directory beside
 *  it. */
export function copySummaries(from: string, to: string): string[] {
  const ids = readdirSync(from)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort()

  if (ids.length === 0) {
    throw new Error(
      `copy-summaries: no summaries found in ${resolve(from)}. Copying nothing ` +
        'would build a site where every paper citation 404s, so this fails loudly ' +
        'rather than quietly succeeding.',
    )
  }

  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })

  const rows: string[] = []
  for (const id of ids) {
    const body = readFileSync(join(from, `${id}.md`), 'utf8')
    copyFileSync(join(from, `${id}.md`), join(to, `${id}.md`))
    rows.push(`- [${titleOf(body, id)}](${id}.md)`)
  }

  // GENERATED PROSE ON A PUBLISHED PAGE, and nothing regenerates it against the
  // facts — so it may only say what is measurable from the directory it
  // describes. The version this replaces said "Each is cited from the atlas,
  // and each links to its own source". Both were false and both shipped:
  // 2 of 92 papers are named by any initiative record, and 77 of 92 summaries
  // contain no URL at all. The count below is the one number safe to state,
  // because it is `ids.length` rather than a number somebody typed.
  // `tests/copy-summaries.test.ts` holds both halves: that the bibliographic
  // claim is true of all 92 sources, and that these two claims stay gone.
  writeFileSync(
    join(to, 'index.md'),
    '# Paper summaries\n\n' +
      `Structured summaries of the ${ids.length} papers behind this guide and the ` +
      "atlas. Each opens with the paper's own bibliographic details — authors, " +
      'year and venue, or a full citation line.\n\n' +
      'These are reference material rather than a reading path, which is why they ' +
      'appear here as one list instead of in the sidebar.\n\n' +
      rows.join('\n') + '\n',
  )

  return ids
}

if (import.meta.filename === process.argv[1]) {
  const root = resolve(import.meta.dirname, '../..')
  const ids = copySummaries(
    join(root, 'litterature_review/summaries'),
    join(root, 'docs/docs/summaries'),
  )
  console.log(`copy-summaries: ${ids.length} summaries`)
}
