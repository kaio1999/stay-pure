package com.staypure.blocker

object DnsCodec {
  fun questionName(message: ByteArray): String? {
    if (message.size < 13) return null
    var offset = 12
    val labels = ArrayList<String>(6)
    while (offset < message.size) {
      val size = message[offset].toInt() and 0xFF
      if (size == 0) break
      if (size and 0xC0 != 0) return null
      offset += 1
      if (offset + size > message.size) return null
      labels.add(String(message, offset, size, Charsets.US_ASCII))
      offset += size
    }
    if (labels.isEmpty()) return null
    return labels.joinToString(".").lowercase()
  }

  fun nxdomain(query: ByteArray): ByteArray {
    val response = query.copyOf()
    if (response.size < 12) return response
    val flags = ((response[2].toInt() and 0xFF) shl 8) or (response[3].toInt() and 0xFF)
    val next = (flags or 0x8000) and 0xFFF0 or 0x3
    response[2] = (next shr 8).toByte()
    response[3] = (next and 0xFF).toByte()
    response[6] = 0
    response[7] = 0
    response[8] = 0
    response[9] = 0
    response[10] = 0
    response[11] = 0
    return response
  }
}
