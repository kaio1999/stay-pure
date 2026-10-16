import Foundation
import UserNotifications

enum ReminderScheduler {
  static let identifier = "stay-pure-morning"

  static func loadSettings() -> ReminderSettings {
    ReminderSettings(
      enabled: UserDefaults.standard.object(forKey: AppKeys.reminderEnabled) as? Bool ?? true,
      hour: UserDefaults.standard.object(forKey: AppKeys.reminderHour) as? Int ?? 8
    )
  }

  static func saveSettings(_ settings: ReminderSettings) {
    UserDefaults.standard.set(settings.enabled, forKey: AppKeys.reminderEnabled)
    UserDefaults.standard.set(settings.hour, forKey: AppKeys.reminderHour)
  }

  static func sync(_ settings: ReminderSettings) async -> Bool {
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: [identifier])
    guard settings.enabled else { return false }

    let granted = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    guard granted == true else { return false }

    var date = DateComponents()
    date.hour = settings.hour
    date.minute = 0

    let content = UNMutableNotificationContent()
    content.title = "Guarde o coração"
    content.body = "O devocional de hoje está à espera."
    content.sound = .default

    let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
    let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
    try? await center.add(request)
    return true
  }
}
