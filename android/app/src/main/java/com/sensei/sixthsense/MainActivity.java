package com.sensei.sixthsense;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {
    private boolean launchReady;

    @Override public void onCreate(Bundle savedInstanceState) {
        // Install before BridgeActivity changes the launch theme. Keep the fox
        // visible until bundled content can paint, with a bounded failure fallback.
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        long launchDeadline = SystemClock.uptimeMillis() + 4000;
        splash.setKeepOnScreenCondition(() -> !launchReady && SystemClock.uptimeMillis() < launchDeadline);
        registerPlugin(SenseiMonetizationPlugin.class);
        registerPlugin(StreakRemindersPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() == null) { launchReady = true; return; }
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
            @Override public void onPageCommitVisible(android.webkit.WebView webView, String url) {
                launchReady = true;
            }
            @Override public void onPageLoaded(android.webkit.WebView webView) {
                launchReady = true;
                ViewCompat.requestApplyInsets(container);
            }
            @Override public void onReceivedError(android.webkit.WebView webView) {
                launchReady = true;
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
