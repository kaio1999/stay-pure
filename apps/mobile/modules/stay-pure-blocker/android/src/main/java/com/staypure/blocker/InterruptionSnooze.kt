package com.staypure.blocker

import android.content.Context

object InterruptionSnooze {
  private const val PREFS = "stay_pure_snooze"
  private const val DURATION_MS = 45L * 60L * 1000L

  fun snooze(context: Context, host: String) {
    val normalized = DomainMatcher.normalize(host)
    if (normalized.isEmpty()) return
    val until = System.currentTimeMillis() + DURATION_MS
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val editor = prefs.edit()
    editor.putLong(key(normalized), until)
    apex(normalized)?.let { editor.putLong(key(it), until) }
    editor.apply()
  }

  fun isSnoozed(context: Context, host: String): Boolean {
    val normalized = DomainMatcher.normalize(host)
    if (normalized.isEmpty()) return false
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val now = System.currentTimeMillis()
    if (isActive(prefs.getLong(key(normalized), 0L), now)) return true
    val apex = apex(normalized) ?: return false
    return isActive(prefs.getLong(key(apex), 0L), now)
  }

  private fun isActive(until: Long, now: Long): Boolean = until > now

  private fun key(host: String): String = "until:$host"

  private fun apex(host: String): String? {
    val parts = host.split('.')
    if (parts.size <= 2) return null
    return parts.takeLast(2).joinToString(".")
  }
}
