#!/usr/bin/env bash
# A dump of the linked (production) database, because the free tier has none.
#
# Two files per run, both gitignored:
#   backups/<stamp>.sql          schema then data
#   backups/<stamp>.storage.txt  what is in the media bucket
#
# The bucket's OBJECT BYTES are not here. Postgres does not hold them, so the
# listing tells you what a restore would have to re-upload and nothing more.
# That gap is real; it is written down rather than papered over.
set -euo pipefail

ref_file="supabase/.temp/project-ref"
if [ ! -f "$ref_file" ]; then
  echo "✖ No linked project. Run: supabase link --project-ref <ref>" >&2
  exit 1
fi
ref="$(cat "$ref_file")"

mkdir -p backups
stamp="$(date +%Y%m%d-%H%M%S)"
dump="backups/${stamp}.sql"
objects="backups/${stamp}.storage.txt"

echo "→ dumping ${ref}"
{
  echo "-- During backup ${stamp} — project ${ref}"
  echo "-- schema"
} > "$dump"
supabase db dump --linked >> "$dump"

echo "-- data" >> "$dump"
supabase db dump --linked --data-only >> "$dump"

echo "→ listing storage objects"
supabase db dump --linked --data-only --schema storage > "$objects" 2>/dev/null ||
  echo "-- storage listing unavailable; check the bucket by hand" > "$objects"

lines=$(wc -l < "$dump" | tr -d ' ')
echo "✓ $dump (${lines} lines)"
echo "✓ $objects"
echo ""
echo "  Object bytes are NOT in this dump. A full restore re-uploads them by hand."
