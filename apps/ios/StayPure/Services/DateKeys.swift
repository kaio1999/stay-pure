import Foundation

enum DateKeys {
  static func todayKey(from date: Date = Date()) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date)
  }

  static func parse(_ dateKey: String) -> Date {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.date(from: dateKey) ?? Date()
  }

  static func dayOfYear(from date: Date = Date()) -> Int {
    let calendar = Calendar.current
    return calendar.ordinality(of: .day, in: .year, for: date) ?? 1
  }

  static func format(_ dateKey: String) -> String {
    let date = parse(dateKey)
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "pt_BR")
    formatter.dateFormat = "EEEE, d 'de' MMMM"
    return formatter.string(from: date)
  }

  static func daysBack(_ count: Int, from date: Date = Date()) -> [String] {
    let calendar = Calendar.current
    return (0 ..< count).compactMap { offset in
      guard let day = calendar.date(byAdding: .day, value: -offset, to: date) else { return nil }
      return todayKey(from: day)
    }
  }
}
