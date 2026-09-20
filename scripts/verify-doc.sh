#!/usr/bin/env bash
# Checks that a doc edit actually landed, before anything claims it did.
#
#   scripts/verify-doc.sh _docs/SPEC.md "v0.12" "within a continuous scroll"
#
# Exists because a passing build says nothing about a document: a text
# replacement that matches nothing changes no file, breaks no type, and reads
# as success. Twice in one session a commit claimed a decision was recorded
# when the edit had silently matched nothing.
set -euo pipefail

file="${1:?usage: verify-doc.sh FILE NEEDLE [NEEDLE...]}"
shift
[ $# -gt 0 ] || { echo "verify-doc.sh: give at least one string to look for" >&2; exit 2; }

if [ ! -f "$file" ]; then
  echo "✖ $file does not exist" >&2
  exit 1
fi

missing=0
for needle in "$@"; do
  if grep -qF -- "$needle" "$file"; then
    echo "  ✓ $needle"
  else
    echo "  ✖ missing: $needle" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "✖ $file did not get the edit. Do not commit, and do not describe it as done." >&2
  exit 1
fi

echo "✓ $file verified"
