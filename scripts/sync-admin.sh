#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_ADMIN_DIR="$PROJECT_DIR/../rustdesk-api/resources/admin"

echo "Building frontend..."
cd "$PROJECT_DIR"
pnpm build

echo "Syncing to backend resources/admin..."
rm -rf "$BACKEND_ADMIN_DIR"
mkdir -p "$BACKEND_ADMIN_DIR"
cp -r dist/* "$BACKEND_ADMIN_DIR/"

echo "Done. Frontend deployed to $BACKEND_ADMIN_DIR"
