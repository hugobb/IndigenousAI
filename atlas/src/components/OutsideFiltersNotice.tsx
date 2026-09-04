/** A selected record the current filters exclude used to become a silent null:
 *  the panel simply vanished and nothing on the page accounted for it. The
 *  record still exists, so the page says so and offers both ways out. */
export default function OutsideFiltersNotice({
  kind, onClearFilters, onDeselect,
}: {
  kind: 'language' | 'initiative'
  onClearFilters: () => void
  onDeselect: () => void
}): React.JSX.Element {
  return (
    <p className="card notice" data-testid="outside-filters" role="status">
      This {kind} is outside your current filters. It is still in the atlas — the
      filters simply do not select it.{' '}
      <button type="button" className="link-button" data-testid="outside-clear-filters" onClick={onClearFilters}>
        Clear the filters
      </button>{' '}
      or{' '}
      <button type="button" className="link-button" data-testid="outside-deselect" onClick={onDeselect}>
        close this record
      </button>.
    </p>
  )
}
