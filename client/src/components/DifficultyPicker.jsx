import { DIFFICULTIES } from '../utils/constants'

const TONE_SELECTED = {
  easy: 'border-complete bg-complete/15 text-complete',
  medium: 'border-gold bg-gold/15 text-gold',
  hard: 'border-hp bg-hp/15 text-hp',
}

export default function DifficultyPicker({ value, onChange }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-text-muted">
        Difficulty
      </span>
      <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((d) => {
          const selected = d.key === value
          return (
            <button
              key={d.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(d.key)}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3 transition ${
                selected
                  ? TONE_SELECTED[d.key]
                  : 'border-border text-text-muted hover:bg-surface-hover'
              }`}
            >
              <span className="text-sm font-semibold">{d.label}</span>
              <span className="text-[10px] opacity-80">{d.xp} XP</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}