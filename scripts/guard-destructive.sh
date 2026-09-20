#!/usr/bin/env bash
# Stands in front of anything that destroys records.
#
# CLAUDE.md, "Data is real now": the linked project is never a target, and the
# local database is protected too — it holds real records until Yoonji says
# otherwise. She says otherwise by setting DURING_DB_DISPOSABLE=yes for one
# command. That declaration is hers; nothing here may make it on her behalf,
# and it is deliberately not settable from a file.
set -euo pipefail

what="${1:?usage: guard-destructive.sh WHAT [args...]}"
shift || true

for arg in "$@"; do
  case "$arg" in
    --linked | --db-url | --project-ref)
      echo "✖ $what with $arg targets production. Refused." >&2
      echo "  There is no undo. A schema change ships as a migration:" >&2
      echo "    supabase migration new <name> && pnpm db:push" >&2
      exit 1
      ;;
  esac
done

if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "✖ SUPABASE_DB_URL is set, which points $what somewhere that is not the" >&2
  echo "  local stack. Unset it." >&2
  exit 1
fi

if [ "${DURING_DB_DISPOSABLE:-no}" != "yes" ]; then
  echo "✖ $what would wipe the local database, which holds real records." >&2
  echo "" >&2
  echo "  If those records are genuinely disposable, say so for this one run:" >&2
  echo "    DURING_DB_DISPOSABLE=yes pnpm db:reset" >&2
  echo "" >&2
  echo "  Back it up first if there is any doubt — pg_dump of the local stack:" >&2
  echo "    supabase db dump --local -f backups/local-\$(date +%Y%m%d-%H%M).sql" >&2
  exit 1
fi

echo "  ✓ declared disposable for this run"
