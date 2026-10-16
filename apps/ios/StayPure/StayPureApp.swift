import SwiftUI
import UserNotifications

@main
struct StayPureApp: App {
  @StateObject private var appState = AppState()
  @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

  var body: some Scene {
    WindowGroup {
      RootView()
        .environmentObject(appState)
        .preferredColorScheme(.dark)
        .onAppear {
          appDelegate.appState = appState
        }
    }
  }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  weak var appState: AppState?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    return true
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let info = response.notification.request.content.userInfo
    if
      let host = info["host"] as? String,
      let verseId = info["verseId"] as? String
    {
      Task { @MainActor in
        appState?.interruption = InterruptionPayload(host: host, verseId: verseId)
      }
    }
    completionHandler()
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let info = notification.request.content.userInfo
    if
      let host = info["host"] as? String,
      let verseId = info["verseId"] as? String
    {
      Task { @MainActor in
        appState?.interruption = InterruptionPayload(host: host, verseId: verseId)
      }
    }
    completionHandler([.banner, .sound])
  }
}
