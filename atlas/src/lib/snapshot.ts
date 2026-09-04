/** The masthead's snapshot line exists so someone citing a filtered view can
 *  name the data it came from. `bundle.generated` is an ISO instant —
 *  "2026-09-03T00:00:00.000Z" — and a machine timestamp with milliseconds and a
 *  trailing Z is not a thing anyone writes in a citation.
 *
 *  Rendered as a plain calendar date in UTC. UTC, not the reader's zone,
 *  because two readers must not disagree about which day a citation names; the
 *  bundle is stamped once, and the date it carries is the date it means.
 *
 *  An unparseable value is returned VERBATIM. The alternative is the string
 *  "Invalid Date" standing where the provenance should be, which is worse than
 *  showing the raw stamp: the raw stamp is at least still evidence. */
export function snapshotDate(generated: string): string {
  const t = Date.parse(generated)
  if (Number.isNaN(t)) return generated
  const d = new Date(t)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
