import type { Language } from '../schema/index.js'
import { unmappedLanguages } from '../map/layers.js'

/** States the coverage gap instead of hiding it: without this, a language with
 *  no centre is simply invisible and a reader cannot tell "we found nothing"
 *  from "there is nothing". */
export default function UnmappedList({
  languages, onSelect,
}: { languages: Language[]; onSelect: (id: string) => void }): React.JSX.Element {
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
    </section>
  )
}
