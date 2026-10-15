package com.horizon.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Keeps the web UI edge-to-edge while exposing Android's real system-bar sizes
 * to CSS. Gesture navigation, two-button navigation and three-button navigation
 * use different bottom insets, and those values also vary between vendors.
 */
public class MainActivity extends BridgeActivity {
    private Insets latestSystemBars = Insets.NONE;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);

        View decorView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            latestSystemBars = systemBars;
            publishInsetsToCss(systemBars);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(decorView);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && !Insets.NONE.equals(latestSystemBars)) publishInsetsToCss(latestSystemBars);
    }

    private void publishInsetsToCss(Insets insets) {
        if (getBridge() == null || getBridge().getWebView() == null) return;

        float density = getResources().getDisplayMetrics().density;
        float top = insets.top / density;
        float right = insets.right / density;
        float bottom = insets.bottom / density;
        float left = insets.left / density;

        String script = String.format(
            java.util.Locale.US,
            "document.documentElement.style.setProperty('--android-inset-top','%.2fpx');" +
            "document.documentElement.style.setProperty('--android-inset-right','%.2fpx');" +
            "document.documentElement.style.setProperty('--android-inset-bottom','%.2fpx');" +
            "document.documentElement.style.setProperty('--android-inset-left','%.2fpx');",
            top, right, bottom, left
        );
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(script, null));
        // The first inset event may arrive while Capacitor is still loading the app document.
        getBridge().getWebView().postDelayed(
            () -> getBridge().getWebView().evaluateJavascript(script, null),
            600
        );
    }
}
