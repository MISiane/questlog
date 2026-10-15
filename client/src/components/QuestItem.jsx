import { useEffect, useRef, useState } from 'react'
import { DIFFICULTY_LABEL } from '../utils/constants'

export default function QuestItem({ habit, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [flash, setFlash] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const done = habit.completedToday
  const scheduled = habit.scheduledToday

  const handleToggle = () => {
    if (!scheduled) return
    if (!done) {
      setFlash(true)
      setTimeout(() => setFlash(false), 400)
    }
    onToggle(habit.id)
  }

  return (
    <li
      className={`relative flex min-w-0 items-stretch gap-2 rounded-xl border transition ${
        done
          ? 'border-complete/40 bg-complete/5'
          : 'border-border bg-surface hover:bg-surface-hover'
      } ${flash ? 'ring-2 ring-complete/50' : ''}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={!scheduled}
        aria-pressed={done}
        aria-label={
          scheduled
            ? `${done ? 'Mark as not done' : 'Complete'} ${habit.name}`
            : `${habit.name} is not scheduled today`
        }
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
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
        <span aria-hidden="true" className="shrink-0 text-lg">{habit.icon}</span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm ${
              done ? 'text-text-muted line-through' : 'text-text'
            }`}
          >
            {habit.name}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[10px] text-text-dim">
            <span>{DIFFICULTY_LABEL[habit.difficulty]}</span>
            {habit.streak > 0 && (
              <span className="text-gold">🔥 {habit.streak}</span>
            )}
            {!scheduled && <span className="text-text-dim">not today</span>}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center pr-1" ref={menuRef}>
        <button
          type="button"
          aria-label={`More options for ${habit.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-dim hover:bg-surface-hover hover:text-text"
        >
          <span aria-hidden="true">⋯</span>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-2 top-12 z-10 w-36 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          >
            <button
              role="menuitem"
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
              onClick={() => {
                setMenuOpen(false)
                onEdit(habit)
              }}
            >
              Edit
            </button>
            <button
              role="menuitem"
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-hp hover:bg-surface-hover"
              onClick={() => {
                setMenuOpen(false)
                onDelete(habit)
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  )
}