import Modal from './Modal'
import Button from './Button'

export default function FaintModal({ open, onClose }) {
  const headingId = 'faint-modal-title'
  return (
    <Modal open={open} onClose={onClose} labelledBy={headingId} maxWidth="max-w-sm">
      <div className="text-center">
        <p className="font-pixel text-[10px] leading-relaxed text-hp">
          YOU FAINTED
        </p>
        <h3
          id={headingId}
          className="mt-4 text-base font-semibold text-text"
        >
          Take a breath, hero.
        </h3>
        <p className="mt-3 text-sm text-text-muted">
          A few quests slipped past you and your health ran out. Nothing is
          lost — your XP and progress are safe. HP is restored to 50 so you
          can keep going.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={onClose}>
            Onward
          </Button>
        </div>
      </div>
    </Modal>
  )
}