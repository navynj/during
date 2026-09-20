# During Roadmap

Session-sized milestones. One session = one Claude Code working block with a demoable definition of done. Order within v1a is dependency order; do not pull later sessions forward. The tab bar grows with scope: a tab appears only when its screen ships.

## v1a: close the loop (write / witnessed / recall)

| # | Session | Builds | Done when |
| --- | --- | --- | --- |
| S0 | Foundation | Repo, Tailwind tokens, full schema migration + RLS, typed clients, Google auth + profile bootstrap (timezone, category seed), shell (Home + Locker + FAB), seed fixtures | Fresh clone reaches signed-in empty Home in 10 min; RLS test proves locked ripples invisible to a linked friend |
| S1 | Wave system | SVG primitives in `components/ui/waves/`: single wave line (drop), bundle with duration span + 8 to 10 line log cap (timed), dotted + reduced-opacity variant (planned/future), expanding-ring commit animation, growing-last-line live animation, `prefers-reduced-motion` fallbacks. Storybook-style fixture page rendering every state from seed data | Every ripple state in the seed renders correctly on the fixture page, static and animated, and looks right against `_docs/mockups/` |
| S2 | Home Daily read | Timeline axis (top = early), ripples placed by occurred_time, Daily Note area (several per day), date pager with author-tz boundaries, scroll anchors (today = now, other days = top, pager resets), section sinking backgrounds | Seed data renders as the mockup's Home Daily; anchors behave per SPEC section 5 |
| S3 | Input sheet | Half-sheet with chips, single note field, time control (now default, past, future = planned, date-only), lock chip, Drop / Timer dual commit, ghost landing on the visible timeline, three entry points (FAB blank, Add-ripple slot = time prefill, chip = category prefill), commit ring, timer stop flow for in-progress timed | A chip-only zero-character drop lands with one ring; ghost tracks time/category edits live; future time disables Timer |
| S4 | Link + rail | Invite link create/accept (mutual link), friends strip with live ring + elapsed, far-right friend rail sharing the time axis, Realtime updates when a friend drops, TTL 3d computed at read (expired = absent, no badge) | Two browsers: A drops, B's rail shows it at the right hour within seconds; a stale seed user is absent from strips |
| S5 | Witness + care | Ripple mini half-sheet (note, time, media, view count), view event recorded on open, view count visible to author only, delete (hard, with media), photo attach + upload, empty states with final copy (zero-friend Home, empty day, empty Trail) | A views B's ripple; B's count increments; delete removes row + storage object; every empty state shows designed copy |
| S6 | Locker Trail + ship | Locker tab: full personal scroll including locked ripples (date-sectioned, waves + notes), cloud Supabase project promotion (slot from cleanup or second free org), Vercel deploy, OAuth redirect config, invite 2 to 3 friends | during.today serves the loop end to end for real accounts |

**Checkpoint after S6: run the experiment.** 4 to 6 weeks of real use, then review SPEC section 1 hypotheses against their decide-by signals (reaction migration, "who saw this?" asks, quoting friction, cross-day scroll requests, recording persistence). Decisions land in DECISIONS.md as group I before any v1.5 work begins.

## v1b: quality of daily life (during/after the experiment window)

- Home Weekly zoom (7-day condensed columns, waves only, opens at top)
- Lanes tab, read-only matrix (my categories x days, locked included unmarked); tab appears now
- Spotify suggestion: client-side now-playing fetch when the sheet opens, one-tap prefill; no background jobs, no token storage beyond the session
- Suggestion row v1: yesterday's repeated drop for one-tap re-drop
- Quiet-day handling polish; rail wave unification decision from real render

## v1.5: Pool world (only after the checkpoint)

- Pool create + invite code; join screen = mapping privacy contract (pre-checked matches, residual categories unchecked, lurker join first-class)
- Pools tab (Lobby: my pools + join with code, activity ripple badges); tab appears now
- Swimmers (Daily time-aligned score view, Weekly person-column matrix, me-first + join order)
- Pool Lanes matrix; Home Lanes column headers become mapping dashboards
- Splash tab (boards + joint ripples filter); participants on ripples
- Swim: FAB entry + lane long-press, live intruding card, focus screen = enlarged lane card + my timer, nothing more

## v2+ (mapped, reserved, untouched)

Lists UI and multi-pool routing settings; notifications (Splash opened / Swim started / Link request only, max 2/day); Splash-born ephemeral pools; open/searchable pools; desktop score layout + ambient window; couple weekly grouping on Splash; recurrence engine; note-convention parsing; photo book export; dark mode (night pool); TTL setting UI (instant/1d/3d/7d).

## Standing rules

- The v1a list never grows mid-session; new ideas go to this file's v2+ section or DECISIONS.md.
- Any schema change after S0 is one migration with a one-line rationale in the commit.
- Hypothesis features (reactions, viewer lists, chat) are not built even if requested casually during the experiment window; they wait for the checkpoint review.
