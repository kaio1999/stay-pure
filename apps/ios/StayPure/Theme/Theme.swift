import SwiftUI

enum Theme {
  static let ink = Color(hex: 0x070B16)
  static let navy = Color(hex: 0x10182B)
  static let navyLift = Color(hex: 0x18233A)
  static let gold = Color(hex: 0xD4AF77)
  static let goldSoft = Color(hex: 0xE8D5B0)
  static let parchment = Color(hex: 0xF4EDE1)
  static let parchmentMuted = Color(hex: 0xF4EDE1).opacity(0.86)
  static let line = Color(hex: 0xD4AF77).opacity(0.22)

  static let gutter: CGFloat = 28
  static let radiusSm: CGFloat = 12
  static let radiusMd: CGFloat = 18
  static let radiusLg: CGFloat = 28
}

extension Color {
  init(hex: UInt32) {
    self.init(
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255
    )
  }
}

struct KickerText: View {
  let text: String

  var body: some View {
    Text(text.uppercased())
      .font(.caption.weight(.medium))
      .tracking(2.4)
      .foregroundStyle(Theme.gold)
  }
}

struct ScreenBackground: ViewModifier {
  func body(content: Content) -> some View {
    content
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .background(Theme.ink.ignoresSafeArea())
      .foregroundStyle(Theme.parchment)
  }
}

extension View {
  func screenBackground() -> some View {
    modifier(ScreenBackground())
  }

  func screenPadding() -> some View {
    padding(.horizontal, Theme.gutter)
  }
}
