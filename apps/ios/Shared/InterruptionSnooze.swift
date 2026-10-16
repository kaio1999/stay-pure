import Foundation

enum InterruptionSnooze {
  private static let duration: TimeInterval = 45 * 60

  static func snooze(host: String) {
    let normalized = DomainMatcher.normalize(host)
    guard !normalized.isEmpty else { return }
    let until = Date().timeIntervalSince1970 + duration
    let defaults = AppGroup.defaults
    defaults.set(until, forKey: key(normalized))
    if let apex = apex(normalized) {
      defaults.set(until, forKey: key(apex))
    }
  }

  static func isSnoozed(host: String) -> Bool {
    let normalized = DomainMatcher.normalize(host)
    guard !normalized.isEmpty else { return false }
    let now = Date().timeIntervalSince1970
    let defaults = AppGroup.defaults
    if isActive(defaults.double(forKey: key(normalized)), now: now) { return true }
    guard let apex = apex(normalized) else { return false }
    return isActive(defaults.double(forKey: key(apex)), now: now)
  }

  private static func isActive(_ until: Double, now: Double) -> Bool {
    until > now
  }

  private static func key(_ host: String) -> String {
    "\(ShieldKeys.snoozePrefix)\(host)"
  }

  private static func apex(_ host: String) -> String? {
    let parts = host.split(separator: ".")
    guard parts.count > 2 else { return nil }
    return parts.suffix(2).joined(separator: ".")
  }
}
