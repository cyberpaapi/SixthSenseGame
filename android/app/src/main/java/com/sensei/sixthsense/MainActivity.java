package com.sensei.sixthsense;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SenseiMonetizationPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        android.webkit.WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        View container = (View) getBridge().getWebView().getParent();
        container.setBackgroundColor(android.graphics.Color.rgb(36, 16, 68));
        ViewCompat.setOnApplyWindowInsetsListener(container, (view, insets) -> {
            // Hidden system bars must not leave empty strips. Keep controls clear
            // of a camera cutout and the keyboard when editing a player name.
            Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(cutout.left, 0, cutout.right, Math.max(cutout.bottom, keyboard.bottom));
            applyHeaderSafeArea(cutout.top);
            return WindowInsetsCompat.CONSUMED;
        });
        getBridge().addWebViewListener(new WebViewListener() {
            @Override public void onPageLoaded(android.webkit.WebView webView) {
                ViewCompat.requestApplyInsets(container);
            }
        });
        ViewCompat.requestApplyInsets(container);
        enterImmersiveMode();
    }

    private void applyHeaderSafeArea(int topPixels) {
        float top = topPixels / getResources().getDisplayMetrics().density;
        // Draw the game background behind the camera instead of a blank native
        // strip. Only the header controls need to stay below the cutout.
        getBridge().getWebView().evaluateJavascript("document.documentElement.style.setProperty('--native-safe-top','" + top + "px')", null);
    }

    private void enterImmersiveMode() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersiveMode();
    }

    @Override public void onResume() {
        super.onResume();
        enterImmersiveMode();
    }
}
