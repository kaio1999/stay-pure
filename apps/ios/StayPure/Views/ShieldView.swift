import SwiftUI

struct ShieldView: View {
  @EnvironmentObject private var app: AppState
  @State private var errorMessage: String?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        KickerText(text: "Escudo")
        Text(app.shield.status.enabled ? "Você está sendo guardado" : "Ative o escudo")
          .font(.title.weight(.bold))
          .foregroundStyle(Theme.parchment)
          .padding(.top, 8)
          .padding(.bottom, 12)

        Text("O Stay Pure intercepta o DNS do aparelho e recusa os principais destinos de pornografia. Quando um acesso é bloqueado, um versículo sobre pureza aparece em notificação.")
          .font(.body)
          .foregroundStyle(Theme.parchmentMuted)
          .lineSpacing(5)

        panel
          .padding(.vertical, Theme.gutter)

        if ShieldController.isSimulator {
          simulatorNotice
            .padding(.bottom, 16)
        }

        GoldButton(
          label: ShieldController.isSimulator
            ? "Pré-visualizar bloqueio"
            : (app.shield.status.enabled ? "Desligar escudo" : "Ligar escudo"),
          variant: app.shield.status.enabled ? .ghost : .gold,
          disabled: app.shield.busy
        ) {
          Task {
            if ShieldController.isSimulator {
              previewInterruption()
              return
            }
            do {
              try await app.shield.toggle(
                enabled: !app.shield.status.enabled,
                strictMode: app.shield.status.strictMode
              )
              await app.journey.refresh()
            } catch {
              errorMessage = error.localizedDescription
            }
          }
        }

        strictRow
          .padding(.top, 22)

        if let errorMessage {
          Text(errorMessage)
            .font(.footnote)
            .foregroundStyle(.red)
            .padding(.top, 12)
        }
      }
      .screenPadding()
      .padding(.bottom, 24)
    }
    .screenBackground()
    .refreshable { await app.shield.refresh() }
  }

  private var panel: some View {
    VStack(alignment: .leading, spacing: 0) {
      Text(app.shield.status.domainCount.formatted(.number.locale(Locale(identifier: "pt_BR"))))
        .font(.system(size: 44, weight: .bold))
        .foregroundStyle(Theme.gold)
      Text("domínios no filtro")
        .font(.footnote)
        .foregroundStyle(Theme.parchmentMuted)
        .padding(.bottom, 16)
      row("Bloqueios hoje", value: "\(app.shield.status.blockedToday)")
      row("Total", value: "\(app.shield.status.blockedTotal)")
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(Theme.gutter)
    .background(Theme.navyLift)
    .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLg, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: Theme.radiusLg, style: .continuous)
        .stroke(Theme.line, lineWidth: 1)
    }
  }

  private func row(_ label: String, value: String) -> some View {
    HStack {
      Text(label)
        .foregroundStyle(Theme.parchmentMuted)
      Spacer()
      Text(value)
        .fontWeight(.semibold)
        .foregroundStyle(Theme.parchment)
    }
    .padding(.vertical, 8)
  }

  private var simulatorNotice: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Simulador")
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(Theme.gold)
      Text("O filtro VPN não sobe aqui — limitação da Apple, não do app. Para ligar o escudo de verdade, rode no iPhone pelo Xcode.")
        .font(.footnote)
        .foregroundStyle(Theme.parchmentMuted)
        .lineSpacing(4)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(18)
    .background(Theme.navy)
    .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: Theme.radiusMd, style: .continuous)
        .stroke(Theme.line, lineWidth: 1)
    }
  }

  private func previewInterruption() {
    let verse = VerseCatalog.pick(host: "example.com", verses: app.verses)
    app.interruption = InterruptionPayload(host: "example.com", verseId: verse.id)
  }

  private var strictRow: some View {
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        Text("Modo estrito")
          .font(.subheadline.weight(.semibold))
        Text("Bloqueia também DNS-over-HTTPS usados para furar filtros.")
          .font(.footnote)
          .foregroundStyle(Theme.parchmentMuted)
      }
      Spacer()
      Toggle("", isOn: Binding(
        get: { app.shield.status.strictMode },
        set: { value in
          Task {
            do {
              try await app.shield.setStrict(value)
            } catch {
              errorMessage = error.localizedDescription
            }
          }
        }
      ))
      .labelsHidden()
      .tint(Theme.gold)
    }
  }
}
