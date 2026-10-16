import Foundation

struct Devotional: Identifiable, Hashable {
  let id: String
  let dateKey: String
  let title: String
  let author: String?
  let work: String?
  let scriptureRef: String
  let scriptureText: String
  let reflection: String
  let prayer: String
}

struct JourneyDay: Identifiable, Hashable {
  var id: String { dateKey }
  let dateKey: String
  let read: Bool
  let blockedCount: Int
}

struct ReminderSettings: Equatable {
  var enabled: Bool
  var hour: Int
}

struct InterruptionPayload: Equatable, Hashable {
  let host: String
  let verseId: String
}
