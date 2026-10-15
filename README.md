# QuestLog

Turns your daily habits and to-dos into RPG quests. Completing them earns XP,
levels up your character, and unlocks rewards. Missed scheduled days cost HP
so streaks feel meaningful.

## Stack

- **Frontend:** Vite + React (JavaScript) + Tailwind CSS v4 (`@tailwindcss/vite`)
- **State:** React + a single `useQuestLog` hook backed by `localStorage`
- **No backend, no database, no auth.** This is a frontend-only app.

## Getting started

```bash
cd client
npm install
npm run dev