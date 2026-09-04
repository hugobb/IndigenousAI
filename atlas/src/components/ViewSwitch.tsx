import { VIEWS, type ViewId } from '../lib/columns.js'

const LABELS: Record<ViewId, string> = {
  map: 'Map', initiatives: 'Initiatives', languages: 'Languages',
}

/** Buttons with `aria-pressed`, not an ARIA tablist: this swaps the whole
 *  pane rather than switching panels inside one. */
export default function ViewSwitch({
  view, counts, onChange,
}: {
  view: ViewId
  counts: { initiatives: number; languages: number }
  onChange: (v: ViewId) => void
}): React.JSX.Element {
  return (
    <div className="view-switch" role="group" aria-label="View">
      {VIEWS.map((v) => (
        <button
          key={v} type="button" aria-pressed={v === view}
          data-testid={`view-${v}`} onClick={() => onChange(v)}
        >
          {LABELS[v]}
          {v !== 'map' && <span className="view-switch__n"> ({counts[v]})</span>}
        </button>
      ))}
    </div>
  )
}
