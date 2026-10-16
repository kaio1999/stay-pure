import SwiftUI

struct MainTabView: View {
  @State private var selection = 0

  var body: some View {
    TabView(selection: $selection) {
      HomeView()
        .tabItem { Label("Hoje", systemImage: "sun.max") }
        .tag(0)
      ShieldView()
        .tabItem { Label("Escudo", systemImage: "shield.lefthalf.filled") }
        .tag(1)
      JourneyView()
        .tabItem { Label("Jornada", systemImage: "calendar") }
        .tag(2)
      SettingsView()
        .tabItem { Label("Ajustes", systemImage: "gearshape") }
        .tag(3)
    }
    .tint(Theme.gold)
    .onAppear {
      let appearance = UITabBarAppearance()
      appearance.configureWithOpaqueBackground()
      appearance.backgroundColor = UIColor(Theme.navy)
      UITabBar.appearance().standardAppearance = appearance
      UITabBar.appearance().scrollEdgeAppearance = appearance
    }
  }
}
