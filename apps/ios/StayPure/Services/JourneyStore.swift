import Foundation

@MainActor
final class JourneyStore: ObservableObject {
  @Published private(set) var streak: Int = 0
  @Published private(set) var days: [JourneyDay] = []

  private let shield: ShieldController

  init(shield: ShieldController) {
    self.shield = shield
  }

  func refresh() async {
    let status = await shield.status()
    let keys = DateKeys.daysBack(21)
    days = keys.map { key in
      JourneyDay(
        dateKey: key,
        read: isRead(key),
        blockedCount: status.blockedByDay[key] ?? 0
      )
    }
    streak = computeStreak()
  }

  func getDay(_ dateKey: String) async -> JourneyDay {
    let status = await shield.status()
    return JourneyDay(
      dateKey: dateKey,
      read: isRead(dateKey),
      blockedCount: status.blockedByDay[dateKey] ?? 0
    )
  }

  func markRead(_ dateKey: String) {
    UserDefaults.standard.set(true, forKey: AppKeys.journeyPrefix + dateKey)
  }

  func isRead(_ dateKey: String) -> Bool {
    UserDefaults.standard.bool(forKey: AppKeys.journeyPrefix + dateKey)
  }

  private func computeStreak() -> Int {
    var count = 0
    let calendar = Calendar.current
    let today = Date()
    for offset in 0 ..< 365 {
      guard let date = calendar.date(byAdding: .day, value: -offset, to: today) else { break }
      let key = DateKeys.todayKey(from: date)
      if !isRead(key) { break }
      count += 1
    }
    return count
  }
}
