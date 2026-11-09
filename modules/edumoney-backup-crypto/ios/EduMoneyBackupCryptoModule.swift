import ExpoModulesCore
import Foundation
import CommonCrypto
public class EduMoneyBackupCryptoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EduMoneyBackupCrypto")
    AsyncFunction("deriveKey") { (password: String, saltHex: String) -> String in
      guard password.utf16.count >= 12, password.utf16.count <= 256,
        saltHex.range(of: "^[a-f0-9]{32}$", options: .regularExpression) != nil else {
        throw NSError(domain: "EduMoneyBackup", code: 1)
      }
      let bytes = Array(saltHex.utf8)
      let salt = Data(stride(from: 0, to: bytes.count, by: 2).map { i in
        UInt8(String(bytes: bytes[i...i+1], encoding: .utf8)!, radix: 16)!
      })
      var passwordBytes = Data(password.utf8)
      var key = Data(repeating: 0, count: 32)
      let passwordCount = passwordBytes.count
      let status = passwordBytes.withUnsafeBytes { pass in
        salt.withUnsafeBytes { saltPointer in
          key.withUnsafeMutableBytes { output in
            CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2),
              pass.bindMemory(to: Int8.self).baseAddress, passwordCount,
              saltPointer.bindMemory(to: UInt8.self).baseAddress, salt.count,
              CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), 600000,
              output.bindMemory(to: UInt8.self).baseAddress, 32)
          }
        }
      }
      defer { passwordBytes.resetBytes(in: 0..<passwordBytes.count); key.resetBytes(in: 0..<key.count) }
      guard status == kCCSuccess else { throw NSError(domain: "EduMoneyBackup", code: 2) }
      return key.map { String(format: "%02x", $0) }.joined()
    }
  }
}
