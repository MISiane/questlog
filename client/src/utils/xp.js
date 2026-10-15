// XP + level math. Pure functions, no state.

export const XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
}

// Level N requires 100 * N XP to advance from N to N+1.
// Total XP to reach level L (L >= 1): 100 * (1 + 2 + ... + (L-1)) = 100 * L*(L-1)/2
export function totalXpToReach(level) {
  if (level <= 1) return 0
  return 100 * ((level * (level - 1)) / 2)
}

// Given total XP, return current level (>= 1).
export function levelFromXp(totalXp) {
  let level = 1
  while (totalXp >= totalXpToReach(level + 1)) {
    level++
    if (level > 999) break // sanity stop
  }
  return level
}

// XP accumulated toward the next level (0 .. xpForNextLevel).
export function xpIntoLevel(totalXp) {
  const level = levelFromXp(totalXp)
  return totalXp - totalXpToReach(level)
}

// XP required to go from current level to next.
export function xpForNextLevel(totalXp) {
  const level = levelFromXp(totalXp)
  return 100 * level
}