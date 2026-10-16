import Foundation

struct PurityVerse: Codable, Identifiable, Hashable {
  let id: String
  let reference: String
  let text: String
  let invitation: String
}

enum VerseCatalog {
  static func load(from bundle: Bundle = .main) -> [PurityVerse] {
    guard
      let url = bundle.url(forResource: "purity-verses", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let verses = try? JSONDecoder().decode([PurityVerse].self, from: data)
    else {
      return []
    }
    return verses
  }

  static func pick(host: String, verses: [PurityVerse]) -> PurityVerse {
    guard !verses.isEmpty else {
      return PurityVerse(
        id: "fallback",
        reference: "Salmo 51:10",
        text: "Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto.",
        invitation: "Você não precisa fingir força. Peça um coração novo."
      )
    }
    let index = abs(host.hashValue) % verses.count
    return verses[index]
  }
}
