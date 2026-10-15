import { DIFFICULTY_LABEL } from '../utils/constants'

export default function TodoItem({ todo, onToggle, onDelete }) {
  const done = !!todo.completedAt
  return (
    <li
      className={`flex min-w-0 items-stretch gap-2 rounded-xl border transition ${
        done
          ? 'border-complete/40 bg-complete/5'
          : 'border-border bg-surface hover:bg-surface-hover'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        aria-pressed={done}
        aria-label={`${done ? 'Mark as not done' : 'Complete'} ${todo.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
      >
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            done
              ? 'border-complete bg-complete text-bg'
              : 'border-border-strong bg-bg'
          }`}
        >
          {done && <span className="text-[11px] leading-none">✓</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm ${
              done ? 'text-text-muted line-through' : 'text-text'
            }`}
          >
            {todo.name}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[10px] text-text-dim">
            <span>{DIFFICULTY_LABEL[todo.difficulty]}</span>
            {done && <span className="text-complete">done</span>}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center pr-1">
        <button
          type="button"
          aria-label={`Delete ${todo.name}`}
          onClick={() => onDelete(todo)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-dim hover:bg-surface-hover hover:text-hp"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </li>
  )
}