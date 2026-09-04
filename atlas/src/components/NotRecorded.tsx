/** One implementation of the words, shared by `Field` and `DataTable`. A blank
 *  reads as "nothing to say"; the words say "we don't know". */
export default function NotRecorded(): React.JSX.Element {
  return <em className="not-recorded">not recorded</em>
}
