.PHONY: blocklist test-blocker apk prebuild clean ios-assets watch test-watch

ROOT := $(shell pwd)
BLOCKER := $(ROOT)/services/blocker
WATCH := $(ROOT)/services/accountability
MOBILE := $(ROOT)/apps/mobile
IOS := $(ROOT)/apps/ios
ASSETS := $(MOBILE)/modules/stay-pure-blocker/android/src/main/assets

ios-assets:
	$(IOS)/scripts/sync-assets.sh

blocklist:
	cd $(BLOCKER) && go run ./cmd/staypure-blocker compile --out $(ASSETS) --fetch
	$(MAKE) ios-assets

blocklist-offline:
	cd $(BLOCKER) && go run ./cmd/staypure-blocker compile --out $(ASSETS)
	$(MAKE) ios-assets

test-blocker:
	cd $(BLOCKER) && go test ./...

test-watch:
	cd $(WATCH) && npm test

prebuild: blocklist-offline
	cd $(MOBILE) && CI=1 npx expo prebuild --platform android

apk: blocklist
	cd $(MOBILE) && CI=1 npx expo prebuild --platform android
	cd $(MOBILE)/android && ./gradlew assembleRelease
	@echo ""
	@echo "APK gerado em:"
	@ls -lh $(MOBILE)/android/app/build/outputs/apk/release/*.apk

watch:
	cd $(WATCH) && npm start

clean:
	rm -rf $(MOBILE)/android $(MOBILE)/ios $(MOBILE)/.expo $(BLOCKER)/dist
