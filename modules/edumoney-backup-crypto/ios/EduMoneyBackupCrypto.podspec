Pod::Spec.new do |s|
  s.name = 'EduMoneyBackupCrypto'
  s.version = '1.0.0'
  s.summary = 'Derivacion PBKDF2 local para respaldos de EduMoney'
  s.description = s.summary
  s.license = 'MIT'
  s.author = 'EduMoney'
  s.homepage = 'https://github.com/dieliza/edumoney'
  s.source = { git: 'https://github.com/dieliza/edumoney' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift}'
end
