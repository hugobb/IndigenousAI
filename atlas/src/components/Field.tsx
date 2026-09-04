import NotRecorded from './NotRecorded.js'

export interface FieldProps {
  label: string
  testId: string
  children?: React.ReactNode
}

const isEmpty = (v: React.ReactNode): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

/** An absent value renders as the words "not recorded", never as a blank cell.
 *  A blank reads as "nothing to say"; the words say "we don't know". All five
 *  real languages have an empty typology because nobody would assert one
 *  without a citation — that distinction is why they were left empty. */
export default function Field({ label, testId, children }: FieldProps): React.JSX.Element {
  return (
    <div data-testid={testId}>
      <dt>{label}</dt>
      <dd>{isEmpty(children) ? <NotRecorded /> : children}</dd>
    </div>
  )
}
