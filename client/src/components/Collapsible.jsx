import { useId, useState } from 'react'

// Accessible disclosure. The trigger is a real button with aria-expanded and
// aria-controls pointing at the panel. Panel is hidden from the a11y tree
// when closed. Keyboard: Tab to trigger, Enter/Space to toggle.
//
// We don't animate height here — content is small and animating height in
// CSS reliably requires either max-height guessing or a ResizeObserver. M4
// can add a fade if it feels needed.
export default function Collapsible({
  title,
  count,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-[10px] uppercase tracking-wide text-text-dim transition hover:text-text-muted"
      >
        <span>
          {title}
          {typeof count === 'number' && (
            <span className="ml-1 text-text-dim">({count})</span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}
        >
          ▸
        </span>
      </button>
      <div id={panelId} hidden={!open} className="mt-2">
        {children}
      </div>
    </div>
  )
}