import type { Initiative, Language, Paper } from '../schema/index.js'
import Field from './Field.js'
import PanelSection from './PanelSection.js'
import SourcedField from './SourcedField.js'

export default function LanguagePanel({
  language, initiatives, filtered, papers,
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
  /** Papers that STUDY this language, per data/paper-languages.yml, each
   *  paired with its mapping's `note` — the curator's hedge on how strong
   *  that evidence is, when the mapping has one. Scoped to the record, not to
   *  the current filters: unlike `initiatives` above, no facet narrows papers
   *  today, so an empty list here is a fact about the atlas rather than a
   *  filter result — and the copy says exactly that. */
  papers: { paper: Paper; note: string | null }[]
}): React.JSX.Element {
  const s = language.speakers
  return (
    <aside className="card panel" aria-label={`Language: ${language.name}`}>
      <h2>{language.name}</h2>
      <PanelSection title="Identity">
        <Field label="Also known as" testId="field-aka">{language.also_known_as.join(', ')}</Field>
        <Field label="Glottocode" testId="field-glottocode">{language.glottocode}</Field>
        <Field label="ISO 639-3" testId="field-iso639-3">{language.iso639_3}</Field>
        {/* D5: an adjacent-tier language is never mapped. Without this the
            reader has no way to tell one from a coverage gap. */}
        <Field label="Tier" testId="field-tier">{language.tier}</Field>
        <Field label="Family" testId="field-family">{language.family}</Field>
        <Field label="Subfamily" testId="field-subfamily">{language.subfamily}</Field>
      </PanelSection>
      <PanelSection title="Situation">
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
        {/* A facet the reader can filter by. Filtering on a dimension the
            record never displays is a gap spec §7 did not anticipate. */}
        <Field label="Region" testId="field-region">{language.region}</Field>
        <Field label="Countries" testId="field-countries">{language.countries.join(', ')}</Field>
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
      <PanelSection title="Literature">
        <Field label="Papers studying this language" testId="field-papers">
          {papers.length === 0 ? (
            <span className="hint">
              No paper in this atlas studies this language — not a result of the current filters.
            </span>
          ) : (
            <ul>
              {papers.map(({ paper: p, note }) => (
                <li key={p.id}>
                  <a href={p.summary_url}>{p.title}</a>{' '}
                  <span>({p.year})</span>
                  {/* The curator's hedge on the mapping, e.g. "one of 23
                      evaluation languages, not the paper's subject" — same
                      `hint` treatment the empty-list case above and the Work
                      section use for subordinate, non-claim text. Rendered
                      only when the mapping actually carries one: most
                      mappings have none, and an empty hedge would be a
                      confusing blank line. */}
                  {note !== null && <p className="hint">{note}</p>}
                </li>
              ))}
            </ul>
          )}
        </Field>
      </PanelSection>
      <PanelSection title="Note">
        {/* Not "Note": the section heading already says that, and a `<dt>`
            repeating its own `<h3>` reads as a rendering slip. This is what
            the field IS — the schema calls it "the curator's own hedge about
            this record" — and it distinguishes the hedge from the
            transferability note the initiative panel keeps in this section. */}
        <Field label="Curator's note" testId="field-caveat">{language.caveat}</Field>
      </PanelSection>
    </aside>
  )
}
