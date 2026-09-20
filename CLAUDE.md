# CLAUDE.md

## What this project is

During (during.today): a one-line diary that assembles itself. While you write it, your presence shows on the surface for a few close friends. Solo-built portfolio project (design engineer case study) plus real daily use with friends. Records are written for oneself; sharing is a leak, not a broadcast.

## Source of truth

- `_docs/SPEC.md`: the product spec (v0.5). Authoritative for behavior, vocabulary, IA, visual system, schema, and scope. Read the relevant section before building any screen.
- `_docs/DECISIONS.md`: the decision log with rationale and rejected alternatives. Do not re-litigate settled decisions. If implementation genuinely forces a revisit, stop and flag it; never silently deviate.
- `_docs/mockups/`: current Figma exports. Visual reference for layout and the wave grammar. Some predate SPEC v0.2; where a mockup and SPEC conflict, SPEC wins. Flag the conflict instead of guessing.

**If the mockup contains a drawn shape, ask for the Figma-exported SVG before generating one.** Guessing at drawn geometry is the most expensive mistake so far: a generated wave was rebuilt from the export, and the exported numbers turned out to be load-bearing (control offsets that make the amplitude land exactly inside the stroke box). Reading a shape off a PNG gets the impression right and the construction wrong.

When the spec is silent, choose the smallest implementation consistent with DECISIONS and say so in the commit message. If it smells like a product decision, ask instead of deciding.

## Current scope: v1a only

Build exactly this, in roughly this order:

1. Auth (social login) and profile bootstrap (category seed from preset)
2. Link: mutual friendship via invite link
3. Input sheet: category chips, single note field, time defaults to now, past time, date-only records, lock, Drop / Timer dual commit, ghost landing on the timeline behind the sheet
4. Home Daily: chronological timeline (top = early), wave rendering (timed = bundle, drop = single line), Daily Note area, friend rail on the far right sharing the time axis, Add ripple ghost slot, scroll anchors (today = now, other days = top)
5. Ripple mini half-sheet: tap a wave, see note, time, view count; opening it records a view event
6. Delete (hard delete, including media)
7. Presence TTL: hardcoded 3 days, computed at render, expired members absent from strips (no badge)
8. Empty states: functional copy for zero-friend Home, zero-ripple day, empty Locker Trail
9. Locker Trail: full personal scroll including locked ripples

Explicitly NOT in v1a (do not scaffold, stub, or placeholder): Pools and everything inside them, Lists UI, Spotify, Home Weekly, Lanes matrix, one year ago, notifications, recurrence, dark mode. Tab slots are full by design: never add a tab. v1b adds Home Weekly, read-only Lanes, and a Spotify now-playing suggestion (fetched client-side when the sheet opens, no background jobs).

## Stack

- Next.js (App Router) + TypeScript strict. Deployed on Vercel.
- Supabase: Postgres, Auth, Storage, Realtime. Local-first development via `supabase start`. Schema changes only through migration files; never edit an applied migration.
- Tailwind CSS. TanStack Query for server state. No global client-state library until a concrete need appears.
- Waves are inline SVG components. No canvas in v1.

## Non-negotiable engineering rules

- **RLS on every table, no exceptions.** The leak model's two visibility paths (Link path, Pool path) are enforced in RLS policies, not in application code. The client must never receive rows the viewer is not allowed to see. Locker-only (locked) ripples are visible solely to their author.
- **Timezone:** `occurred_on` and `occurred_time` are author-local. Day boundaries are computed in the author's timezone (store the author's tz on the profile). This app will be used across Vancouver and Korea from week one.
- **Submerge is never stored.** Presence expiry is computed at read time from the last activity timestamp.
- **Deletes are hard deletes** (privacy over recovery), including storage objects.
- One vocabulary, one table: every remaining record is a row in `ripples`.

## Design tokens and visual rules

- The ONLY custom design tokens are three color ramps plus the typeface. Everything else (spacing, radius, type scale) uses the Tailwind default scale.
  - Main ramp (content vitality): `#0507C9` live/now, `#787BE2` recent, `#D3D7F6` settled/past
  - Gray ramp (structure): `#F1F3F7` surfaces, `#D8DCE8` deeper surfaces / dividers / lane ropes, `#6B79A3` muted text
  - Ink: `#313338` body text
- Typeface: **Poppins** (weights 300/400/500/600/700), self-hosted via `next/font/google` and exposed as Tailwind's `--font-sans`, so `font-sans` and `body` cannot drift apart. The type size _scale_ is untouched.
- Tracking is tightened 5%: the whole `--tracking-*` scale shifts by `-0.05em` (so `tracking-normal` is `-0.05em`), and `body` states it because browsers default to `0`. Shifting the scale rather than only the base keeps the steps' relative distance.
- **Weight: `font-semibold` is the emphasis weight.** Reach for it wherever you would reflexively write `font-bold`; 600 carries emphasis in Poppins without the heaviness. `font-bold` (700) stays loaded for the rare case that genuinely needs it, but is not the default. The header's year + month label is `font-medium`.
- **`#787BE2` (`main-400`) is a chip foreground and a wave tone. Nothing else.** Its only text use is the foreground of category chips and other small tag-like chips; otherwise it exists solely inside the wave vitality ramp as the "recent" tone. It is not a general accent color, and it never colors headings, labels, time markers, or chrome.
- Text colors, in full:
  - Default text: `#313338` (ink).
  - Emphasis / accent text: `#0507C9` (`main-900`).
  - Muted or secondary text, only where the hierarchy needs it: `#6B79A3` (`pool-500`).
  - `#D3D7F6` is never text.
  - Active or selected states in chrome (tab bar, pagers) use `#0507C9` (`main-900`) with weight; inactive is the same color faded by `opacity-20` on the item wrapper, never per-element alpha — one fade for the whole item, so icon and label can never drift apart. This is chrome, not content: SPEC 7 law 1 reserves the opacity channel for _time_ on Ripples, and nav state is neither.
- `pnpm lint` fails on `main-400` or `#787BE2` used outside `components/ui/chips/` and `components/ui/waves/` (see `scripts/check-tokens.sh`). If a new directory legitimately renders chips or waves, add it to that allowlist rather than working around the check.
- Category emojis keep their native colors: the single allowed off-palette element.
- **Motion: only living things move.** An in-progress timed grows its last wave line; a new drop plays one expanding ring that settles to a single ring. Nothing else animates. `prefers-reduced-motion` fallback is mandatory, and every design must read correctly when static.
- Wave grammar: timed = multi-line bundle whose line count is log-scaled on duration (cap 10) at a constant gap, so height is a consequence of density, not a measure of span; drop = single wave line. Wave counts are impressions (calm / some / lots), never precise gauges. The axis is ordered, not time-proportional: vertical distance measures nothing.
- Past sinks **within a continuous scroll** (backgrounds step white, then `#F1F3F7`, then `#D8DCE8`); a paged day keeps its white ground (H14). Future fades (reduced opacity). Tone and opacity never encode ownership.

## Code conventions

- **Domain vocabulary in code.** Identifiers use Ripple, drop, timed, Link, Pool, Lane, Splash, Swim, Locker, Submerge, List. Forbidden identifiers: post, entry, item, group, feed, stream, deck, follower. If the word is retired in SPEC section 2, it does not appear in code either.
- Structure: `app/` for routes and layouts, `features/<name>/` (components, hooks, queries colocated per feature: `features/input-sheet/`, `features/home-daily/`, `features/links/`, `features/locker/`), `components/ui/` for shared primitives (waves, chips, sheets), `lib/` for supabase clients and utilities, `supabase/migrations/` for schema.
- Server components for shells and data fetch; client components for anything that moves or accepts input. Keep components small; extract when a file passes ~150 lines.
- TypeScript: strict, no `any`, explicit return types on exported functions. Validate at boundaries (forms, route handlers) with zod. Database types generated via `supabase gen types`.
- Files kebab-case, components PascalCase, hooks `useX`.
- Comments explain why, not what. When implementing a spec rule, reference it: `// SPEC 7, law 3: only living things move`.
- Conventional commits, small and frequent. One migration per schema change.

## Definition of done for v1a

A two-account demo works end to end: sign up, link via invite, drop from all three entry points (FAB, timeline slot, and chip prefill), ghost landing visible while the sheet is open, waves render correctly for drop / timed / planned / date-only, the friend rail shows the other account at the same hour, tapping a ripple opens the mini sheet and increments its view count for the author, delete removes row and media, a 3-day-stale account disappears from the strip, and every empty state shows designed copy instead of a blank.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
