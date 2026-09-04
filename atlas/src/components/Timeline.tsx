export interface TimelineProps {
  min: number
  max: number
  from: number | null
  to: number | null
  undatedCount: number
  onChange: (from: number | null, to: number | null) => void
}

/** Two native range inputs rather than a custom two-thumb track. A custom widget
 *  would be keyboard-hostile and untestable without a browser, and this project
 *  has no browser in CI (spec F8). Purely controlled by props: the URL is the
 *  single source of truth (spec F3) and this component holds no state of its
 *  own — a browser Back/popstate, or any value the parent declines to accept,
 *  must be reflected here on the very next render, never one render late. */
export default function Timeline({
  min, max, from, to, undatedCount, onChange,
}: TimelineProps): React.JSX.Element {
  const lo = from ?? min
  const hi = to ?? max

  // A window equal to the full range is "unconstrained", reported as nulls so the
  // keys stay out of the URL and stay out of it after new data widens the range.
  const report = (nextLo: number, nextHi: number): void => {
    const isFull = nextLo <= min && nextHi >= max
    onChange(isFull ? null : nextLo, isFull ? null : nextHi)
  }

  return (
    <section className="timeline" aria-label="Filter initiatives by start year">
      <div className="timeline__controls">
        <label>
          <span>From</span>
          <input
            type="range" min={min} max={max} value={lo}
            onChange={(e) => {
              const v = Number(e.target.value)
              report(v, Math.max(v, hi))
            }}
          />
        </label>
        <label>
          <span>To</span>
          <input
            type="range" min={min} max={max} value={hi}
            onChange={(e) => {
              const v = Number(e.target.value)
              report(Math.min(v, lo), v)
            }}
          />
        </label>
      </div>
      <p className="timeline__window" data-testid="timeline-window">
        {lo}–{hi}
      </p>
      {undatedCount > 0 && (
        <p className="timeline__undated" data-testid="timeline-undated">
          {undatedCount} initiative{undatedCount === 1 ? '' : 's'} record no start year and
          {undatedCount === 1 ? ' is' : ' are'} always shown.
        </p>
      )}
    </section>
  )
}
