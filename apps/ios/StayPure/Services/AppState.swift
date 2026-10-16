import Combine
import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
  @Published var onboardingDone: Bool
  @Published var interruption: InterruptionPayload?
  @Published var guardNotice = false

  let catalog = DevotionalCatalog()
  let shield = ShieldController()
  lazy var journey = JourneyStore(shield: shield)
  let verses = VerseCatalog.load()

  private var cancellables = Set<AnyCancellable>()

  init() {
    onboardingDone = UserDefaults.standard.bool(forKey: AppKeys.onboardingDone)
    shield.objectWillChange
      .sink { [weak self] _ in self?.objectWillChange.send() }
      .store(in: &cancellables)
    journey.objectWillChange
      .sink { [weak self] _ in self?.objectWillChange.send() }
      .store(in: &cancellables)
  }

  func completeOnboarding() async {
    UserDefaults.standard.set(true, forKey: AppKeys.onboardingDone)
    onboardingDone = true
    let reminder = ReminderScheduler.loadSettings()
    _ = await ReminderScheduler.sync(reminder)
  }

  func devotional(for dateKey: String) -> Devotional {
    catalog.devotional(for: dateKey)
  }

  func verse(for payload: InterruptionPayload) -> PurityVerse {
    verses.first { $0.id == payload.verseId }
      ?? VerseCatalog.pick(host: payload.host, verses: verses)
  }

  func consumeGuardNotice() {
    if GuardNotice.consume() {
      guardNotice = true
    }
  }

  func refreshAll() async {
    await shield.refresh()
    await journey.refresh()
    consumeGuardNotice()
  }
}
