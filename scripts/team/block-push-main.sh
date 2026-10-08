#!/usr/bin/env bash
# doi-agent v3 — PreToolUse hook: block any git push that targets main (works even without GitHub branch protection).
input=$(cat)
if printf '%s' "$input" | grep -Eq 'git[^"]*push'; then
  if printf '%s' "$input" | grep -Eq 'git[^"]*push[^"]*(^|[^A-Za-z0-9_/-])main([^A-Za-z0-9_-]|$)'; then
    echo "Blocked by doi-agent: pushing to main is not allowed. Ly approves releases by merging the pull request on GitHub." >&2
    exit 2
  fi
  cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null
  if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "main" ]; then
    echo "Blocked by doi-agent: you are on main. Switch to develop or a team/* branch before pushing." >&2
    exit 2
  fi
fi
exit 0
