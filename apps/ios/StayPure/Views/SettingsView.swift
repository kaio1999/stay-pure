import SwiftUI

struct SettingsView: View {
  @State private var reminder = ReminderScheduler.loadSettings()
  @State private var showPermissionAlert = false

  private let hours = [6, 7, 8, 9, 10]

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        KickerText(text: "Ajustes")
        Text("Lembrete da manhã")
          .font(.title.weight(.bold))
          .foregroundStyle(Theme.parchment)
          .padding(.top, 8)
          .padding(.bottom, 12)

        reminderCard

        Text("Sobre o Stay Pure")
          .font(.title.weight(.bold))
          .foregroundStyle(Theme.parchment)
          .padding(.top, 28)
          .padding(.bottom, 12)

        Text("O devocional do dia vem de autores cristãos reais — Ryle, Owen, Agostinho, Spurgeon e outros — em obras de domínio público. Metade do calendário é sobre pureza e santidade; a outra metade é a leitura da manhã de Spurgeon.")
          .font(.body)
          .foregroundStyle(Theme.parchmentMuted)
          .lineSpacing(5)

        aboutCard
          .padding(.top, 18)

        Text("Stay Pure · 1.0.0")
          .font(.footnote)
          .foregroundStyle(Theme.parchmentMuted)
          .padding(.top, 28)
      }
      .screenPadding()
      .padding(.bottom, 40)
    }
    .screenBackground()
    .alert("Lembrete", isPresented: $showPermissionAlert) {
      Button("OK", role: .cancel) {}
    } message: {
      Text("Permita notificações para o Stay Pure avisar de manhã. Você pode mudar isso nas configurações do iOS.")
    }
  }

  private var reminderCard: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack(alignment: .top, spacing: 12) {
        VStack(alignment: .leading, spacing: 8) {
          Text("Avisar todo dia")
            .font(.subheadline.weight(.semibold))
          Text("Uma notificação para abrir o devocional. Sem isso, o hábito depende de lembrar sozinho.")
            .font(.subheadline)
            .foregroundStyle(Theme.parchmentMuted)
        }
        Spacer()
        Toggle("", isOn: Binding(
          get: { reminder.enabled },
          set: { value in persist(ReminderSettings(enabled: value, hour: reminder.hour)) }
        ))
        .labelsHidden()
        .tint(Theme.gold)
      }

      if reminder.enabled {
        HStack(spacing: 8) {
          ForEach(hours, id: \.self) { hour in
            Button {
              persist(ReminderSettings(enabled: true, hour: hour))
            } label: {
              Text(String(format: "%02dh", hour))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(reminder.hour == hour ? Theme.ink : Theme.parchment)
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .background(reminder.hour == hour ? Theme.gold : Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusSm, style: .continuous))
                .overlay {
                  RoundedRectangle(cornerRadius: Theme.radiusSm, style: .continuous)
                    .stroke(Theme.line, lineWidth: reminder.hour == hour ? 0 : 1)
                }
            }
            .buttonStyle(.plain)
          }
        }
      }
    }
    .padding(Theme.gutter)
    .background(Theme.navyLift)
    .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLg, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: Theme.radiusLg, style: .continuous)
        .stroke(Theme.line, lineWidth: 1)
    }
  }

  private var aboutCard: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Escudo")
        .font(.subheadline.weight(.semibold))
      Text("O filtro liga-se na aba Escudo. Depois de um bloqueio, o site fica em silêncio por 45 minutos para você não voltar à mesma guia.")
        .font(.subheadline)
        .foregroundStyle(Theme.parchmentMuted)
        .lineSpacing(4)
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

  private func persist(_ next: ReminderSettings) {
    reminder = next
    ReminderScheduler.saveSettings(next)
    Task {
      let scheduled = await ReminderScheduler.sync(next)
      if next.enabled && !scheduled {
        showPermissionAlert = true
      }
    }
  }
}
