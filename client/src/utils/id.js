// Small id helper. Uses the platform crypto.randomUUID when available
// (all modern browsers, secure contexts + localhost), falls back to a
// timestamp+random string so the app never throws in odd environments.

export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}