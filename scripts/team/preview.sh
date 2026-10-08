#!/usr/bin/env bash
# doi-agent v3 — publish a PREVIEW update (never production) and print only the link lines.
# Usage: bash scripts/team/preview.sh "message"
msg="${1:-team preview}"
npx eas-cli update --channel preview --message "$msg" --non-interactive 2>&1 | grep -Ei 'https?://|error|fail' | tail -n 15
