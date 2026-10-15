
---

# PROJECT_STATE.md

_Last updated: Milestone 5 complete. v1 is feature-complete and QA-verified.

## What this is

**QuestLog** — a single-page, mobile-first React app that turns habits and to-dos into RPG quests. Completing a quest awards XP, levels up your character, and builds streaks. Missing scheduled days costs HP. **Frontend-only.** No backend, no database, no auth. All state lives in `localStorage` under the key `questlog.v1`, managed by a single `useQuestLog` hook.

## Stack (locked)

- **Vite + React (JavaScript)** — no TypeScript anywhere.
- **Tailwind CSS v4** via `@tailwindcss/vite`. **No `tailwind.config.js`.** **No `postcss.config.js`.** **No `@tailwind base/components/utilities` directives.** Design tokens live in `@theme {}` inside `client/src/index.css`. Custom keyframe animations live as plain CSS classes (`.ql-fade-in`, `.ql-pop-in`, `.ql-glow-pulse`, `.ql-hp-warn`) appended to `index.css`.
- **Zero runtime dependencies** beyond the Vite/React/Tailwind baseline. Every component is hand-rolled. **Do not add a dependency without explicit approval.**
- **Fonts:** Press Start 2P (headings, sparingly) + Inter (body) loaded via Google Fonts `<link>` in `client/index.html`.
- **No router.** Single page. `pages/` folder is reserved but **unused**.

## Hard rules for anyone (human or AI) continuing this project

1. **Do not create `server/` or `db/migrations/`.** This app has no backend.
2. **Do not add `tailwind.config.js` or `postcss.config.js`.** Tailwind v4 only.
3. **Do not add dependencies** without asking first.
4. **Do not restructure `client/src/`.** Keep the folder layout (`components/`, `hooks/`, `services/`, `utils/`, `assets/`).
5. **Dates are `YYYY-MM-DD` strings** in browser local time. "Today" is re-read on every render/mutation; no midnight timer.
6. **All XP / HP / streak / heatmap / level state is derived from an append-only `events` log.** Never mutate `character.xp` or `character.hp` directly.
7. **The event log's HP/XP walk lives in exactly one function: `walk()` in `useQuestLog.js`.** Both `reconcile()` and `deriveCharacter()` call it. Do not duplicate.
8. **Today is excluded from `reconcile()`.** Only past days produce `miss` and `perfect_day` events during reconciliation. Today's `perfect_day` is handled inside `toggleHabitToday`.
9. **Deleting a habit/todo archives it** (`archivedAt`), never hard-removes.
10. **When fixing anything touching more than a trivial constant, send the full file, not a diff.**
11. **Test snippets must derive dates relative to `new Date()`.** Never hardcode a date.
12. **The celebration model is deliberately live-session-only.** See the section below. Do not try to make reconciliation appends produce overlays.
13. **Flex rows that contain a truncating name need `min-w-0` on every flex ancestor in the chain.** Learned in M5 (B5). `truncate` alone does not work if any ancestor has default `min-width: auto`.
14. **The heatmap's `completed` count must only include completions of habits that were scheduled on that date.** See the section below. Do not count to-dos, do not count completions of habits archived before that date.

## Game rules (locked)

- **XP per completion:** easy = 10, medium = 25, hard = 50.
- **Level curve:** Level N requires `100 × N` XP to advance. Total XP to reach level L = `100 × L × (L−1) / 2`.
- **HP:** max 100. Missed scheduled day = −10. Unscheduled days = no change.
- **Perfect day:** all habits scheduled for that day completed, or zero habits scheduled (rest day). +5 HP. Recorded once per day.
- **Level-up:** full heal (HP → 100).
- **Faint:** HP ≤ 0 → clamp to 0, emit a `faint` event, restore HP to 50. All data and XP kept. No hard game over.
- **Streaks:** scheduled days only. Mon/Wed/Fri keeps its streak across Tue/Thu. Today does not break the streak if not yet completed.
- **XP is permanent** once earned. Deleting a habit or todo never refunds it.
- **Reset** wipes localStorage and re-seeds the sample habits **immediately** (no reload needed). Character name resets to "Adventurer".

## Data model (localStorage key: `questlog.v1`, schema version 1)

```js
{
  version: 1,
  character: { name: "Adventurer", createdAt: "YYYY-MM-DD" },
  habits: [{
    id, name, icon, difficulty: "easy"|"medium"|"hard",
    schedule: [0..6],        // 0 = Sunday, matches Date.getDay()
    createdAt, archivedAt
  }],
  todos: [{ id, name, difficulty, createdAt, completedAt, archivedAt }],
  events: [
    { id, type: "complete",    refType: "habit"|"todo", refId, date, xp, ts },
    { id, type: "miss",        refType: "habit", refId, date, hp, ts },
    { id, type: "perfect_day", date, hp, ts },
    { id, type: "level_up",    date, level, ts },
    { id, type: "faint",       date, ts },
    { id, type: "reset",       ts }
  ]
}
```

`character.xp` and `character.hp` are **not stored**. `deriveCharacter()` returns `{ name, createdAt, xp, hp, hpMax, level, xpIntoLevel, xpForNextLevel }`.

## Celebration model (deliberately non-obvious)

**Only events appended during the live session trigger the level-up overlay or the faint modal.** Reconciliation on mount is catch-up, not celebration. If a user is away for a month and comes back to HP 50, they see the number drop and a heatmap full of misses — no modal.

**Why:** The first version of M4 tried to surface reconciliation appends as celebrations and broke under React StrictMode's dev-mode double-mount — the `useState` initializer's return value doesn't survive a remount after effects have persisted state. The simpler model is correct UX and StrictMode-safe.

**Testing consequence:** there is no clean way to trigger a live faint in dev. The faint modal's wiring is verified by equivalence with the level-up overlay (same `pendingCelebration` state, same effect, same conditional in `App.jsx`) plus a force-render check of the component. Do not re-litigate.

## Heatmap rule (learned the hard way in M5)

`deriveHeatmap` counts **only completions of habits that were scheduled on that date**, and dedupes them in a Set. Specifically:

- To-dos are **not** counted (they have no schedule, so they can't contribute to a `completed / scheduled` ratio).
- A completion is only counted if `isHabitScheduledOn(habit, completion.date)` is true. This means an archived habit's past completions still count for the days it was scheduled, but stop counting from its `archivedAt` onward.
- Duplicates are absorbed by using a `Set` of habitIds per date.

If you change the heatmap, keep numerator and denominator derived from the same `isHabitScheduledOn` predicate. If they diverge, you get `6 / 3` cells, which is what M5 F1 caught.

## Flexbox rule (learned the hard way in M5)

`truncate` requires `min-w-0` on every flex ancestor in the chain. A flex item's default `min-width: auto` overrides `flex: 1 1 0%` and lets the item grow to fit its content. Rows that contain a truncating name need `min-w-0` on the `<li>` and the `<button>` (or equivalent flex wrapper). See `QuestItem.jsx` and `TodoItem.jsx`.

## Files currently in the project

```
questlog/
  README.md
  PROJECT_STATE.md
  client/
    index.html                          fonts + meta + #root
    vite.config.js                      react() + tailwindcss()
    package.json, package-lock.json
    eslint.config.js, .gitignore
    public/
      vite.svg
    src/
      main.jsx                          entry, imports index.css
      index.css                         Tailwind entry + @theme + @keyframes + .ql-* classes
      App.jsx                           dashboard composition + celebration routing
      assets/                           (empty)
      utils/
        id.js                           newId()
        date.js                         todayStr, dateToStr, strToDate, dayOfWeek, addDays, dateRange, daysBetween
        xp.js                           XP_BY_DIFFICULTY, totalXpToReach, levelFromXp, xpIntoLevel, xpForNextLevel
        constants.js                    DIFFICULTIES, DAYS, ICON_CHOICES, DEFAULT_ICON, DEFAULT_DIFFICULTY
      services/
        storage.js                      STORAGE_KEY, loadState, saveState, resetState, emptyState, seedState
      hooks/
        useQuestLog.js                  walk(), reconcile(), deriveCharacter(), streakFor(), deriveHeatmap()
      components/
        Button.jsx
        Card.jsx
        StatBar.jsx
        SectionHeading.jsx
        Modal.jsx                       accessible dialog (focus trap, Esc, backdrop)
        ConfirmDialog.jsx
        IconPicker.jsx
        DifficultyPicker.jsx
        SchedulePicker.jsx
        HabitForm.jsx
        TodoForm.jsx
        CharacterCard.jsx               name (inline edit), level, XP bar, HP bar, low-HP warning
        QuestItem.jsx                   min-w-0 chain applied
        QuestList.jsx                   shows "not today" even when nothing scheduled today
        TodoItem.jsx                    min-w-0 chain applied
        TodoList.jsx
        CompletedTodos.jsx              collapsed disclosure
        Heatmap.jsx                     140-day grid, newest-first, auto-scroll-right
        Collapsible.jsx
        SettingsCard.jsx
        EmptyState.jsx
        LevelUpOverlay.jsx              full-screen, CSS-only, auto-dismiss 3.5s
        FaintModal.jsx
```

## Milestones

- [x] **M0** — Bootstrap, Tailwind v4, fonts, docs.
- [x] **M1** — Data layer: utils, storage, `useQuestLog` with `walk`/`reconcile`/`derive*`.
- [x] **M1.5** — Single-pass `toggleHabitToday`, shared `walk()`.
- [x] **M2** — Core loop UI: character card, quests, to-dos, forms, modals.
- [x] **M2.5** — Fix `deriveCharacter` missing `name`; fix `CharacterCard` effect race.
- [x] **M3** — Heatmap, collapsed completed to-dos, settings card, reset.
- [x] **M3.5** — Reset re-seeds immediately; heatmap flipped to newest-first with auto-scroll-right.
- [x] **M4** — Level-up overlay, faint modal, empty states, low-HP warning, polish.
- [x] **M4.5** — Reverted celebration model to live-session-only (StrictMode fix).
- [x] **M5** — Manual QA pass against the brief's Must-haves. **Three bugs found and fixed:**
  - **B5** — `min-w-0` missing in `QuestItem`/`TodoItem` flex chains, long names overflowed the row.
  - **F1** — `deriveHeatmap` over-counted completions (todos counted, archived habits counted, duplicates not deduped). Produced `6 / 3` cells after toggling. Fixed to count only scheduled-habit completions, deduped.
  - **J5** — `QuestList` hid "not today" habits when nothing was scheduled today. Fixed to render them alongside a "No quests today" message.
- [ ] **M6 (deferred)** — Vercel deploy (frontend only).

## Known issues / accepted quirks

- **`TodoForm` accepts an `initial` prop and renders "Edit To-do"** but `App.jsx` never passes it. To-dos are add / complete / delete in v1. Adding edit is ~5 lines.
- **Habits not scheduled today render at the bottom of "Today's Quests"** with a "not today" tag, disabled. Deliberate.
- **Missed days are muted, not red.** Deliberate — red is reserved for HP and danger actions.
- **Corrupt localStorage is silently reseeded** in `loadState`. Deliberate for a personal v1.
- **No cleanup on `setTimeout` in `QuestItem`'s flash effect.** Cosmetic only.
- **Backdating a character's `createdAt` alone does not produce misses.** Each habit has its own `createdAt` gate. And writing to localStorage does not update React state — the running app won't see it until the next mount.
- **The heatmap's leftmost column may have padding cells** if the oldest date in the 140-day window isn't a Sunday. Cosmetic.
- **The celebration strip is gone.** M4 replaced the M2 temp strip with the real overlay + modal.

## Out of scope for v1

Accounts / auth, cloud sync, multiplayer / parties / leaderboards, shop / inventory / equipment, push notifications, custom avatar builder, AI features, light theme toggle, routing, backend, deploy.

## Deploy plan (M6, deferred)

Local only until you decide to ship. When ready: **Vercel (frontend only)**.

- Build command: `npm run build` (run from `client/`)
- Output directory: `client/dist`
- Root directory: `client` (if Vercel is pointed at the repo root)
- No environment variables needed. No backend. No Render, no Postgres, no pgAdmin, no Postman.
- The `vite.svg` favicon is a placeholder. Swap it for a real QuestLog favicon before the deploy if you care.
- The `README.md` currently says "Milestone 0 complete." Update before deploy.

## v1 status: done

Every Must-have from the brief is implemented and verified:

- [x] Create, edit, delete habits (daily or specific weekdays) and one-off to-dos
- [x] Check-off flow awards XP, with difficulty tiers (easy/medium/hard = 10/25/50 XP)
- [x] Character profile with level, XP progress bar, and HP
- [x] Streak counter per habit
- [x] Simple calendar heatmap of activity
- [x] Level-up moment (CSS overlay + celebratory copy)
- [x] Data saved in localStorage (no account or backend)
- [x] Works well on mobile screens

## Next step

Decide whether to schedule **M6 (Vercel deploy)** now or later. If later, the project is in a clean, shippable state and can be picked back up at any time. If now, the deploy is a 15-minute milestone: create the Vercel project, point it at the repo, set root to `client/`, ship. Then update `README.md` and swap the favicon.