import { DAYS, DAYS_LONG } from '../utils/constants'

export default function SchedulePicker({ value, onChange }) {
  const toggle = (day) => {
    const set = new Set(value)
    if (set.has(day)) set.delete(day)
    else set.add(day)
    onChange([...set].sort((a, b) => a - b))
  }

  const everyDay = value.length === 7
  const weekdays = value.length === 5 && [1, 2, 3, 4, 5].every((d) => value.includes(d))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Schedule</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])}
            className={`rounded-md px-2 py-0.5 text-[10px] ${everyDay ? 'text-gold' : 'text-text-dim hover:text-text-muted'}`}
          >
            Every day
          </button>
          <button
            type="button"
            onClick={() => onChange([1, 2, 3, 4, 5])}
            className={`rounded-md px-2 py-0.5 text-[10px] ${weekdays ? 'text-gold' : 'text-text-dim hover:text-text-muted'}`}
          >
            Weekdays
          </button>
        </div>
      </div>
      <div role="group" aria-label="Days of the week" className="flex gap-1.5">
        {DAYS.map((label, idx) => {
          const selected = value.includes(idx)
          return (
            <button
              key={idx}
              type="button"
              aria-pressed={selected}
              aria-label={DAYS_LONG[idx]}
              onClick={() => toggle(idx)}
              className={`h-10 flex-1 rounded-lg border text-xs font-medium transition ${
                selected
                  ? 'border-arcane bg-arcane/15 text-arcane'
                  : 'border-border text-text-dim hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      {value.length === 0 && (
        <p className="mt-2 text-xs text-hp">Pick at least one day.</p>
      )}
    </div>
  )
}