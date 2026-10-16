package com.staypure.blocker

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object AccountabilityClient {
  const val PREFS = "stay_pure_account_secure"
  private const val LEGACY_PREFS = "stay_pure_account"
  const val KEY_ENABLED = "enabled"
  const val KEY_EMAIL = "email"
  const val KEY_DEVICE = "deviceId"
  const val KEY_API = "apiUrl"
  const val KEY_TOKEN = "token"

  private val io = Executors.newSingleThreadExecutor()
  @Volatile private var cachedPrefs: SharedPreferences? = null

  fun configure(
    context: Context,
    enabled: Boolean,
    email: String,
    deviceId: String,
    apiUrl: String,
    token: String,
    shieldOn: Boolean,
  ) {
    prefs(context).edit()
      .putBoolean(KEY_ENABLED, enabled)
      .putString(KEY_EMAIL, email.trim())
      .putString(KEY_DEVICE, deviceId)
      .putString(KEY_API, apiUrl.trim().trimEnd('/'))
      .putString(KEY_TOKEN, token)
      .apply()
    if (enabled) {
      HeartbeatScheduler.ensure(context)
      post(context, "/v1/watch", mapOf(
        "deviceId" to deviceId,
        "partnerEmail" to email.trim(),
        "enabled" to true,
        "shieldOn" to shieldOn,
      ))
    } else {
      post(context, "/v1/watch", mapOf(
        "deviceId" to deviceId,
        "partnerEmail" to email.trim(),
        "enabled" to false,
        "shieldOn" to shieldOn,
      ))
      HeartbeatScheduler.cancel(context)
    }
  }

  fun heartbeat(context: Context, shieldOn: Boolean) {
    val cfg = config(context) ?: return
    if (!cfg.enabled) return
    post(context, "/v1/heartbeat", mapOf(
      "deviceId" to cfg.deviceId,
      "shieldOn" to shieldOn,
    ))
  }

  fun event(context: Context, kind: String) {
    val cfg = config(context) ?: return
    if (!cfg.enabled && kind != "accountability_off") return
    post(context, "/v1/event", mapOf(
      "deviceId" to cfg.deviceId,
      "kind" to kind,
    ))
  }

  fun isEnabled(context: Context): Boolean {
    return prefs(context).getBoolean(KEY_ENABLED, false)
  }

  fun snapshot(context: Context): Map<String, Any> {
    val secure = prefs(context)
    return mapOf(
      "enabled" to secure.getBoolean(KEY_ENABLED, false),
      "email" to (secure.getString(KEY_EMAIL, "") ?: ""),
      "deviceId" to (secure.getString(KEY_DEVICE, "") ?: ""),
    )
  }

  private data class Cfg(
    val enabled: Boolean,
    val email: String,
    val deviceId: String,
    val apiUrl: String,
    val token: String,
  )

  private fun config(context: Context): Cfg? {
    val secure = prefs(context)
    val deviceId = secure.getString(KEY_DEVICE, "") ?: ""
    val apiUrl = secure.getString(KEY_API, "") ?: ""
    if (deviceId.isBlank() || apiUrl.isBlank()) return null
    return Cfg(
      enabled = secure.getBoolean(KEY_ENABLED, false),
      email = secure.getString(KEY_EMAIL, "") ?: "",
      deviceId = deviceId,
      apiUrl = apiUrl,
      token = secure.getString(KEY_TOKEN, "") ?: "",
    )
  }

  private fun prefs(context: Context): SharedPreferences {
    cachedPrefs?.let { return it }
    synchronized(this) {
      cachedPrefs?.let { return it }
      val app = context.applicationContext
      val masterKey = MasterKey.Builder(app)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
      val encrypted = EncryptedSharedPreferences.create(
        app,
        PREFS,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
      )
      migrateLegacy(app, encrypted)
      cachedPrefs = encrypted
      return encrypted
    }
  }

  private fun migrateLegacy(context: Context, encrypted: SharedPreferences) {
    if (encrypted.contains(KEY_DEVICE) || encrypted.contains(KEY_TOKEN)) return
    val legacy = context.getSharedPreferences(LEGACY_PREFS, Context.MODE_PRIVATE)
    if (!legacy.contains(KEY_DEVICE) && !legacy.contains(KEY_TOKEN) && !legacy.contains(KEY_EMAIL)) {
      return
    }
    encrypted.edit()
      .putBoolean(KEY_ENABLED, legacy.getBoolean(KEY_ENABLED, false))
      .putString(KEY_EMAIL, legacy.getString(KEY_EMAIL, "") ?: "")
      .putString(KEY_DEVICE, legacy.getString(KEY_DEVICE, "") ?: "")
      .putString(KEY_API, legacy.getString(KEY_API, "") ?: "")
      .putString(KEY_TOKEN, legacy.getString(KEY_TOKEN, "") ?: "")
      .apply()
    legacy.edit().clear().apply()
  }

  private fun post(context: Context, path: String, payload: Map<String, Any>) {
    val cfg = config(context) ?: return
    io.execute {
      try {
        val url = URL(cfg.apiUrl + path)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 12_000
        conn.readTimeout = 12_000
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
        if (cfg.token.isNotBlank()) {
          conn.setRequestProperty("Authorization", "Bearer ${cfg.token}")
        }
        OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
          val json = JSONObject()
          for ((key, value) in payload) {
            when (value) {
              is Boolean -> json.put(key, value)
              is Number -> json.put(key, value)
              else -> json.put(key, value.toString())
            }
          }
          writer.write(json.toString())
        }
        conn.inputStream.bufferedReader().use { it.readText() }
        conn.disconnect()
      } catch (_: Exception) {
      }
    }
  }
}
