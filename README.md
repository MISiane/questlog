# QuestLog

Turns your daily habits and to-dos into RPG quests. Completing them earns XP,
levels up your character, and unlocks rewards. Missed scheduled days cost HP,
so streaks feel meaningful.

Built by [Edriane Mina](https://github.com/MISiane).

## Status

**v1.3** — feature-complete, QA-verified, frontend-only. See `PROJECT_STATE.md`
for invariants, gotchas, and milestone history.

**Live:** https://questlog-by-edriane.vercel.app/

After v1 shipped, continued daily use surfaced four bugs (level math, schedule
edits rewriting the past, HP after a long absence, re-crossing a level). All
four are fixed in v1.3.

## What it does

- **Quests** — habits with a schedule (daily or specific weekdays) and a
  difficulty tier (easy = 10 XP, medium = 25 XP, hard = 50 XP).
- **To-dos** — one-off tasks, same difficulty tiers, no schedule.
- **XP and levels** — level N requires `100 × N` XP to advance. Leveling up
  fully heals your HP.
- **HP** — starts at 100. Missing a scheduled day costs 10. A perfect day
  (everything scheduled, done — or nothing scheduled at all) heals 5. If HP
  hits 0 you faint: all data and XP are kept, and HP is restored to 50.
- **Streaks** — per habit. Only scheduled days count, so a Mon/Wed/Fri habit
  keeps its streak across Tue/Thu.
- **Heatmap** — a 140-day grid of activity: muted for nothing, gold for
  partial, green for perfect days.
- **Level-up moment** — a CSS-only celebration overlay with flavor text.

## Stack

- **Frontend:** Vite + React (JavaScript) + Tailwind CSS v4 (`@tailwindcss/vite`)
- **State:** React + a single `useQuestLog` hook backed by `localStorage`
- **No backend, no database, no auth.** All data lives in the browser under
  the `localStorage` key `questlog.v1`.

## Development

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### Project layout

```
questlog/
  client/                 Vite + React app
    index.html
    vite.config.js
    src/
      main.jsx            entry
      App.jsx             root component
      index.css           Tailwind entry + design tokens + keyframes
      assets/
      components/         UI (PascalCase.jsx)
      hooks/              useQuestLog.js — the one source of truth
      services/           storage.js — the only place localStorage is touched
      utils/              date, xp, id, constants
  README.md
  PROJECT_STATE.md
```

### Design

Dark theme, one accent per system (gold = XP, red = HP, green = completion,
purple = character chrome). Pixel heading font (Press Start 2P) used sparingly;
Inter for body text. Mobile-first, single column, max-width ~640px.

### Game rules

- XP per completion: easy 10, medium 25, hard 50.
- Level N requires `100 × N` XP.
- HP max 100. Missed scheduled day: −10. Perfect day: +5. Level-up: full heal.
- HP ≤ 0 → faint, HP restored to 50, nothing else lost.
- Streaks count scheduled days only.
- XP is permanent once earned; deleting a habit or to-do never refunds it.

## Not in v1

User accounts, cloud sync, multiplayer, shop / inventory, push notifications,
custom avatar builder, AI features, light theme toggle, routing, backend.

## License

Personal project. No license file yet — all rights reserved by default.
```
