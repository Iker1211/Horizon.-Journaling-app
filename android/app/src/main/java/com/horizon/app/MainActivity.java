package com.horizon.app;

import android.graphics.Color;
import android.os.Build;
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
    private NavigationBarProtection navigationBarProtection;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        applySystemBarAppearance();

        View decorView = getWindow().getDecorView();
        // Android 15+ can ignore navigationBarColor. Paint beneath the system icons,
        // above the WebView (including modal backdrops), using actual navigation insets.
        navigationBarProtection = new NavigationBarProtection(getColor(R.color.navigationBarSurface));
        decorView.getOverlay().add(navigationBarProtection);
        decorView.addOnLayoutChangeListener((view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) ->
            navigationBarProtection.setBounds(0, 0, view.getWidth(), view.getHeight())
        );
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            latestSystemBars = systemBars;
            // The keyboard owns navigation appearance while its window is visible.
            // Painting at the bottom of a resized app would otherwise cover the editor.
            navigationBarProtection.setInsets(windowInsets.isVisible(WindowInsetsCompat.Type.ime())
                ? Insets.NONE : windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()));
            navigationBarProtection.setBounds(0, 0, view.getWidth(), view.getHeight());
            publishInsetsToCss(systemBars);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(decorView);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applySystemBarAppearance();
            ViewCompat.requestApplyInsets(getWindow().getDecorView());
            if (!Insets.NONE.equals(latestSystemBars)) publishInsetsToCss(latestSystemBars);
        }
    }

    private void applySystemBarAppearance() {
        getWindow().setNavigationBarColor(getColor(R.color.navigationBarSurface));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(true);
        }
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O);
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
