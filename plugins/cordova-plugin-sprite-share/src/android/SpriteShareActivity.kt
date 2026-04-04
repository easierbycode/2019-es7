package com.easierbycode.spriteshare

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.util.Log
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

    private var webView: WebView? = null
    private var sharedImageFile: File? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Save the shared image to a temp file — avoids passing multi-MB
            // base64 through evaluateJavascript (crashes WebView) or the
            // @JavascriptInterface bridge (Binder TransactionTooLargeException).
            sharedImageFile = saveSharedImageToFile()
            if (sharedImageFile == null) {
                Log.e(TAG, "Failed to read shared image from intent")
                finish()
                return
            }

            val imagePath = "file://${sharedImageFile!!.absolutePath}"

            // Set up the WebView
            val wv = WebView(this)
            webView = wv

            wv.settings.javaScriptEnabled = true
            wv.settings.domStorageEnabled = true
            @Suppress("DEPRECATION")
            wv.settings.allowFileAccess = true
            @Suppress("DEPRECATION")
            wv.settings.allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            wv.settings.allowUniversalAccessFromFileURLs = true
            wv.settings.useWideViewPort = true
            wv.settings.loadWithOverviewMode = true
            wv.settings.builtInZoomControls = true
            wv.settings.displayZoomControls = false

            wv.addJavascriptInterface(SpriteShareBridge(), "Android")

            wv.webChromeClient = WebChromeClient()
            wv.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // Pass only the short file path — the WebView loads the
                    // image directly from the filesystem.
                    view?.evaluateJavascript(
                        "if(typeof receiveSharedImage==='function')receiveSharedImage('$imagePath')",
                        null
                    )
                }
            }

            wv.loadUrl("file:///android_asset/www/sprite-share/sprite-picker.html")
            setContentView(wv)
        } catch (e: Exception) {
            Log.e(TAG, "onCreate failed", e)
            finish()
        }
    }

    /**
     * Save the shared image to a temp file and return the File handle.
     */
    private fun saveSharedImageToFile(): File? {
        if (intent?.action != Intent.ACTION_SEND) return null

        val imageUri: Uri = getImageUri() ?: return null

        return try {
            val inputStream = contentResolver.openInputStream(imageUri) ?: return null
            val tempFile = File(cacheDir, "shared_sprite_input.png")
            FileOutputStream(tempFile).use { out ->
                val chunk = ByteArray(8192)
                var bytesRead: Int
                while (inputStream.read(chunk).also { bytesRead = it } != -1) {
                    out.write(chunk, 0, bytesRead)
                }
            }
            inputStream.close()
            tempFile
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save shared image", e)
            null
        }
    }

    /**
     * Extract the shared image URI from the intent, trying multiple sources.
     */
    private fun getImageUri(): Uri? {
        // 1. EXTRA_STREAM (standard share path)
        val fromExtra: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri
        }
        if (fromExtra != null) return fromExtra

        // 2. ClipData (some apps use this instead of EXTRA_STREAM)
        val clip = intent.clipData
        if (clip != null && clip.itemCount > 0) {
            val uri = clip.getItemAt(0).uri
            if (uri != null) return uri
        }

        // 3. Intent data URI
        return intent.data
    }

    /**
     * JavaScript bridge exposed as `Android.*` in the WebView.
     */
    inner class SpriteShareBridge {

        @JavascriptInterface
        fun getAtlasJson(atlasName: String): String {
            val internalFile = File(filesDir, "assets/_${atlasName}.json")
            if (internalFile.exists()) {
                return internalFile.readText()
            }
            return try {
                assets.open("www/assets/$atlasName.json").bufferedReader().readText()
            } catch (e: Exception) {
                try {
                    assets.open("www/assets/${atlasName}.json").bufferedReader().readText()
                } catch (e2: Exception) {
                    "{\"frames\":{},\"meta\":{}}"
                }
            }
        }

        @JavascriptInterface
        fun getAtlasImageBase64(atlasName: String): String {
            val internalFile = File(filesDir, "assets/img/_${atlasName}.png")
            if (internalFile.exists()) {
                val bytes = internalFile.readBytes()
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                return "data:image/png;base64,$base64"
            }
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

        @JavascriptInterface
        fun saveAtlas(atlasName: String, pngBase64: String, jsonString: String): Boolean {
            return try {
                val imgDir = File(filesDir, "assets/img")
                imgDir.mkdirs()
                val jsonDir = File(filesDir, "assets")
                jsonDir.mkdirs()

                val pngData = pngBase64.substringAfter("base64,", pngBase64)
                val pngBytes = Base64.decode(pngData, Base64.DEFAULT)
                FileOutputStream(File(imgDir, "_${atlasName}.png")).use { it.write(pngBytes) }

                FileOutputStream(File(jsonDir, "_${atlasName}.json")).use {
                    it.write(jsonString.toByteArray())
                }

                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save atlas", e)
                false
            }
        }

        @JavascriptInterface
        fun hasRepackedAtlas(atlasName: String): Boolean {
            val jsonFile = File(filesDir, "assets/_${atlasName}.json")
            val pngFile = File(filesDir, "assets/img/_${atlasName}.png")
            return jsonFile.exists() && pngFile.exists()
        }

        @JavascriptInterface
        fun closeActivity() {
            runOnUiThread { finish() }
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        val wv = webView
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }

    companion object {
        private const val TAG = "SpriteShare"
    }
}
