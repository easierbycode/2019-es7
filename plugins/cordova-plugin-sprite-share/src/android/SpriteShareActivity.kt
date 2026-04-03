package com.easierbycode.spriteshare

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

/**
 * Activity that receives shared images via ACTION_SEND intent,
 * loads a WebView-based sprite picker UI, and lets the user
 * detect / select / repack sprites into game atlases.
 */
class SpriteShareActivity : Activity() {

    private lateinit var webView: WebView
    private var sharedImageDataUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Read the shared image from the intent
        sharedImageDataUrl = readSharedImage()
        if (sharedImageDataUrl == null) {
            finish()
            return
        }

        // Set up the WebView
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowFileAccessFromFileURLs = true
            settings.allowUniversalAccessFromFileURLs = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.builtInZoomControls = true
            settings.displayZoomControls = false

            addJavascriptInterface(SpriteShareBridge(), "Android")

            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // Pass the shared image to JS once the page is loaded
                    sharedImageDataUrl?.let { dataUrl ->
                        val escaped = dataUrl.replace("'", "\\'")
                        view?.evaluateJavascript("receiveSharedImage('$escaped')", null)
                    }
                }
            }

            loadUrl("file:///android_asset/www/sprite-share/sprite-picker.html")
        }

        setContentView(webView)
    }

    /**
     * Read the shared image URI from the intent, convert to a base64 data URL.
     */
    private fun readSharedImage(): String? {
        if (intent?.action != Intent.ACTION_SEND) return null

        // Try EXTRA_STREAM first, then fall back to clipData, then intent.data
        val imageUri: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(Intent.EXTRA_STREAM)
        } ?: intent.clipData?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.uri
          ?: intent.data

        if (imageUri == null) return null

        // Ensure we have permission to read the shared content URI
        try {
            val flags = intent.flags and Intent.FLAG_GRANT_READ_URI_PERMISSION
            if (flags != 0) {
                contentResolver.takePersistableUriPermission(imageUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
        } catch (_: SecurityException) {
            // Persistable permission not available — temporary grant is usually sufficient
        }

        return try {
            val inputStream = contentResolver.openInputStream(imageUri) ?: return null
            val buffer = ByteArrayOutputStream()
            val chunk = ByteArray(8192)
            var bytesRead: Int
            while (inputStream.read(chunk).also { bytesRead = it } != -1) {
                buffer.write(chunk, 0, bytesRead)
            }
            inputStream.close()

            val bytes = buffer.toByteArray()
            val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)

            // Detect MIME type from intent or fall back to png
            val mimeType = intent.type ?: "image/png"
            "data:$mimeType;base64,$base64"
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * JavaScript bridge exposed as `Android.*` in the WebView.
     */
    inner class SpriteShareBridge {

        /**
         * Read an atlas JSON file from bundled www/assets/.
         * @param atlasName e.g. "game_asset" → reads "assets/game_asset.json"
         *                  Also checks for editor-repacked "_game_asset.json" in internal storage first.
         */
        @JavascriptInterface
        fun getAtlasJson(atlasName: String): String {
            // Check internal storage first (editor-repacked version)
            val internalFile = File(filesDir, "assets/_${atlasName}.json")
            if (internalFile.exists()) {
                return internalFile.readText()
            }
            // Fall back to bundled assets
            return try {
                assets.open("www/assets/$atlasName.json").bufferedReader().readText()
            } catch (e: Exception) {
                // Try without www/ prefix
                try {
                    assets.open("www/assets/${atlasName}.json").bufferedReader().readText()
                } catch (e2: Exception) {
                    "{\"frames\":{},\"meta\":{}}"
                }
            }
        }

        /**
         * Read an atlas PNG image and return as a base64 data URL.
         */
        @JavascriptInterface
        fun getAtlasImageBase64(atlasName: String): String {
            // Check internal storage first
            val internalFile = File(filesDir, "assets/img/_${atlasName}.png")
            if (internalFile.exists()) {
                val bytes = internalFile.readBytes()
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                return "data:image/png;base64,$base64"
            }
            // Fall back to bundled assets
            return try {
                val inputStream = assets.open("www/assets/img/$atlasName.png")
                val buffer = ByteArrayOutputStream()
                val chunk = ByteArray(8192)
                var bytesRead: Int
                while (inputStream.read(chunk).also { bytesRead = it } != -1) {
                    buffer.write(chunk, 0, bytesRead)
                }
                inputStream.close()
                val base64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP)
                "data:image/png;base64,$base64"
            } catch (e: Exception) {
                ""
            }
        }

        /**
         * Save a repacked atlas (PNG + JSON) to internal storage.
         * Uses the _ prefix convention so Phaser picks up repacked atlases.
         */
        @JavascriptInterface
        fun saveAtlas(atlasName: String, pngBase64: String, jsonString: String): Boolean {
            return try {
                // Ensure directories exist
                val imgDir = File(filesDir, "assets/img")
                imgDir.mkdirs()
                val jsonDir = File(filesDir, "assets")
                jsonDir.mkdirs()

                // Save PNG (strip data URL prefix if present)
                val pngData = pngBase64.substringAfter("base64,", pngBase64)
                val pngBytes = Base64.decode(pngData, Base64.DEFAULT)
                FileOutputStream(File(imgDir, "_${atlasName}.png")).use { it.write(pngBytes) }

                // Save JSON
                FileOutputStream(File(jsonDir, "_${atlasName}.json")).use {
                    it.write(jsonString.toByteArray())
                }

                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        /**
         * Check if an editor-repacked atlas exists in internal storage.
         */
        @JavascriptInterface
        fun hasRepackedAtlas(atlasName: String): Boolean {
            val jsonFile = File(filesDir, "assets/_${atlasName}.json")
            val pngFile = File(filesDir, "assets/img/_${atlasName}.png")
            return jsonFile.exists() && pngFile.exists()
        }

        /**
         * Close the sprite picker Activity.
         */
        @JavascriptInterface
        fun closeActivity() {
            runOnUiThread { finish() }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
