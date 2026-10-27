package com.horizon.app;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;

import androidx.core.graphics.Insets;

/** A passive background behind Android navigation controls; never receives touch events. */
final class NavigationBarProtection extends Drawable {
    private final Paint paint = new Paint();
    private Insets insets = Insets.NONE;

    NavigationBarProtection(int color) {
        paint.setColor(color);
    }

    void setInsets(Insets nextInsets) {
        if (!insets.equals(nextInsets)) {
            insets = nextInsets;
            invalidateSelf();
        }
    }

    @Override
    public void draw(Canvas canvas) {
        Rect bounds = getBounds();
        // No fixed dp height: gesture bars, three buttons, rotation and OEMs vary.
        if (insets.bottom > 0) canvas.drawRect(bounds.left, bounds.bottom - insets.bottom, bounds.right, bounds.bottom, paint);
        if (insets.left > 0) canvas.drawRect(bounds.left, bounds.top, bounds.left + insets.left, bounds.bottom, paint);
        if (insets.right > 0) canvas.drawRect(bounds.right - insets.right, bounds.top, bounds.right, bounds.bottom, paint);
    }

    @Override
    public void setAlpha(int alpha) { paint.setAlpha(alpha); invalidateSelf(); }

    @Override
    public void setColorFilter(ColorFilter colorFilter) { paint.setColorFilter(colorFilter); invalidateSelf(); }

    @Override
    public int getOpacity() { return PixelFormat.TRANSLUCENT; }
}
