package com.easierbycode.spriteshare

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
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
import kotlin.math.roundToInt

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
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "")

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
        val imageUri: Uri = getImageUri() ?: return null

        return try {
            val inputStream = contentResolver.openInputStream(imageUri) ?: return null
            val tempFile = File(cacheDir, "shared_sprite_input.png")
            inputStream.close()

            when (saveSharedImageBitmapToFile(imageUri, tempFile)) {
                SaveResult.SUCCESS -> tempFile
                SaveResult.DECODE_FAILED -> {
                    if (copySharedImageToFile(imageUri, tempFile)) tempFile else null
                }
                SaveResult.OUT_OF_MEMORY -> {
                    Log.e(TAG, "Shared image was too large to decode safely")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save shared image", e)
            null
        }
    }

    private fun saveSharedImageBitmapToFile(imageUri: Uri, outputFile: File): SaveResult {
        return try {
            val bounds = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }

            contentResolver.openInputStream(imageUri)?.use { input ->
                BitmapFactory.decodeStream(input, null, bounds)
            } ?: return SaveResult.DECODE_FAILED

            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
                return SaveResult.DECODE_FAILED
            }

            val decodeOptions = BitmapFactory.Options().apply {
                inSampleSize = calculateInSampleSize(bounds.outWidth, bounds.outHeight, MAX_IMAGE_DIMENSION)
                inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val decoded = contentResolver.openInputStream(imageUri)?.use { input ->
                BitmapFactory.decodeStream(input, null, decodeOptions)
            } ?: return SaveResult.DECODE_FAILED

            val scaled = scaleBitmapIfNeeded(decoded, MAX_IMAGE_DIMENSION)

            FileOutputStream(outputFile).use { out ->
                if (!scaled.compress(Bitmap.CompressFormat.PNG, 100, out)) {
                    if (scaled !== decoded) scaled.recycle()
                    decoded.recycle()
                    return SaveResult.DECODE_FAILED
                }
            }

            if (scaled !== decoded) scaled.recycle()
            decoded.recycle()
            SaveResult.SUCCESS
        } catch (oom: OutOfMemoryError) {
            SaveResult.OUT_OF_MEMORY
        } catch (e: Exception) {
            Log.w(TAG, "Falling back to raw shared image copy", e)
            SaveResult.DECODE_FAILED
        }
    }

    private fun copySharedImageToFile(imageUri: Uri, outputFile: File): Boolean {
        return try {
            contentResolver.openInputStream(imageUri)?.use { input ->
                FileOutputStream(outputFile).use { out ->
                    val chunk = ByteArray(8192)
                    var bytesRead: Int
                    while (input.read(chunk).also { bytesRead = it } != -1) {
                        out.write(chunk, 0, bytesRead)
                    }
                }
            } ?: false
        } catch (e: Exception) {
            Log.e(TAG, "Failed to copy shared image", e)
            false
        }
    }

    private fun calculateInSampleSize(width: Int, height: Int, maxDimension: Int): Int {
        var sampleSize = 1
        var largest = maxOf(width, height)
        while (largest / sampleSize > maxDimension) {
            sampleSize *= 2
        }
        return sampleSize.coerceAtLeast(1)
    }

    private fun scaleBitmapIfNeeded(bitmap: Bitmap, maxDimension: Int): Bitmap {
        val largest = maxOf(bitmap.width, bitmap.height)
        if (largest <= maxDimension) {
            return bitmap
        }

        val scale = maxDimension.toFloat() / largest.toFloat()
        val scaledWidth = (bitmap.width * scale).roundToInt().coerceAtLeast(1)
        val scaledHeight = (bitmap.height * scale).roundToInt().coerceAtLeast(1)
        return Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, false)
    }

    /**
     * Extract the shared image URI from the intent, trying multiple sources.
     */
    private fun getImageUri(): Uri? {
        val shareAction = intent?.action
        if (shareAction != Intent.ACTION_SEND &&
            shareAction != Intent.ACTION_SEND_MULTIPLE &&
            shareAction != Intent.ACTION_VIEW) {
            Log.w(TAG, "Unexpected share intent action: $shareAction")
        }

        // 1. EXTRA_STREAM (standard share path)
        val fromExtra: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri
        }
        if (fromExtra != null) return fromExtra

        // 1b. EXTRA_STREAM as a list (some apps send ACTION_SEND_MULTIPLE)
        val fromExtraList: List<Uri>? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
        }
        if (!fromExtraList.isNullOrEmpty()) {
            return fromExtraList.firstOrNull()
        }

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
        try { sharedImageFile?.delete() } catch (_: Exception) {}
        super.onDestroy()
    }

    companion object {
        private const val TAG = "SpriteShare"
        private const val MAX_IMAGE_DIMENSION = 2048
    }

    private enum class SaveResult {
        SUCCESS,
        DECODE_FAILED,
        OUT_OF_MEMORY
    }
}
