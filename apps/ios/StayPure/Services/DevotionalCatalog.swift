import Foundation

final class DevotionalCatalog {
  private let purity: [ClassicEntry]
  private let spurgeon: [ClassicEntry]

  init(bundle: Bundle = .main) {
    purity = Self.loadJSON(named: "purity-classics", bundle: bundle)
    spurgeon = Self.loadJSON(named: "spurgeon-mornings", bundle: bundle)
  }

  func devotional(for dateKey: String) -> Devotional {
    let date = DateKeys.parse(dateKey)
    let day = DateKeys.dayOfYear(from: date)
    let entry = pickClassic(dayOfYear: day)
    return Devotional(
      id: "classic:v1:\(dateKey)",
      dateKey: dateKey,
      title: entry.title,
      author: entry.author,
      work: entry.work,
      scriptureRef: entry.scriptureRef,
      scriptureText: entry.scriptureText,
      reflection: entry.reflection,
      prayer: entry.prayer
    )
  }

  private func pickClassic(dayOfYear: Int) -> ClassicEntry {
    let slot = (dayOfYear - 1) / 2
    if dayOfYear % 2 == 1 {
      return purity[slot % purity.count]
    }
    return spurgeon[slot % spurgeon.count]
  }

  private static func loadJSON(named name: String, bundle: Bundle) -> [ClassicEntry] {
    guard
      let url = bundle.url(forResource: name, withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let entries = try? JSONDecoder().decode([ClassicEntry].self, from: data)
    else {
      return []
    }
    return entries
  }
}

private struct ClassicEntry: Decodable {
  let title: String
  let author: String
  let work: String
  let scriptureRef: String
  let scriptureText: String
  let reflection: String
  let prayer: String
}
