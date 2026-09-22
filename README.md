# SwiftMind

**Understand iOS. Don't just memorise it.**

A learning platform for iOS developers: Swift, memory management, concurrency, UIKit and SwiftUI, from beginner to senior level. Every concept is a structured lesson — a plain-English explanation, a real-world analogy, a diagram you can step through, real code, the common mistake, a quick check, and the interview question behind it. Never a wall of prose.

**Live at [kamaal4.github.io/swiftmind-learn](https://kamaal4.github.io/swiftmind-learn/)**

This is the web companion to the SwiftMind iOS app. Content and learning logic are shared with the app rather than reinvented, so the two stay in step.

## What's in it

- **17 concepts** across 5 tracks, 171 authored sections, 13 interactive diagrams
- **51 quiz questions** feeding a Leitner spaced-repetition schedule (1 → 3 → 7 → 16 → 35 days)
- **17 interview questions** by level, junior through staff, with what an interviewer listens for
- **Release Radar** — Swift and iOS changes, deprecations, and what to migrate
- Works offline, installable as a PWA

No accounts, no backend, no tracking. Progress is stored in your browser only, and you can export it to a file at any time.

## Development

```bash
npm install
npm run dev              # http://localhost:3000

npm test                 # ported from the iOS app's XCTest suite
npm run content:check    # validates content JSON and every cross-reference
npm run lint
npm run build            # static export to out/
npm start                # serve out/ locally
```

Node 26 runs TypeScript natively, so the tests and scripts need no transpiler.

Adding a concept means adding JSON under `src/content/data/` and running `npm run content:check` — no code change required.

## Deploying

The site is a static export served from GitHub Pages at `/swiftmind-learn`:

```bash
NEXT_PUBLIC_BASE_PATH=/swiftmind-learn npm run build:pages
```

`NEXT_PUBLIC_BASE_PATH` is read from the environment rather than hardcoded, so the same build serves a domain root unchanged.

## Licence

Content and code © Mohammed Mustafa Kamaal.
