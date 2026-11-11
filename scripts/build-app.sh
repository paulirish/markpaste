#!/bin/bash
set -e

# Repository root
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$REPO_ROOT/dist"
APP_DIR="$DIST_DIR/MarkPaste.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

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

# 1. Compile universal Objective-C launcher binary (Apple Silicon + Intel)
echo "Compiling launcher binary..."
clang -O3 -Wall -Wextra -fobjc-arc -arch arm64 -arch x86_64 -framework AppKit "$REPO_ROOT/mac/launcher.m" -o "$MACOS_DIR/mp"
chmod +x "$MACOS_DIR/mp"

# 2. Bundle CLI and dependencies into a single tree-shaken ES module
echo "Bundling CLI into markpaste.mjs..."
"$REPO_ROOT/node_modules/.bin/esbuild" "$REPO_ROOT/bin/markpaste" \
  --bundle \
  --tree-shaking=true \
  --platform=node \
  --format=esm \
  --target=node24 \
  --external:./pandoc.js \
  --minify \
  --outfile="$RESOURCES_DIR/markpaste.mjs"

# 3. Ad-hoc sign the app bundle
echo "Signing app bundle (ad-hoc)..."
codesign --force --deep --sign - "$APP_DIR"

echo "=== MarkPaste.app ($APP_VERSION) build completed! ==="
