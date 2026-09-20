#!/usr/bin/env bash
# A warning, never a failure: editing UI with the stack down is legitimate.
# What is not legitimate is finding out via a 25-second page load.
set -uo pipefail

URL="${NEXT_PUBLIC_SUPABASE_URL:-http://127.0.0.1:54321}"

if curl -s -m 2 -o /dev/null "${URL}/auth/v1/settings"; then
  exit 0
fi

echo ""
echo "⚠  Supabase is not reachable at ${URL}"
echo "   Start it with:  pnpm db:start   (OrbStack or Docker must be running)"
echo "   Until then every page redirects to /sign-in and auth calls time out."
echo ""
