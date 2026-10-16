import Foundation
import NetworkExtension

enum ShieldError: LocalizedError {
  case simulatorUnsupported
  case underlying(Error)

  var errorDescription: String? {
    switch self {
    case .simulatorUnsupported:
      return "O escudo DNS não liga no Simulador. A Apple só permite Network Extension em iPhone físico — conecte o aparelho no Xcode e rode de novo."
    case .underlying(let error):
      return error.localizedDescription
    }
  }
}

@MainActor
final class ShieldController: ObservableObject {
  static let tunnelBundleId = "com.staypure.app.tunnel"

  static var isSimulator: Bool {
    #if targetEnvironment(simulator)
    true
    #else
    false
    #endif
  }

  @Published private(set) var status: ShieldStatus = .empty
  @Published private(set) var busy = false

  func refresh() async {
    if Self.isSimulator {
      ShieldStore.setWanted(false)
    }
    let manager = await loadManager()
    let connected = !Self.isSimulator && manager?.connection.status == .connected
    var next = ShieldStore.loadStatus(enabled: connected)
    if next.domainCount == 0 {
      next.domainCount = bundledDomainCount(strict: next.strictMode)
      if next.domainCount > 0 {
        ShieldStore.setDomainCount(next.domainCount)
      }
    }
    status = next
  }

  func toggle(enabled: Bool, strictMode: Bool) async throws {
    if Self.isSimulator, enabled {
      throw ShieldError.simulatorUnsupported
    }

    busy = true
    defer { busy = false }

    ShieldStore.setWanted(enabled)
    ShieldStore.setStrict(strictMode)

    if enabled {
      do {
        try await installAndStart(strictMode: strictMode)
      } catch {
        throw ShieldError.underlying(error)
      }
    } else {
      await stop()
    }

    try await Task.sleep(nanoseconds: 800_000_000)
    await refresh()
  }

  func setStrict(_ strictMode: Bool) async throws {
    if Self.isSimulator {
      ShieldStore.setStrict(strictMode)
      await refresh()
      return
    }
    let wanted = status.enabled || AppGroup.defaults.bool(forKey: ShieldKeys.wanted)
    try await toggle(enabled: wanted, strictMode: strictMode)
  }

  func status() async -> ShieldStatus {
    await refresh()
    return status
  }

  func snooze(host: String) {
    InterruptionSnooze.snooze(host: host)
  }

  private func loadManager() async -> NETunnelProviderManager? {
    await withCheckedContinuation { continuation in
      NETunnelProviderManager.loadAllFromPreferences { managers, _ in
        continuation.resume(returning: managers?.first)
      }
    }
  }

  private func installAndStart(strictMode: Bool) async throws {
    let manager = await loadManager() ?? NETunnelProviderManager()
    let protocolConfig = NETunnelProviderProtocol()
    protocolConfig.providerBundleIdentifier = Self.tunnelBundleId
    protocolConfig.serverAddress = "10.8.0.1"
    protocolConfig.providerConfiguration = ["strict": strictMode]

    manager.protocolConfiguration = protocolConfig
    manager.localizedDescription = "Stay Pure"
    manager.isEnabled = true

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      manager.saveToPreferences { error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        manager.loadFromPreferences { loadError in
          if let loadError {
            continuation.resume(throwing: loadError)
            return
          }
          do {
            try manager.connection.startVPNTunnel()
            continuation.resume()
          } catch {
            continuation.resume(throwing: error)
          }
        }
      }
    }
  }

  private func stop() async {
    let manager = await loadManager()
    manager?.connection.stopVPNTunnel()
    ShieldStore.setWanted(false)
  }

  private func bundledDomainCount(strict: Bool) -> Int {
    let asset = strict ? "blocklist-strict" : "blocklist"
    guard let url = Bundle.main.url(forResource: asset, withExtension: "txt") else { return 0 }
    let matcher = DomainMatcher()
    try? matcher.load(from: url)
    return matcher.count
  }
}
