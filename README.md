# Reelcrit v0.2

YouTube reviewer aggregation site for film and TV. This is the v0.2 refactor
of the original Vite single-page app onto Next.js 15 (App Router), TypeScript,
and Tailwind.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # TS only, no emit
npm run build        # production build
npm run lint
```

Requires Node 18.18+ (Next 15).

## Why the refactor

The original SPA worked, but every page was a route in `react-router-dom` with
client-only data fetching, the consensus rule was repeated in three places,
and mock data lived inline in components. v0.2 fixes those three things:

1. **Routes are file-based** under `app/`. Deep links, browser back button,
   SSR-ready URLs come for free. Static params are pre-rendered at build time
   so movie and channel pages serve instantly.
2. **The consensus engine has one home** — `lib/utils/consensus.ts`. The
   recommend-percentage threshold lives in `lib/utils/consensus-config.ts`
   and nowhere else. Change it once, every page updates.
3. **Mock data is isolated** under `data/`, accessed only through `lib/api/`.
   Components never import from `data/` directly. When the backend lands, only
   the API layer changes.

## Architecture

```
app/                  Routes — every page is a server component by default
  page.tsx              Home
  movie/[id]/           Title page (SSG via generateStaticParams)
  channel/[handle]/     Reviewer profile (SSG)
  browse/               Filterable catalogue, filters in the URL
  box-office/           Weekend grosses table
  news/                 Industry headlines
  features/             Long-form editorial list
    [id]/               Long-form article
  score/                Editor admin — assign scores to reviews
    actions.ts          Server actions (currently no-op stubs)

components/
  ui/                 Primitives (Avatar, Pill, VerdictPill, VideoThumb...)
  layout/             Header, Sidebar, AppShell
  domain/             ReviewCard, TitleCard, ChannelCard, ScoreBadge
  home/               Home page section blocks
  title/              Title-page-specific blocks
  channel/            Channel hero, tabs, view wrapper
  browse/             Filter bar
  boxoffice/          Sortable table
  news/               Hero, card
  features/           Card
  admin/              Score queue (editor-only)

lib/
  types/              Single source of truth for the data model
  api/                Async, Promise-returning data accessors. Today they
                      read from `data/`; tomorrow they call the database.
                      Components don't care which.
  utils/
    consensus.ts        The one consensus engine
    consensus-config.ts The one threshold (70% recommend, min 3 reviews)
    format.ts           fmtMoney, posterGradient, etc.
    cn.ts               className helper
  context/            Sidebar open/closed (only true global state)

data/                 Mock JSON-shaped TS modules. Treat as fixtures, not as
                      a runtime data store. Will disappear when the backend
                      is wired.
```

## Routing conventions

- **Server components by default.** Pages fetch data with `await listX()`
  from `lib/api`, render markup, and ship plain HTML on first load.
- **Client components are explicit.** Marked with `'use client'` at the top
  of the file. They live as thin wrappers around interactive surfaces
  (filter bars, tabs, the score queue editor).
- **Filter state lives in the URL.** Browse uses `?type=movie&genre=Drama`
  rather than React state — the URL is shareable, refreshable, and
  bookmarkable. The chip components read `useSearchParams` only to know
  which chip is active.
- **Static params where it makes sense.** `app/movie/[id]/page.tsx` and
  `app/channel/[handle]/page.tsx` both export `generateStaticParams` so
  every title and channel pre-renders. When titles run into the thousands
  this becomes ISR; the per-page changes are tiny.

## What's wired and what isn't

| Area            | Status                                                           |
| --------------- | ---------------------------------------------------------------- |
| Pages           | ✅ All routes render against the mock layer                      |
| Type model      | ✅ Defined once in `lib/types`                                   |
| Consensus       | ✅ Single engine, single config                                  |
| SEO metadata    | ✅ Per-page `generateMetadata` on dynamic routes                 |
| Static params   | ✅ Pre-rendered for every title and channel                      |
| Mobile layout   | ✅ Tested at 375 / 768 / 1280 — single → 2-up → grid             |
| a11y baseline   | ✅ Tabs are `role="tablist"`; verdict toggle is `role="radiogroup"`; colour is paired with text/sign |
| Editor scoring  | 🟡 UI complete, server action is a no-op stub                    |
| Auth            | ❌ The `/score` route is unprotected. See "Auth" below.          |
| Real data       | ❌ Mock JSON in `data/`                                          |
| Image CDN       | ❌ Posters are CSS gradients from a 3-colour seed                |
| Tests           | ❌ None yet                                                      |

## The score editor

The `/score` route lists every review (newest first) and lets an editor
assign or revise the score (0–10) and verdict (recommend / pass). Each row
has its own draft state — editing one row doesn't touch the others. Save
fires a server action, `saveReviewScore`, defined in `app/score/actions.ts`.

In v0.2 that action is a stub:

```ts
// app/score/actions.ts
'use server';

export async function saveReviewScore(input: SaveReviewScoreInput) {
  // ...validation...
  // TODO: replace with db.review.update / Supabase upsert
  console.log('[score] saveReviewScore (stub)', input);
}
```

When the backend lands, replace the body of `saveReviewScore`. The UI doesn't
change.

## Auth (not done — read this before deploying)

The `/score` route is currently reachable by anyone. Before staging or prod:

1. Add `middleware.ts` at the project root checking the editor cookie/JWT.
   Protect `/score` and `app/score/actions.ts`.
2. Move the auth check into the server action itself as a defence-in-depth
   layer — middleware can be bypassed if a route handler is added later.
3. The `metadata` on `/score` already sets `robots: { index: false }`, so
   it won't end up in search results, but that's not a security control.

## Customising the consensus rule

Open `lib/utils/consensus-config.ts`:

```ts
export const CONSENSUS_RECOMMEND_THRESHOLD = 0.7;  // 70%
export const CONSENSUS_MIN_REVIEWS = 3;
```

The threshold is the percentage of reviewers who must recommend a title for
it to count as "consensus recommend". The min-review count prevents a single
glowing review from anointing an obscure title. Both are read by every
caller of `computeConsensus`.

## Deploying

Set up Vercel pointed at this repo. Build command `npm run build`, output
directory left at default. The site is fully static for now — every dynamic
route has `generateStaticParams` — so it'll deploy as edge-cached HTML.

When the database arrives, dynamic routes will need to drop or restrict
their static params and add `revalidate` exports.

## Folder placement quick reference

| Adding...                              | Goes in...                        |
| -------------------------------------- | --------------------------------- |
| New page                               | `app/<route>/page.tsx`            |
| UI primitive (button, badge)           | `components/ui/`                  |
| Domain component (card, list row)      | `components/domain/` or feature folder |
| Page-specific block                    | `components/<feature>/`           |
| New data type                          | `lib/types/index.ts`              |
| New mock data                          | `data/<topic>.ts`                 |
| New data accessor                      | `lib/api/<topic>.ts`              |
| Format / utility helper                | `lib/utils/`                      |
| Server action                          | `app/<route>/actions.ts`          |

If a new component spans more than one feature folder, promote it to
`components/domain/`.
