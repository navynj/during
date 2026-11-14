# Glossary: on-screen words (H78, 2026-11-13)

The app is **Dida** (full name **Dida Diary**). These are the words people read.
Code keeps the old vocabulary: identifiers, tables, columns, routes, URLs, env
vars, storage keys and file names still say pool, lane, splash and ripple
(CLAUDE.md, Code conventions). Only rendered text changed.

| old term (code) | on screen, singular / plural | notes |
|---|---|---|
| pool | **diary** / **diaries** | "Shared diary" only on the create flow, the join flow and the invite page. Lower case mid-sentence ("That diary is gone."), capitalised at the start of a label ("Diary settings"). A diary's own name is never changed: "in Pancake" stays. |
| lane | **category** / **categories** | The Home view tab "Lane" is "Category". |
| splash | **page** / **pages** | Includes "post" where it named a splash ("Deletes the page and its…"). The verb stays ("Ana posted in Pancake"). |
| ripple | **note** / **notes** | |
| home | Home | unchanged |
| Weming, During, During Today | **Dida** on screen; **Dida Diary** where the full name is needed | manifest `name`, HTML title, link previews and the share-image watermark use Dida Diary; manifest `short_name` is Dida. |
| (tagline) | **A digital diary you decorate.** | where the app is first introduced: sign-in, invite page, metadata description |

Unchanged on purpose: reply, reaction, Only me, Calendar, Members, List, the
Drop button, "Add yours too", "Only me · Share", "Share to".

Compound phrases:

| old | new |
|---|---|
| Drop a splash / Drop your splash / Drop new splash | Add new page |
| Add to this splash | Add to this page |
| In this splash | In this page |
| Your side of this splash | Your side of this page |
| N pools (the Audience chip) | N diaries ("1 diary" is the diary's own name) |
| Open a new Pool (create flow, switcher, empty diary list) | New shared diary |
| Join Pool | Join this shared diary |

`tests/old-terms.test.ts` fails when a rendered string names a retired term;
its allowlist names each exception and why.
