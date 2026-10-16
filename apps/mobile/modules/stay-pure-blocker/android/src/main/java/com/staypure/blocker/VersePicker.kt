package com.staypure.blocker

import android.content.Context
import kotlin.math.abs

data class Verse(val id: String, val reference: String, val text: String, val invitation: String)

object VersePicker {
  fun pick(context: Context, host: String): Verse {
    val ids = context.resources.getStringArray(R.array.verse_ids)
    val refs = context.resources.getStringArray(R.array.verse_refs)
    val texts = context.resources.getStringArray(R.array.verse_texts)
    val invites = context.resources.getStringArray(R.array.verse_invites)
    val index = abs(host.hashCode()) % ids.size
    return Verse(ids[index], refs[index], texts[index], invites[index])
  }
}
