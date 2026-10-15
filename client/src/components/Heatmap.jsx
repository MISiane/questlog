import { useLayoutEffect, useRef } from 'react'
import Card from './Card'
import SectionHeading from './SectionHeading'

// Cells are colored by intensity:
//   - 0 completed            -> muted surface
//   - some completed         -> gold
//   - all scheduled done     -> green (perfect)
// Missed scheduled days use a slightly stronger muted fill than rest days.
// The tooltip disambiguates.

function cellTone(day) {
  if (day.completed === 0) {
    return day.scheduled > 0
      ? 'bg-border-strong/60 hover:bg-border-strong'
      : 'bg-surface-hover hover:bg-border'
  }
  if (day.isPerfect) {
    return 'bg-complete hover:brightness-110'
  }
  return 'bg-gold hover:brightness-110'
}

function tooltip(day) {
  if (day.scheduled === 0 && day.completed === 0) return `${day.date} · rest day`
  if (day.scheduled === 0 && day.completed > 0)
    return `${day.date} · ${day.completed} done (unscheduled)`
  if (day.completed === 0)
    return `${day.date} · missed (0 / ${day.scheduled})`
  if (day.isPerfect) return `${day.date} · perfect (${day.completed} / ${day.scheduled})`
  return `${day.date} · ${day.completed} / ${day.scheduled}`
}

export default function Heatmap({ heatmap }) {
  const scrollRef = useRef(null)

  // On mount, scroll to the right so the most recent days are visible.
  // useLayoutEffect avoids a visible left-to-right jump on first paint.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  if (!heatmap || heatmap.length === 0) return null

  // We want the LAST column to end on today's weekday. So we compute
  // today's day-of-week, and pad the END of the array so the final row
  // lines up. Example: today is Wednesday (3), we pad 3 nulls at the end
  // so the last column's first three rows are nulls and Wednesday sits
  // on row 3.
  const last = heatmap[heatmap.length - 1]
  const lastDow = new Date(
    Number(last.date.slice(0, 4)),
    Number(last.date.slice(5, 7)) - 1,
    Number(last.date.slice(8, 10))
  ).getDay() // 0=Sun

  const padEnd = 6 - lastDow
  const padded = [...heatmap, ...Array(padEnd).fill(null)]

  const weeks = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  const totalCompleted = heatmap.reduce((n, d) => n + d.completed, 0)
  const perfectDays = heatmap.filter((d) => d.isPerfect).length

  return (
    <Card>
      <SectionHeading tone="text-gold">Activity</SectionHeading>

      <div
        ref={scrollRef}
        className="-mx-1 overflow-x-auto pb-1"
        // Hint to the browser that we'll scroll horizontally on touch.
        style={{ touchAction: 'pan-x' }}
      >
        <div className="inline-flex gap-1 px-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) =>
                day ? (
                  <div
                    key={day.date}
                    title={tooltip(day)}
                    aria-label={tooltip(day)}
                    role="img"
                    className={`h-3 w-3 shrink-0 rounded-[3px] sm:h-3.5 sm:w-3.5 ${cellTone(day)}`}
                  />
                ) : (
                  <div
                    key={`pad-${wi}-${di}`}
                    className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-text-dim">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-surface-hover" /> none
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-gold" /> partial
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-complete" /> perfect
          </span>
        </div>
        <span>
          {totalCompleted} done · {perfectDays} perfect
        </span>
      </div>
    </Card>
  )
}