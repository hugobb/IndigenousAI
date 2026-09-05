import { useState } from 'react'
import type { Source } from '../schema/index.js'
import Field from './Field.js'

/** One figure and the source that supports it. `figure` names WHICH claim the
 *  source backs — needed wherever a field shows more than one (speakers, where
 *  disagreeing counts are kept rather than resolved), because a list of bare
 *  references leaves the reader unable to tell which source says which. */
export interface SourceEntry {
  source: Source
  figure?: React.ReactNode
}

/** DELIBERATELY NOT EXPORTED, and `tests/sourced-field.test.tsx` asserts this
 *  module's runtime export list is exactly `['default']` so it stays that way.
 *
 *  `Field.aside` exists so a control can sit in a field without counting as the
 *  field's value; routed through `children` instead, `isEmpty` sees a non-empty
 *  node and a null-valued field silently loses its "not recorded". Comments
 *  saying "use `aside`" did not make that unreachable — a caller holding a
 *  disclosure component can still put it wherever it likes. Keeping the
 *  disclosure module-private means no caller can hold one: `SourcedField`
 *  takes DATA (`Source | SourceEntry[]`) and is the only thing that can build
 *  a disclosure, and it only ever hands it to `aside`. */
function SourceLine({ source, figure }: SourceEntry): React.JSX.Element {
  return (
    <div className="source-line">
      {figure !== undefined && <><strong>{figure}</strong>{' — '}</>}
      <span className="source-kind">{source.kind}</span>{' '}
      {/* Only a url ref is a resource. A paper ref is a citation string, and
          every doc ref in the records today is a repo path; linking either
          invents a destination we do not have. Checked rather than assumed: all
          13 `Source.kind` values across the ten curated records are `url`, and
          the fixture's doc refs carry `ref: "fixture"` — a label, not a path.

          THIS BECOMES FALSE the day a doc ref names a published summary.
          `/summaries/<id>/` has been a real route on this origin since SP2b, so
          such a ref would be a destination we DO have, rendered as inert text.
          The fix then is here, not at the call site: `tests/sourced-field.test.tsx`
          pins "a non-url ref is never an anchor", so changing it is deliberate. */}
      {source.kind === 'url'
        ? <a href={source.ref} rel="noreferrer">{source.ref}</a>
        : <span>{source.ref}</span>}
      {/* Required by the schema only for url sources, so absence here is
          correct rather than unknown — "not recorded" would be false. */}
      {source.retrieved !== null && <span> · retrieved {source.retrieved}</span>}
      {source.quote !== null && <blockquote>{source.quote}</blockquote>}
    </div>
  )
}

/** Module-private for the reason above.
 *
 *  The body's CONTENT is unmounted while collapsed rather than merely hidden.
 *  `hidden` alone leaves the reference text in the DOM, where a reader search
 *  (and `getByText`) still finds it — a collapsed disclosure that is still
 *  findable is not collapsed. The element itself stays mounted so
 *  `aria-controls` always resolves. */
function SourceDisclosure({
  label, testId, entries,
}: { label: string; testId: string; entries: SourceEntry[] }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const bodyId = `source-body-${testId}`
  return (
    <>
      <button
        type="button" className="source-toggle"
        aria-expanded={open} aria-controls={bodyId}
        // Named after the field: a panel holds five or six of these, and
        // identical names leave a screen-reader user unable to tell them
        // apart. SP1c shipped exactly that collision across five pairs.
        aria-label={`Source for ${label}`}
        data-testid={`source-${testId}`}
        onClick={() => setOpen(!open)}
      >
        source
      </button>
      <div id={bodyId} hidden={!open} data-testid={bodyId} className="source-body">
        {open && entries.map((e, i) => (
          <SourceLine key={`${i}-${e.source.kind}-${e.source.ref}`} source={e.source} figure={e.figure} />
        ))}
      </div>
    </>
  )
}

/** Every claim in this dataset carries a source, and until now none of them
 *  were shown. Provenance sits with the claim it supports rather than pooled
 *  at the panel foot: pooled, a reader checking one number has to match it to
 *  a source by eye.
 *
 *  A field with no source renders NO toggle, and that silence is meaningful.
 *  It only stays meaningful if a toggle is never rendered empty, so an EMPTY
 *  `SourceEntry[]` renders nothing too, exactly as `null` does.
 *
 *  WHAT an absent toggle means is one of TWO things, and this comment used to
 *  claim only the first:
 *
 *  1. The schema gives that field no `Source` at all — family, region,
 *     typology, countries. Nothing was cited because nothing is cited.
 *  2. The field is one of SEVERAL claims backed by a SINGLE `Source` that
 *     another field in the same section already discloses. `InitiativePanel`'s
 *     `Licence` is the case: `governance.posture`, `governance.licence` and
 *     `governance.source` are one object, so the licence IS cited, to the
 *     reference the `Posture` toggle above it opens. A second toggle
 *     labelled "Source for Licence" opening that identical reference would
 *     read as a second, INDEPENDENT attribution — two sources corroborating
 *     one governance claim — and inventing corroboration in a cited artifact
 *     is worse than the toggle being absent.
 *
 *  An absent toggle NEVER means "the curator asserts this without a citation".
 *  Case 2 is only honest if the field SAYS where its citation comes from, in
 *  its own render, because nothing in this module can say it for them:
 *  `assertDisclosures` in `tests/panels.test.tsx` pins which fields carry a
 *  toggle and is blind to what an absent one means. So a case-2 field owes the
 *  reader that line, and the only thing holding the two together is this
 *  comment and the guard at that call site.
 *
 *  `source` takes a list as well as a single `Source` because a field can show
 *  more than one figure — speakers keeps disagreeing counts instead of picking
 *  one, and each carries its own source. That is data, not a second component:
 *  see `SourceLine` above for why this module exports no way to build a
 *  disclosure by hand. */
export default function SourcedField({
  label, testId, source, children,
}: {
  label: string
  testId: string
  source: Source | SourceEntry[] | null
  children?: React.ReactNode
}): React.JSX.Element {
  const entries: SourceEntry[] =
    source === null ? [] : Array.isArray(source) ? source : [{ source }]

  return (
    <Field
      label={label} testId={testId}
      // NEVER `children`: see `SourceLine`'s note. This is the only call site
      // in the codebase that can construct a disclosure at all.
      aside={entries.length === 0 ? null : (
        <SourceDisclosure label={label} testId={testId} entries={entries} />
      )}
    >
      {children}
    </Field>
  )
}
