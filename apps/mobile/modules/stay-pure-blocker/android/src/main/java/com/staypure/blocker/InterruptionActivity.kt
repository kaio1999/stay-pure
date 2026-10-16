package com.staypure.blocker

import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import android.os.Bundle
class InterruptionActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_interrupted)
    bind(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    bind(intent)
  }

  private fun bind(intent: Intent) {
    val host = intent.getStringExtra(EXTRA_HOST).orEmpty()
    val verse = VersePicker.pick(this, host)
    InterruptionBinder.bind(findViewById(R.id.interruptedRoot), host, verse) {
      LeaveBrowser.continueInHoliness(this, host)
      finish()
    }
  }

  companion object {
    const val EXTRA_HOST = "host"
    const val EXTRA_VERSE = "verseId"
  }
}
