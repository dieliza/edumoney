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
