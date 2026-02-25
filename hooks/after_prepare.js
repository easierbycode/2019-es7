#!/usr/bin/env node

/**
 * Cordova after_prepare hook
 *
 * Patches MainActivity.kt (cordova-android 13+) to enable Android immersive
 * sticky mode.  This replaces the old cordova-plugin-fullscreen which only
 * supported Java-based CordovaActivity projects.
 *
 * The patched activity:
 *  - Hides both status bar and navigation bar on launch.
 *  - Re-hides them whenever the window regains focus (e.g. after a swipe
 *    gesture momentarily reveals the bars).
 *  - Uses the modern WindowInsetsController API (API 30+) with a legacy
 *    fallback for older devices.
 */

const fs   = require("fs");
const path = require("path");

/** Recursively search for a file by name under `dir`. */
function findFile(dir, filename) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch (_) { return null; }

    for (const entry of entries) {
        const full = path.join(dir, entry);
        let stat;
        try { stat = fs.statSync(full); } catch (_) { continue; }

        if (stat.isDirectory()) {
            const found = findFile(full, filename);
            if (found) return found;
        } else if (entry === filename) {
            return full;
        }
    }
    return null;
}

module.exports = function (context) {
    const platformRoot = path.join(
        context.opts.projectRoot, "platforms", "android"
    );
    if (!fs.existsSync(platformRoot)) return;

    const mainActivity = findFile(
        path.join(platformRoot, "app", "src"), "MainActivity.kt"
    );
    if (!mainActivity) {
        console.warn(
            "after_prepare hook: MainActivity.kt not found – skipping immersive-mode patch"
        );
        return;
    }

    let src = fs.readFileSync(mainActivity, "utf8");

    // Guard against patching twice
    if (src.includes("enterImmersiveMode")) return;

    // ---- Add required imports --------------------------------------------------
    const importsToAdd = [
        "",
        "import android.os.Build",
        "import android.view.View",
        "import android.view.WindowInsets",
        "import android.view.WindowInsetsController"
    ].join("\n");

    // Insert right after the existing CordovaActivity import line
    if (src.includes("import org.apache.cordova.*")) {
        src = src.replace("import org.apache.cordova.*", "import org.apache.cordova.*" + importsToAdd);
    } else {
        src = src.replace("import org.apache.cordova.CordovaActivity", "import org.apache.cordova.CordovaActivity" + importsToAdd);
    }

    // ---- Add enterImmersiveMode() + onWindowFocusChanged() ---------------------
    const methodBlock = `
    private fun enterImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.systemBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enterImmersiveMode()
        }
    }`;

    // Call enterImmersiveMode() right after loadUrl in onCreate
    src = src.replace(
        /(loadUrl\(launchUrl\))/,
        "$1\n        enterImmersiveMode()"
    );

    // Insert methods before the final closing brace of the class
    const lastBrace = src.lastIndexOf("}");
    src = src.substring(0, lastBrace) + methodBlock + "\n}\n";

    fs.writeFileSync(mainActivity, src, "utf8");
    console.log("after_prepare hook: patched MainActivity.kt with immersive sticky mode");
};
