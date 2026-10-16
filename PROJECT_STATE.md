
---

# PROJECT_STATE.md

_Last updated: Milestone 6 complete. QuestLog v1 is deployed._

## What this is

**QuestLog** — a single-page, mobile-first React app that turns habits and to-dos into RPG quests. Completing a quest awards XP, levels up your character, and builds streaks. Missing scheduled days costs HP. **Frontend-only.** No backend, no database, no auth. All state lives in `localStorage` under the key `questlog.v1`, managed by a single `useQuestLog` hook.

- **Repo:** https://github.com/MISiane/questlog (public, `main`)
- **Live:** https://questlog-by-edriane.vercel.app 

## Stack (locked)

- **Vite + React (JavaScript)** — no TypeScript anywhere.
- **Tailwind CSS v4** via `@tailwindcss/vite`. **No `tailwind.config.js`.** **No `postcss.config.js`.** **No `@tailwind base/components/utilities` directives.** Design tokens live in `@theme {}` in `client/src/index.css`. Custom keyframes live as plain CSS classes (`.ql-fade-in`, `.ql-pop-in`, `.ql-glow-pulse`, `.ql-hp-warn`).
- **Zero runtime dependencies** beyond Vite/React/Tailwind. **Do not add a dependency without explicit approval.**
- **Fonts:** Press Start 2P (headings, sparingly) + Inter (body) via Google Fonts `<link>`.
- **No router.** Single page. `pages/` folder is reserved but unused.
- **Deploy:** Vercel, Hobby tier, root directory `client/`. Static site, no functions, no env vars.

## Hard rules for anyone (human or AI) continuing this project

1. **Do not create `server/` or `db/migrations/`.** No backend.
2. **Do not add `tailwind.config.js` or `postcss.config.js`.** Tailwind v4 only.
3. **Do not add dependencies** without asking first.
4. **Do not restructure `client/src/`.** Keep `components/`, `hooks/`, `services/`, `utils/`, `assets/`.
5. **Dates are `YYYY-MM-DD` strings** in browser local time. "Today" is re-read on every render/mutation; no midnight timer.
6. **All XP / HP / streak / heatmap / level state is derived from an append-only `events` log.** Never mutate `character.xp` or `character.hp` directly.
7. **The HP/XP walk lives in exactly one function: `walk()` in `useQuestLog.js`.** Both `reconcile()` and `deriveCharacter()` call it. Do not duplicate.
8. **Today is excluded from `reconcile()`.** Today's `perfect_day` is handled inside `toggleHabitToday`.
9. **Deleting a habit/todo archives it** (`archivedAt`), never hard-removes.
10. **When fixing anything touching more than a trivial constant, send the full file, not a diff.**
11. **Test snippets must derive dates relative to `new Date()`.** Never hardcode a date.
12. **The celebration model is deliberately live-session-only.** Reconciliation appends do not produce overlays. Do not re-litigate.
13. **`truncate` needs `min-w-0` on every flex ancestor.** See `QuestItem.jsx` and `TodoItem.jsx`.
14. **The heatmap's `completed` count must only include completions of habits scheduled on that date, deduped.** Do not count to-dos. Do not count completions of habits archived before that date.

## Game rules (locked)

- **XP per completion:** easy 10, medium 25, hard 50.
- **Level curve:** Level N requires `100 × N` XP. Total XP to reach level L = `100 × L × (L−1) / 2`.
- **HP:** max 100. Missed scheduled day: −10. Perfect day (all scheduled done, or none scheduled): +5. Level-up: full heal. HP ≤ 0 → faint, HP restored to 50, nothing else lost.
- **Streaks:** scheduled days only. Today doesn't break the streak if not yet completed.
- **XP is permanent** once earned. Delete never refunds.
- **Reset** wipes localStorage, re-seeds sample habits immediately, resets name to "Adventurer".

## Data model (`localStorage` key: `questlog.v1`, schema v1)

```js
{
  version: 1,
  character: { name, createdAt },
  habits:   [{ id, name, icon, difficulty, schedule: [0..6], createdAt, archivedAt }],
  todos:    [{ id, name, difficulty, createdAt, completedAt, archivedAt }],
  events:   [
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

## File tree

```
quest-log/
  .gitignore
  README.md
  PROJECT_STATE.md
  client/
    index.html
    vite.config.js
    package.json / package-lock.json
    eslint.config.js
    .gitignore
    public/
      favicon.svg
    src/
      main.jsx
      index.css
      App.jsx
      assets/
      utils/         id.js, date.js, xp.js, constants.js
      services/      storage.js
      hooks/         useQuestLog.js
      components/    Button, Card, StatBar, SectionHeading, Modal, ConfirmDialog,
                     IconPicker, DifficultyPicker, SchedulePicker, HabitForm,
                     TodoForm, CharacterCard, QuestItem, QuestList, TodoItem,
                     TodoList, CompletedTodos, Heatmap, Collapsible,
                     SettingsCard, EmptyState, LevelUpOverlay, FaintModal
```

## Milestones

- [x] **M0** — Bootstrap, Tailwind v4, fonts, docs.
- [x] **M1** — Data layer: utils, storage, `useQuestLog`.
- [x] **M1.5** — Single-pass toggle, shared `walk()`.
- [x] **M2** — Core loop UI.
- [x] **M2.5** — `deriveCharacter` name fix; `CharacterCard` effect race fix.
- [x] **M3** — Heatmap, completed to-dos, settings, reset.
- [x] **M3.5** — Reset re-seeds immediately; heatmap newest-first.
- [x] **M4** — Level-up overlay, faint modal, empty states, low-HP warning, polish.
- [x] **M4.5** — Celebration model reverted to live-session-only (StrictMode-safe).
- [x] **M5** — Manual QA. Fixed B5 (flex min-w-0), F1 (heatmap over-count), J5 (QuestList hid "not today").
- [x] **M5.5** — Git + GitHub. Repo live, project moved to `C:\dev\quest-log`.
- [x] **M6** — Vercel deploy. Favicon replaced, live URL, auto-deploy on push.

## Known issues / accepted quirks

- **`TodoForm` accepts `initial` but `App.jsx` never passes it.** To-dos are add/complete/delete only. Adding edit is ~5 lines.
- **"Not today" habits render at the bottom of Today's Quests**, disabled. Deliberate.
- **Missed days are muted, not red.** Deliberate — red is reserved for HP.
- **Corrupt localStorage silently reseeds.** Deliberate for a personal v1.
- **`QuestItem`'s flash `setTimeout` isn't cleaned up on unmount.** Cosmetic.
- **Backdating `createdAt` alone doesn't produce misses** — habits have their own `createdAt` gate. And writing to localStorage does not update running React state.
- **Heatmap's leftmost column may have padding cells** if the oldest date isn't a Sunday. Cosmetic.
- **No LICENSE file.** All rights reserved by default. Add MIT if it should be open-source.
- **Repo lives at `C:\dev\quest-log`, not OneDrive.** Don't move it back.
- **localStorage is per-origin.** `localhost:5173` and the Vercel URL have separate stores.

## What's next (not scheduled)

Everything in the brief's Must-have list is done and shipped. If you come back to this project, here are the obvious directions:

1. **Edit to-dos** — small, ~5 lines.
2. **Light theme toggle** — a `prefers-color-scheme` block in `index.css` and a settings toggle.
3. **Export / import JSON** — a settings button that dumps `localStorage` to a file and restores it. Would solve the "how do I move my data between devices" problem without a backend.
4. **Week/month view of habits** — a second tab on the character card.
5. **Shop / rewards** — the "Not now" item from the original brief. Would be a proper M7.
6. **Custom avatar** — the other deferred "Not now" item.

None of these are required for v1. v1 is done.

## v1 status: shipped

Every Must-have from the brief is implemented, QA-verified, committed, and deployed:

- [x] Create, edit, delete habits (daily or specific weekdays) and one-off to-dos
- [x] Check-off flow awards XP, with difficulty tiers
- [x] Character profile with level, XP bar, HP
- [x] Streak counter per habit
- [x] Calendar heatmap of activity
- [x] Level-up moment
- [x] localStorage persistence, no account
- [x] Mobile-friendly
- [x] Live on Vercel
- [x] Source on GitHub

---

