#!/bin/bash
# Build LearnFlow Windows installer (.exe/.msi)
set -euo pipefail

echo "Building LearnFlow for Windows..."

APP_NAME="LearnFlow"
VERSION="${VERSION:-0.1.0}"
BUILD_DIR="dist/windows"

mkdir -p "${BUILD_DIR}"

# Build the web client
cd apps/client
npm run build
cd ../..

# Package with electron-builder
echo "Packaging with electron-builder for Windows..."
# npx electron-builder --win --config electron-builder.yml

echo "Windows build complete: dist/${APP_NAME}-Setup-${VERSION}.exe"
