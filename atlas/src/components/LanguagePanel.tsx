import type { Initiative, Language } from '../schema/index.js'
import Field from './Field.js'

export default function LanguagePanel({
  language, initiatives, workFiltered,
}: {
  language: Language
  initiatives: Initiative[]
  /** `selection.workFiltered` from the caller. An empty `initiatives` list
   *  here is a filter result only when a work filter is active — with none
   *  active it is the same dataset fact the rail and the table state for
   *  this language, and the two claims must not share one sentence (fix
   *  round 1, found while auditing TableView for the same defect). */
  workFiltered: boolean
}): React.JSX.Element {
  const s = language.speakers
  return (
    <aside className="card panel" aria-label={`Language: ${language.name}`}>
      <h2>{language.name}</h2>
      <dl>
        <Field label="Also known as" testId="field-aka">{language.also_known_as.join(', ')}</Field>
        <Field label="Family" testId="field-family">{language.family}</Field>
        <Field label="Typology" testId="field-typology">{language.typology.join(', ')}</Field>
        <Field label="Endangerment" testId="field-endangerment">{language.endangerment?.status}</Field>
        <Field label="Speakers" testId="field-speakers">
          {s === null ? null : (
            <>
              <span>{s.value.toLocaleString('en')}</span>
              {s.conflicts.length > 0 && (
                <p>
                  Sources disagree. Also reported:{' '}
                  {s.conflicts.map((c) => c.value.toLocaleString('en')).join(', ')}
                </p>
              )}
            </>
          )}
        </Field>
        {/* `not mapped` is a VALUE, not a null: we know this language has no
            cited centre — the same fact the table's Location column and the
            rail's "Not mapped" heading state. Routing it through `Field`'s
            null branch printed "not recorded", which claims we do not know
            it, and left three surfaces disagreeing about one fact. */}
        <Field label="Centre" testId="field-centre">
          {language.centre === null ? <span>not mapped</span> : (
            <>
              {language.centre.lat.toFixed(2)}, {language.centre.lon.toFixed(2)}
              {language.centre.confidence === 'approximate' && <strong> — approximate</strong>}
            </>
          )}
        </Field>
        <Field label="Note" testId="field-caveat">{language.caveat}</Field>
        {/* Scoped to I1, not to the record — App passes the initiatives that
            survived every current filter. An empty list here is therefore a
            filter result, and routing it through `Field`'s null branch printed
            "not recorded", which claims we do not know. The table renders the
            same fact as a `0` under a caption that says what 0 means; this
            surface sat beside it saying something stronger and false. The
            label carries the scope, exactly as the "Matching work" header
            does. */}
        <Field label="Matching initiatives" testId="field-initiatives">
          {initiatives.length === 0 ? (
            <span className="hint">
              {workFiltered
                ? 'None matching the current filters — not a claim that no work exists.'
                : 'The atlas records no initiative for this language — not a result of the current filters.'}
            </span>
          ) : (
            <ul>{initiatives.map((i) => <li key={i.id}>{i.name}</li>)}</ul>
          )}
        </Field>
      </dl>
    </aside>
  )
}
