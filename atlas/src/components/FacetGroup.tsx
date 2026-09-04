import { useState } from 'react'
import { NOT_RECORDED } from '../lib/facets.js'
import type { FacetSummary } from '../lib/filters.js'

export const TYPE_TO_NARROW_THRESHOLD = 12

/** An uncurated facet states the gap instead of rendering an empty control set.
 *  A group with no checkboxes and a group with unchecked checkboxes look the same
 *  at a glance, and they mean opposite things: "no data yet" versus "no filter
 *  applied". */
export default function FacetGroup({
  summary, onToggle,
}: { summary: FacetSummary; onToggle: (value: string) => void }): React.JSX.Element {
  const [needle, setNeedle] = useState('')

  if (!summary.curated) {
    return (
      <div className="facet facet--uncurated" data-testid={`facet-${summary.id}`}>
        <p className="facet__legend">{summary.label}</p>
        <p className="facet__uncurated">
          Not yet curated ({summary.notRecorded} record{summary.notRecorded === 1 ? '' : 's'})
        </p>
      </div>
    )
  }

  const showNeedle = summary.options.length > TYPE_TO_NARROW_THRESHOLD
  const visible = needle === ''
    ? summary.options
    : summary.options.filter((o) => o.value.toLowerCase().includes(needle.toLowerCase()))

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

      <ul className="facet__options">
        {visible.map((o) => (
          <li key={o.value}>
            <label>
              <input
                type="checkbox" checked={summary.selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
              />
              <span>{o.value}</span> <span className="facet__n">{o.count}</span>
            </label>
          </li>
        ))}
        {summary.notRecorded > 0 && (
          <li>
            <label>
              <input
                type="checkbox" checked={summary.selected.includes(NOT_RECORDED)}
                onChange={() => onToggle(NOT_RECORDED)}
              />
              <span>not recorded</span> <span className="facet__n">{summary.notRecorded}</span>
            </label>
          </li>
        )}
      </ul>
    </fieldset>
  )
}
