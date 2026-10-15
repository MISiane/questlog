import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import DifficultyPicker from './DifficultyPicker'
import { DEFAULT_DIFFICULTY } from '../utils/constants'

const EMPTY = { name: '', difficulty: DEFAULT_DIFFICULTY }

export default function TodoForm({ open, initial, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(EMPTY)

  useEffect(() => {
    if (!open) return
    setDraft(
      initial
        ? { name: initial.name, difficulty: initial.difficulty }
        : EMPTY
    )
  }, [open, initial])

  const headingId = 'todo-form-title'
  const isEditing = !!initial
  const valid = useMemo(() => draft.name.trim().length > 0, [draft])

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSubmit({
      name: draft.name.trim().slice(0, 60),
      difficulty: draft.difficulty,
    })
  }

  return (
    <Modal open={open} onClose={onCancel} labelledBy={headingId}>
      <form onSubmit={submit}>
        <h3 id={headingId} className="font-pixel text-[11px] leading-relaxed text-arcane">
          {isEditing ? 'Edit To-do' : 'New To-do'}
        </h3>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="todo-name"
              className="mb-2 block text-xs font-medium text-text-muted"
            >
              Name
            </label>
            <input
              id="todo-name"
              type="text"
              maxLength={60}
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Buy groceries"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-arcane focus:outline-none"
            />
          </div>

          <DifficultyPicker
            value={draft.difficulty}
            onChange={(difficulty) => setDraft({ ...draft, difficulty })}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="arcane" disabled={!valid}>
            {isEditing ? 'Save' : 'Add to-do'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}