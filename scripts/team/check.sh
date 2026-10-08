#!/usr/bin/env bash
# doi-agent v3 — run all automated checks, print only "CHECK PASS" or trimmed failures.
# Repo này để app trong homespa/ → chạy kiểm tra ở đó nếu gốc repo không có package.json.
[ ! -f package.json ] && [ -f homespa/package.json ] && cd homespa
fail=0
ran=0
out=""
run() {
  local name="$1"; shift
  local res
  ran=$((ran+1))
  if ! res=$("$@" 2>&1); then
    fail=1
    out+=$'\n'"### $name FAILED"$'\n'"$(printf '%s\n' "$res" | tail -n 40)"
  fi
}
[ -f tsconfig.json ] && run typecheck npx tsc --noEmit
if ls .eslintrc* eslint.config.* >/dev/null 2>&1; then run lint npx eslint . --quiet; fi
if [ -f jest.config.js ] || [ -f jest.config.ts ] || grep -q '"jest"' package.json 2>/dev/null; then
  run unit npx jest --silent --passWithNoTests
fi
if [ "$ran" -eq 0 ]; then echo "CHECK FAIL — no checks configured (need tsconfig.json and Jest at least)"; exit 1; fi
if [ "$fail" -eq 0 ]; then echo "CHECK PASS ($ran checks)"; else echo "CHECK FAIL$out"; exit 1; fi
