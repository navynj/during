#!/usr/bin/env bash
# Refuses to run when the Supabase CLI is pointed at a linked cloud project.
#
# Seeds and resets are DEV-ONLY. `supabase db reset --linked` drops and
# recreates the remote database, and the fixtures in supabase/seed.sql invent
# a person (yoonji@during.today) who should never exist in production. There
# is no undo for either, so the guard is a refusal rather than a prompt.
set -euo pipefail

for arg in "$@"; do
  case "$arg" in
    --linked | --db-url | --project-ref)
      echo "✖ $arg targets a remote project. Seeds and resets are local only." >&2
      echo "  Nothing was run. If you meant to change production, do it as a" >&2
      echo "  migration and push it: supabase migration new … && supabase db push" >&2
      exit 1
      ;;
  esac
done

# A linked project is not itself a problem — `supabase link` is how migrations
# are pushed. What matters is that this command cannot reach it, so the check
# is on the command's own target, not on whether a link exists.
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "✖ SUPABASE_DB_URL is set, which overrides the local stack." >&2
  echo "  Unset it before seeding or resetting." >&2
  exit 1
fi

echo "  ✓ local stack only"
