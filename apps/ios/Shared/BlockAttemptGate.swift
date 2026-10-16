import Foundation

enum BlockAttemptGate {
  private static let sameFamilyMs: Int64 = 90_000
  private static let burstMs: Int64 = 15_000
  private static let lock = NSLock()
  private static var lastByApex: [String: Int64] = [:]
  private static var lastAnyAt: Int64 = 0

  static func shouldCount(host: String) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    let now = Int64(Date().timeIntervalSince1970 * 1000)
    let family = family(host)
    if let lastFamily = lastByApex[family], now - lastFamily < sameFamilyMs {
      return false
    }
    if now - lastAnyAt < burstMs {
      return false
    }
    lastByApex[family] = now
    lastAnyAt = now
    return true
  }

  private static func family(_ host: String) -> String {
    let normalized = DomainMatcher.normalize(host)
    let parts = normalized.split(separator: ".")
    if parts.count <= 2 { return normalized }
    return parts.suffix(2).joined(separator: ".")
  }
}
