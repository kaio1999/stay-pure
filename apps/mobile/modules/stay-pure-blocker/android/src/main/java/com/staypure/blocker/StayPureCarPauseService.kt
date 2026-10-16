package com.staypure.blocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class StayPureCarPauseService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val watch = Runnable { tick() }

  private val carReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
      if (!CarModeGate.isConnected(context)) {
        CarModeGate.exit(context)
        ShieldCoordinator.resumeAfterCar(context)
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    CarModeReceiver.register(this, carReceiver)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(NOTIFICATION_ID, buildNotification())
    handler.removeCallbacks(watch)
    handler.postDelayed(watch, POLL_MS)
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(watch)
    try {
      unregisterReceiver(carReceiver)
    } catch (_: Exception) {
    }
    super.onDestroy()
  }

  private fun tick() {
    if (!CarModeGate.isConnected(this)) {
      CarModeGate.exit(this)
      ShieldCoordinator.resumeAfterCar(this)
      return
    }
    handler.postDelayed(watch, POLL_MS)
  }

  private fun buildNotification(): Notification {
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL, getString(R.string.shield_channel), NotificationManager.IMPORTANCE_LOW),
      )
    }
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setContentTitle(getString(R.string.shield_paused_title))
      .setContentText(getString(R.string.shield_paused_text))
      .setOngoing(true)
      .setContentIntent(pending)
      .build()
  }

  companion object {
    private const val CHANNEL = "stay_pure_car_pause"
    private const val NOTIFICATION_ID = 19
    private const val POLL_MS = 2_000L

    fun start(context: Context) {
      val intent = Intent(context, StayPureCarPauseService::class.java)
      if (Build.VERSION.SDK_INT >= 26) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, StayPureCarPauseService::class.java))
    }
  }
}
