package com.staypure.blocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.UiModeManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

class StayPureVpnService : VpnService() {
  private val running = AtomicBoolean(false)
  private var tun: ParcelFileDescriptor? = null
  private var matcher = DomainMatcher()
  private var upstream = Executors.newSingleThreadExecutor()
  private val main = Handler(Looper.getMainLooper())
  private var lastInterruptAt = 0L
  private var carReceiverRegistered = false

  private val carReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
      if (CarModeGate.isConnected(context) || intent?.action == UiModeManager.ACTION_ENTER_CAR_MODE) {
        ShieldCoordinator.pauseForCar(context)
      }
    }
  }

  private val carWatch = object : Runnable {
    override fun run() {
      if (!running.get() || !enabled) return
      if (CarModeGate.isConnected(this@StayPureVpnService)) {
        ShieldCoordinator.pauseForCar(this@StayPureVpnService)
        return
      }
      main.postDelayed(this, CAR_POLL_MS)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
    val stopRequested = intent?.action == ACTION_STOP || !prefs.getBoolean(KEY_WANTED, false)
    startForeground(NOTIFICATION_ID, buildNotification())
    if (stopRequested) {
      tearDownTunnel()
      enabled = false
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }
    val strict = intent?.getBooleanExtra(EXTRA_STRICT, false) ?: prefs.getBoolean(KEY_STRICT, false)
    tearDownTunnel()
    ensureUpstream()
    startTunnel(strict)
    registerCarReceiver()
    main.removeCallbacks(carWatch)
    main.postDelayed(carWatch, CAR_POLL_MS)
    return START_STICKY
  }

  override fun onRevoke() {
    ShieldCoordinator.userStop(this)
    super.onRevoke()
  }

  override fun onDestroy() {
    main.removeCallbacks(carWatch)
    unregisterCarReceiver()
    tearDownTunnel()
    upstream.shutdownNow()
    enabled = false
    super.onDestroy()
  }

  private fun tearDownTunnel() {
    running.set(false)
    try {
      tun?.close()
    } catch (_: Exception) {
    }
    tun = null
  }

  private fun ensureUpstream() {
    if (upstream.isShutdown || upstream.isTerminated) {
      upstream = Executors.newSingleThreadExecutor()
    }
  }

  private fun startTunnel(strict: Boolean) {
    running.set(true)
    matcher = DomainMatcher()
    val asset = if (strict) "blocklist-strict.txt" else "blocklist.txt"
    try {
      matcher.load(this, asset)
    } catch (error: Exception) {
      Log.w(TAG, "blocklist ausente, usando núcleo vazio", error)
    }
    domainCount = matcher.size

    val builder = Builder()
      .setSession("Stay Pure")
      .addAddress("10.8.0.2", 32)
      .addDnsServer("10.8.0.1")
      .addRoute("10.8.0.1", 32)
      .setMtu(1500)
      .setBlocking(true)
    try {
      builder.addDisallowedApplication(packageName)
    } catch (_: Exception) {
    }
    CarModeGate.applyBypass(builder, packageManager)
    if (Build.VERSION.SDK_INT >= 29) {
      builder.setMetered(false)
    }

    var descriptor: ParcelFileDescriptor? = null
    for (attempt in 0 until 4) {
      descriptor = try {
        builder.establish()
      } catch (error: Exception) {
        Log.w(TAG, "establish falhou (tentativa ${attempt + 1})", error)
        null
      }
      if (descriptor != null) break
      try {
        Thread.sleep(280)
      } catch (_: InterruptedException) {
      }
    }
    val established = descriptor
    tun = established
    if (established == null) {
      running.set(false)
      enabled = false
      Log.w(TAG, "não foi possível abrir o túnel DNS")
      return
    }
    enabled = true
    AccountabilityClient.heartbeat(this, true)
    Thread({ loop(established) }, "stay-pure-tun").start()
  }

  private fun loop(descriptor: ParcelFileDescriptor) {
    val input = FileInputStream(descriptor.fileDescriptor)
    val output = FileOutputStream(descriptor.fileDescriptor)
    val packet = ByteArray(32767)
    while (running.get()) {
      val length = try {
        input.read(packet)
      } catch (_: Exception) {
        break
      }
      if (length <= 0) continue
      if (!Ipv4.isUdpDns(packet, length)) continue
      val query = Ipv4.dnsPayload(packet, length)
      val host = DnsCodec.questionName(query) ?: continue
      if (matcher.shouldBlock(host)) {
        val response = Ipv4.wrapResponse(packet, DnsCodec.nxdomain(query))
        try {
          output.write(response)
        } catch (_: Exception) {
        }
        onBlocked(host)
      } else {
        val snapshot = packet.copyOf(length)
        upstream.execute { forward(snapshot, length, query, output) }
      }
    }
  }

  private fun forward(request: ByteArray, length: Int, query: ByteArray, output: FileOutputStream) {
    val socket = DatagramSocket()
    try {
      protect(socket)
      socket.soTimeout = 2500
      socket.send(DatagramPacket(query, query.size, InetSocketAddress("1.1.1.1", 53)))
      val buffer = ByteArray(2048)
      val incoming = DatagramPacket(buffer, buffer.size)
      socket.receive(incoming)
      val dns = buffer.copyOf(incoming.length)
      val wrapped = Ipv4.wrapResponse(request, dns)
      synchronized(output) {
        output.write(wrapped)
      }
    } catch (_: Exception) {
    } finally {
      socket.close()
    }
  }

  private fun onBlocked(host: String) {
    if (InterruptionSnooze.isSnoozed(this, host)) return
    if (!BlockAttemptGate.shouldCount(host)) return

    val day = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
    val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
    val storedDay = prefs.getString(KEY_DAY, "")
    blockedToday = if (storedDay == day) prefs.getInt(KEY_TODAY, 0) + 1 else 1
    blockedTotal = prefs.getInt(KEY_TOTAL, blockedTotal) + 1
    prefs.edit()
      .putString(KEY_DAY, day)
      .putInt(KEY_TODAY, blockedToday)
      .putInt(dayCountKey(day), blockedToday)
      .putInt(KEY_TOTAL, blockedTotal)
      .apply()

    val verse = VersePicker.pick(this, host)
    StayPureBlockerModule.emitBlocked(host, verse.id)
    main.post { presentInterruption(host, verse) }
  }

  private fun registerCarReceiver() {
    if (carReceiverRegistered) return
    CarModeReceiver.register(this, carReceiver)
    carReceiverRegistered = true
  }

  private fun unregisterCarReceiver() {
    if (!carReceiverRegistered) return
    try {
      unregisterReceiver(carReceiver)
    } catch (_: Exception) {
    }
    carReceiverRegistered = false
  }

  private fun presentInterruption(host: String, verse: Verse) {
    val now = System.currentTimeMillis()
    if (now - lastInterruptAt < 6_000) return
    lastInterruptAt = now

    vibrate()
    VerseOverlay.show(this, host, verse)

    val interrupt = Intent(this, InterruptionActivity::class.java)
      .putExtra(InterruptionActivity.EXTRA_HOST, host)
      .putExtra(InterruptionActivity.EXTRA_VERSE, verse.id)
      .addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP,
      )

    val fullScreen = PendingIntent.getActivity(
      this,
      88,
      interrupt,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    val notification = NotificationCompat.Builder(this, CHANNEL_INTERRUPT)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(getString(R.string.interrupted_kicker))
      .setContentText(verse.reference + " — " + verse.invitation)
      .setStyle(NotificationCompat.BigTextStyle().bigText(verse.text + "\n\n" + verse.invitation))
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setDefaults(NotificationCompat.DEFAULT_ALL)
      .setSound(sound)
      .setVibrate(longArrayOf(0, 450, 180, 450))
      .setFullScreenIntent(fullScreen, true)
      .setContentIntent(fullScreen)
      .setAutoCancel(true)
      .setTimeoutAfter(60_000)
      .build()
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    ensureChannels(manager)
    manager.notify(INTERRUPT_ID, notification)
    try {
      startActivity(interrupt)
    } catch (_: Exception) {
    }
  }

  private fun vibrate() {
    try {
      val vibrator = if (Build.VERSION.SDK_INT >= 31) {
        val manager = getSystemService(VibratorManager::class.java)
        manager.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        getSystemService(VIBRATOR_SERVICE) as Vibrator
      }
      if (Build.VERSION.SDK_INT >= 26) {
        vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 450, 180, 450), -1))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(longArrayOf(0, 450, 180, 450), -1)
      }
    } catch (_: Exception) {
    }
  }

  private fun buildNotification(): Notification {
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    ensureChannels(manager)
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, CHANNEL_SHIELD)
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setContentTitle(getString(R.string.shield_title))
      .setContentText(getString(R.string.shield_text))
      .setOngoing(true)
      .setContentIntent(pending)
      .build()
  }

  private fun ensureChannels(manager: NotificationManager) {
    if (Build.VERSION.SDK_INT < 26) return
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_SHIELD, getString(R.string.shield_channel), NotificationManager.IMPORTANCE_LOW),
    )
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_INTERRUPT, getString(R.string.interrupted_kicker), NotificationManager.IMPORTANCE_HIGH).apply {
        description = getString(R.string.shield_text)
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 450, 180, 450)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val attrs = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        setSound(sound, attrs)
        setBypassDnd(true)
      },
    )
  }

  companion object {
    const val PREFS = "stay_pure_shield"
    const val KEY_WANTED = "wanted"
    const val KEY_STRICT = "strict"
    const val KEY_DAY = "day"
    const val KEY_TODAY = "today"
    const val KEY_TOTAL = "total"
    const val EXTRA_STRICT = "strict"
    const val ACTION_STOP = "com.staypure.blocker.STOP"
    private const val TAG = "StayPureVpn"
    private const val CHANNEL_SHIELD = "stay_pure_shield"
    private const val CHANNEL_INTERRUPT = "stay_pure_interrupt_v2"
    private const val NOTIFICATION_ID = 17
    private const val INTERRUPT_ID = 18
    private const val CAR_POLL_MS = 2_000L
    const val INTERRUPT_NOTIFICATION_ID = INTERRUPT_ID

    @Volatile var enabled: Boolean = false
    @Volatile var domainCount: Int = 0
    @Volatile var blockedToday: Int = 0
    @Volatile var blockedTotal: Int = 0
    private val startEpoch = AtomicLong(0)

    fun cancelPendingStarts() {
      startEpoch.incrementAndGet()
    }

    fun start(context: Context, strict: Boolean) {
      val app = context.applicationContext
      val epoch = startEpoch.incrementAndGet()
      app.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        .putBoolean(KEY_WANTED, true)
        .putBoolean(KEY_STRICT, strict)
        .putBoolean(CarModeGate.KEY_PAUSED_CAR, false)
        .apply()
      StayPureCarPauseService.stop(app)
      val intent = Intent(app, StayPureVpnService::class.java).putExtra(EXTRA_STRICT, strict)
      Handler(Looper.getMainLooper()).postDelayed({
        if (epoch != startEpoch.get()) return@postDelayed
        val wanted = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
          .getBoolean(KEY_WANTED, false)
        if (!wanted) return@postDelayed
        try {
          if (Build.VERSION.SDK_INT >= 26) {
            app.startForegroundService(intent)
          } else {
            app.startService(intent)
          }
        } catch (error: Exception) {
          Log.w(TAG, "falha ao religar o escudo", error)
        }
      }, 200)
    }

    fun requestStop(context: Context) {
      val app = context.applicationContext
      cancelPendingStarts()
      val stop = Intent(app, StayPureVpnService::class.java).setAction(ACTION_STOP)
      try {
        if (Build.VERSION.SDK_INT >= 26 && enabled) {
          app.startForegroundService(stop)
        } else {
          app.startService(stop)
        }
      } catch (_: Exception) {
      }
      app.stopService(Intent(app, StayPureVpnService::class.java))
    }

    fun stop(context: Context) {
      ShieldCoordinator.userStop(context)
    }

    fun snapshot(context: Context): Map<String, Any> {
      val prefs = context.getSharedPreferences(PREFS, MODE_PRIVATE)
      val day = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
      val today = if (prefs.getString(KEY_DAY, "") == day) prefs.getInt(KEY_TODAY, 0) else 0
      return mapOf(
        "enabled" to enabled,
        "pausedForCar" to prefs.getBoolean(CarModeGate.KEY_PAUSED_CAR, false),
        "strictMode" to prefs.getBoolean(KEY_STRICT, false),
        "domainCount" to domainCount,
        "blockedToday" to today,
        "blockedTotal" to prefs.getInt(KEY_TOTAL, blockedTotal),
        "blockedByDay" to dayCountsJson(prefs, day, today),
      )
    }

    private fun dayCountKey(day: String): String = "dayCount:$day"

    private fun dayCountsJson(
      prefs: android.content.SharedPreferences,
      today: String,
      todayCount: Int,
    ): String {
      val json = org.json.JSONObject()
      for ((key, value) in prefs.all) {
        if (key.startsWith("dayCount:") && value is Int) {
          json.put(key.removePrefix("dayCount:"), value)
        }
      }
      if (!json.has(today)) {
        json.put(today, todayCount)
      }
      return json.toString()
    }
  }
}
