import Darwin
import Foundation
import NetworkExtension
import UserNotifications

@objc(PacketTunnelProvider)
final class PacketTunnelProvider: NEPacketTunnelProvider {
  private var matcher = DomainMatcher()
  private var verses: [PurityVerse] = []
  private var running = false
  private var lastInterruptAt: TimeInterval = 0
  private let upstreamQueue = DispatchQueue(label: "stay-pure-upstream")

  override func startTunnel(options: [String: NSObject]?, completionHandler: @escaping (Error?) -> Void) {
    let strictFromOptions = (options?["strict"] as? NSNumber)?.boolValue
    let strictFromConfig = (protocolConfiguration as? NETunnelProviderProtocol)?
      .providerConfiguration?["strict"] as? Bool
    let strict = strictFromOptions ?? strictFromConfig ?? AppGroup.defaults.bool(forKey: ShieldKeys.strict)

    ShieldStore.setWanted(true)
    ShieldStore.setStrict(strict)

    do {
      let asset = strict ? "blocklist-strict" : "blocklist"
      guard let url = Bundle.main.url(forResource: asset, withExtension: "txt") else {
        throw NSError(domain: "StayPure", code: 1, userInfo: [NSLocalizedDescriptionKey: "Blocklist ausente"])
      }
      try matcher.load(from: url)
      ShieldStore.setDomainCount(matcher.count)
      verses = VerseCatalog.load(from: Bundle.main)
    } catch {
      completionHandler(error)
      return
    }

    let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "10.8.0.1")
    let ipv4 = NEIPv4Settings(addresses: ["10.8.0.2"], subnetMasks: ["255.255.255.255"])
    ipv4.includedRoutes = [NEIPv4Route(destinationAddress: "10.8.0.1", subnetMask: "255.255.255.255")]
    settings.ipv4Settings = ipv4
    settings.dnsSettings = NEDNSSettings(servers: ["10.8.0.1"])
    settings.mtu = 1500

    setTunnelNetworkSettings(settings) { [weak self] error in
      if let error {
        completionHandler(error)
        return
      }
      self?.running = true
      self?.readLoop()
      completionHandler(nil)
    }
  }

  override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
    running = false
    ShieldStore.setWanted(false)
    completionHandler()
  }

  private func readLoop() {
    guard running else { return }
    packetFlow.readPackets { [weak self] packets, protocols in
      guard let self, self.running else { return }
      for (packet, proto) in zip(packets, protocols) {
        self.handle(packet: packet, protocolNumber: proto.intValue)
      }
      self.readLoop()
    }
  }

  private func handle(packet: Data, protocolNumber: Int) {
    guard Ipv4Packet.isUdpDns(packet) else { return }
    let query = Ipv4Packet.dnsPayload(packet)
    guard let host = DnsCodec.questionName(query) else { return }

    if matcher.shouldBlock(host) {
      let response = Ipv4Packet.wrapResponse(request: packet, dns: DnsCodec.nxdomain(query))
      packetFlow.writePackets([response], withProtocols: [NSNumber(value: protocolNumber)])
      onBlocked(host: host)
    } else {
      let snapshot = packet
      upstreamQueue.async { [weak self] in
        guard let self else { return }
        guard let dns = self.forward(query: query) else { return }
        let wrapped = Ipv4Packet.wrapResponse(request: snapshot, dns: dns)
        self.packetFlow.writePackets([wrapped], withProtocols: [NSNumber(value: protocolNumber)])
      }
    }
  }

  private func onBlocked(host: String) {
    if InterruptionSnooze.isSnoozed(host: host) { return }
    if !BlockAttemptGate.shouldCount(host: host) { return }

    ShieldStore.recordBlock()
    GuardNotice.mark()

    let verse = VerseCatalog.pick(host: host, verses: verses)
    let now = Date().timeIntervalSince1970
    if now - lastInterruptAt >= 6 {
      lastInterruptAt = now
      InterruptNotifier.post(host: host, verse: verse)
    }
  }

  private func forward(query: Data) -> Data? {
    var addr = sockaddr_in()
    addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = in_port_t(53).bigEndian
    inet_pton(AF_INET, "1.1.1.1", &addr.sin_addr)

    let fd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)
    guard fd >= 0 else { return nil }
    defer { close(fd) }

    var timeout = timeval(tv_sec: 2, tv_usec: 500_000)
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))

    let sent = query.withUnsafeBytes { buffer -> ssize_t in
      guard let base = buffer.baseAddress else { return -1 }
      return withUnsafePointer(to: &addr) { ptr in
        ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sa in
          sendto(fd, base, buffer.count, 0, sa, socklen_t(MemoryLayout<sockaddr_in>.size))
        }
      }
    }
    guard sent == query.count else { return nil }

    var buffer = [UInt8](repeating: 0, count: 2048)
    let received = buffer.withUnsafeMutableBytes { raw -> ssize_t in
      recvfrom(fd, raw.baseAddress, raw.count, 0, nil, nil)
    }
    guard received > 0 else { return nil }
    return Data(buffer.prefix(received))
  }
}
