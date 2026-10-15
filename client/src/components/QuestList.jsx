import Card from './Card'
import Button from './Button'
import SectionHeading from './SectionHeading'
import QuestItem from './QuestItem'
import EmptyState from './EmptyState'

export default function QuestList({
  habits,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
}) {
  const scheduledToday = habits.filter((h) => h.scheduledToday)
  const offToday = habits.filter((h) => !h.scheduledToday)
  const ordered = [...scheduledToday, ...offToday]

  return (
    <Card>
      <SectionHeading
        tone="text-complete"
        action={
          <Button size="sm" variant="primary" onClick={onAdd}>
            + Add
          </Button>
        }
      >
        Today's Quests
      </SectionHeading>

      {habits.length === 0 ? (
        <EmptyState
          message="Your quest log is empty."
          actionLabel="Add your first quest"
          onAction={onAdd}
        />
      ) : (
        <>
          {scheduledToday.length === 0 && (
            <p className="mb-3 text-sm text-text-muted">
              No quests today. Enjoy the rest, hero.
            </p>
          )}
          <ul className="space-y-2">
            {ordered.map((h) => (
              <QuestItem
                key={h.id}
                habit={h}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}