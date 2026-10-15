import { useState } from 'react'
import Card from './Card'
import Button from './Button'
import SectionHeading from './SectionHeading'
import ConfirmDialog from './ConfirmDialog'

export default function SettingsCard({ onReset }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Card>
        <SectionHeading tone="text-text-muted">Settings</SectionHeading>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-text">Reset all progress</p>
            <p className="mt-0.5 text-xs text-text-muted">
              Wipes XP, HP, streaks, quests, and to-dos. Sample quests come back.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Reset
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="Reset everything?"
        message="This deletes all your progress — XP, levels, streaks, quests, and to-dos. It can't be undone."
        confirmLabel="Reset all"
        onConfirm={() => {
          onReset()
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}