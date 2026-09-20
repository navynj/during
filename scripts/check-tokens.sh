#!/usr/bin/env bash
# main-400 (#787BE2) reaches the screen in exactly two places: wave rendering
# and chip foregrounds (CLAUDE.md, "Design tokens and visual rules"). It is not
# a general accent color, and the easiest way to lose that rule is for someone
# to reach for the nice periwinkle on a heading.
#
# If a new directory legitimately renders chips or waves, add it to ALLOWED
# rather than working around this check.
set -uo pipefail

ALLOWED=(
  'components/ui/chips/'
  'components/ui/waves/'
  'app/globals.css'      # where the token is defined
)

SEARCH_PATHS=(app components features lib)
PATTERN='main-400|#787[Bb][Ee]2'

hits=$(grep -rnE "$PATTERN" "${SEARCH_PATHS[@]}" \
  --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null || true)

for allowed in "${ALLOWED[@]}"; do
  hits=$(printf '%s\n' "$hits" | grep -v "^${allowed}" || true)
done

hits=$(printf '%s\n' "$hits" | sed '/^$/d')

if [ -n "$hits" ]; then
  echo "✖ main-400 (#787BE2) used outside chips and waves:"
  echo ""
  printf '%s\n' "$hits" | sed 's/^/    /'
  echo ""
  echo "  main-400 is a chip foreground and a wave tone, nothing else."
  echo "  Text is ink by default, main-900 for emphasis, pool-500 where muted."
  echo "  See CLAUDE.md, \"Design tokens and visual rules\"."
  exit 1
fi

echo "✓ main-400 confined to chips and waves"
