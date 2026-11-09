package expo.modules.edumoneybackupcrypto
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
class EduMoneyBackupCryptoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EduMoneyBackupCrypto")
    AsyncFunction("deriveKey") { password: String, saltHex: String ->
      require(password.length in 12..256 && saltHex.matches(Regex("[a-f0-9]{32}")))
      val salt = saltHex.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
      val chars = password.toCharArray()
      val spec = PBEKeySpec(chars, salt, 600000, 256)
      try {
        val key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
        try { key.joinToString("") { "%02x".format(it.toInt() and 255) } }
        finally { key.fill(0) }
      } finally { spec.clearPassword(); chars.fill('\u0000') }
    }
  }
}
