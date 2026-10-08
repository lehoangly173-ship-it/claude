#!/usr/bin/env bash
# doi-agent v3 — verify an agent only changed what its role allows.
# Usage:
#   bash scripts/team/guard.sh start                 # Orchestrator: run right BEFORE each agent call (remembers HEAD)
#   bash scripts/team/guard.sh <role>                 # run right AFTER the agent; role = planner|builder|qa|reviewer|security
# Checks commits made since `start` (on any branch) + uncommitted + untracked files.
# Exit: 0 PASS, 1 FAIL (undo needed), 3 NEEDS-APPROVAL (dependency change: ask Ly first).
gd=$(git rev-parse --git-dir) || exit 1
if [ "$1" = "start" ]; then git rev-parse HEAD > "$gd/doi-guard-base"; echo "GUARD START $(cut -c1-7 "$gd/doi-guard-base")"; exit 0; fi
role="$1"
base=$(cat "$gd/doi-guard-base" 2>/dev/null)
[ -z "$base" ] && { echo "GUARD FAIL — run 'bash scripts/team/guard.sh start' before calling the agent"; exit 1; }
changed=$( { git diff --name-only "$base" HEAD 2>/dev/null; git diff --name-only; git diff --name-only --cached; git ls-files --others --exclude-standard; } | sort -u | grep -v '^$')
# Files the Orchestrator itself edits around every call are always fine.
changed=$(printf '%s\n' "$changed" | grep -vE '^docs/team/(STATE|log)\.md$' | grep -v '^$')
only() { printf '%s\n' "$changed" | grep -vE "$1" | grep -v '^$'; }
case "$role" in
  planner)  bad=$(only '^docs/team/(spec/|summary\.md$|decisions\.md$)') ;;
  builder)
    bad=$(printf '%s\n' "$changed" | grep -E '^((homespa/)?e2e/|docs/team/|scripts/team/|\.claude/|(homespa/)?playwright\.config\.)')
    old_mig=$(git diff --name-only --diff-filter=MD "$base" HEAD -- supabase/migrations 2>/dev/null)
    [ -n "$old_mig" ] && bad+=$'\n'"$old_mig (existing migration changed)"
    ;;
  qa)       bad=$(only '^(docs/team/test-plan\.md$|homespa/(e2e/|playwright\.config\.(ts|js)$|package\.json$|package-lock\.json$))') ;;
  reviewer) bad=$(only '^docs/team/reviews/[^/]+\.md$') ;;
  security) bad=$(only '^docs/team/reviews/security-[a-z]+\.md$') ;;
  *) echo "GUARD FAIL — unknown role '$role' (use planner|builder|qa|reviewer|security)"; exit 1 ;;
esac
bad=$(printf '%s\n' "$bad" | grep -v '^$')
if [ -n "$bad" ]; then echo "GUARD FAIL ($role) — not allowed:"; printf '%s\n' "$bad"; exit 1; fi
if [ "$role" = "builder" ] && printf '%s\n' "$changed" | grep -Eq '(^|/)package(-lock)?\.json$'; then
  echo "GUARD NEEDS-APPROVAL (builder) — dependencies changed:"; git diff "$base" -- '*package.json' | grep -E '^[+-][[:space:]]+"' | head -n 20
  exit 3
fi
echo "GUARD PASS ($role)"
