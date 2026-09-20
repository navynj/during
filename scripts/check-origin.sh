#!/usr/bin/env bash
# The deployment's origin is configuration, never source.
#
# It reaches the app through NEXT_PUBLIC_SITE_URL and nowhere else (lib/site.ts
# is the only reader), so the same build serves a preview, a local run and
# production. A domain written into a file is a second source of truth that
# only disagrees once — and the S0 lesson was that an origin mismatch fails
# *silently*, falling back rather than erroring.
#
# Fixture email addresses are not origins, so @-prefixed matches are allowed.
set -euo pipefail

roots=(app features components lib vercel.json next.config.ts proxy.ts)
hits="$(grep -rn --include='*.ts' --include='*.tsx' --include='*.json' \
  -E '\bduring\.today' "${roots[@]}" 2>/dev/null | grep -v '@during\.today' || true)"

if [ -n "$hits" ]; then
  echo "✖ The production domain is written into source:" >&2
  echo "$hits" >&2
  echo "" >&2
  echo "  Read it from NEXT_PUBLIC_SITE_URL through lib/site.ts instead." >&2
  exit 1
fi

echo "✓ no deployment origin in source"
