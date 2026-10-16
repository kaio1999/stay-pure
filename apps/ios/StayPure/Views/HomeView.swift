import SwiftUI

struct HomeView: View {
  @EnvironmentObject private var app: AppState
  @State private var read = false

  private var today: String { DateKeys.todayKey() }
  private var devotion: Devotional { app.devotional(for: today) }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        KickerText(text: "Stay Pure")
        Text("Guarde o coração.")
          .font(.largeTitle.weight(.bold))
          .foregroundStyle(Theme.parchment)
          .padding(.top, 10)
          .padding(.bottom, 24)

        if app.guardNotice {
          guardBanner
            .padding(.bottom, Theme.gutter)
        }

        statsRow
          .padding(.bottom, Theme.gutter)

        DevotionHero(devotion: devotion)

        if !read {
          GoldButton(label: "Marquei como lido") {
            app.journey.markRead(today)
            read = true
            Task { await app.journey.refresh() }
          }
          .padding(.top, 18)
        } else {
          Text("Lido hoje. O streak conta este dia.")
            .font(.footnote)
            .foregroundStyle(Theme.gold)
            .padding(.top, 16)
        }
      }
      .screenPadding()
      .padding(.bottom, 40)
    }
    .screenBackground()
    .onAppear {
      read = app.journey.isRead(today)
      app.consumeGuardNotice()
    }
    .refreshable {
      await app.refreshAll()
      read = app.journey.isRead(today)
    }
  }

  private var guardBanner: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("O escudo agiu")
        .font(.subheadline.weight(.bold))
        .foregroundStyle(Theme.gold)
      Text("Este destino fica em silêncio por 45 minutos. O registro está na Jornada.")
        .font(.subheadline)
        .foregroundStyle(Theme.parchmentMuted)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(Theme.mdPadding)
    .background(Theme.navyLift)
    .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
        .stroke(Theme.gold, lineWidth: 1)
    }
  }

  private var statsRow: some View {
    HStack(spacing: 10) {
      stat(value: "\(app.journey.streak)", label: "dias na Palavra")
      stat(value: app.shield.status.enabled ? "On" : "Off", label: "escudo")
      stat(value: "\(app.shield.status.blockedToday)", label: "bloqueios hoje")
    }
  }

  private func stat(value: String, label: String) -> some View {
    VStack(spacing: 4) {
      Text(value)
        .font(.title2.weight(.bold))
        .foregroundStyle(Theme.gold)
      Text(label)
        .font(.caption)
        .foregroundStyle(Theme.parchmentMuted)
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 14)
    .background(Theme.navyLift)
    .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
        .stroke(Theme.line, lineWidth: 1)
    }
  }
}

private extension Theme {
  static let mdPadding: CGFloat = 18
}
