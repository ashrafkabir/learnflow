#!/bin/bash
LOG="/home/aifactory/.openclaw/workspace/learnflow/BUILD_LOG.md"
DIR="/home/aifactory/.openclaw/workspace/learnflow"
LAST="/tmp/learnflow-last-check"
touch "$LAST"
while true; do
  sleep 120
  NEW=$(find "$DIR/packages" "$DIR/apps" -newer "$LAST" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \) ! -path "*/node_modules/*" ! -path "*/.turbo/*" ! -path "*/dist/*" 2>/dev/null | sort)
  if [ -n "$NEW" ]; then
    echo "" >> "$LOG"
    echo "## $(date -Iseconds) — File Activity" >> "$LOG"
    echo "$NEW" | while read f; do echo "- $f"; done >> "$LOG"
  fi
  # Check test results
  TESTS=$(find "$DIR" -newer "$LAST" -name "*.test.ts" ! -path "*/node_modules/*" 2>/dev/null | wc -l)
  if [ "$TESTS" -gt 0 ]; then
    echo "- $TESTS test file(s) modified" >> "$LOG"
  fi
  touch "$LAST"
done
