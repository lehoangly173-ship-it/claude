#!/usr/bin/env bash
# doi-agent v3 — verify an agent only changed what its role allows.
# Usage: bash scripts/team/guard.sh <builder|qa|reviewer|security> [base-branch]
role="$1"; base="${2:-develop}"
changed=$( { git diff --name-only "$base"...HEAD 2>/dev/null; git diff --name-only; git diff --name-only --cached; git ls-files --others --exclude-standard; } | sort -u )
bad=""
case "$role" in
  builder)
    bad=$(printf '%s\n' "$changed" | grep -E '^(e2e/|docs/team/spec/|docs/team/test-plan\.md|scripts/team/|\.claude/)' )
    old_mig=$(git diff --name-only --diff-filter=MD "$base"...HEAD -- supabase/migrations 2>/dev/null)
    [ -n "$old_mig" ] && bad+=$'\n'"$old_mig (existing migration changed)"
    ;;
  qa)
    bad=$(printf '%s\n' "$changed" | grep -vE '^(e2e/|docs/team/|playwright\.config\.(ts|js)$|package\.json$|package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$)' | grep -v '^$')
    ;;
  reviewer|security)
    bad=$( { git diff --name-only; git diff --name-only --cached; git ls-files --others --exclude-standard; } | sort -u | grep -vE '^docs/team/(reviews/|STATE\.md$|log\.md$)' | grep -v '^$')
    ;;
  *) echo "usage: guard.sh <builder|qa|reviewer|security> [base]"; exit 2;;
esac
bad=$(printf '%s\n' "$bad" | grep -v '^$')
if [ -n "$bad" ]; then echo "GUARD FAIL ($role) — not allowed:"; printf '%s\n' "$bad"; exit 1; fi
echo "GUARD PASS ($role)"
