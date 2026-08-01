#!/usr/bin/env bash
# Runs every test suite. Exits non-zero if any fails.
cd "$(dirname "$0")"
fail=0
echo ""
echo "═══ AEW Platform — full test suite ═══"
echo ""
for t in integrity liveserver test routing handlers erp values tube verify bores inputs inquiry demo scenario full; do
  [ -f "$t.js" ] || continue
  printf "  %-12s " "$t"
  out=$(NODE_PATH="${NODE_PATH:-/tmp/node_modules}" node "$t.js" 2>/dev/null)
  if [ $? -ne 0 ]; then fail=1; echo "FAILED"; echo "$out" | grep "✗" | head -5 | sed 's/^/      /'
  else
    line=$(echo "$out" | grep -E "passed,|bound,|safe,|INTACT|TOTAL blank" | tail -1)
    [ -z "$line" ] && line="skipped (jsdom not installed)"
    echo "$line"
  fi
done
echo ""
[ $fail -eq 0 ] && echo "  ALL SUITES PASSED" || echo "  SOME SUITES FAILED"
exit $fail
