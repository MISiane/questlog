import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const headingId = 'confirm-dialog-title'
  return (
    <Modal open={open} onClose={onCancel} labelledBy={headingId} maxWidth="max-w-sm">
      <h3 id={headingId} className="font-pixel text-[11px] leading-relaxed text-text">
        {title}
      </h3>
      {message && (
        <p className="mt-3 text-sm text-text-muted">{message}</p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}