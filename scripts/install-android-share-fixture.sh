#!/usr/bin/env bash
# CI/emulator only. Never bundled with EduMoney or installed on user devices.
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_DIR="$PROJECT_DIR/tests/fixtures/android-share-receiver"
QA_BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$QA_BUILD_DIR"' EXIT
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
: "${SDK_DIR:?Android SDK is required}"
if [ ! -f "$SDK_DIR/platforms/android-35/android.jar" ]; then
  sdkmanager 'platforms;android-35'
fi
ANDROID_JAR="$SDK_DIR/platforms/android-35/android.jar"
BUILD_TOOLS="$(printf '%s\n' "$SDK_DIR"/build-tools/* | sort -V | tail -1)"
mkdir -p "$QA_BUILD_DIR/classes" "$QA_BUILD_DIR/dex"
javac -source 8 -target 8 -classpath "$ANDROID_JAR" -d "$QA_BUILD_DIR/classes" "$FIXTURE_DIR/ReceiverActivity.java"
jar cf "$QA_BUILD_DIR/classes.jar" -C "$QA_BUILD_DIR/classes" .
"$BUILD_TOOLS/d8" --min-api 23 --lib "$ANDROID_JAR" --output "$QA_BUILD_DIR/dex" "$QA_BUILD_DIR/classes.jar"
"$BUILD_TOOLS/aapt2" link --manifest "$FIXTURE_DIR/AndroidManifest.xml" -I "$ANDROID_JAR" -o "$QA_BUILD_DIR/unsigned.apk"
zip -q -j "$QA_BUILD_DIR/unsigned.apk" "$QA_BUILD_DIR/dex/classes.dex"
"$BUILD_TOOLS/zipalign" -f 4 "$QA_BUILD_DIR/unsigned.apk" "$QA_BUILD_DIR/receiver.apk"
keytool -genkeypair -keystore "$QA_BUILD_DIR/qa.keystore" -storepass android -keypass android -alias qa -keyalg RSA -keysize 2048 -validity 1 -dname 'CN=Disposable local QA' >/dev/null 2>&1
"$BUILD_TOOLS/apksigner" sign --ks "$QA_BUILD_DIR/qa.keystore" --ks-pass pass:android --key-pass pass:android "$QA_BUILD_DIR/receiver.apk"
adb install -r "$QA_BUILD_DIR/receiver.apk"
