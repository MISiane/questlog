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
// is lexicographic: [10, 2] sorts as [10, 2], and even for 0..6 the wrong
// comparator is a footgun).
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
// Returns a new habit object; does not mutate the input.
export function setSchedule(habit, fromDate, days) {
  const normalized = normalizeDays(days)
  const existing = Array.isArray(habit.scheduleHistory)
    ? habit.scheduleHistory
    : []

  // Find an entry with from === fromDate.
  let replaced = false
  const next = existing.map((entry) => {
    if (entry && entry.from === fromDate) {
      replaced = true
      return { from: fromDate, days: normalized }
    }
    return { from: entry.from, days: normalizeDays(entry.days) }
  })

  if (!replaced) next.push({ from: fromDate, days: normalized })

  // Keep history sorted by `from` ascending. Sorting here means lookups
  // never have to assume order, but it also makes debugging easier.
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
    // Either empty (a habit whose history was cleared, will fall back to
    // flat schedule) or every entry is well-formed.
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

function isValidEvent(e) {
  return (
    e &&
    typeof e === 'object' &&
    typeof e.id === 'string' &&
    typeof e.type === 'string'
  )
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
// Wraps pre-M7.3 habits (flat `schedule`, no `scheduleHistory`) into the new
// shape. Purely additive: keeps `schedule` as a mirror, adds `scheduleHistory`
// with one entry `{ from: habit.createdAt, days: habit.schedule }`.
//
// Idempotent: running it on an already-migrated state is a no-op.
//
// Throws if a habit is malformed in a way we can't recover from. The caller
// routes that to backup + reseed.

function migrate(state) {
  if (!state || typeof state !== 'object') return state
  if (!Array.isArray(state.habits)) return state

  const today = todayStr()

  const habits = state.habits.map((h) => {
    if (!h || typeof h !== 'object') {
      throw new Error('migrate: malformed habit')
    }

    const hasHistory =
      Array.isArray(h.scheduleHistory) && h.scheduleHistory.length > 0

    if (hasHistory) {
      // Already migrated (or created post-M7.3). Ensure the mirror exists
      // and matches the latest history entry. Don't touch history.
      const days = scheduleOn(h, today) ?? normalizeDays(h.schedule ?? [])
      return {
        ...h,
        schedule: normalizeDays(days),
        scheduleHistory: h.scheduleHistory.map((e) => ({
          from: e.from,
          days: normalizeDays(e.days),
        })),
      }
    }

    // Pre-M7.3: has flat schedule only. Wrap it.
    if (!Array.isArray(h.schedule)) {
      throw new Error('migrate: habit has no usable schedule')
    }
    if (typeof h.createdAt !== 'string') {
      throw new Error('migrate: habit missing createdAt')
    }

    const days = normalizeDays(h.schedule)
    return {
      ...h,
      schedule: days,
      scheduleHistory: [{ from: h.createdAt, days }],
    }
  })

  return { ...state, habits }
}

// ---------------------------------------------------------------------------
// Load / save / reset
// ---------------------------------------------------------------------------

// Write to a backup key, swallowing any storage error. A quota error here
// must not crash startup.
function writeBackup(key, raw) {
  if (typeof raw !== 'string') return
  try {
    localStorage.setItem(key, raw)
  } catch {
    // ignore
  }
}

export function loadState() {
  let raw = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage disabled. Nothing to back up. Seed fresh.
    return { state: seedState(), seeded: true }
  }

  if (!raw) {
    // First run. Seed without touching backups.
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Corrupt JSON. Back up and reseed.
    writeBackup(BACKUP_KEY, raw)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  // Before the FIRST migration of a pre-M7.3 save, make a rollback copy.
  // This never overwrites an existing pre-m73 backup (we only write if
  // the key is absent), so a bad second migration can't clobber a good
  // first one.
  const hasPreM73Backup = (() => {
    try {
      return localStorage.getItem(PRE_M73_KEY) !== null
    } catch {
      return true // if we can't read, don't try to write
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
    // Migration failed on a habit we can't recover. Back up, reseed.
    writeBackup(BACKUP_KEY, raw)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  if (!isValidState(migrated)) {
    writeBackup(BACKUP_KEY, raw)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }

  // If migration changed anything, persist the migrated shape immediately so
  // the next load reads a post-M7.3 save.
  const wasMigrated = migrated !== parsed
  if (wasMigrated) {
    saveState(migrated)
  }

  return { state: migrated, seeded: false }
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