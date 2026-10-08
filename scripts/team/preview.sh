#!/usr/bin/env bash
# doi-agent v3 — make a PREVIEW (never production) and print only the useful lines.
# Usage: bash scripts/team/preview.sh "message"
msg="${1:-team preview}"
if [ -f homespa/vite.config.ts ] || [ -f vite.config.ts ]; then
  # Vite app (HOME SPA): build one file; Orchestrator deploys it to the preview alias per homespa/HANDOFF.md, only after Ly agrees.
  [ -f homespa/vite.config.ts ] && cd homespa
  [ -d node_modules ] || npm ci --silent --no-audit --no-fund >/dev/null 2>&1
  if npx vite build --logLevel error 2>&1 | tail -n 15; then
    echo "PREVIEW BUILD OK → $(pwd)/dist/index.html — deploy per HANDOFF.md (Expo alias flow) after Ly agrees"
  else
    echo "PREVIEW BUILD FAIL"; exit 1
  fi
else
  npx eas-cli update --channel preview --message "$msg" --non-interactive 2>&1 | grep -Ei 'https?://|error|fail' | tail -n 15
fi
