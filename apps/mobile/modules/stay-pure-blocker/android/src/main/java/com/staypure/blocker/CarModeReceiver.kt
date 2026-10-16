package com.staypure.blocker

import android.app.UiModeManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbManager
import android.os.Build

class CarModeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    when (intent?.action) {
      UiModeManager.ACTION_ENTER_CAR_MODE,
      ACTION_CAR_CONNECTION_UPDATED,
      ACTION_GMS_CAR_CONNECTED,
      ACTION_GMS_CAR_STATUS,
      -> {
        CarModeGate.enter(context)
        ShieldCoordinator.pauseForCar(context)
      }
      Intent.ACTION_DOCK_EVENT -> {
        val state = intent.getIntExtra(Intent.EXTRA_DOCK_STATE, Intent.EXTRA_DOCK_STATE_UNDOCKED)
        if (state != Intent.EXTRA_DOCK_STATE_CAR) return
        CarModeGate.enter(context)
        ShieldCoordinator.pauseForCar(context)
      }
      UsbManager.ACTION_USB_ACCESSORY_ATTACHED -> {
        if (!CarModeGate.isConnected(context)) return
        CarModeGate.enter(context)
        ShieldCoordinator.pauseForCar(context)
      }
      UiModeManager.ACTION_EXIT_CAR_MODE,
      ACTION_GMS_CAR_DISCONNECTED,
      ACTION_GMS_CAR_DISCONNECTED_ALT,
      -> {
        CarModeGate.exit(context)
        ShieldCoordinator.resumeAfterCar(context)
      }
      UsbManager.ACTION_USB_ACCESSORY_DETACHED -> {
        if (CarModeGate.isConnected(context)) return
        CarModeGate.exit(context)
        ShieldCoordinator.resumeAfterCar(context)
      }
    }
  }

  companion object {
    const val ACTION_CAR_CONNECTION_UPDATED = "androidx.car.app.connection.action.CAR_CONNECTION_UPDATED"
    const val ACTION_GMS_CAR_CONNECTED = "com.google.android.gms.car.CONNECTED"
    const val ACTION_GMS_CAR_DISCONNECTED = "com.google.android.gms.car.DISCONNECT"
    const val ACTION_GMS_CAR_DISCONNECTED_ALT = "com.google.android.gms.car.DISCONNECTED"
    const val ACTION_GMS_CAR_STATUS = "com.google.android.gms.car.intent.action.CAR_CONNECTION_STATUS"

    fun filter(): IntentFilter {
      return IntentFilter().apply {
        addAction(UiModeManager.ACTION_ENTER_CAR_MODE)
        addAction(UiModeManager.ACTION_EXIT_CAR_MODE)
        addAction(Intent.ACTION_DOCK_EVENT)
        addAction(UsbManager.ACTION_USB_ACCESSORY_ATTACHED)
        addAction(UsbManager.ACTION_USB_ACCESSORY_DETACHED)
        addAction(ACTION_CAR_CONNECTION_UPDATED)
        addAction(ACTION_GMS_CAR_CONNECTED)
        addAction(ACTION_GMS_CAR_DISCONNECTED)
        addAction(ACTION_GMS_CAR_DISCONNECTED_ALT)
        addAction(ACTION_GMS_CAR_STATUS)
      }
    }

    fun register(context: Context, receiver: BroadcastReceiver) {
      if (Build.VERSION.SDK_INT >= 33) {
        context.registerReceiver(receiver, filter(), Context.RECEIVER_EXPORTED)
      } else {
        @Suppress("UnspecifiedRegisterReceiverFlag")
        context.registerReceiver(receiver, filter())
      }
    }
  }
}
