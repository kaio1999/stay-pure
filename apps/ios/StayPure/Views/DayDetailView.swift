import SwiftUI

struct DayDetailView: View {
  @EnvironmentObject private var app: AppState
  @Environment(\.dismiss) private var dismiss

  let dateKey: String
  @State private var day: JourneyDay?
  @State private var read = false

  private var devotion: Devotional { app.devotional(for: dateKey) }

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 0) {
          KickerText(text: "Jornada")
          Text(DateKeys.format(dateKey))
            .font(.title.weight(.bold))
            .foregroundStyle(Theme.parchment)
            .textCase(nil)
            .padding(.top, 8)
            .padding(.bottom, 8)

          if let day {
            Text(meta(for: day))
              .font(.subheadline)
              .foregroundStyle(Theme.parchmentMuted)
              .lineSpacing(4)
              .padding(.bottom, 20)
          }

          DevotionHero(devotion: devotion)

          if let day, !day.read, !read {
            GoldButton(label: "Marquei como lido") {
              app.journey.markRead(dateKey)
              read = true
              Task {
                self.day = await app.journey.getDay(dateKey)
                await app.journey.refresh()
              }
            }
            .padding(.top, 16)
          }

          GoldButton(label: "Voltar", variant: .ghost) {
            dismiss()
          }
          .padding(.top, 16)
        }
        .screenPadding()
        .padding(.bottom, 40)
      }
      .screenBackground()
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Button("Fechar") { dismiss() }
            .foregroundStyle(Theme.gold)
        }
      }
    }
    .task {
      day = await app.journey.getDay(dateKey)
      read = app.journey.isRead(dateKey)
    }
  }

  private func meta(for day: JourneyDay) -> String {
    let readPart = day.read ? "Lido na Palavra." : "Ainda não marcado como lido."
    let blockPart: String
    if day.blockedCount > 0 {
      let word = day.blockedCount == 1 ? "vez" : "vezes"
      blockPart = " O escudo agiu \(day.blockedCount) \(word)."
    } else {
      blockPart = " O escudo não precisou agir neste dia."
    }
    return readPart + blockPart
  }
}
