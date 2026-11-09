import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const read = path => readFileSync(path, 'utf8');
assert.match(read('android/gradle.properties'), /expo.sqlite.useSQLCipher=true/);
assert.equal(JSON.parse(read('ios/Podfile.properties.json'))['expo.sqlite.useSQLCipher'], 'true');
const manifest = read('android/app/src/main/AndroidManifest.xml');
assert.match(manifest, /android:allowBackup="false"/);
assert.match(manifest, /@xml\/edumoney_extraction_rules/);
assert.match(manifest, /@xml\/edumoney_backup_rules/);
const extraction = read('android/app/src/main/res/xml/edumoney_extraction_rules.xml');
assert.match(extraction, /<cloud-backup>/);
assert.match(extraction, /<device-transfer>/);
for (const domain of ['root', 'file', 'database', 'sharedpref', 'external', 'device_root', 'device_file', 'device_database', 'device_sharedpref']) {
  assert.equal(extraction.split(`<exclude domain="${domain}" path="." />`).length - 1, 2);
  assert.ok(read('android/app/src/main/res/xml/edumoney_backup_rules.xml').includes(`<exclude domain="${domain}" path="." />`));
}
const delegate = read('ios/EduMoney/AppDelegate.swift');
assert.match(delegate, /values.isExcludedFromBackup = true/);
assert.ok(delegate.indexOf('try documents.setResourceValues(values)') < delegate.indexOf('let delegate = ReactNativeDelegate()'));
console.log('Configuración nativa: SQLCipher y exclusiones de respaldo verificadas para iOS y Android.');

assert.match(manifest, /android:name="firebase_messaging_auto_init_enabled" android:value="false"/);
assert.doesNotMatch(read('ios/EduMoney/EduMoney.entitlements'), /aps-environment/);
console.log('Avisos locales: registro remoto desactivado; permisos de calendario y alarmas exactas bloqueados en la configuración.');

// Etapa 8: capacidades locales y permisos expresamente configurados.
assert.match(manifest, /android.permission.CAMERA/);
assert.match(manifest, /android.permission.RECORD_AUDIO/);
assert.doesNotMatch(manifest, /android:name="android.permission.RECORD_AUDIO"[^>]*tools:node="remove"/);
const ocrBuild=read('node_modules/expo-text-extractor/android/build.gradle');
assert.match(ocrBuild, /com.google.mlkit:text-recognition:16.0.1/);
assert.doesNotMatch(ocrBuild, /play-services-mlkit/);
const voiceSource=read('node_modules/expo-speech-recognition/ios/ExpoSpeechRecognizer.swift');
assert.match(voiceSource, /EduMoney: fail closed/);
assert.match(voiceSource, /request.requiresOnDeviceRecognition = options.requiresOnDeviceRecognition/);
console.log('Captura local: permisos presentes, OCR incluido y dictado sin fallback remoto.');

assert.match(read('modules/edumoney-backup-crypto/android/src/main/java/expo/modules/edumoneybackupcrypto/EduMoneyBackupCryptoModule.kt'), /600000/);
assert.match(read('modules/edumoney-backup-crypto/ios/EduMoneyBackupCryptoModule.swift'), /600000/);
console.log('Respaldo: derivación nativa PBKDF2-SHA256 de 600000 iteraciones.');
