package expo.modules.wallpapermanager

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.FileInputStream
import java.io.InputStream
import java.net.URL

class WallpaperManagerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WallpaperManager")

    AsyncFunction("setLockScreenWallpaper") { uri: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("React context is unavailable.")
      val wallpaperManager = WallpaperManager.getInstance(context)
      val bitmap = decodeBitmap(uri, context.contentResolver)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK)
      } else {
        wallpaperManager.setBitmap(bitmap)
      }
      mapOf("supported" to true)
    }

    AsyncFunction("setHomeScreenWallpaper") { uri: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("React context is unavailable.")
      val wallpaperManager = WallpaperManager.getInstance(context)
      val bitmap = decodeBitmap(uri, context.contentResolver)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM)
      } else {
        wallpaperManager.setBitmap(bitmap)
      }
      mapOf("supported" to true)
    }

    AsyncFunction("isPermissionGranted") {
      true
    }

    AsyncFunction("requestPermission") {
      true
    }
  }

  private fun decodeBitmap(uri: String, contentResolver: android.content.ContentResolver): Bitmap {
    val inputStream: InputStream = when {
      uri.startsWith("http://") || uri.startsWith("https://") -> URL(uri).openStream()
      uri.startsWith("file://") -> FileInputStream(uri.removePrefix("file://"))
      else -> contentResolver.openInputStream(Uri.parse(uri))
        ?: throw IllegalArgumentException("Unable to resolve wallpaper URI: $uri")
    }

    inputStream.use { stream ->
      return BitmapFactory.decodeStream(stream)
        ?: throw IllegalArgumentException("Unable to decode wallpaper bitmap from URI: $uri")
    }
  }
}
