import type { LocationConfidence } from '../schema/index.js'

/** How the map should treat a coordinate. `absent` means there is no
 *  coordinate at all — the record still exists and is still listed, it just
 *  cannot be drawn. */
export type Sited = 'sourced' | 'approximate' | 'absent'

/** Reads the schema field ONLY. Never inspect `caveat` to decide this: a
 *  caveat may be about speaker counts rather than location, and treating one
 *  as the other would mark a well-sited pin untrustworthy. */
export function locationConfidence(
  loc: { confidence: LocationConfidence } | null | undefined,
): Sited {
  if (loc === null || loc === undefined) return 'absent'
  return loc.confidence
}
