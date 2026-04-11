import ExpoModulesCore

public class WallpaperManagerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WallpaperManager")

    AsyncFunction("setLockScreenWallpaper") { (_: String) -> [String: Bool] in
      return ["supported": false]
    }

    AsyncFunction("setHomeScreenWallpaper") { (_: String) -> [String: Bool] in
      return ["supported": false]
    }

    AsyncFunction("isPermissionGranted") {
      return true
    }

    AsyncFunction("requestPermission") {
      return true
    }
  }
}
