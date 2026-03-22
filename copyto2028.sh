#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Copy 2019-es7 Phaser game into the 2028 repo with restructured imports
#
# Usage: Run from the directory containing 2019-es7/
#   bash ./2019-es7/copyto2028.sh
#
# Expects:
#   /Users/danieljohnson/CODE/2019-es7/   ← source
#   /Users/danieljohnson/2028/            ← target (sibling of CODE/)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR"                       # 2019-es7 repo root
DST="$(dirname "$SCRIPT_DIR")/../2028"  # ../2028 relative to CODE/

echo "=== Copy 2019-es7 → 2028 ==="
echo "Source: $SRC"
echo "Target: $DST"
echo ""

# Clone if target doesn't exist
if [ ! -d "$DST" ]; then
  echo "📦 Target repo not found — cloning from GitHub..."
  git clone https://github.com/easierbycode/2028.git "$DST"
  echo ""
fi

# Sanity check source has the expected structure
if [ ! -d "$SRC/src/phaser" ]; then
  echo "❌ Error: src/phaser/ not found in $SRC"
  exit 1
fi

# ── Step 1: Assets, libs, icons, resources ──────────────────────────────
echo "📁 [1/7] Copying assets, libs, icons, resources..."
cp -R "$SRC/assets"  "$DST/assets"
cp -R "$SRC/lib"     "$DST/lib"
cp -R "$SRC/icons"   "$DST/icons"
cp -R "$SRC/res"     "$DST/res"
mkdir -p "$DST/tools"
cp -R "$SRC/tools/"* "$DST/tools/"
echo "  ✓ assets/, lib/, icons/, res/, tools/"

# ── Step 2: Phaser game code ────────────────────────────────────────────
echo ""
echo "📁 [2/7] Copying src/phaser/..."
mkdir -p "$DST/src/phaser"
cp -R "$SRC/src/phaser/"* "$DST/src/phaser/"
echo "  ✓ src/phaser/ ($(find "$DST/src/phaser" -type f | wc -l) files)"

# ── Step 3: Shared modules → src/shared/ ────────────────────────────────
echo ""
echo "📁 [3/7] Copying shared modules into src/shared/..."
mkdir -p "$DST/src/shared/enums"

for f in constants.js gameState.js firebaseScores.js haptics.js highScoreUi.js soundManager.js globals.js; do
  cp "$SRC/src/$f" "$DST/src/shared/$f"
  echo "  ✓ src/shared/$f"
done

cp "$SRC/src/enums/scene-ids.js"         "$DST/src/shared/enums/scene-ids.js"
cp "$SRC/src/enums/player-boss-states.js" "$DST/src/shared/enums/player-boss-states.js"
echo "  ✓ src/shared/enums/"

# ── Step 4: PS2 port ────────────────────────────────────────────────────
echo ""
echo "📁 [4/7] Copying src/ps2/..."
mkdir -p "$DST/src/ps2"
cp -R "$SRC/src/ps2/"* "$DST/src/ps2/"
echo "  ✓ src/ps2/ ($(find "$DST/src/ps2" -type f | wc -l) files)"

# ── Step 5: Platform configs & HTML entry points ────────────────────────
echo ""
echo "📁 [5/7] Copying platform configs & entry points..."

# HTML
cp "$SRC/phaser-game.html"        "$DST/phaser-game.html"
cp "$SRC/level-editor.html"       "$DST/level-editor.html"
cp "$SRC/boss-viewer.html"        "$DST/boss-viewer.html"
cp "$SRC/boss-attack-viewer.html" "$DST/boss-attack-viewer.html"
cp "$SRC/support.html"            "$DST/support.html" 2>/dev/null || true

# PWA
cp "$SRC/manifest.json" "$DST/manifest.json"
cp "$SRC/favicon.ico"   "$DST/favicon.ico" 2>/dev/null || true

# Cordova
cp "$SRC/config.xml"    "$DST/config.xml"
mkdir -p "$DST/hooks"
cp "$SRC/hooks/after_prepare.js" "$DST/hooks/after_prepare.js"

# Electron
mkdir -p "$DST/electron"
cp "$SRC/electron/main.js"      "$DST/electron/main.js"
cp "$SRC/electron/package.json"  "$DST/electron/package.json"
cp "$SRC/electron/afterPack.js"  "$DST/electron/afterPack.js"
cp "$SRC/electron/preload.js"    "$DST/electron/preload.js"

# Desktop file for Linux
cp "$SRC/phaser-game.desktop"    "$DST/phaser-game.desktop" 2>/dev/null || true

# Vite config
cp "$SRC/vite.config.js"         "$DST/vite.config.js"

# CI/CD workflows
mkdir -p "$DST/.github/workflows"
cp "$SRC/.github/workflows/deploy.yml"        "$DST/.github/workflows/deploy.yml"
cp "$SRC/.github/workflows/ios-testflight.yml" "$DST/.github/workflows/ios-testflight.yml"

echo "  ✓ HTML, manifest, config.xml, electron/, hooks/, .github/workflows/"

# ── Step 6: Rewrite import paths ────────────────────────────────────────
# Uses perl -pi -e which works identically on macOS and Linux
# (unlike sed -i which differs between GNU and BSD)
echo ""
echo "🔧 [6/7] Rewriting import paths..."

# Root-level phaser files: from "../module.js" → from "../shared/module.js"
find "$DST/src/phaser" -maxdepth 1 -name '*.js' -print0 | xargs -0 \
  perl -pi -e 's|from "\.\./(constants|gameState|firebaseScores|haptics|highScoreUi|soundManager|globals)\.js"|from "../shared/$1.js"|g'

# Root-level phaser files: from "../enums/" → from "../shared/enums/"
find "$DST/src/phaser" -maxdepth 1 -name '*.js' -print0 | xargs -0 \
  perl -pi -e 's|from "\.\./enums/|from "../shared/enums/|g'

# Subdirectory files: from "../../module.js" → from "../../shared/module.js"
find "$DST/src/phaser/game-objects" "$DST/src/phaser/bosses" "$DST/src/phaser/effects" "$DST/src/phaser/ui" \
  -name '*.js' -print0 | xargs -0 \
  perl -pi -e 's|from "\.\./\.\.\/(constants|gameState|firebaseScores|haptics|highScoreUi|soundManager|globals)\.js"|from "../../shared/$1.js"|g'

# Subdirectory files: from "../../enums/" → from "../../shared/enums/"
find "$DST/src/phaser/game-objects" "$DST/src/phaser/bosses" "$DST/src/phaser/effects" "$DST/src/phaser/ui" \
  -name '*.js' -print0 | xargs -0 \
  perl -pi -e 's|from "\.\./\.\./enums/|from "../../shared/enums/|g'

echo "  ✓ ../xxx.js → ../shared/xxx.js  (root-level scenes)"
echo "  ✓ ../../xxx.js → ../../shared/xxx.js  (subdirectory files)"
echo "  ✓ enums/ paths updated at both levels"

# ── Step 7: Update phaser-game.html inline imports ──────────────────────
echo ""
echo "🔧 [7/7] Updating phaser-game.html inline imports..."

perl -pi -e 's|from "./src/gameState.js"|from "./src/shared/gameState.js"|g'           "$DST/phaser-game.html"
perl -pi -e 's|from "./src/firebaseScores.js"|from "./src/shared/firebaseScores.js"|g' "$DST/phaser-game.html"
perl -pi -e 's|from "./src/constants.js"|from "./src/shared/constants.js"|g'           "$DST/phaser-game.html"

echo "  ✓ phaser-game.html"

# ── Verify ───────────────────────────────────────────────────────────────
echo ""
echo "🔍 Verifying import rewrites..."
BAD_IMPORTS=$(grep -rn 'from "\.\./constants\|from "\.\./gameState\|from "\.\./firebaseScores\|from "\.\./haptics\|from "\.\./highScoreUi\|from "\.\./soundManager\|from "\.\./globals\|from "\.\./enums/' "$DST/src/phaser/" | grep -v shared || true)
BAD_HTML=$(grep -n 'from "./src/gameState\|from "./src/firebaseScores\|from "./src/constants' "$DST/phaser-game.html" | grep -v shared || true)

if [ -n "$BAD_IMPORTS" ] || [ -n "$BAD_HTML" ]; then
  echo "  ⚠️  Some imports were NOT rewritten:"
  [ -n "$BAD_IMPORTS" ] && echo "$BAD_IMPORTS"
  [ -n "$BAD_HTML" ] && echo "$BAD_HTML"
  echo ""
  echo "  Fix these manually before committing."
else
  echo "  ✓ All imports correctly point to src/shared/"
fi

# ── Generate package.json ────────────────────────────────────────────────
echo ""
echo "📄 Creating package.json..."
cat > "$DST/package.json" << 'PKGJSON'
{
  "name": "2028-ai",
  "version": "1.0.0",
  "private": true,
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron": "electron .",
    "bundle:cordova": "npx esbuild src/phaser/boot-entry.js --bundle --format=iife --outfile=lib/boot.bundle.js",
    "bundle:electron": "npx esbuild src/phaser/boot-entry.js --bundle --format=iife --outfile=electron/www/lib/boot.bundle.js",
    "ps2:build": "cd src/ps2/deploy && bash build.sh"
  },
  "devDependencies": {
    "electron": "^35.0.0",
    "electron-builder": "^25.1.8",
    "esbuild": "^0.24.0",
    "vite": "^6.0.0"
  }
}
PKGJSON
echo "  ✓ package.json"

# ── Generate .gitignore ──────────────────────────────────────────────────
echo ""
echo "📄 Creating .gitignore..."
cat > "$DST/.gitignore" << 'GITIGNORE'
node_modules/
dist/
cordova/
lib/boot.bundle.js
electron/www/
electron/dist/
electron/node_modules/
*.apk
*.AppImage
*.iso
*.zip
.DS_Store
GITIGNORE
echo "  ✓ .gitignore"

# ── Summary ──────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "✅ Done! New repo populated at: $DST"
echo "   Files: $(find "$DST" -type f -not -path '*/.git/*' | wc -l)"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  cd $DST"
echo "  npm install"
echo "  npx vite                    # test at localhost:5173/phaser-game.html"
echo "  npm run bundle:cordova      # test esbuild bundle"
echo "  git add -A"
echo "  git commit -m 'Initial game code: Phaser 4 + all platforms'"
echo "  git push"
