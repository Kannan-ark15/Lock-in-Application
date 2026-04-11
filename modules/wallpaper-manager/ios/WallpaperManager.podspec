require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json'))) rescue {}

Pod::Spec.new do |s|
  s.name         = 'WallpaperManager'
  s.version      = package['version'] || '0.0.1'
  s.summary      = 'Local Expo module for setting wallpapers.'
  s.description  = 'Android wallpaper manager bridge and iOS unsupported shim.'
  s.license      = package['license'] || 'MIT'
  s.author       = 'LockIn'
  s.homepage     = 'https://github.com/expo/expo'
  s.platforms    = { :ios => '15.1' }
  s.source       = { :git => 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
