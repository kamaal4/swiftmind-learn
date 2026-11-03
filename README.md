# SwiftMind

**Understand iOS. Don't just memorise it.**

A learning platform for iOS developers: Swift, memory management, concurrency, UIKit and SwiftUI, from beginner to senior level. Every concept is a structured lesson — a plain-English explanation, a real-world analogy, a diagram you can step through, real code, the common mistake, a quick check, and the interview question behind it. Never a wall of prose.

**Live at [swiftmind.ACCOUNT.workers.dev](https://swiftmind.ACCOUNT.workers.dev/)**

This is the web companion to the SwiftMind iOS app. Content and learning logic are shared with the app rather than reinvented, so the two stay in step. The content is edited here, and the app copies it.

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
npm run ci               # content:check + test + lint + build, as Cloudflare runs it
```

Node 26 runs TypeScript natively, so the tests and scripts need no transpiler.

Adding a concept means adding JSON under `src/content/data/` and running `npm run content:check` — no code change required.

## Editing content

Content is edited at **https://swiftmind.ACCOUNT.workers.dev/admin/** with [Sveltia CMS](https://sveltiacms.app) (`public/admin/`). Every save is a commit to `main`. Cloudflare rebuilds, and the change is live in 1–2 minutes.

If a save breaks the content, the build fails and the previous version stays live. That covers a quiz pointing at a concept that doesn't exist, a diagram step highlighting a missing node, or a duplicate id: anything `npm run content:check` rejects. Failed builds show under **Cloudflare → Workers & Pages → swiftmind → Deployments**.

**Who can edit:** anyone with write access to the GitHub repository. They sign in with GitHub. The login runs in this site's own Worker (`worker/sveltia-cms-auth.js`), using the GitHub OAuth app "SwiftMind editor" on the repository owner's account. To add an editor, invite their GitHub account as a collaborator with Write access.

| Editor | File |
| --- | --- |
| Swift / Memory / Concurrency / UIKit / SwiftUI concepts | `src/content/data/concepts-<track>.json` |
| Quiz questions | `src/content/data/quizzes.json` |
| Trivia | `src/content/data/trivia.json` |
| Interview questions | `src/content/data/interview.json` |
| Release Radar | `src/content/data/releases.json` (web only) |
| Categories | `src/content/data/categories.json` |

Each file is a JSON array, and each element is one entry; drag entries to reorder them. A concept's `id` is its URL (`/learn/<category>/<id>/`), and other entries refer to ids, so avoid renaming one. Quiz, trivia and interview links on a concept are pickers. Concept ids typed into other fields, such as a quiz's concept or a concept's prerequisites, are plain text that `content:check` verifies.

Editing the JSON by hand works too: add an object shaped like its neighbours and run `npm run content:check`. The iOS app copies these files into its `Content/Resources/`.

## Deploying

The site is a Cloudflare **Worker with static assets** (`wrangler.jsonc`), connected to this repository. Every push to `main`, including every editor save, runs `npm run ci` and deploys `out/`. The only Worker code is the editor login on `/oauth/*`; everything else is served as static files.

| Setting | Where |
| --- | --- |
| Build command `npm run ci`, deploy command `npx wrangler deploy` | swiftmind → Settings → Build |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | swiftmind → Settings → Variables and Secrets (type Secret) |
| `ALLOWED_DOMAINS` (sites the login may serve) | `vars` in `wrangler.jsonc` |
| OAuth callback `https://swiftmind.ACCOUNT.workers.dev/oauth/redirect` | GitHub → Settings → Developer settings → OAuth Apps → SwiftMind editor |

The host appears in `wrangler.jsonc` (`ALLOWED_DOMAINS`), `public/admin/config.yml` (`base_url`) and the OAuth app. Change all three together.

To deploy by hand: `npm run build && npx wrangler deploy`.

A host that serves the site from a sub-path sets `NEXT_PUBLIC_BASE_PATH` at build time, e.g. `NEXT_PUBLIC_BASE_PATH=/swiftmind-learn npm run build`.

## Licence

Content and code © Mohammed Mustafa Kamaal.
