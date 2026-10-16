import SwiftUI

struct DevotionHero: View {
  let devotion: Devotional

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      KickerText(text: devotion.author ?? "Devocional de hoje")
      if let work = devotion.work, !work.isEmpty {
        Text(work)
          .font(.footnote)
          .foregroundStyle(Theme.parchmentMuted)
          .padding(.top, 6)
      }
      Text(devotion.title)
        .font(.title2.weight(.bold))
        .foregroundStyle(Theme.parchment)
        .padding(.top, 12)
      Text(devotion.scriptureRef)
        .font(.subheadline.weight(.medium))
        .foregroundStyle(Theme.gold)
        .padding(.top, 10)
      Text(devotion.scriptureText)
        .font(.body.weight(.medium))
        .foregroundStyle(Theme.goldSoft)
        .lineSpacing(4)
        .padding(.top, 10)
      Rectangle()
        .fill(Theme.line)
        .frame(height: 1)
        .padding(.vertical, 16)
      Text(devotion.reflection)
        .font(.body)
        .foregroundStyle(Theme.parchmentMuted)
        .lineSpacing(6)
      Text("Oração")
        .font(.caption.weight(.medium))
        .tracking(1.8)
        .foregroundStyle(Theme.gold)
        .padding(.top, 18)
      Text(devotion.prayer)
        .font(.body.weight(.medium))
        .foregroundStyle(Theme.parchment)
        .lineSpacing(5)
        .padding(.top, 8)
      if devotion.author != nil {
        Text("Texto clássico em domínio público · tradução fiel")
          .font(.caption2)
          .foregroundStyle(Theme.parchmentMuted)
          .padding(.top, 16)
      }
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
}
