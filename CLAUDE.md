# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build and serve
- `npm test` — `node --test` over `src/**/*.test.ts`
- `npm run content:check` — validates all content JSON (Zod + cross-references)
- `npm run lint` — ESLint flat config

Node 26 runs TypeScript natively, so tests and scripts need no transpiler. Run one test file with `node --test src/learning/scheduler.test.ts`.

## What this is

A web port of the SwiftMind iOS app (`/Users/mustafa/Personal/Owned/SwiftMind`), which remains the source of truth for content and learning logic. The premise: *understand iOS, don't just memorise it* — every concept is a structured lesson (explanation, analogy, stepped diagram, code, common mistake, quick check, interview question), never an article.

No backend, no accounts. Progress lives in `localStorage` only.

## Architecture

**Content** (`src/content/`) — the 9 JSON files in `data/` are copied verbatim from the iOS app's `Content/Resources/`, so both stay content-compatible; `releases.json` is web-only. `index.ts` is a port of `ContentStore` exposing a frozen `content` object plus a `makeContent()` factory used by tests. JSON is imported statically with `with { type: "json" }` — required by Node ESM and accepted by Turbopack.

`schema.ts` holds Zod schemas that run **only** in `scripts/content-check.ts`, never at runtime; the app imports typed JSON and parses nothing. `ConceptSection` is deliberately the *known* union only — adding a `type: string` member would defeat narrowing in the renderer's switch. `references.ts` ports `ContentValidator.swift` (cross-references, duplicate ids, diagram integrity).

**Learning engine** (`src/learning/`) — pure functions ported from the iOS app, with no React or storage dependency: `scheduler.ts` (Leitner intervals 1→3→7→16→35, mastery EMA at 0.3, wrong answer resets to 1), `quiz.ts` (six modes, daily quiz seeded by day number so it is stable all day), `derive.ts` (streak, mastery, review queue, recommendations), `date.ts`, `rng.ts` (mulberry32).

**Progress** (`src/progress/`) — `types.ts` and the pure `reduce.ts` reducer, with `store.ts` the single module that touches `localStorage`. It uses `useSyncExternalStore` whose server snapshot is always empty state, so static HTML and the hydration render agree. Adding cloud sync later should touch `store.ts` alone.

**UI** — server components by default; client islands only where local progress or interaction lives (`progress-islands.tsx`, `QuizRunner`, `Diagram`, `CommandPalette`, `ThemeToggle`). Every route is statically generated.

## Conventions

- **Imports:** relative imports inside `src/content`, `src/learning`, `src/progress` and their tests must carry the `.ts` extension, because those modules also run under `node --test` (ESM). App and component code uses the `@/` alias.
- **Design tokens** live in `globals.css` as CSS variables, ported from the app's `Theme.swift`. Spacing and radii use Tailwind's defaults — the app's scale already matches. Per-category colour is one variable: set `--cat` on a wrapper and use `bg-cat`, `text-cat`, `border-cat`.
- **Elevation is border-only. There are no shadows anywhere.**
- **State is never signalled by colour alone** — every state carries a glyph or a word. This applies to mastery badges, quiz results, and diagram edges.
- Prefer native HTML over JS: `<details>` for reveals and code collapse, radio inputs for quiz options, `<dialog>` for the command palette.
- Adding content means adding JSON and running `content:check`; no code change should be required.
