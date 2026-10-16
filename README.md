# Stay Pure

App Android de santidade: devocional diário sobre pureza e um escudo DNS que bloqueia os principais destinos de pornografia. Quando o bloqueio acontece, a tela mostra um versículo — não uma página em branco.

Não será publicado na loja neste momento. O artefato é um APK para instalar direto no aparelho.

## O que está onde

```
stay-pure/
├── apps/mobile/                  # React Native (Expo) — UI e casos de uso
│   ├── app/                      # rotas (expo-router)
│   ├── src/core/                 # domínio, dados, DI (clean architecture)
│   ├── src/features/             # telas por capacidade
│   └── modules/stay-pure-blocker # VPN DNS nativo Android
├── services/blocker/             # Go — matcher, compile da blocklist, DNS de teste
└── services/accountability/      # Stay Pure Watch (Node.js) — e-mail de prestar contas
```

O React Native não consegue filtrar tráfego do sistema. O bloqueio vive nativo:

1. Go gera a lista (`blocklist.txt` + modo estrito).
2. `StayPureVpnService` sobe um VPN só de DNS (rápido, sem inspecionar todo o tráfego).
3. Domínio bloqueado → NXDOMAIN + tela nativa com versículo (LCP da interrupção, sem esperar o JS).

A lista mescla um núcleo dos destinos de maior tráfego com as extensões públicas de pornografia do [StevenBlack/hosts](https://github.com/StevenBlack/hosts) (Sinfonietta e outras). Não copiamos diretórios de sites adultos. No modo estrito, resolvers DNS-over-HTTPS usados para furar filtro também entram.

## Segurança de dados no app

| Dado | Onde fica |
|------|-----------|
| E-mail da pessoa de confiança, `deviceId`, token do Watch (nativo) | `expo-secure-store` (JS) + EncryptedSharedPreferences / Keystore (Android) |
| Preferências comuns (lembrete, onboarding, jornada, cache do dia) | MMKV |

Não persista tokens ou e-mails de prestar contas em AsyncStorage/MMKV/estado global persistido.

## Qualidade e performance

- **LCP:** splash da mesma cor da home, fontes carregadas antes de revelar a UI, devocional clássico/MMKV no primeiro paint. Card com `minHeight` para não deslocar layout.
- **INP:** toggle do escudo e bloqueio são nativos; animações leves; MMKV síncrono.
- **Hermes + New Architecture** ligados. Cache do dia evita refetch.

O catálogo local tem 32 textos de autores reais em domínio público (metade sobre pureza/santidade, metade Spurgeon) e cobre o ano por rotação. Não há reescrita por IA.

## Gerar o APK

Na raiz do repositório, com JDK 17 e Android SDK:

```bash
make test-blocker
make apk
```

O APK sai em:

`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

`make apk` baixa as listas públicas. Sem rede:

```bash
make blocklist-offline
cd apps/mobile
CI=1 npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

Instale no aparelho:

```bash
adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Na primeira vez o Android pede permissão de VPN. É esperado: o escudo só funciona com essa autorização.

## Desenvolvimento

```bash
make blocklist-offline
cd apps/mobile
npx expo run:android
```

O Expo Go não carrega o módulo VPN. Use o APK ou o dev client gerado por `expo run:android`.

Teste o matcher em desktop:

```bash
cd services/blocker
go run ./cmd/staypure-blocker compile --out dist
go run ./cmd/staypure-blocker check --list dist/blocklist.txt pornhub.com
go run ./cmd/staypure-blocker serve --list dist/blocklist.txt --listen 127.0.0.1:5353
```

## Prestar contas

O Android **não executa código na desinstalação**. O aviso para a pessoa de confiança funciona assim:

1. Em Ajustes, o usuário liga **Prestar contas** e informa o e-mail de alguém de confiança.
2. O app registra o contato no Stay Pure Watch e envia um pulso a cada ~15 minutos.
3. **Desligar o escudo** (ou revogar a VPN) dispara o e-mail na hora.
4. **Desinstalar o app** (ou ficar horas sem internet) aparece como silêncio: o serviço avisa depois de **4 horas** sem pulso. Celular desligado também pode gerar esse aviso.
5. Pausar o escudo no Android Auto **não** avisa — o compromisso continua ligado.

Desligar o próprio prestar contas também avisa o contato, para o acordo não sumir em silêncio.

### Subir o Watch (Node.js)

```bash
cd services/accountability
cp .env.example .env
# preencha SMTP_* e WATCH_TOKEN
npm install
npm start
```

Ou na raiz:

```bash
export SMTP_HOST=smtp.exemplo.com
export SMTP_PORT=587
export SMTP_USER=staypure@exemplo.com
export SMTP_PASS=segredo
export SMTP_FROM="Stay Pure <staypure@exemplo.com>"
export WATCH_TOKEN=um-token-longo
make watch
```

Sem SMTP o serviço sobe na mesma (`:8787`) e só registra o e-mail no log — útil para testar.

O aparelho precisa alcançar essa URL. No telefone da mesma rede, use o IP do computador (`http://192.168.x.x:8787`), não `localhost`.

### APK com o Watch ligado

Copie `apps/mobile/.env.example` para `apps/mobile/.env` (não commitar) e preencha:

```bash
export EXPO_PUBLIC_ACCOUNTABILITY_URL=https://watch.exemplo.com
export EXPO_PUBLIC_ACCOUNTABILITY_TOKEN=um-token-longo
make apk
```

O token do APK tem de ser o mesmo `WATCH_TOKEN` do serviço. Esse valor é um segredo compartilhado do build — não o coloque no repositório.

## Fonte do devocional

O texto do dia vem de obras clássicas em domínio público (Ryle, Owen, Agostinho, Spurgeon e outros), traduzidas para o português. Metade do calendário trata de pureza e santidade; a outra metade é a leitura da manhã de Spurgeon.

## Limites honestos do escudo

- Bloqueio por DNS. Sites novos, proxies, IPs na mão ou redes que não usam o DNS do aparelho podem furar.
- Apps que embutem o próprio DNS-over-HTTPS exigem o modo estrito — e mesmo assim não há garantia absoluta.
- Android não permite um app comum “desligar a internet pornográfica do universo”. Este desenho é o mesmo padrão de filtros de família (VPN local + lista). É forte nos destinos principais; não é onisciente.
