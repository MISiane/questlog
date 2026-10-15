import Button from './Button'

// Reusable empty-state block. Border-dashed, centered, one optional action.
export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
      <p className="text-sm text-text-muted">{message}</p>
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="primary"
          className="mt-3"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}