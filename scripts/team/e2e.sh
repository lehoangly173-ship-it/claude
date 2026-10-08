#!/usr/bin/env bash
# doi-agent v3 — run Playwright end-to-end tests; save trimmed failures for QA.
root=$(pwd)
mkdir -p docs/team
ls homespa/playwright.config.* >/dev/null 2>&1 && cd homespa
if ! ls playwright.config.* >/dev/null 2>&1; then echo "E2E SKIP — no playwright.config yet (QA Phase A sets it up)"; exit 0; fi
[ -d node_modules ] || npm ci --silent --no-audit --no-fund >/dev/null 2>&1
if npx playwright test --reporter=list > "$root/docs/team/e2e-full.txt" 2>&1; then
  echo "E2E PASS — $(grep -Eo '[0-9]+ passed' "$root/docs/team/e2e-full.txt" | tail -n1)"
else
  grep -E '✘|[0-9]+\) |Error|expect\(|Expected|Received|failed|flaky' "$root/docs/team/e2e-full.txt" | tail -n 60 > "$root/docs/team/e2e-result.txt"
  n=$(grep -Eo '[0-9]+ failed' "$root/docs/team/e2e-full.txt" | tail -n1)
  echo "E2E FAIL — ${n:-see log}; details in docs/team/e2e-result.txt"
  exit 1
fi
