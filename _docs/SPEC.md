# During: Product Spec (v0.6)

> A one-line diary that assembles itself. While you write it, your presence shows on the surface for a few close friends.

Domain: during.today. UI language: English. First users: 1:1 friends (most general case), then couples and church small groups via Pools.

The reward loop: **being witnessed is the hook, the personal archive is the retention.** Records are written for oneself; sharing is a side effect (a leak, not a broadcast).

Revision notes: v0.2 dissolved the former "Non-negotiables" section (product prohibitions became MVP hypotheses; system rules moved into their operating sections). v0.3 applies H6 (v1 restructured into v1a/v1b) and H7 (palette mid tone corrected to #787BE2). v0.4 applies H8 (#787BE2 scoped to chip foregrounds and the wave ramp; law 5 split into content surfaces vs interactive chrome). v0.5 applies H9 (wave tone deleted; law 4 narrowed to ropes and empty slots; the commit ring becomes a multi-ring ripple). v0.6 applies H10 (an in-progress timed travels; the grow mode is deleted).

---

## 1. Design hypotheses (ship the MVP without these, then confirm or revise)

Rationale for the demotion: a document's authority should come from rationale, not labels, and the asymmetry favors testing. Adding these later is cheap; removing them once shipped is nearly impossible. Shipping without them IS the experiment.

| Hypothesis (MVP ships without) | Decide-by signal |
| --- | --- |
| No likes, comments, rankings, streaks, follower counts | Reactions migrating to KakaoTalk = intended division of labor. Recording volume decaying = witnessing alone under-rewards. |
| Witness signal is a view count only, never a viewer list | How often "who saw this?" gets asked directly. |
| No chat: no threads, no reply chains; Splash logs flat, quoting one level max | Whether one-level quoting is reported as cramped, and whether conversation stays comfortably in KakaoTalk. |
| No feed: day pages with a pager, no infinite catch-up scroll | Requests for cross-day continuous scrolling. |
| No guilt devices: no streaks, no red gaps; unchecked plans fade quietly, empty days pass silently, empty states read as invitations | Whether recording persists without reinforcement. Habit requests are served by suggestion-row re-drops first. |

## 2. Vocabulary (fixed, do not rename)

| Term | Meaning |
| --- | --- |
| **Ripple** | Any record that remains. Two kinds: **drop** (a point in time, no duration claim) and **timed** (explicit timer; the only kind that shows elapsed time). |
| **Splash** | A shared collection board someone opens; others add Ripples to it (photo pools, Q&A prompts). |
| **Swim** | A live quiet co-presence session. Per-person lanes numbered by join order; the last lane is always an empty "your lane" slot acting as the invitation. |
| **Pool** | A group. Explicit membership. Home of shared artifacts. |
| **Lobby** | The pool browser screen (my pools, join with code). |
| **Lanes** | The category-axis view. Top level: my categories. Inside a pool: that pool's categories. A lane is a division of the water; the category is what the division means. |
| **Swimmers** | A pool's people view. Daily zoom: time-aligned score view. Weekly zoom: person-column matrix. |
| **Locker** | My private global archive and recall engine. Outside any pool. Sees everything, including locked drops. |
| **Submerge** | Presence expiry. Per-user TTL (default 3 days; options instant / 1d / 3d / 7d). Expired members disappear from rosters entirely (no "submerged" badge). Past Ripples persist; only "presence" expires. |
| **Link** | Mutual friendship. The only kind; no asymmetric follow. |
| **List** | My private labels over Links, used for audience routing. Never visible to others. |

Retired vocabulary (do not reuse): Stream, Deck, Pan, Table, Event, Moment, Log.

## 3. Social graph

- **Link is always mutual.** No follower asymmetry, so no audience accumulation.
- **Pool membership is independent from Link.** Groupmates need not be friends. Never join these tables to imply friendship.
- Two visibility paths for a Ripple:
  1. **Link path:** my rail appears in my friends' Home (subject to List routing).
  2. **Pool path:** only what is mapped/leaked into that pool, visible to all members including non-friends.
- A non-friend pool member's profile is a dead end: only their in-pool Ripples + a Link request button. Never a gateway to their full timeline.
- Lists are the answer to "send to friend-group A and B at once". Routing asymmetry (I show you more than you show me) is acceptable and undetectable by design (no view lists, no membership visibility).

## 4. Leak model (routing) and category rules

- Records are made in Home ("a dot on my Trail"); pools receive them by **leak**, not by publish.
- **Explicit mapping is the precondition of any leak.** my_category to pool_lane. No name-match auto flow (identical names in different pools are different contexts).
- Pool join screen is a **privacy contract**: "these things will flow into this pool." Suggested mappings for matching names come pre-checked, **except residual categories (e.g. Day), which default unchecked.** When a residual category is about to be mapped, nudge toward creating a dedicated category instead.
- Zero mappings = lurker membership. Fully valid, no warning copy, CTA adapts ("enter without connecting").
- Per-drop override: a small audience chip on the input sheet. One spectrum: everyone, selected lists/pools, only me (lock). Lock is not a separate toggle.
- My category names are mine; pool lane names are the group's. Mapping connects them without forcing shared vocabulary.
- Locker always contains everything. TTL governs presence only.

**Category axis rules (system rules, embodied in the schema):**
- Categories answer only "what". "With whom" = participants. "When" = the page and time fields. "To whom" is not a category (a future marker at most).
- One event may produce several Ripples; category assignment is per Ripple, never per event.
- Structured-data ambitions (scores, distances) go into note conventions, never into schema fields.

## 5. Information architecture

**Top level (slots full; any future feature demanding a tab is auto-rejected):**

```
Home / Lanes / Pools / Locker + FAB
```

- **Home: my timeline (Daily <-> Weekly zoom).**
  Layout, top to bottom:
  1. Friends strip (live = bold ring + elapsed; past-TTL members absent).
  2. Header: month + date pager (`< 15 SAT >`). **One pager governs the whole page**; it is the only date navigation.
  3. Daily Note area: records that belong to the date without a time. **Several per day allowed**, stacked; empty state shows the "Add a Daily Note" prompt. Weekly zoom shows the Weekly Note area.
  4. Time axis: **top to bottom = early to late.** My Ripples sit at their time position (timed = wave bundle whose vertical span = its duration; drop = single wave line; category badge at the bundle head; planned/future items render at reduced opacity).
  5. **"Add ripple" ghost slot at the end of the flow**: the seat of the next record and an input entry point (time prefilled = now). New records append downward in time order.
  6. **Friend rail, far right:** a thin vertical line where friends' activity sits at its time-of-day position, sharing the main axis's time coordinates. Same-hour adjacency is the rail's information.
  7. Bottom resident area: active Splash bar (only when one exists) + Lanes preview strip.
  Scroll rules: **today opens anchored at the current time** (latest records and the Add ripple slot in view; scrolling up = earlier in the day). **Any other day opens at the top** (earliest record). Moving the pager resets to these anchors.
  Weekly zoom: columns = 7 days, each a condensed Daily axis (waves only, no notes); always opens at the top.
- **Lanes**: my categories x days matrix (wave cells). Includes locked Ripples, unmarked (this view is mine alone). Column header = that category's dashboard: where it flows (mappings), edit name/icon. Exploration lives here.
- **Pools**: room list with activity signals (ripple badges on pool cards: active Splash bar miniature, Swim traces). Lobby = browse my pools + join with code. No public search / open pools in v1.
- **Locker**: recall engine: weekly recap (score view), aggregates ("42 tracks, indie pop lately"), one year ago today, export. Recall lives here; do not add matrices here or aggregates to Lanes.

**Inside a pool:**

```
Swimmers / Lanes / Splash
```

- **Swimmers**: the room's daily screen. Daily zoom: time-aligned score view (per-person vertical lanes, me first, then join order). Weekly zoom: person-column matrix. Quiet members within TTL show as calm columns; past-TTL members have no column.
- **Lanes**: this pool's categories x days matrix.
- **Splash**: boards + **all joint Ripples (participants >= 2)**. The "records of us together" filter; ended Swims are absorbed here as joint-Ripple bundles. For couples this tab is effectively the shared album.
- **Swim has no tab.** Start: FAB sheet (secondary entry) or long-press on a lane. Live: a large intruding card wherever relevant (carousel peek if multiple). Past: a record card on that day's page + traces in Swimmers (simultaneous bundles).

## 6. Input sheet (the most-opened screen)

- One sheet, three entry points differing only in prefill: FAB = blank, lane "+" slot = category prefilled, timeline empty slot = time prefilled.
- First paint is completable: **suggestion row** (now playing, location change, yesterday's repeated drop for one-tap re-drop) + category chips + **single note field** (no title/content split), no autofocus.
- A chip tap alone is a valid entry: the zero-character diary.
- Time defaults to now. Changing it is edge UI. Future time = planned Ripple (dotted ghost at reduced opacity; check converts it). Removing time = date-only record ("for the whole day"). Microcopy: "change the time and it becomes a plan."
- **Ghost landing:** while editing, a ghost wave sits live on the timeline behind the half-sheet at the chosen time/category; committing solidifies it with one ripple animation. The sheet must not cover the landing spot.
- **Dual commit: Drop / Timer.** No mode state, no long-press dependency. Future time disables the timer button (or converts it to "save as plan").
- Audience chip: small, visible, one tap to override this drop only. Repeat/recurrence engine: rejected for v1 (suggestion-row re-drop covers habits).
- After commit: sheet closes, one expanding ring on the timeline, nothing else. No praise, no share prompts.

## 7. Visual system

Theme: swimming pool. Stop before skeuomorphism: no wave textures, no floats, no water puns in copy.

**Laws:**
1. **Time owns the tone and opacity channels.** Past: backgrounds sink stepwise (white, then #F1F3F7, then #D8DCE8); scrolling into older sections = going deeper. Future: the item itself renders at reduced opacity, dotted. Tone and opacity never encode ownership (mine vs others).
2. **Undulation = activity.** More waves = more happened. Impression-level (calm / some / lots), log-scaled, never a precise count or a participation gauge.
3. **Only living things move.** An in-progress timed **travels**: its waveform is held rigid and slid through a clipped window, every line in the bundle in phase, so what moves is the water and not the drawing of it (H10). Finished water is still. New drop = a **ripple: three rings spreading outward, staggered**, their opacity front-loaded against their travel (H9c) — one event per commit, never a loop. reduced-motion fallback mandatory, and every design must read correctly static.
4. **Dotted = not yet.** Lane ropes and the empty "your lane" slot. **Not planned Ripples** (H9b): at the wave's 1px amplitude a dashed stroke becomes a row of dots and stops reading as a wave, so planned renders at reduced opacity instead.
5. **One channel, one meaning.** Position = me (first column/row, leading). Ring weight + #0507C9 = live. A solid #0507C9 **content** surface is reserved for live Swim/Splash cards, where the fill is what encodes liveness. Interactive **chrome** — the FAB, primary action buttons, the active nav item — may use solid #0507C9 as the action color: chrome styling is not encoding, so it does not compete for the channel (H8).
6. **Vocabulary may be taught; visual encodings may not.** If an encoding needs explanation, it is rejected.

**Palette (the only custom tokens):**
- Main ramp: **#0507C9** is the whole of it in practice — waves, live states, emphasis text and interactive chrome. **#787BE2** is a chip foreground only (H8). **#D3D7F6** is **reserved and currently unused** (H9a): the wave vitality ramp it belonged to no longer exists, because a wave keeps its strength wherever it sits and the past is carried by the sinking background instead.
- Gray ramp, structure: **#F1F3F7** surfaces, **#D8DCE8** deeper surfaces / dividers / lane ropes, **#6B79A3** muted and secondary text.
- Ink: **#313338** body text.
- **Text rule (H8):** #787BE2 is a **chip foreground and a wave tone, nothing else**. Its only text use is the foreground of category chips and other small tag-like chips; otherwise it appears solely as the "recent" tone inside the wave ramp. Text hierarchy: **#313338** default, **#0507C9** emphasis, **#6B79A3** muted or secondary. #D3D7F6 is never text. Enforced by `scripts/check-tokens.sh`, which fails the lint if main-400 is used outside the chip and wave components.
- **No other colors, with one exception: category emojis keep their native colors** (the only off-palette element).
- Dark mode: undefined for now. When designed it must be a night pool, never inverted colors.

**Ripple grammar:** timed = multi-line wave bundle (line count log-scaled on duration, capped at 10; constant gap between lines, so only the count varies), drop = single wave line. Planned renders at reduced opacity, badge included. Category badge on the avatar corner (rows) or bundle head (timeline), so text is 100% note. Display format: `category · note`.

**Design system follows Tailwind conventions:** spacing, radius, and type use the default scale; the three ramps above are the only custom tokens.

## 8. Data sketch

```
users
links(user_a, user_b)                     -- mutual, single row
lists(owner), list_members(list, user)    -- private labels
pools(ephemeral, born_from_splash?)       -- reserved flags
pool_members(pool, user)                  -- independent of links
pool_lanes(pool, name, icon, order)
my_categories(user, name, icon, default_mode drop|timed)
lane_mappings(user, my_category, pool_lane)   -- the plumbing
ripples(author, category, note?, media[],
        occurred_on date, occurred_time?,     -- null time = date-only record (several per day allowed)
        ended_at?,                            -- null = in progress; =start for drops
        planned bool, participants[], created_at)
ripple_audience(ripple, target: list|pool|lock)
ripple_views(ripple, viewer, viewed_at)       -- witness counts; readable by the ripple's author only
splashes(pool, type free|prompted, prompt?, ends_at?)
```

occurred vs created separated (backfill lands on the right day); occurred_on and occurred_time are author-local, day boundaries computed in the author's timezone. Swim = a grouping of simultaneous timed Ripples. RLS enforces the two visibility paths at the DB level.

## 9. Scope

**v1a (close the loop: write / witnessed / recall):** auth (social login) + profile bootstrap (timezone capture, category seed), Link + invite link, input sheet (chips, single note, lock, now/past/future/date-only time, Drop/Timer, ghost landing), Home Daily (wave rendering, Daily Note area, friend rail, scroll anchors), Ripple mini half-sheet (note, time, media, view count; opening records a view event; count visible to the author only), delete (hard, including media), presence TTL hardcoded 3d computed at read, designed empty states, Locker Trail (full personal scroll including locked ripples). Responsive web (Vercel) + Supabase.

**v1b:** Home Weekly zoom, Lanes read-only matrix, Spotify now-playing as a client-side fetch when the input sheet opens (no background jobs, no stored tokens), suggestion row v1 (yesterday's repeat for one-tap re-drop).

**Checkpoint after v1a ships to real friends:** 4 to 6 weeks of use, then review the section 1 hypotheses against their decide-by signals; decisions land in DECISIONS.md as group I before any v1.5 work.

**v1.5 (Pool world):** Pool create/join + mapping contract screen, Swimmers (Daily score / Weekly matrix), pool Lanes, Splash tab (boards + joint filter), Swim (lane card, live card, FAB entry), suggestion row full version.

**v2+:** one year ago today (empty by definition for the first 12 months), background auto-collection (timeline autofill; Spotify first), multi-pool routing UI (category x pool mapping settings), Lists UI, notifications (Splash opened / Swim started / Link request only; <= 2/day), Splash-born ephemeral pools, open/searchable pools, desktop score layout and ambient window, weekly-group view for couples (Splash grouping), recurrence engine, note-convention parsing (scores), photo book export, dark mode (night pool), TTL setting UI.

## 10. Open items

- Onboarding flow beyond functional empty states (first drop before first invite; "everyone's submerged" roster copy).
- Home-Lanes-Detail person/pool filter chips in mockup: undecided whether that view includes others' content (would be a new axis decision) or is mine-only (then remove chips).
- Friend-rail wave unification; quiet-day row compression thresholds.
- Swim focus screen: lane card enlarged + my timer, nothing more (one-liner, v1.5).
- E2EE stance: rejected in favor of access control (RLS); revisit only if positioning changes.
- Monetization: explicitly a non-goal (portfolio + personal use).
