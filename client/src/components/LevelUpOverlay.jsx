    import { useEffect } from 'react'

// Full-screen celebratory overlay. Dismissed by: auto-timer, click anywhere,
// Escape key. Respects prefers-reduced-motion via the global CSS rule (the
// .ql-* animations get their duration clamped to ~0, so it appears instantly
// and just sits there until dismissed).
//
// Flavor text is chosen deterministically from the level number so the same
// level always reads the same, but different levels feel different.

const FLAVOR = [
  'The dragon was defeated.',
  'A new chapter begins.',
  'Your legend grows.',
  'The guild takes notice.',
  'Steel sharpens steel.',
  'Another peak conquered.',
]

function flavorFor(level) {
  return FLAVOR[level % FLAVOR.length]
}

export default function LevelUpOverlay({ level, onDismiss }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onDismiss()
      }
    }
    document.addEventListener('keydown', onKey)
    const timer = setTimeout(onDismiss, 3500)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [onDismiss])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Level up. You reached level ${level}.`}
      onClick={onDismiss}
      className="ql-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
    >
      <div
        className="ql-pop-in ql-glow-pulse w-full max-w-sm rounded-2xl border border-gold bg-surface p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-pixel text-[10px] leading-relaxed text-arcane">
          LEVEL UP
        </p>
        <p className="mt-4 font-pixel text-4xl leading-none text-gold">
          {level}
        </p>
        <p className="mt-5 text-sm text-text-muted">{flavorFor(level)}</p>
        <p className="mt-6 text-[10px] text-text-dim">
          tap anywhere to continue
        </p>
      </div>
    </div>
  )
}