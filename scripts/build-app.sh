#!/bin/bash
set -e

# Repository root
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$REPO_ROOT/dist"
APP_DIR="$DIST_DIR/MarkPaste.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
TARGET_APP_DIR="$RESOURCES_DIR/app"

echo "=== Building MarkPaste.app in dist/ ==="

# Clean and recreate APP_DIR structure
rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"
touch "$DIST_DIR/.metadata_never_index"

# Copy static mac assets and sync version from package.json
cp "$REPO_ROOT/mac/Info.plist" "$CONTENTS_DIR/Info.plist"
APP_VERSION=$(node -p "require('$REPO_ROOT/package.json').version")
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$CONTENTS_DIR/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $APP_VERSION" "$CONTENTS_DIR/Info.plist"
cp "$REPO_ROOT/mac/AppIcon.icns" "$RESOURCES_DIR/AppIcon.icns"

# 1. Compile universal launcher binary (Apple Silicon + Intel)
echo "Compiling launcher binary..."
clang -O3 -arch arm64 -arch x86_64 "$REPO_ROOT/mac/launcher.c" -o "$MACOS_DIR/mp"
chmod +x "$MACOS_DIR/mp"

# 2. Copy run.sh
echo "Copying run.sh..."
cp "$REPO_ROOT/mac/run.sh" "$RESOURCES_DIR/run.sh"
chmod +x "$RESOURCES_DIR/run.sh"

# 3. Prepare target app directory
echo "Preparing app bundle contents..."
rm -rf "$TARGET_APP_DIR"
mkdir -p "$TARGET_APP_DIR"

# Copy source files
cp -R "$REPO_ROOT/src" "$TARGET_APP_DIR/src"
cp -R "$REPO_ROOT/bin" "$TARGET_APP_DIR/bin"
cp "$REPO_ROOT/package.json" "$TARGET_APP_DIR/package.json"
cp "$REPO_ROOT/pnpm-lock.yaml" "$TARGET_APP_DIR/pnpm-lock.yaml"

# 4. Install production dependencies flat (no store symlinks inside the .app bundle)
echo "Installing production dependencies..."
cd "$TARGET_APP_DIR"
pnpm install --prod --ignore-workspace --frozen-lockfile --config.node-linker=hoisted

# Clean up build-only metadata from the app bundle
rm -rf pnpm-lock.yaml node_modules/.bin node_modules/.modules.yaml node_modules/.pnpm*

# 5. Ad-hoc sign the app bundle
echo "Signing app bundle (ad-hoc)..."
codesign --force --deep --sign - "$APP_DIR"

echo "=== MarkPaste.app ($APP_VERSION) build completed! ==="
