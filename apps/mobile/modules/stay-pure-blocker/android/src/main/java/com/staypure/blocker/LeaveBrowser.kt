package com.staypure.blocker

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper

object LeaveBrowser {
  fun continueInHoliness(
    context: Context,
    host: String? = null,
    bringAppForward: Boolean = true,
  ) {
    val app = context.applicationContext
    if (!host.isNullOrBlank()) {
      InterruptionSnooze.snooze(app, host)
    }
    GuardNotice.mark(app)
    dismissInterruptNotification(app)
    if (!bringAppForward) {
      VerseOverlay.hide(app)
      return
    }
    goHome(app)
    Handler(Looper.getMainLooper()).postDelayed({
      VerseOverlay.hide(app)
      openStayPure(app)
    }, 280)
  }

  private fun goHome(context: Context) {
    try {
      context.startActivity(
        Intent(Intent.ACTION_MAIN).apply {
          addCategory(Intent.CATEGORY_HOME)
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        },
      )
    } catch (_: Exception) {
    }
  }

  private fun dismissInterruptNotification(context: Context) {
    try {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.cancel(StayPureVpnService.INTERRUPT_NOTIFICATION_ID)
    } catch (_: Exception) {
    }
  }

  private fun openStayPure(context: Context) {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launch.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
        Intent.FLAG_ACTIVITY_SINGLE_TOP,
    )
    try {
      context.startActivity(launch)
    } catch (_: Exception) {
    }
  }
}
