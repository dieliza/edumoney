const { withAppDelegate, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');
/** Excluye documentos de iCloud/Finder antes de abrir la base. */
module.exports = config => {
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application[0].$;
    app['android:allowBackup'] = 'false';
    app['android:fullBackupContent'] = '@xml/edumoney_backup_rules';
    app['android:dataExtractionRules'] = '@xml/edumoney_extraction_rules';
    return mod;
  });
  config = withDangerousMod(config, ['android', async mod => {
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.mkdir(dir, { recursive: true });
    const excludes = ['root', 'file', 'database', 'sharedpref', 'external', 'device_root', 'device_file', 'device_database', 'device_sharedpref']
      .map(domain => `<exclude domain="${domain}" path="." />`).join('');
    await fs.writeFile(path.join(dir, 'edumoney_backup_rules.xml'), `<?xml version="1.0" encoding="utf-8"?><full-backup-content>${excludes}</full-backup-content>`);
    await fs.writeFile(path.join(dir, 'edumoney_extraction_rules.xml'), `<?xml version="1.0" encoding="utf-8"?><data-extraction-rules><cloud-backup>${excludes}</cloud-backup><device-transfer>${excludes}</device-transfer></data-extraction-rules>`);
    return mod;
  }]);
  return withAppDelegate(config, config => {
  if (config.modResults.language !== 'swift') throw new Error('EduMoney requiere AppDelegate Swift para excluir copias automáticas');
  const marker = '// EduMoney: local-only storage';
  if (config.modResults.contents.includes(marker)) return config;
  const anchor = '    let delegate = ReactNativeDelegate()';
  if (!config.modResults.contents.includes(anchor)) throw new Error('Revisar plantilla AppDelegate antes de continuar');
  config.modResults.contents = config.modResults.contents.replace(anchor, `    ${marker}
    do {
      var documents = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try documents.setResourceValues(values)
    } catch {
      fatalError("EduMoney: no se pudo proteger el almacenamiento local")
    }
${anchor}`);
  return config;
  });
};
