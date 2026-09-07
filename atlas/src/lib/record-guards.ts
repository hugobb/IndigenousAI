import type { GlottologResolution, Language } from '../schema/index.js'

/** D8: a cover term gets a record with no centre, because Glottolog's
 *  family-level entries carry no coordinates and inventing one would place a
 *  43-language family at a single point. The record must then SAY it is a
 *  cover term: the language panel prints "not mapped" for a null centre, which
 *  is equally true of a language whose centre merely was not sourced, and the
 *  reader cannot tell those apart without the caveat.
 *
 *  Adjacent records are exempt: D6 gives them centre: null by rule, so the
 *  explanation belongs to the rule, not to each row. */
export function coverTermProblems(languages: readonly Language[]): string[] {
  return languages
    .filter((l) => l.tier === 'indigenous' && l.centre === null && l.caveat === null)
    .map((l) => `language ${l.id}: indigenous tier with no centre must carry a caveat saying why (spec D8)`)
}

/** Checks each record against `data/glottolog-resolution.yml` — the record of
 *  what Glottolog actually returned. Three things it catches that nothing else
 *  can: a glottocode nobody fetched, a FAMILY code sitting in a field that
 *  means "this language" (the schema's pattern matches both), and a centre
 *  that disagrees with the coordinates the fetch recorded. */
export function resolutionProblems(
  languages: readonly Language[],
  resolution: readonly GlottologResolution[],
): string[] {
  const byCode = new Map(resolution.map((r) => [r.glottocode, r]))
  const problems: string[] = []
  for (const l of languages) {
    if (l.glottocode === null) continue
    const r = byCode.get(l.glottocode)
    if (r === undefined) {
      problems.push(
        `language ${l.id}: glottocode "${l.glottocode}" appears in no row of ` +
          'data/glottolog-resolution.yml — every code must be one that was actually fetched (spec D9)',
      )
      continue
    }
    // FAMILY specifically, not "anything but language". Glottolog also returns
    // level: dialect — Inuinnaqtun (copp1244) and SENĆOŦEN (saan1246) both do —
    // and a dialect is the opposite problem from a family: it is MORE specific
    // than a language, not less, so its code identifies the lect precisely and
    // belongs in the record. Only a family code is the category error this
    // catches, because only a family stands in for languages it is not.
    if (r.level === 'family') {
      problems.push(
        `language ${l.id}: glottocode "${l.glottocode}" is Glottolog level "family", not a language — ` +
          'a cover term takes glottocode: null and a caveat instead (spec D8)',
      )
      // A family row's own latitude/longitude are always null (Glottolog
      // publishes no coordinate for a family). Falling through to the
      // coordinate check below would then compare a sourced centre against
      // `null, null` and emit a second, misleading "disagrees with null,
      // null" message on top of the real problem already reported above.
      continue
    }
    // Only a `sourced` centre claims to BE the fetched coordinate. An
    // `approximate` one says in the record that it is not — myaamia carries
    // 40, -90, a placeholder the maintainer knowingly kept — so demanding
    // equality there would refuse a record on the strength of a hedge it
    // already declares.
    if (l.centre !== null && l.centre.confidence === 'sourced'
        && (l.centre.lat !== r.latitude || l.centre.lon !== r.longitude)) {
      problems.push(
        `language ${l.id}: centre ${l.centre.lat}, ${l.centre.lon} disagrees with the fetched ` +
          `Glottolog coordinates ${r.latitude}, ${r.longitude} for "${l.glottocode}"`,
      )
    }
  }
  return problems
}
