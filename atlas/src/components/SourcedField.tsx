import { useState } from 'react'
import type { Source } from '../schema/index.js'
import Field from './Field.js'

/** One source, rendered as one line. `figure` names WHICH claim this source
 *  supports — needed wherever a field shows more than one figure (speakers,
 *  where disagreeing counts are kept rather than resolved), because a list of
 *  bare references leaves the reader unable to tell which source says which. */
export function SourceLine({
  source, figure,
}: { source: Source; figure?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="source-line">
      {figure !== undefined && <><strong>{figure}</strong>{' — '}</>}
      <span className="source-kind">{source.kind}</span>{' '}
      {/* Only a url ref is a resource. A paper ref is a citation string and a
          doc ref is a repo path; linking either invents a destination we do
          not have. */}
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

/** The toggle plus its body, with no opinion about what the body holds — so a
 *  field whose provenance is more than one source (speakers) composes this
 *  directly instead of widening `SourcedField` for its one case.
 *
 *  Pass the WHOLE of this to `Field`'s `aside`, never to its `children`: see
 *  `FieldProps.aside`.
 *
 *  The body's CONTENT is unmounted while collapsed rather than merely hidden.
 *  `hidden` alone leaves the reference text in the DOM, where a reader search
 *  (and `getByText`) still finds it — a collapsed disclosure that is still
 *  findable is not collapsed. The element itself stays mounted so
 *  `aria-controls` always resolves. */
export function SourceDisclosure({
  label, testId, children,
}: { label: string; testId: string; children: React.ReactNode }): React.JSX.Element {
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
        {open && children}
      </div>
    </>
  )
}

/** Every claim in this dataset carries a source, and until now none of them
 *  were shown. Provenance sits with the claim it supports rather than pooled
 *  at the panel foot: pooled, a reader checking one number has to match it to
 *  a source by eye.
 *
 *  A field with `source === null` renders NO toggle, and that silence is
 *  meaningful — those fields carry no `Source` in the schema at all. It only
 *  stays meaningful if a toggle is never rendered empty. */
export default function SourcedField({
  label, testId, source, children,
}: {
  label: string
  testId: string
  source: Source | null
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <Field
      label={label} testId={testId}
      aside={source === null ? null : (
        <SourceDisclosure label={label} testId={testId}>
          <SourceLine source={source} />
        </SourceDisclosure>
      )}
    >
      {children}
    </Field>
  )
}
