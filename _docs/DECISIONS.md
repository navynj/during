# During: Decision Log (v0.3)

Format: **Decision** · Why · Rejected (and why). Grouped by theme, roughly chronological within each. Group H records spec-review amendments; where H supersedes an earlier entry, the earlier entry stays as history with a note.

---

## A. Concept

**A1. Closed-group app, not a social network.** Numbers-free (no likes/rankings/streaks) is the identity, not a feature. Rejected: any engagement mechanics; they reintroduce broadcast psychology. (Reframed by H1: now a hypothesis set to validate with the MVP, not a dogma.)

**A2. Chat is excluded on purpose.** Can't beat KakaoTalk; including it makes archiving a side feature. Reactions were later removed too. Rejected: chat tab, reply threads. (Reframed by H1.)

**A3. Survive next to KakaoTalk by not competing for conversation.** Value = data chat doesn't have (location, time, originals, structure), value that grows with time, and utility even when others are quiet.

**A4. Church small-group product: deprioritized.** Leader-motivated / member-cost tools collapse in 3 to 4 weeks; archives of prayer lists have no compounding value. Kept only as a Pool preset.

**A5. Realtime micro-sharing chosen over archiving-first.** Presence has near-zero production cost ("existing is the signal") and fills the gap chat structurally can't (status is not addressing someone).

**A6. Reward = being witnessed, not interaction.** Must hold with zero response from others. View count only, never viewer lists. (Count-only display is now hypothesis H1-b.)

**A7. Pivot: input-based SNS to self-record with leakage.** Chip-tapping "for broadcast" felt meaningless (user diagnosis). Frame flipped: a dot on my Trail; friends seeing it is a byproduct. Rejected: productivity-tool core (todo/timer as the engine: tone too narrow, non-purposeful states die), permanent standing-Splash-first (records without a matching board still homeless).

**A8. Timeline day-page diary (Structured-like plan+check allowed) adopted as the core form.** The empty time axis itself invites filling; morning planning prepays the day's record; the time axis doesn't discriminate rest vs work (unlike todo's completion axis). Conditions: dual path (planning optional, drop-only valid), unchecked plans fade without guilt.

**A9. Timeline format presupposes auto-collection.** Quiet-day emptiness must read as "quiet", not "dead": auto signals (Spotify first) + plans filling the future + copy. Promoted from v2 to v1.

**A10. Diary posture, not chat posture.** No persistent bottom input bar, flat rows (no bubbles), generous spacing, day pagination not infinite scroll. Chat contributes only its grammar (single time axis, author labels, cardinality-adaptive rendering). (Amended by H2: the original "newest on top" ordering is replaced by chronological top-to-bottom with a current-time anchor for today; the intent, opening onto the latest, is preserved by the anchor.)

**A11. All records belong to the time they were born.** Date-only records sit in that view's Note area (several per day allowed, per H5); week/month notes on their period views (recursive rule). Timeless documents are out of scope: "want to become X" is a record of the day you thought it. Rejected: undated notes area (turns the app into a general notebook).

## B. Vocabulary

**B1. English service; vocabulary is a budgeted system.** Skeleton nav uses common words (Home), custom words only where meaning would be lost otherwise. Encodings must be intuitive without teaching; words may be taught.

**B2. Final glossary:** Ripple (record; drop/timed), Splash (board), Swim (session), Pool (group), Lobby (pool browser), Lanes (category axis), Swimmers (pool people view), Locker (recall), Submerge (presence expiry), Link, List. Retired: Table, Pan, Event, Moment, Log, Stream, Deck.

**B3. Ripple unified as the name for every remaining record** (statuses, pool posts, logs). One vocabulary = one schema table. "The wave while it spreads is the status; what remains is the Ripple."

**B4. Lane belongs to the category axis; Swimmers names the people view.** Three rounds: person-exclusive (metaphor literalism), then reverted. A lane is a division of one pool of water; the category IS that division's meaning; identical form because identical nature. Lane then appears at both levels (asset placed where most seen). Swimmers reads as a scene (people swimming), not a roster. swim-root = activity words, lane-root = space words.

**B5. Stream rejected twice.** As category name: tech smell, then displaced by Lanes. As Home name: it names the feed form this app deliberately killed; flow is expressed by the screen's physics, the tab names the place. Retired words stay retired.

**B6. Locker never reused for categories.** One word = one axis. Categories' jobs are index/routing/declaration, not storage; storage is Locker's alone.

**B7. Naming: During kept (concept word: duration/simultaneity; theme is a replaceable skin, name is structural). Dive rejected (active plunge is not quiet floating). Budget app renamed Namjit.** Domain: during.today (first-year cheap, renewal acceptable, TLD reads as a sentence); auto-renew off; premium C$114 alternative dropped.

## C. Graph & privacy

**C1. Mutual-only Link.** No follower asymmetry = no audience accumulation = graph-level anti-SNS.

**C2. Two-layer social model: flows are person-based (Link+List), artifacts are room-based (Pool).** Pure ego-model rejected: shared artifacts (Splash/Swim/boards) need a common reference "us" that private labels can't provide.

**C3. Link and Pool membership are independent.** Groupmates need not be friends. Non-friend member sees only in-pool leaks; their profile view is a dead end + Link request. Tables never joined to imply friendship.

**C4. List-scoped artifacts rejected.** Reproduces the missing-common-reference bug (invitees can't see "who is us"). Alternative adopted: a Splash can spawn a lightweight ephemeral Pool; the List is consumed as an invite roster only; success path = promote to a real Pool.

**C5. Leak, not publish.** Publish = per-record audience decision = friction + curation pressure. Default flow with valves instead. Then corrected: **explicit category-to-lane mapping is the precondition of any leak** (name-coincidence must not route data; "Day" in two pools are different contexts). Personal and group vocabularies stay independent via mapping.

**C6. Join screen = privacy contract.** Result-phrased ("these will flow here"), match suggestions pre-checked except residual categories (default unchecked; nudge to create a dedicated category), zero-mapping lurker join is first-class with no warning copy, "change later" visible.

**C7. Submerge redefined as universal TTL.** Not a mode: presence expires N after last update (instant/1/3/7d, default 3d). Manual submerge = "expire now" shortcut. Display: the row disappears entirely; no "submerged" badge anywhere (plausible deniability is the point). Past Ripples and pool contributions persist: expiry of "now-ness", not deletion. Not stored as a flag; computed at render.

**C8. Per-drop audience spectrum:** everyone, lists/pools, only me. Lock is one end, not a separate feature. Locker sees all. "Public is ephemeral (presence), private is permanent" became "presence expires, records persist, per-drop lock guards curation pressure."

## D. IA & views

**D1. Everything derives from one primitive.** Splash = Ripple collection, Swim = plural timed, Locker = Ripple aggregation. Complexity lives in surface area, not concepts.

**D2. View formula: time (rows) x entity (columns) x waves (cells); only the column binding changes.** Lanes = categories, Swimmers-Weekly = people, Home-Weekly = weekdays (degenerate single-entity case).

**D3. Tabs split by errand, not by ownership; toggles only for same-errand cross-sections.** Led to top-level Home / Lanes / Pools / Locker (zoom-axis unification of Daily-Weekly-Lanes rejected: zoom is magnification, not axis swap; then toggle rejected too: different errands, discoverability) and pool-level Swimmers / Lanes / Splash. Tab slots are now full: future tab demands auto-reject.

**D4. Home is top-level, not inside a Pool.** Record unit = my day (diary pivot); Link-only users must be complete with zero pools. Pool = a room my records leak into.

**D5. Swim has no tab.** Frequency-area inverse rule. Start = FAB sheet + lane long-press; live = large intruding card (carousel peek); past = absorbed by Splash tab (joint-Ripple definition covers ended swims) + simultaneous-bundle traces in Swimmers.

**D6. Splash tab = boards + all joint Ripples (participants >= 2).** "Records of us" filter; the Us-column need lands here. Global cross-pool Splash feed rejected (artifact-room principle + feed resurrection + empty for Link-only users); its real need decomposed into Pools-tab activity badges + notifications.

**D7. Group weekly = person-column matrix (Lanes grammar, column binding swapped).** Earlier "no group weekly" verdict was a rendering error (imagined a content grid). Column order: me first + join order (activity-order = implicit ranking, rejected). Quiet-within-TTL = calm column; past-TTL = no column.

**D8. Day page: stream to today page with pager.** One pager governs the whole page; boards get their own only when expanded. Later Home Daily/Weekly + rail finalized; category board demoted to a resident summary strip, then split out to the Lanes tab.

**D9. Us/Message are not categories.** "With whom" = participants (overlapping avatars; render rule per group type), "to whom" = at most a future marker. Couple preset: Food / Place / Fun / Day (concrete nouns beat abstractions; Fun = enjoy-by-doing included; Day = guilt-free residual is a culture declaration). Boardgame-with-scores: Fun + note convention ("120:106"), schema fields rejected.

**D10. Locker = recall engine, Lanes = exploration.** Weekly recap (score view), aggregates, one year ago, export live in Locker; matrices don't. Mutual erosion forbidden.

**D11. PC version is coverage, not port.** Desk half of life (focus, Lane sessions, Spotify) happens where the phone is face-down; width solves the compression dilemmas; v1 = responsive web only, ambient window v2.

## E. Input

**E1. Preset chips = category layer, free text = detail layer.** category (enum) + note split is what makes Locker aggregation possible; presets also declare culture (resting equals focus in rank). Chip alone = valid zero-character entry.

**E2. drop/timed split: only explicit timers claim duration.** Drops display "dropped Xm ago", never elapsed. Fake-duration TTL rejected. Category carries a default mode.

**E3. Dual commit buttons (Drop / Timer) replace long-press mode flip.** No hidden gesture, no mode state; choice deferred to commit moment. Future time disables the timer.

**E4. Ghost landing + suggestion row are the sheet's direction.** Form-submission feel rejected: direct manipulation (ghost wave lands where it will live) + reaction-not-recall (now playing / location / yesterday's repeat for one-tap re-drop). Habits are served by re-drop suggestions, not a recurrence engine (Repeat button removed) and never by streaks.

**E5. Single note field.** Title/content split rejected (document smell). Time editing is edge UI ("change the time and it becomes a plan"). After commit: one ring, no praise.

**E6. Three entry points, one sheet, prefill only** (FAB blank / lane = category / timeline slot = time).

## F. Visual system

**F1. Pool theme adopted; depth = time is the systemic value** (theme as information hierarchy, not decoration). Stop before skeuomorphism; no water puns in copy; dark mode = designed night pool.

**F2. Undulation = activity, generalized to "only living things move".** Wave counts are impressions (calm/some/lots, log-scaled, cap), never gauges (blue progress bars rejected as participation-tracking backdoor).

**F3. Timed = wave bundle, drop = single wave line.** Capsule blocks rejected (Structured's signature + calendar-partition metaphor vs water physics); line-thickness "water column" superseded by the user's wave-bundle sketch (one shape, quantity difference; board and timeline finally share one language). Bundle span = duration span.

**F4. One channel, one meaning.** Depth/opacity = time (never mine/others), position = me (first row/column), dotted = not-yet (ropes, plans, empty lane), ring weight + live accent = live, solid deep surface = Swim/Splash cards only. Avatar corner badge / bundle head carries category so text is pure note. Mine/others by opacity rejected ("nobody would understand" = the rejection criterion, promoted to principle). (Color values superseded by H3.)

**F5. Sunken sections + ripple ring feedback.** Day sections sink stepwise; new drop = one expanding ring settling to one; reduced-motion fallback required. (Color values superseded by H3.)

## G. Scope & stack

**G1. v1 cut by the core loop verbs: write / witnessed / recall.** Link world first (auth, Link, input sheet, Home Daily+Weekly waves, rail, Lanes stub, Locker Trail + one year ago, TTL hardcoded, Spotify). Pool world v1.5 (join contract, Swimmers, pool Lanes, Splash, Swim). v2+: routing UI, Lists UI, notifications (<=2/day; Splash/Swim/Link only), ephemeral pools, open pools, desktop layouts, recurrence, exports. (v1 internals restructured by H6 into v1a/v1b.)

**G2. Feature chains that stayed out of v1 stayed out.** Multi-pool audience routing, List artifacts, global feeds: each explored, mapped, reserved; the v1 line never moved. Open/searchable pools removed from the create screen (stranger-world costs uncontracted).

**G3. Stack: responsive web (Vercel) + Supabase.** Neon rejected (DB-only; Auth/Storage/Realtime/RLS would become assembly work; leak-model visibility enforced via RLS). Free-tier slot limit handled by local-first dev (`supabase start`) + slot cleanup (dump and delete dead projects / second free org). Pro plan only if paths close.

**G4. Not a business.** Personal use + portfolio (Ashby design-engineer case study). Korean real users + English UI + English demo seed data; ko/en copy layer if a church group onboards. The exploration record itself (sketch iterations, this log) is portfolio material.

## H. Spec-review amendments (v0.2)

**H1. "Non-negotiables" section dissolved.** Product prohibitions (no likes/comments/rankings/streaks/follower counts; view count only; no chat; no feed; no guilt devices) demoted to MVP-validated hypotheses, each with a decide-by signal. Why: a document's authority should come from rationale, not labels, and the asymmetry favors testing (adding later is cheap, removing later is nearly impossible; shipping without them IS the experiment). System rules (categories = "what" only, per-Ripple assignment, note conventions over schema, encodings never taught) redistributed into their operating sections.

**H2. Home axis and anchors finalized.** Timeline runs chronologically top to bottom (early to late); new records append at the flow's end, where an "Add ripple" ghost slot sits as the next seat and input entry. Scroll anchors: today opens at the current time (scroll up = earlier), any other day opens at the top, pager moves reset anchors. Supersedes A10's "newest on top" while preserving its intent (opening shows the latest today). Friend rail: far right, sharing the main axis's time coordinates.

**H3. Palette v2.** Main ramp #0507C9 / #898BE3 / #D3D7F6 = content vitality (live / recent / settled); gray ramp #F1F3F7 / #D8DCE8 / #6B79A3 = structure, sinking backgrounds, dividers, muted text; ink #313338 = body text. Role remap: live accent and Swim/Splash solid surfaces = #0507C9; sinking backgrounds white to #F1F3F7 to #D8DCE8. #898BE3 and lighter never used for text (contrast). Design system follows Tailwind conventions: default scale for spacing/radius/type; the three ramps are the only custom tokens. Dark mode deferred (night pool when designed; inversion forbidden). (Mid tone and text rule corrected by H7.)

**H4. Emoji exception.** Category emojis keep their native colors: the single allowed off-palette element. Resolves the emoji-vs-icon open item in favor of emojis.

**H5. Date-only records: several per day.** Stacked in the Daily/Weekly Note area under the header (not a single one-line caption). Future-time items render dotted at reduced opacity: time owns the tone and opacity channels in both directions (past sinks, future fades).

**H6. v1 restructured into v1a / v1b (loop-first).** v1a = the smallest set that closes write / witnessed / recall with real friends: auth + profile bootstrap (timezone, category seed), Link + invite, input sheet with ghost landing, Home Daily + rail, Ripple mini half-sheet with view count (new table ripple_views; the witnessed half of the loop was missing from the list), hard delete (privacy requires recall of misfires), designed empty states, TTL hardcoded, Locker Trail. v1b = Home Weekly, read-only Lanes, Spotify reduced to a client-side now-playing fetch when the sheet opens (background OAuth polling infrastructure deferred; the sheet suggestion is most of the value), suggestion-row re-drop. Cut from v1: one year ago today (empty by definition for the first 12 months). A hypothesis checkpoint follows v1a: 4 to 6 weeks of real use, section 1 hypotheses reviewed against their signals, logged as group I before v1.5.

**H7. Palette mid tone corrected: #898BE3 to #787BE2; the "never text" rule retracted.** The prohibition was a contrast inference stated as a decision; the color was always intended for text. Scoped rule instead: #787BE2 = accent text (labels, time markers, headings, bold or generous sizes; ~3.7:1 on white passes large-text contrast), body copy stays #313338 / #6B79A3, #D3D7F6 never text. One-channel-one-meaning is unaffected: the vitality encoding lives in waves; accent text is styling, not encoding.

