#!/usr/bin/env bash
# Auto-restarts EverShop if it dies. Useful while Supabase Session pooler is
# closing idle connections faster than the pool can recover.
# Stop with Ctrl+C — trap kills children before exiting.

set -uo pipefail
cd "$(dirname "$0")/.."

trap 'echo ""; echo "Apagando..."; pkill -P $$ 2>/dev/null || true; pkill -f evershop 2>/dev/null || true; exit 0' INT TERM

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo ""
  echo "===== EverShop start (intento #$attempt) — $(date '+%H:%M:%S') ====="
  npm run start
  rc=$?
  echo ""
  echo "===== Server exited with code $rc — reiniciando en 3s ====="
  sleep 3
done
