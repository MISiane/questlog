import { ICON_CHOICES } from '../utils/constants'

export default function IconPicker({ value, onChange }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-text-muted">
        Icon
      </span>
      <div
        role="radiogroup"
        aria-label="Quest icon"
        className="grid grid-cols-8 gap-1.5 sm:grid-cols-12"
      >
        {ICON_CHOICES.map((icon) => {
          const selected = icon === value
          return (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Icon ${icon}`}
              onClick={() => onChange(icon)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                selected
                  ? 'border-arcane bg-arcane/15'
                  : 'border-border hover:bg-surface-hover'
              }`}
            >
              <span aria-hidden="true">{icon}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}