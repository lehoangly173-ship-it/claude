#!/usr/bin/env bash
# doi-agent v3 — PREVIEW (never production). Usage: bash scripts/team/preview.sh "message"
#   HOME SPA (Vite): builds homespa/dist/index.html from the CURRENT branch. Deploy steps: docs/team/decisions.md "Preview".
#   Expo apps: publishes an EAS update to the preview channel.
msg="${1:-team preview}"
if [ -f homespa/vite.config.ts ] || [ -f vite.config.ts ]; then
  [ -f homespa/vite.config.ts ] && cd homespa
  [ -d node_modules ] || npm ci --silent --no-audit --no-fund >/dev/null 2>&1
  if npx vite build --logLevel error 2>&1 | tail -n 15; then
    echo "PREVIEW BUILD OK ($(git rev-parse --abbrev-ref HEAD)) → $(pwd)/dist/index.html — deploy to alias 'team' per docs/team/decisions.md (never 'flow')"
  else
    echo "PREVIEW BUILD FAIL"; exit 1
  fi
else
  npx eas-cli update --channel preview --message "$msg" --non-interactive 2>&1 | grep -Ei 'https?://|error|fail' | tail -n 15
fi
