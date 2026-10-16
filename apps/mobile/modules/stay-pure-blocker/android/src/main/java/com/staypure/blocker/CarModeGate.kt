package com.staypure.blocker

import android.app.UiModeManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.hardware.usb.UsbManager
import android.net.Uri
import android.net.VpnService

object CarModeGate {
  const val KEY_PAUSED_CAR = "paused_car"
  const val KEY_CAR_SESSION = "car_session"

  val bypassPackages = listOf(
    "com.google.android.projection.gearhead",
    "com.google.android.gms",
    "com.google.android.gms.policy_sidecar_aps",
    "com.google.android.googlequicksearchbox",
    "com.android.bluetooth",
  )

  fun isSession(context: Context): Boolean {
    return prefs(context).getBoolean(KEY_CAR_SESSION, false)
  }

  fun enter(context: Context) {
    prefs(context).edit().putBoolean(KEY_CAR_SESSION, true).apply()
  }

  fun exit(context: Context) {
    prefs(context).edit().putBoolean(KEY_CAR_SESSION, false).apply()
  }

  fun isConnected(context: Context): Boolean {
    if (isSession(context)) return true
    val projection = carConnectionType(context)
    if (projection == CONNECTION_NATIVE || projection == CONNECTION_PROJECTION) return true
    if (isCarUi(context)) return true
    if (isUsbAndroidAuto(context)) return true
    return false
  }

  fun applyBypass(builder: VpnService.Builder, packageManager: PackageManager) {
    for (pkg in bypassPackages) {
      try {
        packageManager.getPackageInfo(pkg, 0)
        builder.addDisallowedApplication(pkg)
      } catch (_: Exception) {
      }
    }
  }

  private fun isCarUi(context: Context): Boolean {
    val ui = context.getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager ?: return false
    return ui.currentModeType == Configuration.UI_MODE_TYPE_CAR
  }

  private fun carConnectionType(context: Context): Int {
    return try {
      val uri = Uri.parse("content://androidx.car.app.connection")
      val cursor = context.contentResolver.query(
        uri,
        arrayOf("CarConnectionState"),
        null,
        null,
        null,
      )
      cursor?.use { if (it.moveToFirst()) it.getInt(0) else 0 } ?: 0
    } catch (_: Exception) {
      0
    }
  }

  private fun isUsbAndroidAuto(context: Context): Boolean {
    return try {
      val usb = context.getSystemService(Context.USB_SERVICE) as? UsbManager ?: return false
      usb.accessoryList?.any { accessory ->
        val manufacturer = accessory.manufacturer.orEmpty().lowercase()
        val model = accessory.model.orEmpty().lowercase()
        manufacturer.contains("google") ||
          model.contains("android auto") ||
          model.contains("androidauto")
      } ?: false
    } catch (_: Exception) {
      false
    }
  }

  private fun prefs(context: Context) =
    context.getSharedPreferences(StayPureVpnService.PREFS, Context.MODE_PRIVATE)

  private const val CONNECTION_NATIVE = 1
  private const val CONNECTION_PROJECTION = 2
}
