import { useEffect, useState } from 'react'

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
 *  has no browser in CI (spec F8). */
export default function Timeline({
  min, max, from, to, undatedCount, onChange,
}: TimelineProps): React.JSX.Element {
  // Local state mirrors the incoming window but also tracks each input's own
  // change immediately, so a second handle move in the same interaction (e.g.
  // dragging "from" back to min, then "to" back to max) sees the first move's
  // result rather than a stale prop. Re-synced whenever the caller's window
  // (or the range bounds) actually changes underneath us.
  const [lo, setLo] = useState(from ?? min)
  const [hi, setHi] = useState(to ?? max)

  useEffect(() => setLo(from ?? min), [from, min])
  useEffect(() => setHi(to ?? max), [to, max])

  // A window equal to the full range is "unconstrained", reported as nulls so the
  // keys stay out of the URL and stay out of it after new data widens the range.
  const report = (nextLo: number, nextHi: number): void => {
    setLo(nextLo)
    setHi(nextHi)
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
