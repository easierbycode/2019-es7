package com.easierbycode.spriteshare;

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
