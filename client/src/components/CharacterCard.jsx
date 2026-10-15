import { useRef, useState } from 'react'
import Card from './Card'
import StatBar from './StatBar'

export default function CharacterCard({ character, onRename }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const startEditing = () => {
    setDraft(character.name ?? '')
    setEditing(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const commit = () => {
    const raw = typeof draft === 'string' ? draft : ''
    const next = raw.trim().slice(0, 24)
    onRename(next || 'Adventurer')
    setEditing(false)
  }

  const cancel = () => {
    setDraft('')
    setEditing(false)
  }

  const hpLow = character.hp > 0 && character.hp <= 25

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={24}
              aria-label="Character name"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  cancel()
                }
              }}
              className="w-full rounded-lg border border-arcane bg-bg px-2 py-1 text-base font-semibold text-text focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-2 text-left"
              aria-label={`Edit character name (currently ${character.name})`}
            >
              <span className="truncate text-base font-semibold text-text">
                {character.name}
              </span>
              <span aria-hidden="true" className="text-xs text-text-dim">✎</span>
            </button>
          )}
          <p className="mt-0.5 text-xs text-text-dim">Your hero</p>
        </div>

        <div className="text-right">
          <p className="font-pixel text-[10px] leading-relaxed text-arcane">
            LV
          </p>
          <p className="font-pixel text-lg leading-none text-gold">
            {character.level}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <StatBar
          tone="gold"
          label="XP"
          value={character.xpIntoLevel}
          max={character.xpForNextLevel}
          caption={`${character.xpIntoLevel} / ${character.xpForNextLevel}`}
        />
        <div className={hpLow ? 'ql-hp-warn rounded-full' : ''}>
          <StatBar
            tone="hp"
            label="HP"
            value={character.hp}
            max={character.hpMax}
            caption={`${character.hp} / ${character.hpMax}`}
          />
        </div>
      </div>
    </Card>
  )
}