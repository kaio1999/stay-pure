import SwiftUI

struct InterruptedView: View {
  @EnvironmentObject private var app: AppState
  @Environment(\.dismiss) private var dismiss

  let payload: InterruptionPayload
  @State private var prayed = false

  private var verse: PurityVerse { app.verse(for: payload) }

  private let prayer =
    "Senhor, cria em mim um coração puro. Desvia os meus olhos da vaidade. Quero olhar para Ti."

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        KickerText(text: "Você foi guardado")
        Text(verse.text)
          .font(.title3.weight(.medium))
          .foregroundStyle(Theme.parchment)
          .lineSpacing(6)
          .padding(.top, 28)
        Text(verse.reference)
          .font(.subheadline.weight(.medium))
          .tracking(1.4)
          .textCase(.uppercase)
          .foregroundStyle(Theme.gold)
          .padding(.top, 18)
        Text(verse.invitation)
          .font(.body)
          .foregroundStyle(Theme.parchmentMuted)
          .lineSpacing(5)
          .padding(.top, 22)

        if prayed {
          Text(prayer)
            .font(.body.weight(.medium))
            .foregroundStyle(Theme.parchment)
            .lineSpacing(5)
            .padding(.top, 22)
          Text("Este destino fica em silêncio por 45 minutos.")
            .font(.subheadline)
            .foregroundStyle(Theme.gold)
            .padding(.top, 14)
        }

        GoldButton(label: prayed ? "Ir ao texto de hoje" : "Orar agora") {
          if !prayed {
            prayed = true
          } else {
            app.shield.snooze(host: payload.host)
            app.interruption = nil
            dismiss()
          }
        }
        .padding(.top, 36)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .screenPadding()
      .padding(.bottom, 24)
    }
    .screenBackground()
  }
}
