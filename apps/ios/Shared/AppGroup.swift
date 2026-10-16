import Foundation

enum AppGroup {
  static let identifier = "group.com.staypure.app"

  static var defaults: UserDefaults {
    UserDefaults(suiteName: identifier) ?? .standard
  }
}

enum ShieldKeys {
  static let wanted = "shield.wanted"
  static let strict = "shield.strict"
  static let day = "day"
  static let today = "today"
  static let total = "total"
  static let domainCount = "domainCount"
  static let guardPending = "guard.pending"
  static let snoozePrefix = "until:"
  static let dayCountPrefix = "dayCount:"
}

enum AppKeys {
  static let onboardingDone = "onboarding.done"
  static let reminderEnabled = "reminder.enabled"
  static let reminderHour = "reminder.hour"
  static let journeyPrefix = "journey:"
}
