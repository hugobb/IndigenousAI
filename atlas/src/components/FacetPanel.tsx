import type { FacetId } from '../lib/facets.js'
import type { FacetSummary } from '../lib/filters.js'
import FacetGroup from './FacetGroup.js'

export default function FacetPanel({
  summaries, activeCount, onToggle, onClearAll,
}: {
  summaries: FacetSummary[]
  activeCount: number
  onToggle: (facet: FacetId, value: string) => void
  onClearAll: () => void
}): React.JSX.Element {
  return (
    <section className="card facets" aria-label="Filters">
      <div className="facets__head">
        <p className="section-label">Filters</p>
        {activeCount > 0 && (
          <button type="button" className="link-button" data-testid="clear-all" onClick={onClearAll}>
            Clear all ({activeCount})
          </button>
        )}
      </div>
      {summaries.map((s) => (
        <FacetGroup key={s.id} summary={s} onToggle={(v) => onToggle(s.id, v)} />
      ))}
    </section>
  )
}
