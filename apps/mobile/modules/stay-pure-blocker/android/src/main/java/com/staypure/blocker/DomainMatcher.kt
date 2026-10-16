package com.staypure.blocker

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader

class DomainMatcher {
  private val exact = HashSet<String>(4096)
  private val tlds = HashSet<String>(8)

  val size: Int
    get() = exact.size

  fun add(raw: String) {
    val domain = normalize(raw)
    if (domain.isEmpty() || !domain.contains('.')) return
    exact.add(domain)
  }

  fun addTld(raw: String) {
    val tld = normalize(raw)
    if (tld.isNotEmpty()) tlds.add(tld)
  }

  fun shouldBlock(host: String): Boolean {
    var current = normalize(host)
    if (current.isEmpty()) return false
    val lastDot = current.lastIndexOf('.')
    if (lastDot >= 0 && tlds.contains(current.substring(lastDot + 1))) {
      return true
    }
    while (true) {
      if (exact.contains(current)) return true
      val dot = current.indexOf('.')
      if (dot < 0) return false
      current = current.substring(dot + 1)
    }
  }

  fun load(context: Context, assetName: String) {
    context.assets.open(assetName).use { stream ->
      BufferedReader(InputStreamReader(stream)).use { reader ->
        var line: String? = reader.readLine()
        while (line != null) {
          val trimmed = line.trim()
          if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
            if (trimmed.startsWith("tld:")) {
              addTld(trimmed.substring(4))
            } else {
              add(trimmed)
            }
          }
          line = reader.readLine()
        }
      }
    }
  }

  companion object {
    fun normalize(host: String): String {
      var value = host.trim().lowercase()
      value = value.removePrefix("http://").removePrefix("https://")
      val slash = value.indexOf('/')
      if (slash >= 0) value = value.substring(0, slash)
      val colon = value.indexOf(':')
      if (colon >= 0) value = value.substring(0, colon)
      value = value.removePrefix("*.").removePrefix(".")
      if (value.startsWith("www.")) value = value.substring(4)
      return value.trimEnd('.')
    }
  }
}
