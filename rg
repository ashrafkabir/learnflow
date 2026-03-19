#!/usr/bin/env bash
set -euo pipefail
RG_BIN="$(node -e 'process.stdout.write(require("@vscode/ripgrep").rgPath)')"
exec "$RG_BIN" "$@"
