import Foundation
import UserNotifications

enum InterruptNotifier {
  static func post(host: String, verse: PurityVerse) {
    let content = UNMutableNotificationContent()
    content.title = "Você foi guardado"
    content.subtitle = verse.reference
    content.body = verse.invitation
    content.sound = .default
    content.userInfo = ["host": host, "verseId": verse.id]
    content.interruptionLevel = .timeSensitive

    let request = UNNotificationRequest(
      identifier: "stay-pure-interrupt-\(UUID().uuidString)",
      content: content,
      trigger: nil
    )
    UNUserNotificationCenter.current().add(request)
  }
}
