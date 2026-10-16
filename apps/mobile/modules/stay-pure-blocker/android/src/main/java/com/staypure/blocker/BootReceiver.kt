package com.staypure.blocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    if (AccountabilityClient.isEnabled(context)) {
      HeartbeatScheduler.ensure(context)
    }
    val prefs = context.getSharedPreferences(StayPureVpnService.PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(StayPureVpnService.KEY_WANTED, false)) return
    if (VpnService.prepare(context) != null) return
    StayPureVpnService.start(context, prefs.getBoolean(StayPureVpnService.KEY_STRICT, false))
  }
}
