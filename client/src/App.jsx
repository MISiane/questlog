import { useState } from 'react'
import { useQuestLog } from './hooks/useQuestLog'
import CharacterCard from './components/CharacterCard'
import QuestList from './components/QuestList'
import TodoList from './components/TodoList'
import CompletedTodos from './components/CompletedTodos'
import Heatmap from './components/Heatmap'
import SettingsCard from './components/SettingsCard'
import HabitForm from './components/HabitForm'
import TodoForm from './components/TodoForm'
import ConfirmDialog from './components/ConfirmDialog'
import LevelUpOverlay from './components/LevelUpOverlay'
import FaintModal from './components/FaintModal'

export default function App() {
  const {
    character,
    habits,
    todos,
    heatmap,
    addHabit,
    editHabit,
    deleteHabit,
    toggleHabitToday,
    addTodo,
    toggleTodo,
    deleteTodo,
    renameCharacter,
    resetAll,
    pendingCelebration,
    clearCelebration,
  } = useQuestLog()


  const [habitForm, setHabitForm] = useState({ open: false, habit: null })
  const [todoForm, setTodoForm] = useState({ open: false, todo: null })
  const [confirm, setConfirm] = useState(null)

  // ---- Habit form handlers ------------------------------------------------

  const openAddHabit = () => setHabitForm({ open: true, habit: null })
  const openEditHabit = (habit) => setHabitForm({ open: true, habit })
  const closeHabitForm = () => setHabitForm({ open: false, habit: null })

  const submitHabit = (values) => {
    if (habitForm.habit) editHabit(habitForm.habit.id, values)
    else addHabit(values)
    closeHabitForm()
  }

  const askDeleteHabit = (habit) => {
    setConfirm({
      title: 'Delete quest?',
      message: `Delete "${habit.name}"? Your XP and history stay. This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        deleteHabit(habit.id)
        setConfirm(null)
      },
    })
  }

  // ---- Todo form handlers -------------------------------------------------

  const openAddTodo = () => setTodoForm({ open: true, todo: null })
  const closeTodoForm = () => setTodoForm({ open: false, todo: null })

  const submitTodo = (values) => {
    if (!todoForm.todo) addTodo(values)
    closeTodoForm()
  }

  const askDeleteTodo = (todo) => {
    setConfirm({
      title: 'Delete to-do?',
      message: `Delete "${todo.name}"? This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        deleteTodo(todo.id)
        setConfirm(null)
      },
    })
  }

  // ---- Celebration routing ------------------------------------------------

  const celebrationKind = pendingCelebration?.kind ?? null

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <h1 className="font-pixel text-lg leading-relaxed text-gold">
            QuestLog
          </h1>
          <p className="mt-1 text-xs text-text-dim">
            Turn your habits into quests. Level up, hero.
          </p>
        </header>

        <div className="space-y-5">
          <CharacterCard
            character={character}
            onRename={renameCharacter}
          />

          <QuestList
            habits={habits}
            onAdd={openAddHabit}
            onToggle={toggleHabitToday}
            onEdit={openEditHabit}
            onDelete={askDeleteHabit}
          />

          <TodoList
            todos={todos}
            onAdd={openAddTodo}
            onToggle={toggleTodo}
            onDelete={askDeleteTodo}
          />

          <CompletedTodos
            todos={todos}
            onToggle={toggleTodo}
            onDelete={askDeleteTodo}
          />

          <Heatmap heatmap={heatmap} />

          <SettingsCard onReset={resetAll} />
        </div>

        <footer className="mt-10 text-center text-[10px] text-text-dim">
         - questlog v1 -
        </footer>
      </main>

      <HabitForm
        open={habitForm.open}
        initial={habitForm.habit}
        onSubmit={submitHabit}
        onCancel={closeHabitForm}
      />

      <TodoForm
        open={todoForm.open}
        initial={todoForm.todo}
        onSubmit={submitTodo}
        onCancel={closeTodoForm}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        onConfirm={() => confirm?.onConfirm?.()}
        onCancel={() => setConfirm(null)}
      />

      {celebrationKind === 'level_up' && (
  <LevelUpOverlay
    level={pendingCelebration.level}
    onDismiss={clearCelebration}
  />
)}

      {celebrationKind === 'faint' && (
        <FaintModal open onClose={clearCelebration} />
      )}
    </div>
  )
}