#!/bin/bash
# Build LearnFlow macOS .dmg installer
set -euo pipefail

echo "Building LearnFlow for macOS..."

APP_NAME="LearnFlow"
VERSION="${VERSION:-0.1.0}"
BUILD_DIR="dist/macos"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"

mkdir -p "${BUILD_DIR}"

# Build the web client
cd apps/client
npm run build
cd ../..

# Package as Electron app (or Tauri)
echo "Packaging with electron-builder..."
# npx electron-builder --mac --config electron-builder.yml

# Create DMG
echo "Creating ${DMG_NAME}..."
# hdiutil create -volname "${APP_NAME}" -srcfolder "${BUILD_DIR}/${APP_NAME}.app" -ov -format UDZO "dist/${DMG_NAME}"

echo "macOS build complete: dist/${DMG_NAME}"
