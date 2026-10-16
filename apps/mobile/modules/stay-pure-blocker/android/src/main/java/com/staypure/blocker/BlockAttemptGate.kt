package com.staypure.blocker

import java.util.concurrent.ConcurrentHashMap

object BlockAttemptGate {
  private const val SAME_FAMILY_MS = 90_000L
  private const val BURST_MS = 15_000L

  private val lastByApex = ConcurrentHashMap<String, Long>()
  @Volatile private var lastAnyAt = 0L

  @Synchronized
  fun shouldCount(host: String): Boolean {
    val now = System.currentTimeMillis()
    val family = family(host)
    val lastFamily = lastByApex[family] ?: 0L
    if (now - lastFamily < SAME_FAMILY_MS) return false
    if (now - lastAnyAt < BURST_MS) return false
    lastByApex[family] = now
    lastAnyAt = now
    return true
  }

  private fun family(host: String): String {
    val normalized = DomainMatcher.normalize(host)
    val parts = normalized.split('.')
    return if (parts.size <= 2) normalized else parts.takeLast(2).joinToString(".")
  }
}
