import Foundation

enum DnsCodec {
  static func questionName(_ message: Data) -> String? {
    guard message.count >= 13 else { return nil }
    var offset = 12
    var labels: [String] = []
    while offset < message.count {
      let size = Int(message[offset])
      if size == 0 { break }
      if size & 0xC0 != 0 { return nil }
      offset += 1
      guard offset + size <= message.count else { return nil }
      let label = String(data: message.subdata(in: offset ..< offset + size), encoding: .ascii) ?? ""
      labels.append(label)
      offset += size
    }
    guard !labels.isEmpty else { return nil }
    return labels.joined(separator: ".").lowercased()
  }

  static func nxdomain(_ query: Data) -> Data {
    var response = query
    guard response.count >= 12 else { return response }
    let flags = (UInt16(response[2]) << 8) | UInt16(response[3])
    let next = (flags | 0x8000) & 0xFFF0 | 0x0003
    response[2] = UInt8(next >> 8)
    response[3] = UInt8(next & 0xFF)
    response[6] = 0
    response[7] = 0
    response[8] = 0
    response[9] = 0
    response[10] = 0
    response[11] = 0
    return response
  }
}
