# Shipping During

P1's last session: cloud Supabase, Vercel, during.today. Written as a
checklist because it is done once and then referred to when something breaks.

**Read `CLAUDE.md` § "Data is real now" first.** Production has no backups but
the ones we take, and `db reset` is never pointed at it.

## 0. What I cannot do for you

Three things need your browser and your account. Everything else is scripted.

```bash
supabase login                    # opens a browser; run it as `! supabase login`
pnpm dlx vercel login             # or use the dashboard, below
```

The Google Cloud console change in step 3 is by hand, deliberately: it is the
one place where a wrong value fails silently.

## 1. The Supabase project

Free tier allows two active projects per org. G3's answer to the slot limit is
a **second free org** — create the project there rather than deleting anything.

```bash
supabase projects create during --org-id <second-org> --region us-west-1
supabase link --project-ref <ref>
pnpm db:push                      # refuses without a same-day backup
```

Region: `us-west-1` is the closest to Vancouver, and Seoul traffic crosses the
Pacific either way.

`pnpm db:push` applies `0001`–`0004`. Migration `0003` creates the private
`ripple-media` bucket and its owner-prefix write policies, so there is no
bucket to make by hand — confirm it exists rather than creating it.

### Verify RLS live, before anything else goes near it

```bash
pnpm verify:prod        # signed out, every table must be empty or refused
```

It walks all thirteen tables with the anon key and refuses to run against a
local URL. Empty counts as a pass: `select` with no policy returns zero rows
rather than an error, and zero rows is the right answer to "what may a
stranger see". It also checks that the media bucket will not serve an object
without a signature.

Then, signed in on the deployed site, confirm a second account cannot see your
rows. The local suite proves the policies; this proves they shipped.

### Seeds cannot reach it

`pnpm seed:me` runs `docker exec` against the local container — it has no path
to a remote project at all. `pnpm db:reset` refuses outright (see CLAUDE.md
§ "Data is real now"). Neither is a matter of remembering.

## 2. Auth, in the Supabase dashboard

Authentication → URL Configuration:

| Field | Value |
| --- | --- |
| Site URL | `https://during.today` |
| Redirect URLs | `https://during.today/auth/callback` |

`supabase/config.toml` stays pointed at local — it is the local stack's
config, and changing it would send local sign-ins to production.

**The S0 lesson, restated:** `additional_redirect_urls` is matched as an exact
string and a miss falls back to Site URL **silently**. `lib/site.ts` builds
every redirect from `NEXT_PUBLIC_SITE_URL` for exactly this reason, and the
timezone travels in a cookie rather than a query parameter because a query
string is enough to miss the match.

Authentication → Providers → Google: paste the same client ID and secret the
local stack uses. They are in `.env.local`; they do **not** go to Vercel.

## 3. Google Cloud console — by hand

<https://console.cloud.google.com/apis/credentials> → the **existing** OAuth
client (no new one; a second client means a second consent record).

**Authorized redirect URIs → Add:**

```
https://<project-ref>.supabase.co/auth/v1/callback
```

That is Supabase's callback, not the app's. The browser goes
Google → Supabase → `during.today/auth/callback`, and Google only ever needs
the middle one. Keep the existing `http://127.0.0.1:54321/auth/v1/callback`
entry: local dev still uses it.

**Do not touch** the consent screen. It stays in **Testing** with your account
as the only test user until P2 — publishing it starts a verification review
that a closed-group app does not need.

## 4. Vercel

Import the repo (`navynj/during`). Framework preset: Next.js.

`vercel.json` sets the build command to `pnpm verify && next build`, so every
deploy runs ESLint, the design-token guard, and the test suite minus the
files that need a live Postgres (`vitest.ci.config.ts` names them).

### Environment variables — all three, Production and Preview

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the project's anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://during.today` |

**Server-only variables on Vercel: none.** All three above are
`NEXT_PUBLIC_`, meaning they reach the browser by design — the anon key is a
public identifier, and RLS is what protects the data.

**These two never go to Vercel:**

- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS entirely. Local tests only; no
  app code imports it. On Vercel it would be one mis-import from a leak.
- `SUPABASE_AUTH_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_GOOGLE_SECRET` — these
  configure the *local* Supabase stack. In cloud, Supabase holds them.

### Domain

Vercel → Settings → Domains: add `during.today` and `www.during.today`.
Follow the registrar instructions Vercel prints. `vercel.json` already
redirects `www` to the apex permanently.

## 5. Prod smoke

Sign in on the phone, then walk the backlog. This is the P1 definition of
done, on the device it was built for:

- [ ] Drop from all three entry points: FAB, timeline slot, lane chip
- [ ] A manual past span → renders as a bundle
- [ ] A plan with a future span → planned, reduced opacity
- [ ] Timer → now band → `/now` → Break (bubbles) → inner drop → Stop
- [ ] A deliberate overlap → the collision is named, with the nest offer
- [ ] An All-day note
- [ ] Edit a note, a time, an end
- [ ] A retroactive inner ripple on a finished session
- [ ] A photo from the phone camera
- [ ] Delete a session that has an inner ripple → both gone, media too
- [ ] Walk Lanes, then the Trail
- [ ] Add to Home Screen → opens standalone, no browser chrome

## Afterwards

**Weekly-ish `pnpm backup` is yours to run.** The free tier keeps no backups;
these dumps are the only copy. Object bytes are not in them — Postgres does
not hold them — so a full restore re-uploads media by hand.
