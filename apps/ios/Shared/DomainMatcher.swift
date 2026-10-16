import Foundation

final class DomainMatcher {
  private(set) var exact = Set<String>()
  private var tlds = Set<String>()

  var count: Int { exact.count }

  func add(_ raw: String) {
    let domain = Self.normalize(raw)
    guard !domain.isEmpty, domain.contains(".") else { return }
    exact.insert(domain)
  }

  func addTld(_ raw: String) {
    let tld = Self.normalize(raw)
    if !tld.isEmpty { tlds.insert(tld) }
  }

  func shouldBlock(_ host: String) -> Bool {
    var current = Self.normalize(host)
    if current.isEmpty { return false }
    if let lastDot = current.lastIndex(of: ".") {
      let tld = String(current[current.index(after: lastDot)...])
      if tlds.contains(tld) { return true }
    }
    while true {
      if exact.contains(current) { return true }
      guard let dot = current.firstIndex(of: ".") else { return false }
      current = String(current[current.index(after: dot)...])
    }
  }

  func load(from url: URL) throws {
    exact.removeAll(keepingCapacity: true)
    tlds.removeAll(keepingCapacity: true)
    let text = try String(contentsOf: url, encoding: .utf8)
    for line in text.split(whereSeparator: \.isNewline) {
      let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
      if trimmed.isEmpty || trimmed.hasPrefix("#") { continue }
      if trimmed.hasPrefix("tld:") {
        addTld(String(trimmed.dropFirst(4)))
      } else {
        add(trimmed)
      }
    }
  }

  static func normalize(_ host: String) -> String {
    var value = host.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if value.hasPrefix("http://") { value.removeFirst(7) }
    if value.hasPrefix("https://") { value.removeFirst(8) }
    if let slash = value.firstIndex(of: "/") { value = String(value[..<slash]) }
    if let colon = value.firstIndex(of: ":") { value = String(value[..<colon]) }
    if value.hasPrefix("*.") { value.removeFirst(2) }
    if value.hasPrefix(".") { value.removeFirst() }
    if value.hasPrefix("www.") { value.removeFirst(4) }
    while value.hasSuffix(".") { value.removeLast() }
    return value
  }
}
