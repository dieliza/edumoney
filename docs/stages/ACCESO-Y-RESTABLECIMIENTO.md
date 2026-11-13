# Acceso y restablecimiento — 2026-11-13

Rama: `web-edumoney`. No se modifica GitHub main.

Se añade mostrar/ocultar a los campos de contraseña. «Olvidé mi contraseña» abre una explicación y exige escribir RESTABLECER antes de empezar un espacio local vacío y solicitar contraseña nueva y repetición. No descifra registros antiguos con la contraseña nueva ni borra el servidor. Una transacción conserva la base y ajustes anteriores cifrados bajo identificadores de recuperación únicos antes de retirar las copias activas. No hay interfaz de restauración de estas copias archivadas todavía; su descifrado requiere la contraseña original. Los respaldos y el código de sincronización siguen siendo vías independientes de recuperación.

Se serializan las aperturas y se obtiene la exclusión entre pestañas antes de leer la base; se rechaza abrir otra conexión encima de una sesión abierta. Evita conservar conexiones con claves obsoletas, pero no prueba que sea la causa del fallo comunicado tras varias horas. No se cambian las claves ni formatos de las bases existentes al desbloquear.

La APK usa SQLCipher con clave de SecureStore, sin formulario de contraseña local ni código de logout que la elimine. La revisión no encontró borrado de clave al salir. Si falta una clave con una base existente, la aplicación conserva los datos y rechaza generar otra. No se reprodujo el incidente en un dispositivo físico ni se generó un APK nuevo.

Validación final: 8 casos web y 3 de claves nativas pasados; TypeScript, ESLint, exportación web y empaquetado correctos. Se ejecutaron 19 casos contando repeticiones: una expectativa antigua sobre la exclusión de pestañas falló inicialmente y se adaptó al nuevo bloqueo temprano; la repetición de 8 pasó. Sin comprobación visual: entorno Sites administrado sin cua_repl.js.

Publicación pendiente: el conector Sites rechazó emitir credenciales con `sites_git_client_upgrade_required` (409): exige una sesión Work compatible o actualizar el cliente/plugin. La versión publicada anterior permanece intacta. El artefacto nuevo está preparado localmente; no se presentó como publicado ni se intentó eludir la restricción.
