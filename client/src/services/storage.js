// localStorage persistence + seeding + the append-only event helpers.
// This module is the ONLY place that touches localStorage.
// It is intentionally dumb: load/save/validate/seed/reset. No derivation.

import { newId } from '../utils/id'
import { todayStr } from '../utils/date'

export const STORAGE_KEY = 'questlog.v1'
export const SCHEMA_VERSION = 1

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
  const mk = (name, icon, difficulty, schedule) => ({
    id: newId(),
    name,
    icon,
    difficulty,
    schedule,
    createdAt: today,
    archivedAt: null,
  })
  const everyDay = [0, 1, 2, 3, 4, 5, 6]
  return {
    ...emptyState(),
    habits: [
      mk('Drink water', '💧', 'easy', everyDay),
      mk('Read 20 pages', '📖', 'medium', everyDay),
      mk('Workout', '🏋️', 'hard', [1, 3, 5]), // Mon/Wed/Fri
    ],
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
    Array.isArray(s.todos) &&
    Array.isArray(s.events)
  )
}

export function loadState() {
  let raw = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private mode / disabled storage — fall through to seed.
    return { state: seedState(), seeded: true }
  }
  if (!raw) {
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }
  try {
    const parsed = JSON.parse(raw)
    if (!isValidState(parsed)) throw new Error('Invalid state shape')
    return { state: parsed, seeded: false }
  } catch {
    // Corrupt data — reseed rather than crash. (We do NOT delete their
    // data silently in a real product; here we've decided a clean reseed
    // is the friendlier failure for a personal v1.)
    const seeded = seedState()
    saveState(seeded)
    return { state: seeded, seeded: true }
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Swallow quota / private-mode errors. The in-memory state is still
    // valid for this session.
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}