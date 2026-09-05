import type { Language } from '../schema/index.js'
import { unmappedLanguages } from '../map/layers.js'

/** TWO cards, not one, and that is the whole point of this component's shape.
 *
 *  It used to be one card headed "What the map cannot show", which SP1b was
 *  right to put the workless group inside: back then `filteredOut` was the
 *  COMPLEMENT of `languages`, so a language in that group had been removed
 *  from the map and the heading described it exactly.
 *
 *  SP2a Task 1 inverted that. `noMatchingWork` is now a SUBSET of `languages`,
 *  and `App` hands the map `languageFields(selection.languages)` — so every
 *  language in the workless group with a centre IS drawn, at the same moment,
 *  on the same screen. At `?application=asr` the single card claimed the map
 *  could not show four languages, three of which it was drawing. Two correct
 *  decisions in two tasks; their combination was a card that contradicted the
 *  map beside it.
 *
 *  The two cards state two different KINDS of gap — "we cannot place it" and
 *  "no work covers it" — so a language named in both is read as two facts
 *  rather than as a duplicate entry in one list. Each card renders only when
 *  it has something to say: a headed card with nothing under it reads as a
 *  rendering bug, which is what `?region=arctic` used to show. */
export default function UnmappedList({
  languages, noMatchingWork, workFiltered, languageFiltered, onSelect,
}: {
  languages: Language[]
  /** A subset of `languages`, so a language may legitimately appear here AND
   *  in a location group. Both facts are true and both are stated. */
  noMatchingWork: Language[]
  workFiltered: boolean
  /** Whether a LANGUAGE facet narrowed this list at all. The hint used to say
   *  "these languages match your language filters" in every state; under a
   *  work filter alone the list is the whole atlas and no language filter
   *  exists, so the sentence credited a filter the reader never set. */
  languageFiltered: boolean
  onSelect: (id: string) => void
}): React.JSX.Element {
  const { notMapped, approximate } = unmappedLanguages(languages)
  const name = (l: Language): React.JSX.Element => (
    <button type="button" className="link-button" onClick={() => onSelect(l.id)}>
      {l.name}
    </button>
  )
  return (
    <>
      {(notMapped.length > 0 || approximate.length > 0) && (
        <section className="card rail-list" aria-label="Languages the map cannot show faithfully">
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
                    {name(l)}
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
                    {name(l)}
                    {l.caveat !== null && <p>{l.caveat}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      {noMatchingWork.length > 0 && (
        // Its own card, with no `section-label` above the heading: the heading
        // already states the claim and its count, and a label repeating it in
        // other words is the defect this review exists to catch.
        <section className="card rail-list" aria-label="Languages with no matching work">
          <div data-testid="group-no-matching-work">
            <h3>
              {workFiltered
                ? `Matches your filters, but no matching work (${noMatchingWork.length})`
                : `No work in the atlas for these languages (${noMatchingWork.length})`}
            </h3>
            <p className="hint">
              {workFiltered
                ? `${languageFiltered
                    ? 'These languages match your language filters.'
                    : 'These are every language in the atlas — no language filter is narrowing the list.'} No initiative in the current selection works on them — which is a finding, not an empty result.`
                : 'No initiative anywhere in this atlas names these languages. That is the coverage gap this map exists to show, not a result of your filters.'}
            </p>
            <ul>
              {noMatchingWork.map((l) => (
                <li key={l.id}>{name(l)}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
