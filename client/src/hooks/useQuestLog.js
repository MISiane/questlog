import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadState,
  saveState,
  resetState,
  emptyState,
  seedState,
} from '../services/storage'
import { newId } from '../utils/id'
import { todayStr, dayOfWeek, addDays, dateRange } from '../utils/date'
import {
  XP_BY_DIFFICULTY,
  levelFromXp,
  xpIntoLevel,
  xpForNextLevel,
} from '../utils/xp'

const HP_MAX = 100
const HP_MISS = -10
const HP_PERFECT = 5
const HP_FAINT_RESET = 50
const HEATMAP_DAYS = 140

// ---------------------------------------------------------------------------
// Rule predicates
// ---------------------------------------------------------------------------

function isHabitScheduledOn(habit, dateStr) {
  if (habit.archivedAt && dateStr >= habit.archivedAt) return false
  if (dateStr < habit.createdAt) return false
  return habit.schedule.includes(dayOfWeek(dateStr))
}

function xpForNextLevelAtLevel(level) {
  return 100 * level
}

function completedDatesFor(habitId, events) {
  const set = new Set()
  for (const e of events) {
    if (e.type === 'complete' && e.refId === habitId && e.date) set.add(e.date)
  }
  return set
}

// ---------------------------------------------------------------------------
// walk() — the single HP/XP mapping from an event log.
// ---------------------------------------------------------------------------

function walk(events) {
  const sorted = [...events].sort((a, b) => a.ts - b.ts)
  let xp = 0
  let hp = HP_MAX
  let level = 1
  const levelUpEvents = []
  const faintEvents = []

  for (const e of sorted) {
    if (e.type === 'complete') xp += e.xp ?? 0
    else if (e.type === 'miss') hp += e.hp ?? 0
    else if (e.type === 'perfect_day') hp += e.hp ?? 0
    else if (e.type === 'faint') hp = HP_FAINT_RESET
    else if (e.type === 'level_up') hp = HP_MAX

    while (xp >= xpForNextLevelAtLevel(level)) {
      level++
      hp = HP_MAX
      levelUpEvents.push({ level, ts: e.ts + 0.001 })
    }

    if (hp <= 0) {
      hp = 0
      faintEvents.push({ ts: e.ts + 0.001 })
      hp = HP_FAINT_RESET
    }

    if (hp > HP_MAX) hp = HP_MAX
  }

  return { xp, hp, level, levelUpEvents, faintEvents }
}

// ---------------------------------------------------------------------------
// reconcile() — pure. Returns { state, appended }.
// ---------------------------------------------------------------------------

function reconcile(state) {
  const today = todayStr()
  const pastDays = dateRange(state.character.createdAt, today)

  const existing = new Set(
    state.events.map((e) => `${e.type}:${e.refId ?? ''}:${e.date ?? ''}`)
  )
  const completedOn = (habitId, dateStr) =>
    existing.has(`complete:${habitId}:${dateStr}`)

  const appended = []

  for (const day of pastDays) {
    for (const habit of state.habits) {
      if (!isHabitScheduledOn(habit, day)) continue
      if (completedOn(habit.id, day)) continue
      const key = `miss:${habit.id}:${day}`
      if (existing.has(key)) continue
      appended.push({
        id: newId(),
        type: 'miss',
        refType: 'habit',
        refId: habit.id,
        date: day,
        hp: HP_MISS,
        ts: dateToTs(day, 12),
      })
      existing.add(key)
    }
  }

  for (const day of pastDays) {
    const scheduled = state.habits.filter((h) => isHabitScheduledOn(h, day))
    const allDone = scheduled.every((h) => completedOn(h.id, day))
    if (!allDone) continue
    const key = `perfect_day::${day}`
    if (existing.has(key)) continue
    appended.push({
      id: newId(),
      type: 'perfect_day',
      date: day,
      hp: HP_PERFECT,
      ts: dateToTs(day, 23),
    })
    existing.add(key)
  }

  const combined = [...state.events, ...appended]
  const { levelUpEvents, faintEvents } = walk(combined)

  const existingLevelUps = combined.filter((e) => e.type === 'level_up').length
  const existingFaints = combined.filter((e) => e.type === 'faint').length

  const newLevelUps = levelUpEvents.slice(existingLevelUps)
  const newFaints = faintEvents.slice(existingFaints)

  for (const lu of newLevelUps) {
    appended.push({
      id: newId(),
      type: 'level_up',
      date: today,
      level: lu.level,
      ts: Date.now(),
    })
  }
  for (const _f of newFaints) {
    appended.push({
      id: newId(),
      type: 'faint',
      date: today,
      ts: Date.now(),
    })
  }

  if (appended.length === 0) return { state, appended: [] }

  const nextEvents = [...state.events, ...appended]
  nextEvents.sort((a, b) => a.ts - b.ts)
  return { state: { ...state, events: nextEvents }, appended }
}

function dateToTs(dateStr, hour) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, hour, 0, 0, 0).getTime()
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

function deriveCharacter(state) {
  const { xp, hp, level } = walk(state.events)
  return {
    name: state.character.name,
    createdAt: state.character.createdAt,
    xp,
    hp,
    hpMax: HP_MAX,
    level,
    xpIntoLevel: xpIntoLevel(xp),
    xpForNextLevel: xpForNextLevel(xp),
  }
}

function streakFor(habit, events) {
  const completed = completedDatesFor(habit.id, events)
  const today = todayStr()
  let streak = 0
  let cursor = today
  for (let i = 0; i < 365 * 5; i++) {
    if (cursor < habit.createdAt) break
    const scheduled = isHabitScheduledOn(habit, cursor)
    if (scheduled) {
      if (completed.has(cursor)) {
        streak++
      } else if (cursor !== today) {
        break
      }
    }
    cursor = addDays(cursor, -1)
  }
  return streak
}

function deriveHeatmap(state) {
  const today = todayStr()
  const from = addDays(today, -(HEATMAP_DAYS - 1))
  const days = dateRange(from, addDays(today, 1))

  // Map habitId -> habit so completions can be filtered by whether the
  // habit was scheduled on the completion date.
  const habitById = new Map(state.habits.map((h) => [h.id, h]))

  // completedByDate: date -> Set of habitIds completed that date.
  // Using a Set dedupes in case duplicate complete events exist (defensive).
  // Only counting completions of habits scheduled on that date keeps the
  // numerator consistent with `scheduled` below — a habit archived after
  // completion stops counting, and its past completions still count for the
  // days it was scheduled.
  const completedByDate = new Map()
  for (const e of state.events) {
    if (e.type !== 'complete' || !e.date || e.refType !== 'habit') continue
    const habit = habitById.get(e.refId)
    if (!habit) continue
    if (!isHabitScheduledOn(habit, e.date)) continue
    if (!completedByDate.has(e.date)) completedByDate.set(e.date, new Set())
    completedByDate.get(e.date).add(e.refId)
  }

  return days.map((date) => {
    const scheduled = state.habits.filter((h) =>
      isHabitScheduledOn(h, date)
    ).length
    const completed = completedByDate.get(date)?.size ?? 0
    return {
      date,
      completed,
      scheduled,
      isPerfect: scheduled > 0 && completed >= scheduled,
    }
  })
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
//
// Celebration policy (simplified in M4.5):
//   - Only events appended DURING THE LIVE SESSION trigger the overlay/modal.
//   - Reconciliation on mount is catch-up. If it appends 300 misses and a
//     faint, that's history, not a moment. The visible signal is HP = 50 and
//     a heatmap full of misses. No modal.
//
// This is deliberate. It's also StrictMode-safe: no reliance on the initial
// useState value surviving React's dev-mode double-mount.

export function useQuestLog() {
  const [state, setState] = useState(() => {
    const { state: loaded } = loadState()
    const { state: reconciled } = reconcile(loaded)
    return reconciled
  })

  const [pendingCelebration, setPendingCelebration] = useState(null)
  const lastEventCountRef = useRef(state.events.length)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const prevCount = lastEventCountRef.current
    const newEvents = state.events.slice(prevCount)
    const levelUp = newEvents.find((e) => e.type === 'level_up')
    const faint = newEvents.find((e) => e.type === 'faint')
    if (levelUp) setPendingCelebration({ kind: 'level_up', event: levelUp })
    else if (faint) setPendingCelebration({ kind: 'faint', event: faint })
    lastEventCountRef.current = state.events.length
  }, [state.events])

  const clearCelebration = useCallback(() => setPendingCelebration(null), [])

  // ---- mutations -----------------------------------------------------------

  const mutate = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev)
      const { state: reconciled } = reconcile(next)
      return reconciled
    })
  }, [])

  const addHabit = useCallback(
    ({ name, icon, difficulty, schedule }) => {
      const habit = {
        id: newId(),
        name: name.trim(),
        icon: icon || '⭐',
        difficulty,
        schedule: [...schedule].sort(),
        createdAt: todayStr(),
        archivedAt: null,
      }
      mutate((s) => ({ ...s, habits: [...s.habits, habit] }))
      return habit.id
    },
    [mutate]
  )

  const editHabit = useCallback(
    (id, patch) => {
      mutate((s) => ({
        ...s,
        habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      }))
    },
    [mutate]
  )

  const deleteHabit = useCallback(
    (id) => {
      mutate((s) => ({
        ...s,
        habits: s.habits.map((h) =>
          h.id === id ? { ...h, archivedAt: todayStr() } : h
        ),
      }))
    },
    [mutate]
  )

  const toggleHabitToday = useCallback(
    (id) => {
      const today = todayStr()
      mutate((s) => {
        const habit = s.habits.find((h) => h.id === id)
        if (!habit) return s

        const hasComplete = s.events.some(
          (e) =>
            e.type === 'complete' && e.refId === id && e.date === today
        )

        if (hasComplete) {
          return {
            ...s,
            events: s.events.filter(
              (e) =>
                !(
                  e.type === 'complete' &&
                  e.refId === id &&
                  e.date === today
                ) && !(e.type === 'perfect_day' && e.date === today)
            ),
          }
        }

        const xp = XP_BY_DIFFICULTY[habit.difficulty] ?? 0
        const withComplete = [
          ...s.events,
          {
            id: newId(),
            type: 'complete',
            refType: 'habit',
            refId: id,
            date: today,
            xp,
            ts: Date.now(),
          },
        ]

        const scheduledToday = s.habits.filter((h) =>
          isHabitScheduledOn(h, today)
        )
        const completedToday = new Set(
          withComplete
            .filter((e) => e.type === 'complete' && e.date === today)
            .map((e) => e.refId)
        )
        const allDone =
          scheduledToday.length > 0 &&
          scheduledToday.every((h) => completedToday.has(h.id))
        const alreadyPerfect = withComplete.some(
          (e) => e.type === 'perfect_day' && e.date === today
        )

        if (allDone && !alreadyPerfect) {
          withComplete.push({
            id: newId(),
            type: 'perfect_day',
            date: today,
            hp: HP_PERFECT,
            ts: Date.now(),
          })
        }

        return { ...s, events: withComplete }
      })
    },
    [mutate]
  )

  const addTodo = useCallback(
    ({ name, difficulty }) => {
      const todo = {
        id: newId(),
        name: name.trim(),
        difficulty,
        createdAt: todayStr(),
        completedAt: null,
        archivedAt: null,
      }
      mutate((s) => ({ ...s, todos: [...s.todos, todo] }))
      return todo.id
    },
    [mutate]
  )

  const toggleTodo = useCallback(
    (id) => {
      const today = todayStr()
      mutate((s) => {
        const todo = s.todos.find((t) => t.id === id)
        if (!todo) return s
        const isDone = !!todo.completedAt
        if (isDone) {
          return {
            ...s,
            todos: s.todos.map((t) =>
              t.id === id ? { ...t, completedAt: null } : t
            ),
            events: s.events.filter(
              (e) =>
                !(
                  e.type === 'complete' &&
                  e.refType === 'todo' &&
                  e.refId === id
                )
            ),
          }
        }
        const xp = XP_BY_DIFFICULTY[todo.difficulty] ?? 0
        return {
          ...s,
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, completedAt: today } : t
          ),
          events: [
            ...s.events,
            {
              id: newId(),
              type: 'complete',
              refType: 'todo',
              refId: id,
              date: today,
              xp,
              ts: Date.now(),
            },
          ],
        }
      })
    },
    [mutate]
  )

  const deleteTodo = useCallback(
    (id) => {
      mutate((s) => ({
        ...s,
        todos: s.todos.map((t) =>
          t.id === id ? { ...t, archivedAt: todayStr() } : t
        ),
      }))
    },
    [mutate]
  )

  const renameCharacter = useCallback(
    (name) => {
      mutate((s) => ({
        ...s,
        character: { ...s.character, name: name.trim() || 'Adventurer' },
      }))
    },
    [mutate]
  )

  const resetAll = useCallback(() => {
    resetState()
    const fresh = seedState()
    saveState(fresh)
    const { state: reconciled } = reconcile(fresh)
    setState(reconciled)
    lastEventCountRef.current = reconciled.events.length
    setPendingCelebration(null)
  }, [])

  // ---- derived -------------------------------------------------------------

  const character = useMemo(() => deriveCharacter(state), [state])

  const habitsWithStreaks = useMemo(
    () =>
      state.habits
        .filter((h) => !h.archivedAt)
        .map((h) => ({
          ...h,
          streak: streakFor(h, state.events),
          scheduledToday: isHabitScheduledOn(h, todayStr()),
          completedToday: state.events.some(
            (e) =>
              e.type === 'complete' &&
              e.refId === h.id &&
              e.date === todayStr()
          ),
        })),
    [state]
  )

  const todos = useMemo(
    () => state.todos.filter((t) => !t.archivedAt),
    [state]
  )

  const heatmap = useMemo(() => deriveHeatmap(state), [state])

  return {
    state,
    character,
    habits: habitsWithStreaks,
    todos,
    heatmap,
    pendingCelebration,
    clearCelebration,
    addHabit,
    editHabit,
    deleteHabit,
    toggleHabitToday,
    addTodo,
    toggleTodo,
    deleteTodo,
    renameCharacter,
    resetAll,
  }
}