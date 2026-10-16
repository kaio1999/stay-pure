import Foundation

enum GuardNotice {
  static func mark() {
    AppGroup.defaults.set(true, forKey: ShieldKeys.guardPending)
  }

  static func consume() -> Bool {
    let defaults = AppGroup.defaults
    let pending = defaults.bool(forKey: ShieldKeys.guardPending)
    if pending {
      defaults.set(false, forKey: ShieldKeys.guardPending)
    }
    return pending
  }
}
