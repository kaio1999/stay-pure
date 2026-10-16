package com.staypure.blocker

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StayPureBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StayPureBlocker")
    Events("onBlocked")

    OnCreate {
      instance = this@StayPureBlockerModule
    }

    OnDestroy {
      if (instance === this@StayPureBlockerModule) {
        instance = null
      }
    }

    AsyncFunction("enable") { strictMode: Boolean ->
      val activity = appContext.currentActivity ?: throw IllegalStateException("Sem activity")
      val intent = Intent(activity, VpnConsentActivity::class.java)
        .putExtra(StayPureVpnService.EXTRA_STRICT, strictMode)
      activity.startActivity(intent)
    }

    AsyncFunction("disable") {
      val context = appContext.reactContext
        ?: appContext.currentActivity
        ?: throw IllegalStateException("Sem contexto")
      StayPureVpnService.stop(context.applicationContext)
    }

    AsyncFunction("status") {
      val context = appContext.reactContext
        ?: appContext.currentActivity
        ?: throw IllegalStateException("Sem contexto")
      StayPureVpnService.snapshot(context.applicationContext)
    }

    Function("hasOverlayPermission") {
      val context = appContext.reactContext ?: throw IllegalStateException("Sem contexto")
      Settings.canDrawOverlays(context)
    }

    AsyncFunction("openOverlaySettings") {
      val activity = appContext.currentActivity ?: throw IllegalStateException("Sem activity")
      activity.startActivity(
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${activity.packageName}")),
      )
    }

    AsyncFunction("leaveBrowser") { host: String?, reopen: Boolean? ->
      val context = appContext.reactContext ?: appContext.currentActivity
        ?: throw IllegalStateException("Sem contexto")
      LeaveBrowser.continueInHoliness(context, host, reopen ?: true)
    }

    Function("consumeGuardNotice") {
      val context = appContext.reactContext ?: return@Function false
      GuardNotice.consume(context)
    }

    AsyncFunction("configureAccountability") { enabled: Boolean, email: String, deviceId: String, apiUrl: String, token: String, shieldOn: Boolean ->
      val context = appContext.reactContext
        ?: appContext.currentActivity
        ?: throw IllegalStateException("Sem contexto")
      AccountabilityClient.configure(
        context.applicationContext,
        enabled,
        email,
        deviceId,
        apiUrl,
        token,
        shieldOn,
      )
    }

    AsyncFunction("accountabilityEvent") { kind: String ->
      val context = appContext.reactContext
        ?: appContext.currentActivity
        ?: throw IllegalStateException("Sem contexto")
      AccountabilityClient.event(context.applicationContext, kind)
    }

    AsyncFunction("openFullScreenSettings") {
      val activity = appContext.currentActivity ?: throw IllegalStateException("Sem activity")
      if (Build.VERSION.SDK_INT >= 34) {
        activity.startActivity(
          Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
            .setData(Uri.parse("package:${activity.packageName}")),
        )
      }
    }
  }

  companion object {
    @Volatile
    private var instance: StayPureBlockerModule? = null

    fun emitBlocked(host: String, verseId: String) {
      instance?.sendEvent(
        "onBlocked",
        mapOf(
          "host" to host,
          "blockedAt" to System.currentTimeMillis(),
          "verseId" to verseId,
        ),
      )
    }
  }
}
