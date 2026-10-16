package com.staypure.blocker

import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import android.net.VpnService
import android.os.Bundle

class VpnConsentActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val prepare = VpnService.prepare(this)
    if (prepare != null) {
      startActivityForResult(prepare, REQUEST)
    } else {
      startShield()
      finish()
    }
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == REQUEST && resultCode == RESULT_OK) {
      startShield()
    }
    finish()
  }

  private fun startShield() {
    val strict = intent.getBooleanExtra(StayPureVpnService.EXTRA_STRICT, false)
    StayPureVpnService.start(this, strict)
  }

  companion object {
    private const val REQUEST = 71
  }
}
