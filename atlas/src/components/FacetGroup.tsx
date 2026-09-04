import { useState } from 'react'
import { NOT_RECORDED } from '../lib/facets.js'
import type { FacetSummary } from '../lib/filters.js'

export const TYPE_TO_NARROW_THRESHOLD = 12

/** An uncurated facet states the gap instead of rendering an empty control set.
 *  A group with no checkboxes and a group with unchecked checkboxes look the same
 *  at a glance, and they mean opposite things: "no data yet" versus "no filter
 *  applied".
 *
 *  One rule governs every branch below: a value the reader has SELECTED is
 *  always rendered, whatever the pool says. `summary.options` is computed with
 *  this facet cleared but the other facets applied, so a selection can be
 *  counted out of its own list — at `?region=africa&application=asr` the
 *  Application group read "Application (1) · mt 1" while `asr` was checked,
 *  active, and rendered nowhere. A count with no control behind it is a filter
 *  the reader can neither see nor undo except by clearing everything. */
export default function FacetGroup({
  summary, onToggle,
}: { summary: FacetSummary; onToggle: (value: string) => void }): React.JSX.Element {
  const [needle, setNeedle] = useState('')

  const isSelected = (value: string): boolean => summary.selected.includes(value)

  // The union of the pool and the selection. A selected value the pool no
  // longer holds shows a count of 0 — which is the honest number: selecting it
  // alongside the current filters yields nothing.
  const rows = [
    ...summary.options,
    ...summary.selected
      .filter((v) => v !== NOT_RECORDED && !summary.options.some((o) => o.value === v))
      .map((value) => ({ value, count: 0 })),
  ].sort((a, b) => a.value.localeCompare(b.value))

  // The sentinel row obeys the same rule: gating it on `notRecorded > 0` alone
  // hid a `_none` selection whenever the current pool happened to hold no such
  // record.
  const showNotRecorded = summary.notRecorded > 0 || isSelected(NOT_RECORDED)

  const showNeedle = rows.length > TYPE_TO_NARROW_THRESHOLD
  // A selection survives the needle. Letting a keystroke narrow it away hides
  // the only control that could clear it — the same defect, one keystroke later.
  const visible = needle === ''
    ? rows
    : rows.filter(
        (o) => isSelected(o.value) || o.value.toLowerCase().includes(needle.toLowerCase()),
      )

  const options = (
    <ul className="facet__options">
      {visible.map((o) => (
        <li key={o.value}>
          <label>
            <input
              type="checkbox" checked={isSelected(o.value)}
              onChange={() => onToggle(o.value)}
            />
            <span>{o.value}</span> <span className="facet__n">{o.count}</span>
          </label>
        </li>
      ))}
      {showNotRecorded && (
        <li>
          <label>
            <input
              type="checkbox" checked={isSelected(NOT_RECORDED)}
              onChange={() => onToggle(NOT_RECORDED)}
            />
            <span>not recorded</span> <span className="facet__n">{summary.notRecorded}</span>
          </label>
        </li>
      )}
    </ul>
  )

  if (!summary.curated) {
    // The count belongs to the sentence, and the sentence is a claim about the
    // whole dataset — "this dimension has not been coded" — so it takes the
    // bundle-scoped count. The pool-scoped one made `?region=oceania` read
    // "Not yet curated (1 record)", inviting the reading that exactly one
    // record was ever checked.
    const n = summary.notRecordedTotal
    return (
      <fieldset className="facet facet--uncurated" data-testid={`facet-${summary.id}`}>
        <legend className="facet__legend">{summary.label}</legend>
        <p className="facet__uncurated">
          Not yet curated ({n} record{n === 1 ? '' : 's'})
        </p>
        {/* An uncurated group rendered no controls at all, so a cited
            `?typology=_none` showed "Clear all (1)" with the selection nowhere
            on the page. The statement stands; the selection is rendered beside
            it so it can be removed. */}
        {summary.selected.length > 0 && options}
      </fieldset>
    )
  }

  return (
    <fieldset className="facet" data-testid={`facet-${summary.id}`}>
      <legend className="facet__legend">
        {summary.label}
        {summary.selected.length > 0 && <span className="facet__count"> ({summary.selected.length})</span>}
      </legend>

      {showNeedle && (
        <input
          type="text" className="facet__needle" placeholder={`Filter ${summary.label.toLowerCase()}`}
          aria-label={`Filter ${summary.label} options`} data-testid={`facet-filter-${summary.id}`}
          value={needle} onChange={(e) => setNeedle(e.target.value)}
        />
      )}

      {rows.length === 0 && !showNotRecorded ? (
        // Curated, but the current selection leaves this dimension with nothing
        // to offer. Without this line the group is a bare label above nothing,
        // which reads exactly like a rendering bug.
        <p className="facet__empty">No values in the current selection.</p>
      ) : (
        options
      )}
    </fieldset>
  )
}
