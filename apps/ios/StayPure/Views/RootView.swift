import SwiftUI

struct RootView: View {
  @EnvironmentObject private var app: AppState

  var body: some View {
    Group {
      if app.onboardingDone {
        MainTabView()
      } else {
        OnboardingView()
      }
    }
    .fullScreenCover(item: $app.interruption) { payload in
      InterruptedView(payload: payload)
    }
    .task {
      await app.refreshAll()
    }
  }
}

extension InterruptionPayload: Identifiable {
  var id: String { "\(host)-\(verseId)" }
}
