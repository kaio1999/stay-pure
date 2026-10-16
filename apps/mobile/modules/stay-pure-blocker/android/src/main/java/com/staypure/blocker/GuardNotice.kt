package com.staypure.blocker

import android.content.Context

object GuardNotice {
  private const val PREFS = "stay_pure_guard"
  private const val KEY_PENDING = "pending"

  fun mark(context: Context) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_PENDING, true)
      .apply()
  }

  fun consume(context: Context): Boolean {
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val pending = prefs.getBoolean(KEY_PENDING, false)
    if (pending) {
      prefs.edit().putBoolean(KEY_PENDING, false).apply()
    }
    return pending
  }
}
