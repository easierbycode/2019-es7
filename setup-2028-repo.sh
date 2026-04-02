#!/bin/bash
# ============================================================================
# setup-2028-repo.sh
#
# Run this from the PARENT directory that contains BOTH repos side by side:
#   parent/
#     2019-es7/    ← existing repo
#     2028/        ← freshly cloned empty repo
#
# Usage:
#   cd /path/to/parent
#   bash 2019-es7/setup-2028-repo.sh
# ============================================================================

set -euo pipefail

SRC="2019-es7"
DST="2028"

if [ ! -d "$SRC" ]; then echo "ERROR: $SRC/ not found. Run from the parent directory."; exit 1; fi
if [ ! -d "$DST" ]; then echo "ERROR: $DST/ not found. Clone the repo first."; exit 1; fi

echo "=== Step 1/7: Copy assets, libs, icons, resources ==="
cp -r "$SRC/assets"     "$DST/assets"
cp -r "$SRC/lib"        "$DST/lib"
cp -r "$SRC/icons"      "$DST/icons"
cp -r "$SRC/res"        "$DST/res"
cp -r "$SRC/tools"      "$DST/tools"
echo "  ✓ assets, lib, icons, res, tools"

echo ""
echo "=== Step 2/7: Copy Phaser game code into src/phaser/ ==="
mkdir -p "$DST/src/phaser"
cp -r "$SRC/src/phaser/"* "$DST/src/phaser/"
echo "  ✓ src/phaser/ ($(find "$DST/src/phaser" -type f | wc -l) files)"

echo ""
echo "=== Step 3/7: Copy shared modules into src/shared/ ==="
mkdir -p "$DST/src/shared/enums"

SHARED_FILES=(
    "constants.js"
    "gameState.js"
    "firebaseScores.js"
    "haptics.js"
    "highScoreUi.js"
    "soundManager.js"
    "globals.js"
)

for f in "${SHARED_FILES[@]}"; do
    cp "$SRC/src/$f" "$DST/src/shared/$f"
    echo "  ✓ src/shared/$f"
done

cp "$SRC/src/enums/scene-ids.js"          "$DST/src/shared/enums/scene-ids.js"
cp "$SRC/src/enums/player-boss-states.js"  "$DST/src/shared/enums/player-boss-states.js"
echo "  ✓ src/shared/enums/"

echo ""
echo "=== Step 4/7: Copy PS2 port ==="
mkdir -p "$DST/src/ps2"
cp -r "$SRC/src/ps2/"* "$DST/src/ps2/"
echo "  ✓ src/ps2/ ($(find "$DST/src/ps2" -type f | wc -l) files)"

echo ""
echo "=== Step 5/7: Copy platform configs & entry points ==="

# HTML entry points
cp "$SRC/phaser-game.html"       "$DST/phaser-game.html"
cp "$SRC/level-editor.html"      "$DST/level-editor.html"
cp "$SRC/boss-viewer.html"       "$DST/boss-viewer.html"
cp "$SRC/boss-attack-viewer.html" "$DST/boss-attack-viewer.html"
cp "$SRC/support.html"           "$DST/support.html" 2>/dev/null || true

# PWA
cp "$SRC/manifest.json"  "$DST/manifest.json"
cp "$SRC/favicon.ico"    "$DST/favicon.ico" 2>/dev/null || true

# Cordova
cp "$SRC/config.xml"     "$DST/config.xml"
mkdir -p "$DST/hooks"
cp "$SRC/hooks/after_prepare.js" "$DST/hooks/after_prepare.js"
cp -r "$SRC/plugins" "$DST/plugins"

# Electron
mkdir -p "$DST/electron"
cp "$SRC/electron/main.js"       "$DST/electron/main.js"
cp "$SRC/electron/package.json"  "$DST/electron/package.json"
cp "$SRC/electron/afterPack.js"  "$DST/electron/afterPack.js"
cp "$SRC/electron/preload.js"    "$DST/electron/preload.js"

# Desktop file for Linux
cp "$SRC/phaser-game.desktop"    "$DST/phaser-game.desktop" 2>/dev/null || true

# Vite config
cp "$SRC/vite.config.js"        "$DST/vite.config.js"

# CI/CD workflows
mkdir -p "$DST/.github/workflows"
cp "$SRC/.github/workflows/deploy.yml"          "$DST/.github/workflows/deploy.yml"
cp "$SRC/.github/workflows/ios-testflight.yml"   "$DST/.github/workflows/ios-testflight.yml"

echo "  ✓ HTML, manifest, config.xml, electron/, hooks/, .github/workflows/"

echo ""
echo "=== Step 6/7: Rewrite import paths ==="

# --- Root-level phaser files: "../xxx.js" → "../shared/xxx.js" ---
SHARED_IMPORT_TARGETS='(constants|gameState|firebaseScores|haptics|highScoreUi|soundManager|globals)'

# Pattern 1: Root-level phaser files import "../module.js"
find "$DST/src/phaser" -maxdepth 1 -name '*.js' -exec \
    sed -i '' -E "s@from \"\.\./${SHARED_IMPORT_TARGETS}\.js\"@from \"../shared/\1.js\"@g" {} +

# Pattern 2: Root-level phaser files import "../enums/xxx.js"
find "$DST/src/phaser" -maxdepth 1 -name '*.js' -exec \
    sed -i '' -E 's|from "\.\./enums/|from "../shared/enums/|g' {} +

# Pattern 3: Subdirectory files (game-objects/, bosses/, effects/, ui/) import "../../module.js"
find "$DST/src/phaser/game-objects" "$DST/src/phaser/bosses" "$DST/src/phaser/effects" "$DST/src/phaser/ui" \
    -name '*.js' -exec \
    sed -i '' -E "s@from \"\.\.\/\.\./${SHARED_IMPORT_TARGETS}\.js\"@from \"../../shared/\1.js\"@g" {} +

# Pattern 4: Subdirectory files import "../../enums/xxx.js"
find "$DST/src/phaser/game-objects" "$DST/src/phaser/bosses" "$DST/src/phaser/effects" "$DST/src/phaser/ui" \
    -name '*.js' -exec \
    sed -i '' -E 's|from "\.\./\.\./enums/|from "../../shared/enums/|g' {} +

echo "  ✓ Rewrote ../xxx.js → ../shared/xxx.js (root-level scenes)"
echo "  ✓ Rewrote ../../xxx.js → ../../shared/xxx.js (subdirectory files)"
echo "  ✓ Rewrote enums/ paths in both levels"

# --- boot-entry.js: "../xxx.js" → "../shared/xxx.js" ---
# (already handled by Pattern 1 above, but boot-entry is critical so verify)

echo ""
echo "=== Step 7/7: Update phaser-game.html inline module imports ==="

# The <script type="module"> in phaser-game.html imports from ./src/gameState.js etc.
# These need to become ./src/shared/gameState.js
sed -i 's|from "./src/gameState.js"|from "./src/shared/gameState.js"|g'       "$DST/phaser-game.html"
sed -i 's|from "./src/firebaseScores.js"|from "./src/shared/firebaseScores.js"|g' "$DST/phaser-game.html"
sed -i 's|from "./src/constants.js"|from "./src/shared/constants.js"|g'       "$DST/phaser-game.html"

echo "  ✓ Updated phaser-game.html inline imports"

echo ""
echo "=== Creating package.json ==="
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

echo ""
echo "=== Creating .gitignore ==="
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

echo ""
echo "============================================================"
echo " DONE! New repo populated at: $DST/"
echo ""
echo " Files copied: $(find "$DST" -type f -not -path '*/.git/*' | wc -l)"
echo "============================================================"
echo ""
echo " NEXT STEPS:"
echo ""
echo " 1) cd $DST"
echo " 2) Verify import rewrites:"
echo "    grep -rn 'from \"\.\./' src/phaser/*.js | grep -v shared"
echo "    (should return ZERO lines except local phaser-to-phaser imports)"
echo ""
echo " 3) Test local dev:"
echo "    npm install"
echo "    npx vite          # open http://localhost:5173/phaser-game.html"
echo ""
echo " 4) Test esbuild bundle:"
echo "    npm run bundle:cordova"
echo ""
echo " 5) Commit & push:"
echo "    git add -A"
echo '    git commit -m "Initial game code: Phaser 4 + all platforms"'
echo "    git push"
echo ""
echo " 6) Back in 2019-es7, update titles to '2019' and add submodule:"
echo "    cd ../$SRC"
echo "    git submodule add https://github.com/easierbycode/2028.git packages/2028"
echo ""
