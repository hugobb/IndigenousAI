import type { Initiative, Language } from '../schema/index.js'
import Field from './Field.js'
import PanelSection from './PanelSection.js'
import SourcedField from './SourcedField.js'

export default function LanguagePanel({
  language, initiatives, filtered,
}: {
  language: Language
  initiatives: Initiative[]
  /** Whether SOME active filter could plausibly explain an empty
   *  `initiatives` list here — not `selection.workFiltered` alone (fix round
   *  2: that under-reported it). `App` looks `language` up in the BUNDLE, so
   *  a language a facet excludes from L1 can still have real initiatives —
   *  ones the language-intersection clause in `applyFilters` then drops from
   *  `selection.initiatives` too, with no work filter in sight. The caller
   *  passes `workFiltered || !languageInSelection`: an L1 language's own
   *  initiatives can only ever be narrowed by a WORK filter, because the
   *  intersection clause is satisfied trivially by the language's own id
   *  once it is in L1 — so `workFiltered` alone is exactly right there, and
   *  the `!languageInSelection` term only ever adds true for a language a
   *  facet has already excluded. */
  filtered: boolean
}): React.JSX.Element {
  const s = language.speakers
  return (
    <aside className="card panel" aria-label={`Language: ${language.name}`}>
      <h2>{language.name}</h2>
      <PanelSection title="Identity">
        <Field label="Also known as" testId="field-aka">{language.also_known_as.join(', ')}</Field>
      </PanelSection>
      <PanelSection title="Situation">
        <Field label="Family" testId="field-family">{language.family}</Field>
        <Field label="Typology" testId="field-typology">{language.typology.join(', ')}</Field>
        <SourcedField
          label="Endangerment" testId="field-endangerment"
          source={language.endangerment?.source ?? null}
        >
          {language.endangerment?.status}
        </SourcedField>
        {/* A LIST of sources, not one: this field can show two disagreeing
            figures and each carries its OWN source. One reference under two
            numbers leaves the reader unable to tell which source says which —
            and being able to tell is the entire reason the schema keeps both
            instead of picking one. */}
        <SourcedField
          label="Speakers" testId="field-speakers"
          source={s === null ? null : [
            { source: s.source, figure: s.value.toLocaleString('en') },
            ...s.conflicts.map((c) => ({
              source: c.source, figure: c.value.toLocaleString('en'),
            })),
          ]}
        >
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
        </SourcedField>
      </PanelSection>
      <PanelSection title="Place">
        {/* `not mapped` is a VALUE, not a null: we know this language has no
            cited centre — the same fact the table's Location column and the
            rail's "Not mapped" heading state. Routing it through `Field`'s
            null branch printed "not recorded", which claims we do not know
            it, and left three surfaces disagreeing about one fact. */}
        <SourcedField
          label="Centre" testId="field-centre"
          source={language.centre?.source ?? null}
        >
          {language.centre === null ? <span>not mapped</span> : (
            <>
              {language.centre.lat.toFixed(2)}, {language.centre.lon.toFixed(2)}
              {language.centre.confidence === 'approximate' && <strong> — approximate</strong>}
            </>
          )}
        </SourcedField>
      </PanelSection>
      <PanelSection title="Work">
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
              {filtered
                ? 'None matching the current filters — not a claim that no work exists.'
                : 'The atlas records no initiative for this language — not a result of the current filters.'}
            </span>
          ) : (
            <ul>{initiatives.map((i) => <li key={i.id}>{i.name}</li>)}</ul>
          )}
        </Field>
      </PanelSection>
      <PanelSection title="Note">
        <Field label="Note" testId="field-caveat">{language.caveat}</Field>
      </PanelSection>
    </aside>
  )
}
