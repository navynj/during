# During: Product Spec (v0.22)

> A one-line diary that assembles itself. While you write it, your presence shows on the surface for a few close friends.
>
> **The hand throws moments at stories; the machine shelves them in time.** (H20)

Domain: during.today. UI language: English. First users: 1:1 friends (most general case), then couples and church small groups via Pools.

The reward loop: **being witnessed is the hook, the personal archive is the retention.** Records are written for oneself; sharing is a side effect (a leak, not a broadcast).

Revision notes: v0.2 dissolved the former "Non-negotiables" section (product prohibitions became MVP hypotheses; system rules moved into their operating sections). v0.3 applies H6 (v1 restructured into v1a/v1b) and H7 (palette mid tone corrected to #787BE2). v0.4 applies H8 (#787BE2 scoped to chip foregrounds and the wave ramp; law 5 split into content surfaces vs interactive chrome). v0.5 applies H9 (wave tone deleted; law 4 narrowed to ropes and empty slots; the commit ring becomes a multi-ring ripple). v0.6 settled H9's open item (an in-progress timed travels; grow deleted). v0.7 applies H10 (timeline exclusivity and inner ripples). v0.8 corrects section 5.4: the axis is ordered, not time-proportional (H16). v0.9 applies H12 (the ghost lands on a compressed axis inside the sheet). v0.10: inner ripples are created from the parent Ripple's detail sheet, not the input sheet. v0.11 applies H13 (the landing rail is progressive; time is a segmented toggle). v0.12 applies H14 (law 1's sinking is scoped to sections within a scroll; a paged day keeps its ground). v0.13 applies H11 (scope re-cut into solo-first phases; v1a/v1b/v1.5 retired). v0.14 applies H15 (a running record gets a now band and a focus screen; solid #0507C9 means a live session; wave colour is contrast-determined). v0.15 adds Break to H15: a timed inner ripple; the parent session keeps gross duration and no net time is shown. v0.16: the focus screen carries the deep wave preset and hosts the sheet as an overlay; inner composition is Drop-only. v0.17 reverses calm-water rendering; a break inherits its parent's category rather than having one of its own. v0.18 applies H17 (the Ripple detail sheet; edit is the input sheet; hard delete takes its media and its inner ripples). v0.19 refines H17: a finished record's end is correctable, and the Daily Note prompt opens the sheet with no time. v0.20 applies H18 (kind is end-presence at the input surface too: a typed span makes a timed Ripple, and the present is written by the Timer). v0.21 applies H19 (the Lanes matrix and the Locker Trail ship; law 1's sinking finds its first consumer in their month sections; the empty-state voice is fixed). **v0.22 applies H20, the Splash pivot**: the record unit is a story fragment; identity is record/retrospect and live tracking goes dormant; Home is one ordinal flow keyed on `COALESCE(occurred, created_at)` with two view modes; Splash is promoted from P3 as a personal topic board; the exclusion constraint is dropped; the input sheet splits into a ripple sheet and a splash sheet; ink fill means selection and blue fill means action; six default lanes.

---

## 1. Design hypotheses (ship the MVP without these, then confirm or revise)

Rationale for the demotion: a document's authority should come from rationale, not labels, and the asymmetry favors testing. Adding these later is cheap; removing them once shipped is nearly impossible. Shipping without them IS the experiment.

| Hypothesis (MVP ships without) | Decide-by signal |
| --- | --- |
| No likes, comments, rankings, streaks, follower counts | Reactions migrating to KakaoTalk = intended division of labor. Recording volume decaying = witnessing alone under-rewards. |
| Witness signal is a view count only, never a viewer list | How often "who saw this?" gets asked directly. |
| No chat: no threads, no reply chains; Splash logs flat, quoting one level max | Whether one-level quoting is reported as cramped, and whether conversation stays comfortably in KakaoTalk. |
| No feed: Home is one scroll of **my own** records, newest first; nothing anyone else wrote ever arrives at its top (H19, H20) | Whether the flow gets read as a feed once friends exist in P2. |
| No guilt devices: no streaks, no red gaps; unchecked plans fade quietly, empty days pass silently, empty states read as invitations | Whether recording persists without reinforcement. Habit requests are served by suggestion-row re-drops first. |

## 2. Vocabulary (fixed, do not rename)

| Term | Meaning |
| --- | --- |
| **Ripple** | Any record that remains: a **story fragment with a voice** (H20a), thrown at a story and shelved in time by the system. Two kinds: **drop** (a point, no duration claim) and **timed** (a record *with a span*, the only kind that shows duration). Kind is **end-presence, not provenance** (H18): a span is a recorded fact, typed in after the fact. Most fragments carry **no time annotation at all** and flow in posting order; an `occurred` annotation is an instruction to place the fragment where it happened (H20c). *Dormant (H20b):* the Timer, the running record, and **inner ripples** (`parent_ripple_id`) — the modules stay for P3's Swim; no surface offers them. |
| **Splash** | A **personal topic board that collects Ripples** (H20d). Not a Ripple: it makes no time claim. A Ripple belongs to at most one Splash (`ripples.splash_id`); a Splash may declare a date range and lanes, or derive both from its fragments. Solo in P1; shared by two in P2; pool-wide in P3, when others add Ripples to it (photo pools, Q&A prompts). |
| **Swim** | A live quiet co-presence session. Per-person lanes numbered by join order; the last lane is always an empty "your lane" slot acting as the invitation. |
| **Pool** | A group. Explicit membership. Home of shared artifacts. |
| **Lobby** | The pool browser screen (my pools, join with code). |
| **Lanes** | The category-axis view. Top level: my categories. Inside a pool: that pool's categories. A lane is a division of the water; the category is what the division means. |
| **Swimmers** | A pool's people view. Daily zoom: time-aligned score view. Weekly zoom: person-column matrix. |
| **Locker** | My private global archive and recall engine. Outside any pool. Sees everything, including locked drops. |
| **Submerge** | Presence expiry. Per-user TTL (default 3 days; options instant / 1d / 3d / 7d). Expired members disappear from rosters entirely (no "submerged" badge). Past Ripples persist; only "presence" expires. |
| **Link** | Mutual friendship. The only kind; no asymmetric follow. |
| **List** | My private labels over Links, used for audience routing. Never visible to others. |

Retired vocabulary (do not reuse): Stream, Deck, Pan, Table, Event, Moment, Log. **Thread** is banned as a UI noun: it collides with the no-chat hypothesis (section 1). The home flow has no name of its own — it is just **Home** (H20d).

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
- Per-drop override: a small audience chip on the input sheet. One spectrum: everyone, selected lists/pools, only me (lock). Lock is not a separate toggle. **Absent in P1** (H20g): no audience exists solo, so fragments default to Everyone and the lock toggles in the detail sheet; the chip re-enters the sheet at P2.
- **Lane membership is per-space and derived** (H20h): a Ripple keeps one personal category; pool-side lane assignment lives on the sharing record (the P3 join table carries `pool_lane_id`), never as an array on the fragment. Detach ends the pool-side membership.
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

- **Home: one screen, one scroll, two view modes** (H20c, H20d). Layout authority: `_docs/mockups/home-ripple-mode.png` and `home-splash-mode.png`.
  1. **One flow**, newest at top, ordered by the diary's own key: `COALESCE(occurred, created_at)` descending, `created_at` descending as the tiebreak. Spans sort by their start; a date-only fragment sorts at that date's end; an unannotated fragment (the default) sits where it was posted. The axis is **ordinal** (H16): no gaps, no slots, no proportional spacing. Sections are **months**, grouped by the same key in the author's timezone, sinking per law 1 as the scroll goes back, each under a compact sticky month header that also carries the mode toggle.
  2. **Two lanes of one flow.** The **ripple rope on the left**: a category badge on the rope, content rightward (note, splash tag when a member, photo thumbnails). **Splashes on the right**: right-aligned date range and title, a meta row below (lane chips, always: declared, else the derived dominant, drawn as outline chips, never a fill; a **+Drop** pill only while the board is open), right-anchored waves whose count is the fragment count on the log scale. A splash sits at its **latest fragment's** point in the flow (a fresh, empty board sits at its own creation). *Reserved for P2/P3, spec only:* a pool-shared splash renders pool identity and its pool-side lane as one compound pill — `[pool avatar+name | lane]` — left of +Drop.
  3. **Ripple mode**: ripple rows render full. Splashes render as **quiet marks** — right-anchored wave lines only, minimal vertical space, floating beside the rows and never claiming a full row; an open splash keeps a small `+`.
  4. **Splash mode**: splash rows render full. Ripples render as **quiet marks** — bare badges on the left rope at compact spacing, no content, no full row height.
  5. **Tail ghosts** under a gray wave underline: `+ Drop New Ripple` in ripple mode, `+ Drop New Splash` in splash mode. The rope ends in a ghost ring in both.
  6. **Persistent entries**: the FAB (bottom right) opens the ripple sheet; the tab bar's left `+ with wave` button opens the splash sheet, in both modes.
  7. **Switching is a refocus, not navigation.** One rendered list with mode-conditional presentation, opacity and transform transitions only, instant under reduced motion, and one shared scroll position. Two ways to switch: the small header toggle (one-wave glyph = ripple mode, two waves = splash mode; the active segment is an ink fill, law 5), and **tapping any quiet mark**, which switches modes focused at that element. Foreground taps keep their meanings: a ripple row opens the detail sheet, a splash row opens the splash screen, +Drop opens the ripple sheet preset to that splash. Default mode: **splash**, remembered per session (a reversible constant).
  8. **Splash screen** (`_docs/mockups/splash-thread.png`; "thread" is the working name, never a UI noun): header with the date range (declared or derived), title, wave underline and fragment count; then the rope with category badges and the fragments in **time order, oldest first**, by the same key, small day labels grouping them, photos inline and large; an add slot at the bottom opens the ripple sheet preset to this splash. Delete lives here and **detaches** the fragments rather than deleting them — the confirm says so.
  *Retired (H20c):* the date pager and the paged day, the Daily Note area, the now band, the ghost slot, the Lanes strip, planned-at-reduced-opacity. A future-dated annotation is a normal fragment with a future date chip and sorts above today (dogfood watch item, section 10).
- **Lanes**: my categories x days matrix (wave cells). Includes locked Ripples, unmarked (this view is mine alone). Column header = that category's dashboard: edit name/icon and delete while empty (shipped), plus where it flows — mappings — which arrives with pools in P2. Exploration lives here.
  - **A cell is a count, drawn as an impression** (H19): how many Ripples that category held that day, log-scaled and capped, never a number. A day is the fragment's **coalesced `occurred_on`** — its annotation's date, else the author-local date it was written (H20c). **Future-dated fragments are not counted**: the day has not happened. Sections are months, sinking per law 1 as the scroll goes back.
  - **Quiet stretches fold**: three or more consecutive days with nothing recorded collapse into one low row (`Sep 2 to 6`). The threshold is tunable. The matrix is otherwise unbounded — today back to the first record — because the fold is what makes that affordable.
  - Interactions, two: a cell opens that day on Home, a column header opens that lane's sheet. Deleting a lane that still holds records is refused rather than resolved.
- **Pools**: room list with activity signals (ripple badges on pool cards: active Splash bar miniature, Swim traces). Lobby = browse my pools + join with code. No public search / open pools in v1.
- **Locker**: recall engine: the **Trail** (shipped), weekly recap (score view), aggregates ("42 tracks, indie pop lately"), one year ago today, export. Recall lives here; do not add matrices here or aggregates to Lanes.
  - **Trail**: my whole archive as one continuous backward scroll, newest day first, days cut on the **coalesced `occurred_on`** (H20c), each day's Ripples in Home's row grammar and still reading early to late. Locked Ripples included, unmarked. Rows open the detail sheet; a day header goes back to that day on Home. Sections are months and sink per law 1. **This is archive browsing of my own records** — the no-feed hypothesis concerns others' content arriving unasked, and nothing ever arrives at the top of one's own past (H19).

**Inside a pool:**

```
Swimmers / Lanes / Splash
```

- **Swimmers**: the room's daily screen. Daily zoom: time-aligned score view (per-person vertical lanes, me first, then join order). Weekly zoom: person-column matrix. Quiet members within TTL show as calm columns; past-TTL members have no column.
- **Lanes**: this pool's categories x days matrix.
- **Splash**: boards + **all joint Ripples (participants >= 2)**. The "records of us together" filter; ended Swims are absorbed here as joint-Ripple bundles. For couples this tab is effectively the shared album.
- **Swim has no tab.** Start: FAB sheet (secondary entry) or long-press on a lane. Live: a large intruding card wherever relevant (carousel peek if multiple). Past: a record card on that day's page + traces in Swimmers (simultaneous bundles).

## 6. Input sheets (the most-opened screens)

**No in-sheet mode toggle: the entry path decides which sheet opens** (H20). Layout authority: `_docs/mockups/sheet-ripple.png` and `sheet-splash.png`.

**The ripple sheet** — from the FAB, a splash's +Drop, or the splash screen's add slot.
- **Top zone**: the lane chip row, horizontally scrollable; selected = ink fill, white text (law 5). A search field above it renders only when lanes exceed **8** (a constant), never on mere one-row overflow.
- **Note field**: autofocused, keyboard up, placeholder *Drop your words here*. The selected lane's emoji is the field's leading badge and updates with selection. Note-only commits are valid; no lane chosen = the residual category (Day). A chip tap alone is still a valid entry: the zero-character diary.
- **Two quiet affordances under the field.** `+ Add Time` — an `occurred` annotation for **not-now only**: occurred = now is redundant with posting, so no *now* option or segment exists anywhere. The picker takes a date (default today) and an optional time; `+ end` adds an end for a manual span, validated only as end > start. Date without time = date-only. A set annotation renders as one removable chip (`14:30`, `8. 17`, `8. 17 ~ 8. 18`); unset is the default, a plain posted fragment. `+ Add Image` — camera or gallery; photo-only commits are valid; thumbnails preview above the commit row.
- **`+ Add to Splash`**, bottom right above the commit, a wave-underlined text link: opens a small board picker (recent first, plus *New splash*); once set it renders as the board's chip, removable. Preset when opened from +Drop or a splash screen. Attaching a lane-declared splash applies inheritance (H20e): one declared lane and the chip row disappears; several and it offers only those; detaching restores free choice.
- **Commit row**: a single full-width **Drop**. No audience chip (P2), no Timer (dormant).
- **Edit is this sheet, prefilled**, committing as *Update* (H17). Editable: note, category (unless inherited), media, the annotation, the splash. Not editable: `created_at`.
- After commit: the sheet closes, the multi-ring ripple plays once at the new row, nothing else. No praise, no share prompts.

**The splash sheet** — from the tab bar's `+ with wave` or the `+ Drop New Splash` ghost.
- **Top zone**: `Add Lanes` (optional, several allowed).
- **Title field** autofocused, placeholder *Drop your splash*; `+ Add Date` beneath it (a date and an optional end date, one removable chip). A declared range is descriptive, never a deadline.
- **Full-width Drop** — one commit verb for both sheets; the placeholder differentiates. After commit the ripple sheet opens preset to the new board, so creating and first-throwing is one motion; dismissing it is fine.

**Ripple detail half-sheet (H17):** tapping a settled Ripple opens it — category · note, its annotation (date, time, and end plus duration for a span), media, its splash, and the **lock toggle** (Everyone / Only me), which is where audience lives in P1 (H20g). Edit and Delete live here and nowhere else. **No view count and no person-paging in P1**: both need an audience.

*Dormant (H20b, H20c):* the Timer and the dual commit, the running-session swap, the straddle refusal, the ghost landing rail, inner composition, the collision repair. Their modules and tests stay for P3's Swim.

## 7. Visual system

Theme: swimming pool. Stop before skeuomorphism: no wave textures, no floats, no water puns in copy.

**Laws:**
1. **Time owns the tone and opacity channels.** Past: backgrounds sink stepwise (white, then #F1F3F7, then #D8DCE8) **within a continuous scroll** — going deeper as you move back through one surface. A paged day is not a section: Home Daily shows one day at a time and keeps its ground white at every date, because tinting a whole page reads as disabled rather than deep (H14). Future: the item itself renders at reduced opacity. Tone and opacity never encode ownership (mine vs others).
2. **Undulation = activity.** More waves = more happened. Impression-level (calm / some / lots), log-scaled, never a precise count or a participation gauge. A bundle's count is an impression and nothing finer: it does not represent breaks or any other structure inside a session, because information below an encoding's resolution reads as a defect (H15a2).
3. **Only living things move.** An in-progress timed **travels**: its waveform is held rigid and slid through a clipped window, every line in the bundle in phase, so what moves is the water and not the drawing of it (H9). Finished water is still. New drop = a **ripple: three rings spreading outward, staggered**, their opacity front-loaded against their travel (H9c) — one event per commit, never a loop. reduced-motion fallback mandatory, and every design must read correctly static.
4. **Dotted = not yet.** Lane ropes and the empty "your lane" slot. **Not planned Ripples** (H9b): at the wave's 1px amplitude a dashed stroke becomes a row of dots and stops reading as a wave, so planned renders at reduced opacity instead.
5. **One channel, one meaning.** Position = me (first column/row, leading). Ring weight + #0507C9 = live. **Two fills, two meanings (H20f): solid #0507C9 fill = action** — Drop, +Drop, the FAB, waves, live surfaces (a solid #0507C9 *content* surface still means a live session: Swim cards and the dormant focus screen, H15); **solid ink #313338 fill = selection** — the selected chip, the active toggle segment. White text on both. Blue fills on a screen point only at what commits or creates. Chrome styling is not encoding, so the action colour does not compete for the channel (H8).
6. **Vocabulary may be taught; visual encodings may not.** If an encoding needs explanation, it is rejected.

**Palette (the only custom tokens):**
- Main ramp: **#0507C9** is the whole of it in practice — waves, live states, emphasis text and interactive chrome. **#787BE2** is a chip foreground only (H8). **#D3D7F6** is **reserved and currently unused** (H9a): the wave vitality ramp it belonged to no longer exists, because a wave keeps its strength wherever it sits and the past is carried by the sinking background instead.
- Gray ramp, structure: **#F1F3F7** surfaces, **#D8DCE8** deeper surfaces / dividers / lane ropes, **#6B79A3** muted and secondary text.
- Ink: **#313338** body text.
- **Text rule (H8):** #787BE2 is a **chip foreground and a wave tone, nothing else**. Its only text use is the foreground of small tag-like chips (the duration chip); otherwise it appears solely as the "recent" tone inside the wave ramp. Text hierarchy: **#313338** default, **#0507C9** emphasis, **#6B79A3** muted or secondary. #D3D7F6 is never text. Enforced by `scripts/check-tokens.sh`, which fails the lint if main-400 is used outside the chip and wave components.
- **Chips (H20f):** a category chip is white with muted text when unselected and an **ink fill with white text** when selected; an outline chip (a splash's lane chips) is never filled. Blue fill is never a selection.
- **No other colors, with one exception: category emojis keep their native colors** (the only off-palette element).
- Dark mode: undefined for now. When designed it must be a night pool, never inverted colors.

**Wave colour is contrast-determined (H15c):** #0507C9 on light surfaces, white on deep live surfaces. An inversion rule, not a second tone — one wave drawn in whatever reads against its ground, carried by `currentColor` so the surface decides and the component never takes a colour.

**Ripple grammar:** timed = multi-line wave bundle (line count log-scaled on duration, capped at 10; **constant gap between lines, so only the count varies** — a bundle's height is a consequence of its density, not a measure of its span). drop = single wave line. A splash's waves = its fragment count on the log scale (law 2), right-anchored, and a splash with nothing in it yet draws one line so it has a mark at all. Planned-at-reduced-opacity is retired (H20c): a future-dated fragment is a normal fragment with a future date chip. Category badge on the avatar corner (rows) or bundle head (timeline), so text is 100% note. Display format: `category · note`.

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
        occurred_on? date, occurred_time?,    -- both null = unannotated (the default, flows by created_at);
                                              -- date only = date-only record; both = a placed fragment (H20c)
        started_at,                           -- the instant, resolved from the author's zone at write time
        ended_at?,                            -- =start for drops; later = a span
        splash_id?,                           -- at most one board per fragment; on delete set null (H20d)
        parent_ripple_id?,                    -- dormant (H20b): inner ripple, contained by its parent's span
        planned bool,                         -- dormant (H20c): always false from the sheet
        participants[], created_at)
  -- H20c: the exclusion constraint is dropped; overlapping spans are legitimate records
ripple_audience(ripple, target: list|pool|lock)
ripple_views(ripple, viewer, viewed_at)       -- witness counts; readable by the ripple's author only
splashes(owner, title, declared_start?, declared_end?, lane_ids uuid[],   -- H20d/e; owner-only RLS
         pool?, type free|prompted, prompt?)                             -- pool-side seat, reserved for P3
```

occurred vs created separated (backfill lands on the right day); occurred_on and occurred_time are author-local, day boundaries computed in the author's timezone. **The display key is `COALESCE(occurred, created_at)`** and the day Locker and Lanes read is `COALESCE(occurred_on, created_at in the author's zone)` (H20c), computed where it is read; no sort key is stored. Swim = a grouping of simultaneous timed Ripples. RLS enforces the two visibility paths at the DB level.

## 9. Scope

Scope is cut into **phases**, not versions (H11). The build is solo-first: the app becomes complete for one person before anyone is invited, because the founding constraint is that a user is complete with zero pools and the archive is worth keeping with nobody watching.

*Mapping, stated once:* the old v1a splits across **P1** (everything except the social half) and **P2** (Link, rail, view count, presence). Old v1b's Lanes matrix moves into P1; its Spotify suggestion into P1.5; Home Weekly is deferred. Old v1.5 becomes **P3** unchanged. The v1a/v1b/v1.5 labels are retired.

**P1 — solo-complete.** Auth (social login) + profile bootstrap (timezone capture, six-lane seed); the ripple sheet and the splash sheet (section 6); Home as one flow with two modes; **Splash, solo** (H20d: boards, the splash screen, inheritance, detach-on-delete); Ripple detail half-sheet — note, annotation, media, splash, lock toggle, **no view count**; delete (hard, including media); photo attach; designed empty-state copy; Lanes read-only matrix; Locker Trail (full personal scroll including locked Ripples); deploy to cloud Supabase + Vercel, because daily use on a phone requires it. *Dormant, kept for P3:* the Timer, the now band, the focus screen, Break, inner ripples.

**P1.5 — dogfood window.** Daily personal use and small fixes. First candidate: Spotify now-playing as a client-side fetch when the input sheet opens — no background jobs, no stored tokens.

**P2 — Link world.** Link + invite link, friend rail, the audience chip back in the sheet, **Splash shared by two**, view-count UI (opening a Ripple records a view event; the count is visible to the author only), presence TTL surfacing (hardcoded 3d, computed at read). **The witnessing experiment runs here**: the section 1 hypotheses about being witnessed are not answerable before an audience exists.

**What each phase can conclude (H11).** P1 and P1.5 validate **input cost and recall value only** — whether a record is cheap enough to make, and whether the archive is worth returning to. **Solo usage decay is not evidence of product failure**, because the witnessed hook is absent by design until P2.

**P3 — Pool world.** Pool create/join + mapping contract screen, Swimmers (Daily score / Weekly matrix), pool Lanes, **Splash pool-wide** (the compound pool pill, the joint filter, the sharing record carrying `pool_lane_id`), Swim (lane card, live card, FAB entry — the dormant live modules wake here), suggestion row full version.

**Later, unscheduled:** Home Weekly zoom, one year ago today (empty by definition for the first 12 months), background auto-collection (timeline autofill; Spotify first), multi-pool routing UI (category x pool mapping settings), Lists UI, notifications (Splash opened / Swim started / Link request only; <= 2/day), Splash-born ephemeral pools, open/searchable pools, desktop score layout and ambient window, weekly-group view for couples (Splash grouping), recurrence engine, note-convention parsing (scores), photo book export, dark mode (night pool), TTL setting UI.

### 5.8 Empty states

One voice: **invitation, never absence, never a nudge** (H19). No exclamation marks, no counts of what is missing, no "yet" that implies a debt. Home with nothing at all: *Your trail starts with the first ripple.* Home in splash mode with no splashes: *Stories gather what keeps happening.* Lanes with nothing recorded at all: *Waves gather here as you drop.* An empty Trail: *Your trail starts with the first ripple.* The tail ghost stays beside the copy in every case. *(Retired with the paged day, H20c: A quiet day so far / A quiet day / Nothing planned yet.)*

## 10. Open items

- Onboarding flow beyond functional empty states (first drop before first invite; "everyone's submerged" roster copy).
- Home-Lanes-Detail person/pool filter chips in mockup: undecided whether that view includes others' content (would be a new axis decision) or is mine-only (then remove chips).
- Friend-rail wave unification; quiet-day row compression thresholds.
- Swim focus screen: lane card enlarged + my timer, nothing more (one-liner, P3).
- **Future-dated fragments sort above today (H20c).** Accepted for now and a dogfood watch item: if plans crowd the top of Home, the fallback is a plans shelf above the flow. Lanes already leaves them out of cell counts.
- *Dormant with the live surfaces (H20b):* **Timed inner ripples, partly settled (H18).** Inner mode has **no Timer**, not "Drop only": a typed span is allowed inside a session, validated by containment, so a backfilled break or a call taken during a focus block can be recorded with its own span. That answers the old open question about arbitrary timed children in the retroactive direction, and it settles the break-identity worry the safe way round — **breaks were identified by span rather than by name, and that still holds**, but a break is no longer the *only* timed child, so "a timed inner ripple" and "a break" are no longer the same set. What remains open: whether a timed child may ever be started live and outlive its parent, and whether two timed children may overlap inside one parent (today's containment and the exclusion constraint say no to both).
- *Dormant with the live surfaces (H20b):* **Detach is deliberately absent.** An inner ripple cannot be promoted to top-level by moving it out of its parent: its time is clamped to the parent's span, and the way out is delete and re-drop. Composition is a decision made when the record is written, not a later re-filing, and a detach control would put a second structural verb next to the three that already exist (drop, timer, break). Revisit only if dogfooding produces the need.
- E2EE stance: rejected in favor of access control (RLS); revisit only if positioning changes.
- Monetization: explicitly a non-goal (portfolio + personal use).
