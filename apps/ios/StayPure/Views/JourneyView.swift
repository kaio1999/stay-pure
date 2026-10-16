import SwiftUI

struct JourneyView: View {
  @EnvironmentObject private var app: AppState
  @State private var selectedDay: DayRoute?

  private var today: String { DateKeys.todayKey() }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        KickerText(text: "Jornada")
        Text("\(app.journey.streak) dias seguidos")
          .font(.title.weight(.bold))
          .foregroundStyle(Theme.parchment)
          .padding(.top, 8)
          .padding(.bottom, 12)

        Text("Cada dia na Palavra constrói um caminho. Toque um dia para ler o texto e ver se o escudo agiu. Os bloqueios não são fracasso — são guarda.")
          .font(.body)
          .foregroundStyle(Theme.parchmentMuted)
          .lineSpacing(5)

        LazyVGrid(columns: Array(repeating: GridItem(.fixed(52), spacing: 8), count: 5), spacing: 8) {
          ForEach(app.journey.days) { day in
            Button {
              selectedDay = DayRoute(dateKey: day.dateKey)
            } label: {
              VStack(spacing: 2) {
                Text(String(day.dateKey.suffix(2)))
                  .font(.subheadline.weight(.bold))
                  .foregroundStyle(Theme.parchment)
                if day.blockedCount > 0 {
                  Text("\(day.blockedCount)")
                    .font(.caption2)
                    .foregroundStyle(Theme.gold)
                }
              }
              .frame(width: 52, height: 52)
              .background(day.dateKey == today ? Theme.navy : Theme.navyLift)
              .clipShape(RoundedRectangle(cornerRadius: Theme.radiusSm, style: .continuous))
              .overlay {
                RoundedRectangle(cornerRadius: Theme.radiusSm, style: .continuous)
                  .stroke(day.read ? Theme.gold : Theme.line, lineWidth: 1)
              }
            }
            .buttonStyle(.plain)
          }
        }
        .padding(.top, 24)
      }
      .screenPadding()
      .padding(.bottom, 32)
    }
    .screenBackground()
    .sheet(item: $selectedDay) { route in
      DayDetailView(dateKey: route.dateKey)
        .environmentObject(app)
    }
    .refreshable { await app.journey.refresh() }
  }
}

struct DayRoute: Identifiable {
  let dateKey: String
  var id: String { dateKey }
}
