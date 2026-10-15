import Card from './Card'
import Button from './Button'
import SectionHeading from './SectionHeading'
import TodoItem from './TodoItem'
import EmptyState from './EmptyState'

export default function TodoList({ todos, onAdd, onToggle, onDelete }) {
  const open = todos.filter((t) => !t.completedAt)

  return (
    <Card>
      <SectionHeading
        tone="text-arcane"
        action={
          <Button size="sm" variant="arcane" onClick={onAdd}>
            + Add
          </Button>
        }
      >
        To-dos
      </SectionHeading>

      {open.length === 0 ? (
        <EmptyState
          message="No open to-dos right now."
          actionLabel="Add a to-do"
          onAction={onAdd}
        />
      ) : (
        <ul className="space-y-2">
          {open.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}