package com.staypure.blocker

import android.view.View
import android.widget.Button
import android.widget.TextView

object InterruptionBinder {
  fun bind(root: View, host: String, verse: Verse, onContinue: () -> Unit) {
    root.findViewById<TextView>(R.id.verse).text = verse.text
    root.findViewById<TextView>(R.id.reference).text = verse.reference
    root.findViewById<TextView>(R.id.invite).text = verse.invitation

    val prayer = root.findViewById<TextView>(R.id.prayer)
    val snooze = root.findViewById<TextView>(R.id.snooze)
    val button = root.findViewById<Button>(R.id.continueButton)
    prayer.visibility = View.GONE
    snooze.visibility = View.GONE
    button.setText(R.string.interrupted_pray)

    var prayed = false
    button.setOnClickListener {
      if (!prayed) {
        prayed = true
        prayer.visibility = View.VISIBLE
        snooze.visibility = View.VISIBLE
        button.setText(R.string.interrupted_cta)
        return@setOnClickListener
      }
      onContinue()
    }
  }
}
