#!/bin/bash
# Solo simuladores desechables de CI, sin datos personales.
set -euo pipefail
DEVICE_ID="$1"
mkdir -p native-results/ios-direct
capture_failure() {
  xcrun simctl io "$DEVICE_ID" screenshot native-results/ios-direct/failure.png || true
  xcrun simctl spawn "$DEVICE_ID" log show --style compact --last 3m --predicate 'process == "EduMoney" OR process == "SpringBoard" OR process == "runningboardd" OR process == "amfid"' > native-results/ios-direct/failure.log || true
}
trap capture_failure ERR
xcrun simctl launch "$DEVICE_ID" com.edumoney.app
APP_CONTAINER=$(xcrun simctl get_app_container "$DEVICE_ID" com.edumoney.app data)
DATABASE_PATH="$APP_CONTAINER/Documents/SQLite/edumoney.db"
for attempt in $(seq 1 30); do
  if [ -s "$DATABASE_PATH" ]; then break; fi
  sleep 2
done
# La creación completa del esquema se termina antes de mostrar el estado listo.
sleep 5
python3 scripts/check-encrypted-db.py "$DATABASE_PATH" > native-results/ios-direct/database-check.json
xcrun simctl io "$DEVICE_ID" screenshot native-results/ios-direct/first-open.png
xcrun simctl terminate "$DEVICE_ID" com.edumoney.app
xcrun simctl launch "$DEVICE_ID" com.edumoney.app
sleep 10
python3 scripts/check-encrypted-db.py "$DATABASE_PATH" > native-results/ios-direct/database-reopened-check.json
cmp native-results/ios-direct/database-check.json native-results/ios-direct/database-reopened-check.json
xcrun simctl io "$DEVICE_ID" screenshot native-results/ios-direct/reopened.png
# Confirma el atributo que excluye Documents de respaldos automáticos.
swift - "$APP_CONTAINER/Documents" <<'SWIFT'
import Foundation
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let values = try url.resourceValues(forKeys: [.isExcludedFromBackupKey])
guard values.isExcludedFromBackup == true else { fatalError("Documents no está excluido de backup") }
print("Exclusión de backup verificada")
SWIFT
