/** Parches acotados y versionados: modelo OCR incluido y dictado sin fallback remoto. */
import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(p,'utf8');
assert.equal(JSON.parse(read('node_modules/expo-text-extractor/package.json')).version,'2.0.0');
assert.equal(JSON.parse(read('node_modules/expo-speech-recognition/package.json')).version,'58.0.1');
writeFileSync('node_modules/expo-text-extractor/android/build.gradle',`plugins {
  id 'com.android.library'
  id 'expo-module-gradle-plugin'
}
group = 'expo.modules.textextractor'
version = '2.0.0'
android { namespace 'expo.modules.textextractor' }
dependencies { implementation 'com.google.mlkit:text-recognition:16.0.1' }
`);
const voice='node_modules/expo-speech-recognition/ios/ExpoSpeechRecognizer.swift';
let s=read(voice);
const before=`    if recognizer.supportsOnDeviceRecognition {
      request.requiresOnDeviceRecognition = options.requiresOnDeviceRecognition
    }`;
const after=`    // EduMoney: fail closed, even if the selected language has no on-device model.
    request.requiresOnDeviceRecognition = options.requiresOnDeviceRecognition`;
if(!s.includes(after)){assert.ok(s.includes(before),'Revisar API de dictado antes de actualizar');s=s.replace(before,after);writeFileSync(voice,s);}
const module='node_modules/expo-speech-recognition/ios/ExpoSpeechRecognitionModule.swift';s=read(module);
const all='      let installedLocales = supportedLocales';
const local=`      let installedLocales = supportedLocales.filter {
        SFSpeechRecognizer(locale: Locale(identifier: $0))?.supportsOnDeviceRecognition == true
      }`;
if(!s.includes(local)){assert.ok(s.includes(all));writeFileSync(module,s.replace(all,local));}
console.log('Reconocimiento: OCR incluido y dictado iOS con requisito local incondicional.');
// El módulo OCR solo acepta archivos locales y cierra sus recursos nativos.
writeFileSync('node_modules/expo-text-extractor/ios/ExpoTextExtractorModule.swift',`import ExpoModulesCore
import Vision
import Foundation

public class ExpoTextExtractorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoTextExtractor")
    Constants(["isSupported": true])
    AsyncFunction("extractTextFromImage") { (uri: String, promise: Promise) in
      do {
        let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
        guard url.isFileURL else { throw NSError(domain: "EduMoneyOCR", code: 1) }
        let request = VNRecognizeTextRequest { request, error in
          if let error = error { promise.reject(error); return }
          let observations = request.results as? [VNRecognizedTextObservation] ?? []
          let parts = observations.compactMap { item -> (String, CGRect)? in
            guard let text = item.topCandidates(1).first?.string else { return nil }
            return (text, item.boundingBox)
          }.sorted { $0.1.midY > $1.1.midY }
          var rows: [(y: CGFloat, height: CGFloat, items: [(CGFloat, String)])] = []
          for (text, box) in parts {
            if let index = rows.indices.first(where: { abs(rows[$0].y - box.midY) <= max(rows[$0].height, box.height) * 0.55 }) {
              rows[index].items.append((box.minX, text))
            } else { rows.append((box.midY, box.height, [(box.minX, text)])) }
          }
          promise.resolve(rows.map { row in row.items.sorted { $0.0 < $1.0 }.map { $0.1 }.joined(separator: "  ") })
        }
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["es-ES", "en-US"]
        request.usesLanguageCorrection = true
        try VNImageRequestHandler(url: url, options: [:]).perform([request])
      } catch { promise.reject(error) }
    }
  }
}
`);
writeFileSync('node_modules/expo-text-extractor/android/src/main/java/expo/modules/textextractor/ExpoTextExtractorModule.kt',`package expo.modules.textextractor
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
class ExpoTextExtractorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoTextExtractor")
    Constants("isSupported" to true)
    AsyncFunction("extractTextFromImage") { path: String, promise: Promise ->
      try {
        val uri = if (path.startsWith("file://")) Uri.parse(path) else Uri.fromFile(File(path))
        require(uri.scheme == "file")
        val image = InputImage.fromFilePath(appContext.reactContext!!, uri)
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        recognizer.process(image).addOnSuccessListener { result -> val rows = mutableListOf<MutableList<Text.Line>>()
          for (line in result.textBlocks.flatMap { it.lines }.filter { it.boundingBox != null }.sortedBy { it.boundingBox!!.centerY() }) {
            val box = line.boundingBox!!
            val row = rows.firstOrNull { kotlin.math.abs(it.first().boundingBox!!.centerY() - box.centerY()) <= kotlin.math.max(it.first().boundingBox!!.height(), box.height()) * 0.55 }
            if (row != null) row.add(line) else rows.add(mutableListOf(line))
          }
          promise.resolve(rows.map { row -> row.sortedBy { it.boundingBox!!.left }.joinToString("  ") { it.text } }) }
          .addOnFailureListener { error -> promise.reject("OCR_FAILED", "No se pudo reconocer localmente", error) }
          .addOnCompleteListener { recognizer.close() }
      } catch (error: Exception) { promise.reject("OCR_FAILED", "No se pudo reconocer localmente", error) }
    }
  }
}
`);
