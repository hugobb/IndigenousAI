import type { Language } from '../schema/index.js'
import { unmappedLanguages } from '../map/layers.js'

/** States the coverage gap instead of hiding it: without this, a language with
 *  no centre is simply invisible and a reader cannot tell "we found nothing"
 *  from "there is nothing". */
export default function UnmappedList({
  languages, filteredOut, onSelect,
}: {
  languages: Language[]
  filteredOut: Language[]
  onSelect: (id: string) => void
}): React.JSX.Element {
  const { notMapped, approximate } = unmappedLanguages(languages)
  return (
    <section className="card unmapped" aria-label="Languages the map cannot show faithfully">
      <p className="section-label">What the map cannot show</p>
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
      {filteredOut.length > 0 && (
        <div data-testid="group-filtered-out">
          <h3>Matches your filters, but no matching work ({filteredOut.length})</h3>
          <p className="hint">
            These languages match your language filters. No initiative in the current
            selection works on them — which is a finding, not an empty result.
          </p>
          <ul>
            {filteredOut.map((l) => (
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
