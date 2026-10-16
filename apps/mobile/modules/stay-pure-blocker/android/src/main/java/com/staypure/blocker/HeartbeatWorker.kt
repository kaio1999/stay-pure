package com.staypure.blocker

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class HeartbeatWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    val prefs = applicationContext.getSharedPreferences(StayPureVpnService.PREFS, Context.MODE_PRIVATE)
    val shieldOn = prefs.getBoolean(StayPureVpnService.KEY_WANTED, false)
    AccountabilityClient.heartbeat(applicationContext, shieldOn)
    return Result.success()
  }
}

object HeartbeatScheduler {
  private const val UNIQUE = "stay-pure-heartbeat"

  fun ensure(context: Context) {
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()
    val request = PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES)
      .setConstraints(constraints)
      .build()
    WorkManager.getInstance(context.applicationContext).enqueueUniquePeriodicWork(
      UNIQUE,
      ExistingPeriodicWorkPolicy.UPDATE,
      request,
    )
  }

  fun cancel(context: Context) {
    WorkManager.getInstance(context.applicationContext).cancelUniqueWork(UNIQUE)
  }
}
