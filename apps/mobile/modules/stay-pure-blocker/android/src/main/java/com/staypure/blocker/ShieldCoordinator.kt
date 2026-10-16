package com.staypure.blocker

import android.content.Context
import android.content.Intent
import android.net.VpnService

object ShieldCoordinator {
  fun pauseForCar(context: Context) {
    val app = context.applicationContext
    val prefs = app.getSharedPreferences(StayPureVpnService.PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(StayPureVpnService.KEY_WANTED, false)) return
    prefs.edit().putBoolean(CarModeGate.KEY_PAUSED_CAR, true).apply()
    StayPureVpnService.enabled = false
    StayPureCarPauseService.start(app)
    StayPureVpnService.requestStop(app)
  }

  fun resumeAfterCar(context: Context) {
    val app = context.applicationContext
    val prefs = app.getSharedPreferences(StayPureVpnService.PREFS, Context.MODE_PRIVATE)
    prefs.edit().putBoolean(CarModeGate.KEY_PAUSED_CAR, false).apply()
    StayPureCarPauseService.stop(app)
    if (!prefs.getBoolean(StayPureVpnService.KEY_WANTED, false)) return
    if (CarModeGate.isConnected(app)) {
      CarModeGate.enter(app)
      pauseForCar(app)
      return
    }
    CarModeGate.exit(app)
    if (VpnService.prepare(app) != null) return
    StayPureVpnService.start(app, prefs.getBoolean(StayPureVpnService.KEY_STRICT, false))
  }

  fun userStop(context: Context) {
    val app = context.applicationContext
    StayPureVpnService.cancelPendingStarts()
    app.getSharedPreferences(StayPureVpnService.PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(StayPureVpnService.KEY_WANTED, false)
      .putBoolean(CarModeGate.KEY_PAUSED_CAR, false)
      .putBoolean(CarModeGate.KEY_CAR_SESSION, false)
      .apply()
    StayPureCarPauseService.stop(app)
    StayPureVpnService.enabled = false
    StayPureVpnService.requestStop(app)
    AccountabilityClient.event(app, "shield_off")
  }
}
