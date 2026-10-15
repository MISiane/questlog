export const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', xp: 10 },
  { key: 'medium', label: 'Medium', xp: 25 },
  { key: 'hard', label: 'Hard', xp: 50 },
]

export const DIFFICULTY_LABEL = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const DIFFICULTY_XP = {
  easy: 10,
  medium: 25,
  hard: 50,
}

// Order matches JS Date.getDay(): 0 = Sunday.
export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const DAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// Small curated emoji set. Enough to feel expressive without a wall of
// choice. Users can type their own into the name field if they want; we
// don't expose a free emoji input in v1.
export const ICON_CHOICES = [
  '💧', '📖', '🏋️', '🧘', '🏃', '🥗', '💤', '🚶',
  '🎯', '📝', '💻', '🎸', '🎨', '🧹', '💊', '☀️',
  '🌱', '🍎', '☕', '🛁', '🧠', '❤️', '⭐', '🔥',
]

export const DEFAULT_ICON = '⭐'
export const DEFAULT_DIFFICULTY = 'medium'