#!/usr/bin/env bash
# doi-agent v3 — run Playwright end-to-end tests; save trimmed failures for QA.
root=$(pwd)
mkdir -p docs/team
# App in homespa/ → run there if its Playwright config lives there.
ls homespa/playwright.config.* >/dev/null 2>&1 && cd homespa
if ! ls playwright.config.* >/dev/null 2>&1; then echo "E2E SKIP — no playwright.config yet (QA Phase A sets it up)"; exit 0; fi
if npx playwright test --reporter=line > "$root/docs/team/e2e-full.txt" 2>&1; then
  echo "E2E PASS"
else
  grep -E '✘|Error|expect|›|failed' "$root/docs/team/e2e-full.txt" | tail -n 60 > "$root/docs/team/e2e-result.txt"
  echo "E2E FAIL — $(grep -c '✘' "$root/docs/team/e2e-full.txt") failing; details in docs/team/e2e-result.txt"
  exit 1
fi
