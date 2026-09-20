# During

A one-line diary that assembles itself. While you write it, your presence shows on the
surface for a few close friends.

- Product spec: [`_docs/SPEC.md`](_docs/SPEC.md) — authoritative for behavior and vocabulary.
- Decision log: [`_docs/DECISIONS.md`](_docs/DECISIONS.md) — rationale and rejected alternatives.
- Roadmap: [`_docs/ROADMAP.md`](_docs/ROADMAP.md) — session-sized milestones.
- Working rules for contributors and agents: [`CLAUDE.md`](CLAUDE.md).

## Quickstart

Requirements: Node 20+, [pnpm](https://pnpm.io), the
[Supabase CLI](https://supabase.com/docs/guides/local-development), and a container
runtime ([OrbStack](https://orbstack.dev) or Docker Desktop) running.

```bash
pnpm install
cp .env.example .env.local
supabase start          # boots Postgres, Auth, Storage, Realtime locally
```

`supabase start` prints an `anon key` and a `service_role key`. Paste them into
`.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, then:

```bash
pnpm dev                # http://localhost:3000
```

Sign-in needs Google OAuth credentials. Create an OAuth client in the
[Google Cloud console](https://console.cloud.google.com/apis/credentials) with
`http://127.0.0.1:54321/auth/v1/callback` as an authorized redirect URI, and put the
client ID and secret in `.env.local` as `SUPABASE_AUTH_GOOGLE_CLIENT_ID` and
`SUPABASE_AUTH_GOOGLE_SECRET`. Restart the stack (`supabase stop && supabase start`)
after adding them.

## Everyday commands

| Command         | What it does                                              |
| --------------- | --------------------------------------------------------- |
| `pnpm dev`      | Next.js dev server                                        |
| `pnpm build`    | Production build; must pass with zero type errors         |
| `pnpm lint`     | ESLint                                                    |
| `pnpm format`   | Prettier write                                            |
| `pnpm test`     | Vitest; the RLS suite needs a running local stack         |
| `pnpm db:reset` | Re-runs every migration, then `supabase/seed.sql`         |
| `pnpm db:types` | Regenerates `lib/database.types.ts` from the local schema |

## Layout

```
app/                     routes and layouts
features/<name>/         components, hooks and queries colocated per feature
components/ui/           shared primitives (waves, chips, sheets)
lib/                     supabase clients, queries, utilities
supabase/migrations/     schema; never edit an applied migration
```

## Schema changes

One migration per change, never an edit to an applied one:

```bash
supabase migration new <name>
# write the SQL, then
pnpm db:reset && pnpm db:types
```
