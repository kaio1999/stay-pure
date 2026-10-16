import Foundation

struct ShieldStatus: Equatable {
  var enabled: Bool
  var strictMode: Bool
  var domainCount: Int
  var blockedToday: Int
  var blockedTotal: Int
  var blockedByDay: [String: Int]

  static let empty = ShieldStatus(
    enabled: false,
    strictMode: false,
    domainCount: 0,
    blockedToday: 0,
    blockedTotal: 0,
    blockedByDay: [:]
  )
}

enum ShieldStore {
  static func todayKey() -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
  }

  static func loadStatus(domainCount: Int = 0, enabled: Bool = false) -> ShieldStatus {
    let defaults = AppGroup.defaults
    let today = todayKey()
    let storedDay = defaults.string(forKey: ShieldKeys.day) ?? ""
    let blockedToday = storedDay == today ? defaults.integer(forKey: ShieldKeys.today) : 0
    return ShieldStatus(
      enabled: enabled,
      strictMode: defaults.bool(forKey: ShieldKeys.strict),
      domainCount: domainCount > 0 ? domainCount : defaults.integer(forKey: ShieldKeys.domainCount),
      blockedToday: blockedToday,
      blockedTotal: defaults.integer(forKey: ShieldKeys.total),
      blockedByDay: loadBlockedByDay(today: today, todayCount: blockedToday)
    )
  }

  static func setWanted(_ wanted: Bool) {
    AppGroup.defaults.set(wanted, forKey: ShieldKeys.wanted)
  }

  static func setStrict(_ strict: Bool) {
    AppGroup.defaults.set(strict, forKey: ShieldKeys.strict)
  }

  static func setDomainCount(_ count: Int) {
    AppGroup.defaults.set(count, forKey: ShieldKeys.domainCount)
  }

  static func recordBlock() {
    let defaults = AppGroup.defaults
    let today = todayKey()
    let storedDay = defaults.string(forKey: ShieldKeys.day) ?? ""
    let blockedToday = storedDay == today ? defaults.integer(forKey: ShieldKeys.today) + 1 : 1
    let blockedTotal = defaults.integer(forKey: ShieldKeys.total) + 1
    defaults.set(today, forKey: ShieldKeys.day)
    defaults.set(blockedToday, forKey: ShieldKeys.today)
    defaults.set(blockedTotal, forKey: ShieldKeys.total)
    defaults.set(blockedToday, forKey: dayCountKey(today))
  }

  static func dayCountKey(_ day: String) -> String {
    "\(ShieldKeys.dayCountPrefix)\(day)"
  }

  private static func loadBlockedByDay(today: String, todayCount: Int) -> [String: Int] {
    var result: [String: Int] = [:]
    for (key, value) in AppGroup.defaults.dictionaryRepresentation() {
      guard key.hasPrefix(ShieldKeys.dayCountPrefix), let count = value as? Int else { continue }
      result[String(key.dropFirst(ShieldKeys.dayCountPrefix.count))] = count
    }
    if result[today] == nil, todayCount > 0 {
      result[today] = todayCount
    }
    return result
  }
}
