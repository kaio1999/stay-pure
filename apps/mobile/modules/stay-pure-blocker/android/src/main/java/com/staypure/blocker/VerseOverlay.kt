package com.staypure.blocker

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager

object VerseOverlay {
  @Volatile
  private var current: View? = null

  fun show(context: Context, host: String, verse: Verse) {
    if (!Settings.canDrawOverlays(context)) return
    val app = context.applicationContext
    hide(app)
    val view = LayoutInflater.from(app).inflate(R.layout.overlay_verse, null)
    InterruptionBinder.bind(view, host, verse) {
      LeaveBrowser.continueInHoliness(app, host)
    }

    val type = if (Build.VERSION.SDK_INT >= 26) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
      PixelFormat.TRANSLUCENT,
    )
    val wm = app.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    wm.addView(view, params)
    current = view
  }

  fun hide(context: Context) {
    val view = current ?: return
    current = null
    try {
      val wm = context.applicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      wm.removeView(view)
    } catch (_: Exception) {
    }
  }
}
