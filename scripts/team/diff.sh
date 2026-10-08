#!/usr/bin/env bash
# doi-agent v3 — save the change to review into docs/team/diff.txt.
# Usage: bash scripts/team/diff.sh [base-ref] [security]
#   base-ref: develop (whole module), a commit (incremental re-review) or main (release; compared with the fresh origin/main)
#   security: only security-relevant paths; secret scan goes to docs/team/secret-scan.txt
base="${1:-develop}"; mode="$2"
mkdir -p docs/team
if [ "$base" = "main" ]; then git fetch -q origin main 2>/dev/null && base="origin/main"; fi
ex=(':(exclude,glob)**/package-lock.json' ':(exclude,glob)**/yarn.lock' ':(exclude,glob)**/pnpm-lock.yaml' ':(exclude)docs/team' ':(exclude,glob)**/dist/**')
if [ "$mode" = "security" ]; then
  paths=()
  for d in supabase app.json app.config.js app.config.ts eas.json lib services src/lib src/services src/api api hooks src/hooks homespa/src/store.tsx homespa/src/logic.ts homespa/src/data.ts; do [ -e "$d" ] && paths+=("$d"); done
  while read -r f; do paths+=("$f"); done < <(git ls-files | grep -Ei '(auth|role|permission|payment|billing|admin|session)' | grep -v '^docs/' | head -n 200)
  if [ ${#paths[@]} -gt 0 ]; then git diff "$base"...HEAD -- "${paths[@]}" "${ex[@]}" > docs/team/diff.txt 2>/dev/null; else : > docs/team/diff.txt; fi
  { echo "## Secret scan $(date +%F)"; git grep -nEI 'service_role|sk_live_|-----BEGIN [A-Z ]*PRIVATE KEY|SUPABASE_SERVICE|secret_key|api[_-]?key[[:space:]]*[:=]' -- . ':(exclude)docs/team' ':(exclude)scripts/team' ':(exclude).claude' ':(exclude,glob)**/dist/**' | head -n 40; } > docs/team/secret-scan.txt
else
  git diff "$base"...HEAD -- . "${ex[@]}" > docs/team/diff.txt
fi
echo "DIFF saved (${mode:+$mode }vs $base): $(wc -l < docs/team/diff.txt) lines → docs/team/diff.txt"
