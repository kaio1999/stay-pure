# Stay Pure — iOS (SwiftUI)

App nativo em Swift com a mesma identidade visual e lógica do Android (React Native).

## Estrutura

```
apps/ios/
├── StayPure/          # App SwiftUI (Hoje, Escudo, Jornada, Ajustes)
├── StayPureTunnel/    # Network Extension — filtro DNS
├── Shared/            # Código compartilhado (matcher, snooze, contadores)
├── project.yml        # XcodeGen
└── scripts/sync-assets.sh
```

## Pré-requisitos

- macOS com **Xcode 15+** (não basta Command Line Tools)
- Conta **Apple Developer** (Network Extension exige perfil pago)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`

## Setup

1. Sincronize blocklists e devocionais a partir do app Android:

```bash
chmod +x apps/ios/scripts/sync-assets.sh
./apps/ios/scripts/sync-assets.sh
```

2. Gere o projeto Xcode:

```bash
cd apps/ios
xcodegen generate
open StayPure.xcodeproj
```

3. No Xcode:
   - Defina seu **Team** em ambos os targets (`StayPure` e `StayPureTunnel`)
   - Confirme os bundle IDs: `com.staypure.app` e `com.staypure.app.tunnel`
   - Ative **App Groups** (`group.com.staypure.app`) nos dois targets
   - Ative **Network Extensions → Packet Tunnel** nos dois targets
   - Adicione um ícone em `StayPure/Assets.xcassets` (opcional; fundo `#070B16`, escudo dourado)

4. Rode em dispositivo físico (VPN não funciona no simulador de forma confiável).

## Paridade com Android

| Recurso | Android | iOS |
|---------|---------|-----|
| Devocional diário | Catálogo clássico | Igual (JSON exportado) |
| Escudo DNS | VPN Kotlin | Packet Tunnel Provider |
| Interrupção | Overlay + Activity | Notificação + tela full-screen |
| Snooze 45 min | SharedPreferences | App Group |
| Jornada 21 dias | MMKV | UserDefaults |
| Lembrete matinal | expo-notifications | UNUserNotificationCenter |
| Modo estrito | blocklist-strict.txt | Igual |

## Escudo no iOS

- O usuário precisa aprovar a configuração VPN do sistema na primeira ativação.
- Não há overlay sobre outros apps (limitação da Apple); o versículo aparece via notificação e abre a tela de interrupção.
- Contadores e snooze ficam no App Group `group.com.staypure.app`.

## TestFlight

1. Archive → Distribute App → App Store Connect
2. Inclua **ambos** os targets (app + extension) no archive
3. Descreva o uso de VPN DNS para filtro de conteúdo adulto na revisão

## Desenvolvimento

Após mudar devocionais ou blocklist no Android:

```bash
./apps/ios/scripts/sync-assets.sh
```

Rebuild no Xcode.
