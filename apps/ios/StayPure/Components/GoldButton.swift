import SwiftUI

struct GoldButton: View {
  enum Variant {
    case gold
    case ghost
  }

  let label: String
  var variant: Variant = .gold
  var disabled = false
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Text(label)
        .font(.body.weight(.semibold))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(background)
        .foregroundStyle(foreground)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
        .overlay {
          if variant == .ghost {
            RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
              .stroke(Theme.line, lineWidth: 1)
          }
        }
    }
    .disabled(disabled)
    .opacity(disabled ? 0.6 : 1)
  }

  private var background: Color {
    variant == .gold ? Theme.gold : Color.clear
  }

  private var foreground: Color {
    variant == .gold ? Theme.ink : Theme.parchment
  }
}
