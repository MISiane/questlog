import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import IconPicker from './IconPicker'
import DifficultyPicker from './DifficultyPicker'
import SchedulePicker from './SchedulePicker'
import { DEFAULT_ICON, DEFAULT_DIFFICULTY } from '../utils/constants'

const EMPTY = {
  name: '',
  icon: DEFAULT_ICON,
  difficulty: DEFAULT_DIFFICULTY,
  schedule: [0, 1, 2, 3, 4, 5, 6],
}

export default function HabitForm({
  open,
  initial,        // habit object when editing, null when adding
  onSubmit,
  onCancel,
}) {
  const [draft, setDraft] = useState(EMPTY)

  useEffect(() => {
    if (!open) return
    setDraft(
      initial
        ? {
            name: initial.name,
            icon: initial.icon,
            difficulty: initial.difficulty,
            schedule: [...initial.schedule],
          }
        : EMPTY
    )
  }, [open, initial])

  const headingId = 'habit-form-title'
  const isEditing = !!initial

  const valid = useMemo(
    () => draft.name.trim().length > 0 && draft.schedule.length > 0,
    [draft]
  )

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSubmit({
      name: draft.name.trim().slice(0, 60),
      icon: draft.icon,
      difficulty: draft.difficulty,
      schedule: draft.schedule,
    })
  }

  return (
    <Modal open={open} onClose={onCancel} labelledBy={headingId}>
      <form onSubmit={submit}>
        <h3 id={headingId} className="font-pixel text-[11px] leading-relaxed text-gold">
          {isEditing ? 'Edit Quest' : 'New Quest'}
        </h3>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="habit-name"
              className="mb-2 block text-xs font-medium text-text-muted"
            >
              Name
            </label>
            <input
              id="habit-name"
              type="text"
              maxLength={60}
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Drink water"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-arcane focus:outline-none"
            />
          </div>

          <IconPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
          />

          <DifficultyPicker
            value={draft.difficulty}
            onChange={(difficulty) => setDraft({ ...draft, difficulty })}
          />

          <SchedulePicker
            value={draft.schedule}
            onChange={(schedule) => setDraft({ ...draft, schedule })}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!valid}>
            {isEditing ? 'Save' : 'Add quest'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}