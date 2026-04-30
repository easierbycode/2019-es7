package com.easierbycode.apkforge

import java.io.File

/**
 * Patches the package id in a binary AndroidManifest.xml inside an APK.
 *
 * Strategy: locate a length-stable placeholder string (UTF-16LE) in the
 * raw bytes and overwrite it in place. The shell APK is built with the
 * placeholder as the widget id in config.xml so AAPT2 emits it directly
 * into both the AXML attribute payload and the AXML string pool. Because
 * the replacement has the exact same UTF-16 byte length, no string-pool
 * offset table needs to be rewritten.
 */
object AxmlPatcher {

    const val PKG_PLACEHOLDER = "com.easierbycode.zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
    const val PKG_LEN = 47

    fun patchManifest(apk: File, packageId: String) {
        require(packageId.length <= PKG_LEN) {
            "packageId longer than placeholder: $packageId"
        }
        val data = ZipRewriter.readEntry(apk, "AndroidManifest.xml")
            ?: throw IllegalStateException("AndroidManifest.xml missing")
        val padded = packageId.padEnd(PKG_LEN, '_')
        val patched = replaceAllUtf16(data, PKG_PLACEHOLDER, padded)
        ZipRewriter.replaceEntry(apk, "AndroidManifest.xml", patched)
    }

    private fun replaceAllUtf16(data: ByteArray, find: String, replace: String): ByteArray {
        require(find.length == replace.length)
        val findBytes = find.toByteArray(Charsets.UTF_16LE)
        val replaceBytes = replace.toByteArray(Charsets.UTF_16LE)
        val out = data.copyOf()
        var matches = 0
        var i = 0
        while (i <= out.size - findBytes.size) {
            if (matchesAt(out, i, findBytes)) {
                System.arraycopy(replaceBytes, 0, out, i, replaceBytes.size)
                matches++
                i += findBytes.size
            } else {
                i++
            }
        }
        if (matches == 0) {
            throw IllegalStateException(
                "AXML placeholder not found — shell APK does not match expected format. " +
                "Expected: '$find'"
            )
        }
        return out
    }

    private fun matchesAt(data: ByteArray, idx: Int, needle: ByteArray): Boolean {
        for (j in needle.indices) if (data[idx + j] != needle[j]) return false
        return true
    }
}
