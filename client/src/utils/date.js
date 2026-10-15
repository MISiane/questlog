// Local-date helpers. All dates are 'YYYY-MM-DD' strings in the user's
// browser-local timezone. We never use ISO/UTC for "the date the user sees"
// because that shifts across timezones and breaks streaks.

export function todayStr() {
  return dateToStr(new Date())
}

export function dateToStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function strToDate(s) {
  // Parse as local midnight, not UTC. `new Date('2025-01-01')` is UTC and
  // shifts a day for negative-offset timezones.
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function dayOfWeek(dateStr) {
  return strToDate(dateStr).getDay() // 0 = Sunday .. 6 = Saturday
}

export function addDays(dateStr, n) {
  const d = strToDate(dateStr)
  d.setDate(d.getDate() + n)
  return dateToStr(d)
}

// Inclusive of `from`, exclusive of `to`. Returns [] if from >= to.
export function dateRange(from, to) {
  const out = []
  let cur = from
  while (cur < to) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

export function daysBetween(from, to) {
  const a = strToDate(from).getTime()
  const b = strToDate(to).getTime()
  return Math.round((b - a) / 86400000)
}