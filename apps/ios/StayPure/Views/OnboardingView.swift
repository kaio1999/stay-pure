import SwiftUI

struct OnboardingView: View {
  @EnvironmentObject private var app: AppState
  @State private var index = 0

  private let pages: [(kicker: String, title: String, body: String)] = [
    (
      "Stay Pure",
      "Um caminho de santidade.",
      "Devocionais diários sobre pureza, guarda dos olhos e um coração limpo diante do Senhor."
    ),
    (
      "Escudo",
      "O filtro trabalha em silêncio.",
      "Por baixo dos panos, um VPN DNS local recusa os principais destinos de pornografia no aparelho."
    ),
    (
      "Interrupção",
      "Quando o bloqueio acontece.",
      "Em vez da página, um versículo. A tentação encontra Escritura — não um erro de rede."
    ),
  ]

  var body: some View {
    VStack {
      Spacer()
      let page = pages[index]
      KickerText(text: page.kicker)
      Text(page.title)
        .font(.largeTitle.weight(.bold))
        .foregroundStyle(Theme.parchment)
        .padding(.top, 16)
      Text(page.body)
        .font(.body)
        .foregroundStyle(Theme.parchmentMuted)
        .lineSpacing(6)
        .padding(.top, 16)
      Spacer()
      GoldButton(label: index == pages.count - 1 ? "Começar" : "Continuar") {
        if index < pages.count - 1 {
          index += 1
        } else {
          Task { await app.completeOnboarding() }
        }
      }
    }
    .screenPadding()
    .screenBackground()
  }
}
