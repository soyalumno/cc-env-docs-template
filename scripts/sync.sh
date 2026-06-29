#!/bin/bash
# CC Env Docs — Daily Sync Pipeline
# Syncs content from ~/.claude/ and rebuilds the static site.
# Designed to run via launchd daily.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/sync.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

cd "$PROJECT_DIR"

log "=== CC Env Docs sync start ==="

# Sync content from ~/.claude/rules + ~/.claude/skills
log "Syncing content..."
node scripts/sync-content.mjs 2>&1 | tee -a "$LOG_FILE"

# Build site + pagefind index
log "Building site..."
pnpm run build 2>&1 | tee -a "$LOG_FILE"

log "=== Sync complete ==="
