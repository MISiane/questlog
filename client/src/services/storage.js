// localStorage persistence + seeding + migration.
// This module is the ONLY place that touches localStorage.
// It is intentionally dumb: load/save/validate/migrate/seed/reset.
// No derivation, no game rules.

import { newId } from '../utils/id'
import { todayStr } from '../utils/date'

export const STORAGE_KEY = 'questlog.v1'
export const BACKUP_KEY = 'questlog.v1.backup'
export const PRE_M73_KEY = 'questlog.v1.pre-m73'
export const SCHEMA_VERSION = 1

// ---------------------------------------------------------------------------
// Schedule history helpers (pure, exported so the hook can reuse them)
// ---------------------------------------------------------------------------

// Normalize a list of weekday numbers. Numeric sort (the default .sort()
// is lexicographic).
export function normalizeDays(days) {
  if (!Array.isArray(days)) return []
  const unique = new Set()
  for (const d of days) {
    const n = Number(d)
    if (Number.isInteger(n) && n >= 0 && n <= 6) unique.add(n)
  }
  return [...unique].sort((a, b) => a - b)
}

// Pick the schedule in effect on a given date from a habit's scheduleHistory.
// Returns null if no entry applies (i.e. date is before the earliest entry).
export function scheduleOn(habit, dateStr) {
  const history = habit.scheduleHistory
  if (Array.isArray(history) && history.length > 0) {
    let best = null
    for (const entry of history) {
      if (
        entry &&
        typeof entry.from === 'string' &&
        entry.from <= dateStr &&
        Array.isArray(entry.days)
      ) {
        if (best === null || entry.from > best.from) best = entry
      }
    }
    if (best) return best.days
  }
  // Fallback: flat schedule (pre-M7.3 saves, or a habit mid-migration).
  if (Array.isArray(habit.schedule)) return habit.schedule
  return null
}

// Write both scheduleHistory and the flat schedule mirror atomically.
// `fromDate` is the date the change takes effect. If an entry already exists
// for that date, its days are replaced (not duplicated).
//
// Returns a new habit object. If `days` normalizes to empty, returns the
// habit unchanged — empty schedules are not supported (matches
// isValidScheduleHistoryEntry, which rejects empty days).
export function setSchedule(habit, fromDate, days) {
  const normalized = normalizeDays(days)
  if (normalized.length === 0) return habit

  const existing = Array.isArray(habit.scheduleHistory)
    ? habit.scheduleHistory
    : []

  let replaced = false
  const next = existing.map((entry) => {
    if (entry && entry.from === fromDate) {
      replaced = true
      return { from: fromDate, days: normalized }
    }
    return { from: entry.from, days: normalizeDays(entry.days) }
  })

  if (!replaced) next.push({ from: fromDate, days: normalized })

  next.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0))

  return {
    ...habit,
    scheduleHistory: next,
    schedule: normalized, // mirror
  }
}

// ---------------------------------------------------------------------------
// State construction
// ---------------------------------------------------------------------------

export function emptyState() {
  const today = todayStr()
  return {
    version: SCHEMA_VERSION,
    character: {
      name: 'Adventurer',
      createdAt: today,
    },
    habits: [],
    todos: [],
    events: [],
  }
}

export function seedState() {
  const today = todayStr()

  const mk = (name, icon, difficulty, days) => {
    const id = newId()
    const base = {
      id,
      name,
      icon,
      difficulty,
      createdAt: today,
      archivedAt: null,
      scheduleHistory: [],
      schedule: [],
    }
    return setSchedule(base, today, days)
  }

  return {
    ...emptyState(),
    habits: [
      mk('Drink water', '💧', 'easy', [0, 1, 2, 3, 4, 5, 6]),
      mk('Read 20 pages', '📖', 'medium', [0, 1, 2, 3, 4, 5, 6]),
      mk('Workout', '🏋️', 'hard', [1, 3, 5]),
    ],
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidScheduleHistoryEntry(e) {
  return (
    e &&
    typeof e === 'object' &&
    typeof e.from === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.from) &&
    Array.isArray(e.days) &&
    e.days.length > 0 &&
    e.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  )
}

function isValidHabit(h) {
  if (!h || typeof h !== 'object') return false
  if (typeof h.id !== 'string') return false
  if (typeof h.name !== 'string') return false
  if (!['easy', 'medium', 'hard'].includes(h.difficulty)) return false
  if (!Array.isArray(h.schedule) && !Array.isArray(h.scheduleHistory)) {
    return false
  }
  if (h.scheduleHistory !== undefined) {
    if (!Array.isArray(h.scheduleHistory)) return false
    for (const e of h.scheduleHistory) {
      if (!isValidScheduleHistoryEntry(e)) return false
    }
  }
  return true
}

function isValidTodo(t) {
  return (
    t &&
    typeof t === 'object' &&
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    ['easy', 'medium', 'hard'].includes(t.difficulty)
  )
}

// Per-type event validation. Anything malformed here goes to backup + reseed
// rather than silently polluting walk().
function isValidEvent(e) {
  if (!e || typeof e !== 'object') return false
  if (typeof e.id !== 'string') return false
  if (typeof e.type !== 'string') return false

  switch (e.type) {
    case 'complete':
      return (
        (e.refType === 'habit' || e.refType === 'todo') &&
        typeof e.refId === 'string' &&
        typeof e.date === 'string' &&
        Number.isFinite(e.xp)
      )
    case 'miss':
      return (
        e.refType === 'habit' &&
        typeof e.refId === 'string' &&
        typeof e.date === 'string' &&
        Number.isFinite(e.hp)
      )
    case 'perfect_day':
      return typeof e.date === 'string' && Number.isFinite(e.hp)
    // Legacy event types. The app no longer writes these, but old logs may
    // contain them. walk() ignores them; here we only check they're shaped
    // well enough not to crash anything reading them.
    case 'level_up':
      return typeof e.date === 'string' && Number.isFinite(e.level)
    case 'faint':
      return typeof e.date === 'string'
    case 'reset':
      return true
    default:
      return false
  }
}

function isValidState(s) {
  return (
    s &&
    typeof s === 'object' &&
    s.version === SCHEMA_VERSION &&
    s.character &&
    typeof s.character.name === 'string' &&
    typeof s.character.createdAt === 'string' &&
    Array.isArray(s.habits) &&
    s.habits.every(isValidHabit) &&
    Array.isArray(s.todos) &&
    s.todos.every(isValidTodo) &&
    Array.isArray(s.events) &&
    s.events.every(isValidEvent)
  )
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------
// Wraps pre-M7.3 habits into the history shape. Purely additive: keeps
// `schedule` as a mirror, adds `scheduleHistory` with one entry.
//
// Idempotent. Returns { state, changed } — `changed` is true only if a habit
// was actually modified. This is what `loadState` uses to decide whether to
// persist, instead of a reference comparison (which was always true because
// map() creates a new object every call).
//
// Throws if a habit is malformed beyond recovery. The caller routes that to
// backup + reseed.

function migrate(state) {
  if (!state || typeof state !== 'object') return { state, changed: false }
  if (!Array.isArray(state.habits)) return { state, changed: false }

  const today = todayStr()
  let changed = false

  const habits = state.habits.map((h) => {
    if (!h || typeof h !== 'object') {
      throw new Error('migrate: malformed habit')
    }

    const hasHistory =
      Array.isArray(h.scheduleHistory) && h.scheduleHistory.length > 0

    if (hasHistory) {
      // Already migrated. Verify the mirror exists and matches the latest
      // history entry. If it already matches, return the habit unchanged so
      // `changed` stays false.
      const effective = scheduleOn(h, today) ?? normalizeDays(h.schedule ?? [])
      const normalizedEffective = normalizeDays(effective)
      const normalizedHistory = h.scheduleHistory.map((e) => ({
        from: e.from,
        days: normalizeDays(e.days),
      }))

      const mirrorMatches =
        Array.isArray(h.schedule) &&
        h.schedule.length === normalizedEffective.length &&
        h.schedule.every((d, i) => d === normalizedEffective[i])

      const historyAlreadyNormalized = h.scheduleHistory.every(
        (e, i) =>
          e.from === normalizedHistory[i].from &&
          Array.isArray(e.days) &&
          e.days.length === normalizedHistory[i].days.length &&
          e.days.every((d, j) => d === normalizedHistory[i].days[j])
      )

      if (mirrorMatches && historyAlreadyNormalized) {
        return h // unchanged
      }

      changed = true
      return {
        ...h,
        schedule: normalizedEffective,
        scheduleHistory: normalizedHistory,
      }
    }

    // Pre-M7.3: flat schedule only. Wrap it.
    if (!Array.isArray(h.schedule)) {
      throw new Error('migrate: habit has no usable schedule')
    }
    if (typeof h.createdAt !== 'string') {
      throw new Error('migrate: habit missing createdAt')
    }

    changed = true
    const days = normalizeDays(h.schedule)
    return {
      ...h,
      schedule: days,
      scheduleHistory: [{ from: h.createdAt, days }],
    }
  })

  if (!changed) return { state, changed: false }
  return { state: { ...state, habits }, changed: true }
}

// ---------------------------------------------------------------------------
// Load / save / reset
// ---------------------------------------------------------------------------

function writeBackup(key, raw) {
  if (typeof raw !== 'string') return
  try {
    localStorage.setItem(key, raw)
  } catch (err) {
    // A quota or disabled-storage error here means the backup didn't happen.
    // Log so it's visible in devtools; the app still reseeds.
    console.warn(`[QuestLog] backup to "${key}" failed:`, err)
  }
}

export function loadState() {
  let raw = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { state: seedState(), seeded: true }
  }

  if (!raw) {
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    writeBackup(BACKUP_KEY, raw)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  // Before the FIRST migration of a pre-M7.3 save, make a rollback copy.
  // Never overwrites an existing pre-m73 backup.
  const hasPreM73Backup = (() => {
    try {
      return localStorage.getItem(PRE_M73_KEY) !== null
    } catch {
      return true // can't read → don't try to write
    }
  })()
  const looksLikePreM73 =
    parsed &&
    Array.isArray(parsed.habits) &&
    parsed.habits.some((h) => !Array.isArray(h?.scheduleHistory))
  if (looksLikePreM73 && !hasPreM73Backup) {
    writeBackup(PRE_M73_KEY, raw)
  }

  let migrated
  try {
    migrated = migrate(parsed)
  } catch {
    writeBackup(BACKUP_KEY, raw)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  if (!isValidState(migrated.state)) {
    writeBackup(BACKUP_KEY, raw)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  // Persist only if migration actually changed something.
  if (migrated.changed) {
    saveState(migrated.state)
  }

  return { state: migrated.state, seeded: false }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Swallow quota / private-mode errors. In-memory state is still valid.
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}