import type { Language } from '../schema/index.js'
import { unmappedLanguages } from '../map/layers.js'

/** States the coverage gap instead of hiding it: without this, a language with
 *  no centre is simply invisible and a reader cannot tell "we found nothing"
 *  from "there is nothing". */
export default function UnmappedList({
  languages, noMatchingWork, workFiltered, onSelect,
}: {
  languages: Language[]
  /** A subset of `languages`, so a language may legitimately appear here AND
   *  in a location group. Both facts are true and both are stated. */
  noMatchingWork: Language[]
  workFiltered: boolean
  onSelect: (id: string) => void
}): React.JSX.Element {
  const { notMapped, approximate } = unmappedLanguages(languages)
  return (
    <section className="card unmapped" aria-label="Languages the map cannot show faithfully">
      <p className="section-label">What the map cannot show</p>
      {/* An empty group is suppressed rather than headed with a zero. At
       *  `?region=africa&application=asr` both of these were empty, so two
       *  zero-count headings stacked above the one group that carried the
       *  finding — noise that buries exactly what the reader came for. */}
      {notMapped.length > 0 && (
        <div data-testid="group-not-mapped">
          <h3>Not mapped ({notMapped.length})</h3>
          <ul>
            {notMapped.map((l) => (
              <li key={l.id}>
                <button type="button" className="link-button" onClick={() => onSelect(l.id)}>
                  {l.name}
                </button>
                {l.tier === 'adjacent' && <span>adjacent tier, never mapped</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {approximate.length > 0 && (
        <div data-testid="group-approximate">
          <h3>Approximate location ({approximate.length})</h3>
          <ul>
            {approximate.map((l) => (
              <li key={l.id}>
                <button type="button" className="link-button" onClick={() => onSelect(l.id)}>
                  {l.name}
                </button>
                {l.caveat !== null && <p>{l.caveat}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {noMatchingWork.length > 0 && (
        <div data-testid="group-no-matching-work">
          <h3>
            {workFiltered
              ? `Matches your filters, but no matching work (${noMatchingWork.length})`
              : `No work in the atlas for these languages (${noMatchingWork.length})`}
          </h3>
          <p className="hint">
            {workFiltered
              ? 'These languages match your language filters. No initiative in the current selection works on them — which is a finding, not an empty result.'
              : 'No initiative anywhere in this atlas names these languages. That is the coverage gap this map exists to show, not a result of your filters.'}
          </p>
          <ul>
            {noMatchingWork.map((l) => (
              <li key={l.id}>
                <button type="button" className="link-button" onClick={() => onSelect(l.id)}>
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
