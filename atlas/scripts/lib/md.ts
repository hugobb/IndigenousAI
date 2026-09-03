const ENTITIES: Record<string, string> = {
  '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
}

/** The technique docs still carry HTML entities escaped for Docusaurus MDX
 *  (e.g. `&lt;1K sentences`). mkdocs does not need them; the parser must not
 *  be fooled by them. */
export function decodeEntities(s: string): string {
  return s.replace(/&(?:lt|gt|amp|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
}

/** Lookup key for the data-regime table: entities decoded, unicode normalised,
 *  whitespace collapsed, trimmed, lowercased. Dashes are NOT normalised —
 *  en-dash and em-dash are meaningful in the source and kept verbatim. */
export function normaliseValue(s: string): string {
  return decodeEntities(s).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()
}
