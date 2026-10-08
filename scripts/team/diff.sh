#!/usr/bin/env bash
# doi-agent v3 — save the change to review into docs/team/diff.txt.
# Usage: bash scripts/team/diff.sh [base-ref] [security]
#   base-ref: develop (whole module), a commit (incremental re-review) or main (release)
#   security: only security-relevant paths, plus a scan for secrets
base="${1:-develop}"; mode="$2"
mkdir -p docs/team
ex=(':(exclude,glob)**/package-lock.json' ':(exclude,glob)**/yarn.lock' ':(exclude,glob)**/pnpm-lock.yaml' ':(exclude)docs/team' ':(exclude,glob)**/dist/**')
if [ "$mode" = "security" ]; then
  paths=(supabase app.json app.config.js app.config.ts eas.json)
  for d in lib services src/lib src/services src/api api hooks src/hooks; do [ -e "$d" ] && paths+=("$d"); done
  git ls-files | grep -Ei '(auth|role|permission|payment|billing|admin|session)' | head -n 200 > /tmp/doi-sec-files.txt
  while read -r f; do paths+=("$f"); done < /tmp/doi-sec-files.txt
  git diff "$base"...HEAD -- "${paths[@]}" "${ex[@]}" > docs/team/diff.txt 2>/dev/null
  { echo "## Secret scan"; git grep -nEI 'service_role|sk_live_|-----BEGIN [A-Z ]*PRIVATE KEY|SUPABASE_SERVICE|secret_key' -- . ':(exclude)docs/team' ':(exclude)scripts/team' | head -n 40; } >> docs/team/advisors.txt
else
  git diff "$base"...HEAD -- . "${ex[@]}" > docs/team/diff.txt
fi
echo "DIFF saved ($mode${mode:+ }vs $base): $(wc -l < docs/team/diff.txt) lines → docs/team/diff.txt"
