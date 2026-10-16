package com.staypure.blocker

object Ipv4 {
  fun isUdpDns(packet: ByteArray, length: Int): Boolean {
    if (length < 28) return false
    if (packet[0].toInt() ushr 4 and 0xF != 4) return false
    if (packet[9].toInt() and 0xFF != 17) return false
    val ihl = headerLength(packet)
    if (length < ihl + 8) return false
    val destPort = port(packet, ihl + 2)
    return destPort == 53
  }

  fun headerLength(packet: ByteArray): Int = (packet[0].toInt() and 0x0F) * 4

  fun dnsPayload(packet: ByteArray, length: Int): ByteArray {
    val start = headerLength(packet) + 8
    return packet.copyOfRange(start, length)
  }

  fun wrapResponse(request: ByteArray, dns: ByteArray): ByteArray {
    val ihl = headerLength(request)
    val packet = ByteArray(ihl + 8 + dns.size)
    System.arraycopy(request, 0, packet, 0, ihl + 8)
    System.arraycopy(dns, 0, packet, ihl + 8, dns.size)
    swapIp(packet, 12, 16)
    swapPort(packet, ihl, ihl + 2)
    val total = packet.size
    packet[2] = (total shr 8).toByte()
    packet[3] = (total and 0xFF).toByte()
    val udpLen = 8 + dns.size
    packet[ihl + 4] = (udpLen shr 8).toByte()
    packet[ihl + 5] = (udpLen and 0xFF).toByte()
    packet[ihl + 6] = 0
    packet[ihl + 7] = 0
    packet[10] = 0
    packet[11] = 0
    val sum = checksum(packet, 0, ihl)
    packet[10] = (sum shr 8).toByte()
    packet[11] = (sum and 0xFF).toByte()
    return packet
  }

  private fun port(packet: ByteArray, offset: Int): Int {
    return ((packet[offset].toInt() and 0xFF) shl 8) or (packet[offset + 1].toInt() and 0xFF)
  }

  private fun swapIp(packet: ByteArray, a: Int, b: Int) {
    for (i in 0 until 4) {
      val tmp = packet[a + i]
      packet[a + i] = packet[b + i]
      packet[b + i] = tmp
    }
  }

  private fun swapPort(packet: ByteArray, a: Int, b: Int) {
    val t0 = packet[a]
    val t1 = packet[a + 1]
    packet[a] = packet[b]
    packet[a + 1] = packet[b + 1]
    packet[b] = t0
    packet[b + 1] = t1
  }

  private fun checksum(buf: ByteArray, offset: Int, length: Int): Int {
    var sum = 0
    var i = 0
    while (i < length - 1) {
      sum += ((buf[offset + i].toInt() and 0xFF) shl 8) or (buf[offset + i + 1].toInt() and 0xFF)
      i += 2
    }
    if (length % 2 == 1) {
      sum += (buf[offset + length - 1].toInt() and 0xFF) shl 8
    }
    while (sum ushr 16 != 0) {
      sum = (sum and 0xFFFF) + (sum ushr 16)
    }
    return sum.inv() and 0xFFFF
  }
}
