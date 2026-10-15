import { useEffect, useRef } from 'react'

// Accessible dialog. Focus moves into the modal on open, is trapped while
// open, and returns to the previously focused element on close. Esc closes.
// Backdrop click closes. Uses a real <dialog>-like pattern with role +
// aria-modal since we're rendering our own overlay.
export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
  maxWidth = 'max-w-md',
}) {
  const panelRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement

    // Move focus into the panel. Prefer the first focusable element; if
    // there isn't one, focus the panel itself so Esc and Tab are scoped.
    const panel = panelRef.current
    if (panel) {
      const focusable = panel.querySelector(
        'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable || panel).focus()
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusable = Array.from(
        panel.querySelectorAll(
          'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.disabled && el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const prev = previousFocusRef.current
      if (prev && typeof prev.focus === 'function') prev.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl sm:p-6`}
      >
        {children}
      </div>
    </div>
  )
}