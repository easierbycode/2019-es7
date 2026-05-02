package com.easierbycode.apkforge

import android.app.Application
import android.content.Context
import android.os.Environment
import android.util.Log
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Diagnostic Application class that installs an UncaughtExceptionHandler in
 * attachBaseContext() — runs *before* ContentProvider.attachInfo, so it
 * captures FileProvider/manifest-merge style crashes that would otherwise
 * leave no visible trace on a device without ADB.
 *
 * The handler writes the stack trace to three locations (best-effort):
 *   1. cacheDir/last-crash.txt                           (always writable)
 *   2. getExternalFilesDir(null)/last-crash.txt          (visible to file managers)
 *   3. /sdcard/Download/EvilInvadersForge/last-crash.txt (visible in Files app)
 *
 * MainActivity is patched (by hooks/after_prepare.js) to read #1 on the next
 * launch and display it in a Dialog so the user can read the trace on-device.
 */
class ForgeApplication : Application() {

    private var savedHandler: Thread.UncaughtExceptionHandler? = null

    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(base)
        installCrashHandler(base)
        Log.i(TAG, "ForgeApplication attached, crash handler installed")
    }

    private fun installCrashHandler(ctx: Context) {
        savedHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try { writeCrashLog(ctx, thread, throwable) } catch (_: Throwable) {}
            savedHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun writeCrashLog(ctx: Context, thread: Thread, throwable: Throwable) {
        val sw = StringWriter()
        val ts = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        sw.write("CRASH at $ts\n")
        sw.write("Thread: ${thread.name}\n\n")
        throwable.printStackTrace(PrintWriter(sw))
        val text = sw.toString()
        Log.e(TAG, text)

        runCatching { File(ctx.cacheDir, CRASH_FILE).writeText(text) }

        runCatching {
            ctx.getExternalFilesDir(null)?.let { File(it, CRASH_FILE).writeText(text) }
        }

        runCatching {
            @Suppress("DEPRECATION")
            val downloads = File(Environment.getExternalStorageDirectory(),
                "Download/EvilInvadersForge")
            downloads.mkdirs()
            File(downloads, CRASH_FILE).writeText(text)
        }
    }

    companion object {
        private const val TAG = "ForgeApplication"
        const val CRASH_FILE = "last-crash.txt"
    }
}
