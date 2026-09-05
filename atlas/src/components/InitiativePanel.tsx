import type { AtlasBundle } from '../lib/load.js'
import type { Initiative, Method, Paper } from '../schema/index.js'
import Field from './Field.js'
import PanelSection from './PanelSection.js'
import SourcedField from './SourcedField.js'

export default function InitiativePanel({
  initiative, methods, bundle,
}: {
  initiative: Initiative
  methods: Method[]
  /** Papers and languages are named on the initiative by ID; the records they
   *  point at live at the top of the bundle. Bundle-scoped rather than
   *  selection-scoped, for the same reason `TableView`'s `languageName` is: an
   *  initiative may name a language the current filters exclude, and printing
   *  a raw id there is a worse answer than printing the name. */
  bundle: AtlasBundle
}): React.JSX.Element {
  const mine = methods.filter((m) => initiative.methods.includes(m.id))
  const names = new Map(bundle.languages.map((l) => [l.id, l.name]))
  // Resolved to `null` rather than filtered out: see the Evidence section.
  const papers: { id: string; paper: Paper | null }[] = initiative.papers.map((id) => ({
    id,
    paper: bundle.papers.find((p) => p.id === id) ?? null,
  }))
  const years =
    initiative.started === null
      ? null
      : `${initiative.started}–${initiative.ended === null ? 'ongoing' : initiative.ended}`
  return (
    <aside className="card panel" aria-label={`Initiative: ${initiative.name}`}>
      <h2>{initiative.name}</h2>
      <PanelSection title="Identity">
        <Field label="Kind" testId="field-kind">{initiative.kind}</Field>
        {/* D5, on the initiative side: adjacent tier means work that
            TRANSFERS to an Indigenous language, not work on one. Flattening
            that would overstate coverage on the single record a reader has
            gone to the trouble of opening. */}
        <Field label="Tier" testId="field-tier">{initiative.tier}</Field>
        {/* `?? id`, exactly as the table's `languageName` does: an id we
            cannot resolve is still a claim the record makes, and printing
            nothing would understate it. */}
        <Field label="Languages" testId="field-languages">
          {initiative.languages.map((id) => names.get(id) ?? id).join(', ')}
        </Field>
      </PanelSection>
      <PanelSection title="Work">
        <Field label="Years" testId="field-years">{years}</Field>
        <Field label="Applications" testId="field-applications">{initiative.applications.join(', ')}</Field>
        <Field label="Methods" testId="field-methods">
          {mine.length === 0 ? null : (
            <ul>{mine.map((m) => <li key={m.id}><a href={m.doc_url}>{m.name}</a></li>)}</ul>
          )}
        </Field>
        <Field label="Models" testId="field-models">{initiative.models.join(', ')}</Field>
        {/* A facet the reader can filter by and a column the table shows —
            filtering on a dimension the record itself never displays leaves
            the panel unable to explain why a filter kept it. */}
        <Field label="Data regime" testId="field-regime">{initiative.data_regime}</Field>
      </PanelSection>
      <PanelSection title="Governance">
        {/* "Posture", not "Governance": the section heading already says
            Governance, and a `<dt>` repeating its own `<h3>` renders the word
            twice over one value. `posture` is the schema's own name for this
            claim, and the DIMENSION stays "Governance" everywhere it is named
            as one — the section, the table column, the facet group — so the
            reader's path from column to panel is unbroken. */}
        <SourcedField
          label="Posture" testId="field-governance"
          source={initiative.governance?.source ?? null}
        >
          {initiative.governance?.posture}
        </SourcedField>
        {/* No disclosure of its own: the licence is a member of the same
            `governance` object as the posture above, backed by that one
            `Source`, and a second toggle over the same reference would read as
            a second, INDEPENDENT attribution — two sources corroborating one
            governance claim.
            So it says where its citation comes from instead. Without that
            line, a reader applying the rule `SourcedField` documents — no
            toggle, no source — reads a cited claim as an uncited curator
            assertion, on the one page whose whole premise is that every claim
            carries provenance. This is case 2 of that comment; see it.
            Through `aside`, never `children`: a note is not the value, and
            folding it in would make a null licence look non-empty and lose its
            "not recorded". Rendered only when there IS a licence — under "not
            recorded" an attribution would be citing an absence. */}
        <Field
          label="Licence" testId="field-licence"
          aside={initiative.governance?.licence == null ? null : (
            <span className="cited-to"> — cited to the governance source above</span>
          )}
        >
          {initiative.governance?.licence ?? null}
        </Field>
      </PanelSection>
      <PanelSection title="Place">
        <SourcedField label="Location" testId="field-site" source={initiative.site.source}>
          {initiative.site.place}
          {initiative.site.confidence === 'approximate' && <strong> — approximate</strong>}
        </SourcedField>
      </PanelSection>
      <PanelSection title="Evidence">
        {/* Published since SP2b: `summary_url` is a route (`/summaries/<id>/`)
            served from this same origin, so an anchor points at a page that
            exists. The rule did not change — it was always "never invent a
            destination", and the destination now exists. An UNRESOLVED id is
            still never a link: nothing published corresponds to it.

            The link is the trailing word "summary", NEVER the title. A title
            is a third party's name for a third party's object, and in every
            citation convention a reader has met — DOI, arXiv, ACL Anthology, a
            publisher — a linked title resolves to THE PAPER. This one resolves
            to OUR summary of it, so linking the title would misdirect before
            the reader could tell, and would keep doing it: ten citations
            followed is ten of our summaries and zero papers. Not the same case
            as `Method.doc_url`, where the name we link is our own label for
            our own page and the two are one object. The accessible name of
            this anchor is therefore the word "summary", which is what it is. */}
        <Field label="Papers" testId="field-papers">
          {papers.length === 0 ? null : (
            <>
              <ul className="citations">
                {/* Keyed by POSITION as well as id: neither
                    `papers: z.array(z.string())` nor the `links` array below
                    enforces uniqueness, so a record naming one paper twice —
                    or two labels on one URL — is schema-valid and would
                    collide. No record does it today; one line makes it
                    impossible rather than latent. */}
                {papers.map(({ id, paper }, n) => (
                  <li key={`${n}-${id}`}>
                    {paper === null ? (
                      // Never silently drop a reference the record makes — the
                      // same rule `columns.ts` uses for an unresolvable
                      // language id. A bare id would read as noise, so it is
                      // marked as the dangling reference it is.
                      <span>{id} <em>— unresolved reference</em></span>
                    ) : (
                      <>
                        <cite>{paper.title}</cite> · {paper.authors} · {paper.year}
                        {paper.venue !== null && <> · {paper.venue}</>}
                        {' · '}<a href={paper.summary_url}>summary</a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Field>
        {/* These ARE somewhere you can go. `retrieved` is required by the
            schema on every one of them, so it always prints: a link with no
            honest retrieval date is not a citation. */}
        <Field label="Links" testId="field-links">
          {initiative.links.length === 0 ? null : (
            <ul>
              {initiative.links.map((l, n) => (
                <li key={`${n}-${l.url}`}>
                  <a href={l.url} rel="noreferrer">{l.label}</a> · retrieved {l.retrieved}
                </li>
              ))}
            </ul>
          )}
        </Field>
      </PanelSection>
      <PanelSection title="Note">
        <Field label="Curator's note" testId="field-caveat">{initiative.caveat}</Field>
        {initiative.transferability !== null && (
          <Field label="Does this transfer?" testId="field-transferability">
            <p>{initiative.transferability.note}</p>
            <p>Transfers: {initiative.transferability.transfers.join(', ')}</p>
            <p>Does not transfer: {initiative.transferability.does_not_transfer.join(', ')}</p>
          </Field>
        )}
      </PanelSection>
    </aside>
  )
}
