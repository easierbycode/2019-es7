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
 *
 * Note: SpriteShareActivity (for receiving shared images) is installed by
 * the cordova-plugin-sprite-share plugin via plugin.xml, not by this hook.
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

function patchIOSWebViewInspectable(context) {
    const platformRoot = path.join(
        context.opts.projectRoot, "platforms", "ios"
    );
    if (!fs.existsSync(platformRoot)) return;

    // Find CDVViewController.m or the main AppDelegate/ViewController to
    // enable WKWebView.isInspectable (iOS 16.4+).
    // cordova-ios 7.x reads the InspectableWebview preference from config.xml
    // automatically, but we also patch the Swift/ObjC source as a fallback
    // to ensure it works on debug builds.

    const appDelegatePath = findFile(
        path.join(platformRoot, "App"), "AppDelegate.swift"
    );

    if (!appDelegatePath) {
        console.log("after_prepare hook: AppDelegate.swift not found – skipping iOS inspectable patch");
        return;
    }

    let src = fs.readFileSync(appDelegatePath, "utf8");

    // Guard against patching twice
    if (src.includes("isInspectable")) return;

    // Add WKWebView isInspectable = true after the webView is configured.
    // In cordova-ios 7.x, the CDVWebViewEngine creates the WKWebView.
    // We inject code in didFinishLaunchingWithOptions to set inspectable after
    // the web view is created by calling into the viewController.
    const inspectablePatch = `
        // Enable remote debugging (iOS 16.4+)
        if #available(iOS 16.4, *) {
            if let vc = self.window?.rootViewController,
               let webView = vc.view?.subviews.compactMap({ $0 as? WKWebView }).first {
                webView.isInspectable = true
            }
        }`;

    // Try to insert after "return true" in didFinishLaunchingWithOptions
    if (src.includes("return true")) {
        src = src.replace(
            /(\s*return true\s*\n\s*\})/,
            inspectablePatch + "\n$1"
        );

        // Add WKWebView import if missing
        if (!src.includes("import WebKit")) {
            src = src.replace(
                /(import UIKit)/,
                "$1\nimport WebKit"
            );
        }

        fs.writeFileSync(appDelegatePath, src, "utf8");
        console.log("after_prepare hook: patched AppDelegate.swift with WKWebView.isInspectable = true");
    } else {
        console.log("after_prepare hook: could not locate insertion point in AppDelegate.swift");
    }
}

/**
 * Remove any stale Java SpriteShareActivity.java left behind in the Android
 * platform directory by earlier versions of this hook. The real Kotlin
 * SpriteShareActivity is copied in by the cordova-plugin-sprite-share plugin;
 * if a leftover .java file of the same class is still present, the Kotlin and
 * Java compilers will both emit com.easierbycode.spriteshare.SpriteShareActivity
 * and Gradle will fail with a duplicate-class error — or, worse, the stub .java
 * (which just forwards to the main game without showing the sprite picker) can
 * end up in the APK and shadow the real picker activity.
 */
function removeStaleSpriteShareJavaStub(context) {
    const platformRoot = path.join(
        context.opts.projectRoot, "platforms", "android"
    );
    if (!fs.existsSync(platformRoot)) return;

    const stalePath = path.join(
        platformRoot, "app", "src", "main", "java",
        "com", "easierbycode", "spriteshare", "SpriteShareActivity.java"
    );
    if (fs.existsSync(stalePath)) {
        try {
            fs.unlinkSync(stalePath);
            console.log("after_prepare hook: removed stale SpriteShareActivity.java stub at " + stalePath);
        } catch (e) {
            console.warn("after_prepare hook: failed to remove stale SpriteShareActivity.java", e);
        }
    }
}

/**
 * Register com.easierbycode.apkforge.ForgeApplication as the application
 * class. This is done here (not via the apk-forge plugin's plugin.xml)
 * because cordova-common rejects an <edit-config> on /manifest/application
 * when another edit-config already targets /manifest/application/activity
 * — it considers ancestor xpaths to overlap and refuses to merge.
 *
 * Idempotent: if android:name is already set on <application>, leaves it.
 */
function registerForgeApplication(platformRoot) {
    const manifestPath = path.join(
        platformRoot, "app", "src", "main", "AndroidManifest.xml"
    );
    if (!fs.existsSync(manifestPath)) return;

    let xml = fs.readFileSync(manifestPath, "utf8");
    if (xml.indexOf("ForgeApplication") !== -1) return;

    const appOpenRe = /<application\b([^>]*)>/;
    const m = xml.match(appOpenRe);
    if (!m) {
        console.warn("after_prepare hook: <application> tag not found in AndroidManifest.xml");
        return;
    }

    const attrs = m[1];
    if (/\bandroid:name\s*=/.test(attrs)) {
        console.log("after_prepare hook: <application> already has android:name; leaving it alone");
        return;
    }

    const replacement = '<application android:name="com.easierbycode.apkforge.ForgeApplication"' + attrs + '>';
    xml = xml.replace(appOpenRe, replacement);
    fs.writeFileSync(manifestPath, xml, "utf8");
    console.log("after_prepare hook: registered ForgeApplication on <application> in AndroidManifest.xml");
}

module.exports = function (context) {
    // ── iOS: enable WKWebView remote inspection ─────────────────────
    patchIOSWebViewInspectable(context);

    // ── Android: remove any stale Java SpriteShareActivity stub ─────
    // (the real Kotlin activity is installed by cordova-plugin-sprite-share)
    removeStaleSpriteShareJavaStub(context);

    // ── Android: immersive sticky mode ──────────────────────────────
    const platformRoot = path.join(
        context.opts.projectRoot, "platforms", "android"
    );
    if (!fs.existsSync(platformRoot)) return;

    // ── Android: register ForgeApplication on <application> ─────────
    registerForgeApplication(platformRoot);

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
        "import android.os.Build",
        "import android.view.View",
        "import android.view.WindowInsets",
        "import android.view.WindowInsetsController",
        "import android.app.AlertDialog",
        "import android.widget.TextView",
        "import android.widget.ScrollView",
        "import android.text.method.ScrollingMovementMethod",
        "import java.io.File"
    ].join("\n");

    // Insert right after the existing CordovaActivity import line
    src = src.replace(
        /(import\s+org\.apache\.cordova\.\*)/,
        "$1\n" + importsToAdd
    );

    // ---- Add enterImmersiveMode() + onWindowFocusChanged() + showPreviousCrashIfAny() -
    const methodBlock = `
    private fun showPreviousCrashIfAny() {
        try {
            val f = File(cacheDir, "last-crash.txt")
            if (!f.exists()) return
            val text = f.readText()
            f.delete()
            val tv = TextView(this).apply {
                this.text = text
                textSize = 10f
                setPadding(24, 24, 24, 24)
                setTextIsSelectable(true)
                movementMethod = ScrollingMovementMethod()
            }
            val sv = ScrollView(this).apply { addView(tv) }
            AlertDialog.Builder(this)
                .setTitle("Previous launch crashed")
                .setView(sv)
                .setPositiveButton("Continue") { d, _ -> d.dismiss() }
                .setCancelable(false)
                .show()
        } catch (_: Throwable) {}
    }

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

    // Call enterImmersiveMode() right after loadUrl in onCreate, and surface any
    // crash log written by ForgeApplication on the previous launch.
    src = src.replace(
        /(loadUrl\(launchUrl\))/,
        "$1\n        enterImmersiveMode()\n        showPreviousCrashIfAny()"
    );

    // Insert methods before the final closing brace of the class
    const lastBrace = src.lastIndexOf("}");
    src = src.substring(0, lastBrace) + methodBlock + "\n}\n";

    fs.writeFileSync(mainActivity, src, "utf8");
    console.log("after_prepare hook: patched MainActivity.kt with immersive sticky mode");
};
