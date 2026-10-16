import Foundation

enum Ipv4Packet {
  static func isUdpDns(_ packet: Data) -> Bool {
    guard packet.count >= 28 else { return false }
    guard (packet[0] >> 4) & 0xF == 4 else { return false }
    guard packet[9] == 17 else { return false }
    let ihl = headerLength(packet)
    guard packet.count >= ihl + 8 else { return false }
    return port(packet, offset: ihl + 2) == 53
  }

  static func headerLength(_ packet: Data) -> Int {
    Int(packet[0] & 0x0F) * 4
  }

  static func dnsPayload(_ packet: Data) -> Data {
    let start = headerLength(packet) + 8
    return packet.subdata(in: start ..< packet.count)
  }

  static func wrapResponse(request: Data, dns: Data) -> Data {
    let ihl = headerLength(request)
    var packet = Data(count: ihl + 8 + dns.count)
    packet.replaceSubrange(0 ..< ihl + 8, with: request.prefix(ihl + 8))
    packet.replaceSubrange(ihl + 8 ..< packet.count, with: dns)
    swapIp(&packet, a: 12, b: 16)
    swapPort(&packet, a: ihl, b: ihl + 2)
    let total = packet.count
    packet[2] = UInt8(total >> 8)
    packet[3] = UInt8(total & 0xFF)
    let udpLen = 8 + dns.count
    packet[ihl + 4] = UInt8(udpLen >> 8)
    packet[ihl + 5] = UInt8(udpLen & 0xFF)
    packet[ihl + 6] = 0
    packet[ihl + 7] = 0
    packet[10] = 0
    packet[11] = 0
    let sum = checksum(packet, offset: 0, length: ihl)
    packet[10] = UInt8(sum >> 8)
    packet[11] = UInt8(sum & 0xFF)
    return packet
  }

  private static func port(_ packet: Data, offset: Int) -> Int {
    (Int(packet[offset]) << 8) | Int(packet[offset + 1])
  }

  private static func swapIp(_ packet: inout Data, a: Int, b: Int) {
    for i in 0 ..< 4 {
      packet.swapAt(a + i, b + i)
    }
  }

  private static func swapPort(_ packet: inout Data, a: Int, b: Int) {
    packet.swapAt(a, b)
    packet.swapAt(a + 1, b + 1)
  }

  private static func checksum(_ buf: Data, offset: Int, length: Int) -> Int {
    var sum = 0
    var i = 0
    while i < length - 1 {
      sum += (Int(buf[offset + i]) << 8) | Int(buf[offset + i + 1])
      i += 2
    }
    if length % 2 == 1 {
      sum += Int(buf[offset + length - 1]) << 8
    }
    while sum >> 16 != 0 {
      sum = (sum & 0xFFFF) + (sum >> 16)
    }
    return (~sum) & 0xFFFF
  }
}
