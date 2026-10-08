#!/usr/bin/env bash
# doi-agent v3 — run Playwright end-to-end tests against Expo web; save trimmed failures for QA.
mkdir -p docs/team
if npx playwright test --reporter=line > docs/team/e2e-full.txt 2>&1; then
  echo "E2E PASS"
else
  grep -E '✘|Error|expect|›|failed' docs/team/e2e-full.txt | tail -n 60 > docs/team/e2e-result.txt
  echo "E2E FAIL — $(grep -c '✘' docs/team/e2e-full.txt) failing; details in docs/team/e2e-result.txt"
  exit 1
fi
