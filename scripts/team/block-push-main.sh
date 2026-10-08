#!/usr/bin/env bash
# doi-agent v3 — PreToolUse hook: block any git push that targets main (works even without GitHub branch protection).
# Only the "command" field is checked, split on && ; || |, so text like `echo main` or a description never blocks.
input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: pass' 2>/dev/null)
[ -z "$cmd" ] && cmd="$input"
pushes=$(printf '%s\n' "$cmd" | sed -E 's/(&&|\|\||;|\|)/\n/g' | grep -E '^[[:space:]]*git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+push([[:space:]]|$)')
[ -z "$pushes" ] && exit 0
if printf '%s\n' "$pushes" | grep -Eq '(^|[[:space:]:+/])main([[:space:]]|$)'; then
  echo "Blocked by doi-agent: pushing to main is not allowed. Ly approves releases by merging the pull request on GitHub." >&2
  exit 2
fi
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null
if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "main" ]; then
  echo "Blocked by doi-agent: you are on main. Switch to develop or a team/* branch before pushing." >&2
  exit 2
fi
exit 0
