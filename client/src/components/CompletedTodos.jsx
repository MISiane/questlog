import Card from './Card'
import SectionHeading from './SectionHeading'
import Collapsible from './Collapsible'
import TodoItem from './TodoItem'

// Completed to-dos, collapsed by default. Rendered separately from open
// to-dos so the open list stays uncluttered.
export default function CompletedTodos({ todos, onToggle, onDelete }) {
  const done = todos.filter((t) => !!t.completedAt)
  if (done.length === 0) return null

  return (
    <Card>
      <SectionHeading tone="text-text-muted">Completed</SectionHeading>
      <Collapsible title="Show completed to-dos" count={done.length}>
        <ul className="space-y-2 opacity-70">
          {done.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </Collapsible>
    </Card>
  )
}