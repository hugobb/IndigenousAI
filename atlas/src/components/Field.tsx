import NotRecorded from './NotRecorded.js'

export interface FieldProps {
  label: string
  testId: string
  children?: React.ReactNode
  /** Rendered after the value, inside the same `<dd>`. Deliberately NOT part
   *  of `children`: `isEmpty` tests the value, and folding a control into it
   *  makes every field carrying a control look non-empty — so a null value
   *  would silently lose its "not recorded". */
  aside?: React.ReactNode
}

const isEmpty = (v: React.ReactNode): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

/** An absent value renders as the words "not recorded", never as a blank cell.
 *  A blank reads as "nothing to say"; the words say "we don't know". All five
 *  real languages have an empty typology because nobody would assert one
 *  without a citation — that distinction is why they were left empty.
 *
 *  THE RULE FOR AN EMPTY ARRAY, decided as a class by the SP2a seam review
 *  because deciding it field by field is how one idea acquires three wordings.
 *
 *  An empty array is "not recorded", everywhere, on both panels: `typology`,
 *  `countries`, `also_known_as`, `applications`, `methods`, `models`,
 *  `papers`, `links`. Every one of them is a `.default([])` in the schema —
 *  the shape a record has when nobody has filled the field — so an empty one
 *  is the absence of curation, which is exactly what these words say.
 *
 *  Ruling R12 proposed the opposite for `papers`: that `[]` means "the review
 *  holds none for this record" rather than "we do not know", and should read
 *  as such. Checked against the data, that premise is false. The review corpus
 *  holds 92 papers and 2 of them are attached to any initiative; the technique
 *  guide holds 39 docs and 0 are attached. `papers: []` on te-hiku-media does
 *  not mean the review has no paper about Te Hiku Media — it means the linking
 *  has not been done. Printing "none in this review" there would manufacture a
 *  claim of completeness out of unfinished work, on the one artifact whose
 *  premise is that it never claims more than it knows.
 *
 *  An absence reads as something OTHER than "not recorded" only where the
 *  atlas independently asserts that absence elsewhere. Exactly one field
 *  qualifies: a language's `centre === null` reads "not mapped", because the
 *  map omits the point, the table's Location column says "not mapped" and the
 *  rail heads a group "Not mapped" — three surfaces stating one fact, so a
 *  fourth must state the same one. (`Matching initiatives` is a second, and a
 *  different, case: its list is scoped to I1, so an empty one is a FILTER
 *  RESULT, not a property of the record at all.) `tests/panels.test.tsx`
 *  pins both exceptions by set equality, so a third one cannot be added
 *  quietly. */
export default function Field({ label, testId, children, aside }: FieldProps): React.JSX.Element {
  return (
    <div data-testid={testId}>
      <dt>{label}</dt>
      <dd>{isEmpty(children) ? <NotRecorded /> : children}{aside}</dd>
    </div>
  )
}
