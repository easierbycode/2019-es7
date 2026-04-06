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
 * Write SpriteShareActivity.java into the Android platform and register it
 * in AndroidManifest.xml so the app can receive images shared from other apps.
 *
 * The Java source is embedded here (same pattern as the immersive-mode patch)
 * so there are no external file dependencies — works in CI where the Cordova
 * project directory structure differs from the repo layout.
 */
function installSpriteShareActivity(context) {
    const platformRoot = path.join(
        context.opts.projectRoot, "platforms", "android"
    );
    if (!fs.existsSync(platformRoot)) return;

    // ── Write Java source ───────────────────────────────────────────
    const javaSrc = `package com.easierbycode.spriteshare;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Handles images shared to the app via Android ACTION_SEND intents.
 *
 * When a user shares an image to this app, this activity:
 *   1. Copies the shared image to internal storage
 *   2. Launches the main Cordova activity with a query parameter pointing
 *      to the saved image so the web layer can load it as a custom sprite
 */
public class SpriteShareActivity extends Activity {

    private static final String TAG = "SpriteShare";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        String action = intent.getAction();
        String type = intent.getType();

        Uri imageUri = null;

        if (Intent.ACTION_SEND.equals(action) && type != null && type.startsWith("image/")) {
            imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        } else if (Intent.ACTION_VIEW.equals(action)) {
            imageUri = intent.getData();
        }

        if (imageUri != null) {
            File saved = copyToInternal(imageUri);
            if (saved != null) {
                launchGame(saved.getAbsolutePath());
                return;
            }
            Log.w(TAG, "Failed to copy shared image");
        }

        // No valid image — just launch the game normally
        launchGame(null);
    }

    /**
     * Copies the shared image URI to an internal file so the WebView can
     * access it regardless of the source app's permission grants.
     */
    private File copyToInternal(Uri uri) {
        try {
            InputStream in = getContentResolver().openInputStream(uri);
            if (in == null) return null;

            File outDir = new File(getFilesDir(), "shared_sprites");
            if (!outDir.exists()) outDir.mkdirs();

            File outFile = new File(outDir, "sprite_" + System.currentTimeMillis() + ".png");
            OutputStream out = new FileOutputStream(outFile);

            byte[] buf = new byte[8192];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            out.close();
            in.close();

            Log.i(TAG, "Saved shared sprite to " + outFile.getAbsolutePath());
            return outFile;
        } catch (Exception e) {
            Log.e(TAG, "Error copying shared image", e);
            return null;
        }
    }

    /**
     * Launches the main Cordova activity. If a sprite path is provided it is
     * passed as an extra so the web layer can pick it up.
     */
    private void launchGame(String spritePath) {
        Intent launch = getPackageName() != null
                ? getPackageManager().getLaunchIntentForPackage(getPackageName())
                : null;

        if (launch == null) {
            launch = new Intent(Intent.ACTION_MAIN);
            launch.setPackage(getPackageName());
            launch.addCategory(Intent.CATEGORY_LAUNCHER);
        }

        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        if (spritePath != null) {
            launch.putExtra("shared_sprite_path", spritePath);
        }

        startActivity(launch);
        finish();
    }
}
`;

    const destDir = path.join(
        platformRoot, "app", "src", "main", "java",
        "com", "easierbycode", "spriteshare"
    );
    fs.mkdirSync(destDir, { recursive: true });

    const destFile = path.join(destDir, "SpriteShareActivity.java");
    fs.writeFileSync(destFile, javaSrc, "utf8");
    console.log("after_prepare hook: wrote SpriteShareActivity.java to " + destDir);

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
