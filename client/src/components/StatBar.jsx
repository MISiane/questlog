import { useEffect, useState } from 'react'

const TONES = {
  gold: { fill: 'bg-gold', track: 'bg-border' },
  hp: { fill: 'bg-hp', track: 'bg-border' },
  arcane: { fill: 'bg-arcane', track: 'bg-border' },
}

// Accessible progress bar. `value` and `max` are numbers; `label` is the
// text alternative (also visible under the bar via children).
export default function StatBar({
  value,
  max,
  tone = 'gold',
  label,
  caption,
}) {
  const safeMax = Math.max(1, max)
  const clamped = Math.max(0, Math.min(value, safeMax))
  const pct = (clamped / safeMax) * 100
  const t = TONES[tone] ?? TONES.gold

  // Animate width changes with a short transition. `useState` here is just
  // to force a reflow when the value first lands, giving the transition
  // something to animate from.
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-text-muted">{label}</span>
        {caption && <span className="text-text-dim">{caption}</span>}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className={`h-3 w-full overflow-hidden rounded-full border border-border ${t.track}`}
      >
        <div
          className={`h-full rounded-full ${t.fill} transition-[width] duration-500 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}