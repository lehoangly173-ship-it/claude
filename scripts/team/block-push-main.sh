#!/usr/bin/env bash
# doi-agent v3 — PreToolUse hook (Bash).
# Blocks: any git push that targets main, --all/--mirror pushes, pushes while on main,
# and commands that touch .env secret files (.env.example is fine).
input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: pass' 2>/dev/null)
[ -z "$cmd" ] && cmd="$input"
flat=$(printf '%s' "$cmd" | tr -d "'\"\\\\")   # drop quotes/backslashes: 'HEAD:main', ma""in, ma\in

# Secrets: block commands that read, print or copy a .env file (.env.example is fine; merely mentioning ".env" is fine).
readers='(cat|less|more|head|tail|bat|nl|xxd|od|hexdump|strings|source|cp|mv|scp|rsync|base64|grep|egrep|rg|awk|sed|sort|uniq|cut|tee|python3?|node|curl|open|code|vi|vim|nano)'
envfile='(^|[[:space:]/=<])\.env(\.(local|production|development|staging|test|preview)[A-Za-z0-9_.]*)?([[:space:]>|;&]|$)'
if printf '%s\n' "$flat" | sed -E 's/(&&|\|\||;|\|)/\n/g' | grep -E "(^|[[:space:]])$readers([[:space:]]|$)" | sed 's/\.env\.example//g' | grep -Eq "$envfile" \
   || printf '%s\n' "$flat" | sed 's/\.env\.example//g' | grep -Eq "(^|[[:space:]])(\.|source)[[:space:]]+[^[:space:]]*\.env([[:space:]]|$)|<[[:space:]]*[^[:space:]]*\.env([[:space:]]|$)"; then
  echo "Blocked by doi-agent: .env files hold secrets and must not be read or printed. Use .env.example for variable names." >&2
  exit 2
fi

# Split into simple commands, strip env prefixes and git -c/-C options, keep only git push lines.
pushes=$(printf '%s\n' "$flat" | sed -E 's/(&&|\|\||;|\||\$\(|`)/\n/g' \
  | sed -E 's/^[[:space:]]*(env[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*//' \
  | sed -E 's/[[:space:]]+-[cC][[:space:]]+[^[:space:]]+//g' \
  | grep -E '^[[:space:]]*(sudo[[:space:]]+)?git[[:space:]]+push([[:space:]]|$)')
[ -z "$pushes" ] && exit 0
if printf '%s\n' "$pushes" | grep -Eq '(^|[[:space:]:+/])main([[:space:]]|$)|[[:space:]]--(all|mirror)([[:space:]=]|$)'; then
  echo "Blocked by doi-agent: pushing to main (or --all/--mirror) is not allowed. Ly approves releases by merging the pull request on GitHub." >&2
  exit 2
fi
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null
if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "main" ]; then
  echo "Blocked by doi-agent: you are on main. Switch to develop or a team/* branch before pushing." >&2
  exit 2
fi
exit 0
