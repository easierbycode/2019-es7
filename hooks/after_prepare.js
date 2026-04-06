#!/usr/bin/env node

/**
 * Cordova after_prepare hook
 *
 * 1. Patches MainActivity.kt (cordova-android 13+) to enable Android immersive
 *    sticky mode.  This replaces the old cordova-plugin-fullscreen which only
 *    supported Java-based CordovaActivity projects.
 *
 * 2. Copies SpriteShareActivity.java into the Android platform so the app can
 *    receive images shared from other apps (ACTION_SEND with image/*).
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
 * Copy SpriteShareActivity.java into the Android platform and register it
 * in AndroidManifest.xml so the app can receive shared images.
 */
function installSpriteShareActivity(context) {
    const platformRoot = path.join(
        context.opts.projectRoot, "platforms", "android"
    );
    if (!fs.existsSync(platformRoot)) return;

    // ── Copy Java source ────────────────────────────────────────────
    const srcFile = path.join(
        context.opts.projectRoot, "src", "android", "SpriteShareActivity.java"
    );
    if (!fs.existsSync(srcFile)) {
        console.warn("after_prepare hook: SpriteShareActivity.java not found – skipping");
        return;
    }

    const destDir = path.join(
        platformRoot, "app", "src", "main", "java",
        "com", "easierbycode", "spriteshare"
    );
    fs.mkdirSync(destDir, { recursive: true });

    const destFile = path.join(destDir, "SpriteShareActivity.java");
    fs.copyFileSync(srcFile, destFile);
    console.log("after_prepare hook: copied SpriteShareActivity.java to " + destDir);

    // ── Register in AndroidManifest.xml ─────────────────────────────
    const manifestPath = path.join(
        platformRoot, "app", "src", "main", "AndroidManifest.xml"
    );
    if (!fs.existsSync(manifestPath)) {
        console.warn("after_prepare hook: AndroidManifest.xml not found – skipping SpriteShare manifest patch");
        return;
    }

    let manifest = fs.readFileSync(manifestPath, "utf8");

    if (manifest.includes("SpriteShareActivity")) {
        console.log("after_prepare hook: SpriteShareActivity already in manifest");
        return;
    }

    const activityBlock = `
        <activity
            android:name="com.easierbycode.spriteshare.SpriteShareActivity"
            android:exported="true"
            android:theme="@android:style/Theme.NoDisplay">
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="image/*" />
            </intent-filter>
        </activity>`;

    // Insert before the closing </application> tag
    manifest = manifest.replace(
        /(\s*)<\/application>/,
        activityBlock + "\n$1</application>"
    );

    fs.writeFileSync(manifestPath, manifest, "utf8");
    console.log("after_prepare hook: added SpriteShareActivity to AndroidManifest.xml");
}

module.exports = function (context) {
    // ── iOS: enable WKWebView remote inspection ─────────────────────
    patchIOSWebViewInspectable(context);

    // ── Android: SpriteShareActivity (receive shared images) ────────
    installSpriteShareActivity(context);

    // ── Android: immersive sticky mode ──────────────────────────────
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
        "import android.os.Build",
        "import android.view.View",
        "import android.view.WindowInsets",
        "import android.view.WindowInsetsController"
    ].join("\n");

    // Insert right after the existing CordovaActivity import line
    src = src.replace(
        /(import\s+org\.apache\.cordova\.\*)/,
        "$1\n" + importsToAdd
    );

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
