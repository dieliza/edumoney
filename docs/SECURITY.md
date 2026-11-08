# Seguridad local

## Base preparada

- SQLCipher cifra la base SQLite (incluye metadatos y texto). `useSQLCipher: true` se aplica en ambos proyectos nativos.
- Clave aleatoria local de 256 bits mediante expo-crypto; se guarda en SecureStore (Keychain/Keystore).
- En iOS la clave usa WHEN_UNLOCKED_THIS_DEVICE_ONLY. No se registra, exporta ni guarda en SQLite.
- Antes de crear tablas se exige `cipher_version` y se lee sqlite_master para comprobar la clave.
- Si existe la base y falta la clave, se detiene la apertura; no se recrean ni borran los datos.
- Consultas parametrizadas para entradas del usuario; la clave interpolada se valida estrictamente como hex de 64 caracteres.
- Errores de UI genéricos sin rutas, SQL, claves ni importes; no hay telemetría propia.
- Android: allowBackup=false y reglas que excluyen todos los dominios tanto de cloud backup como de device transfer.
- iOS: Documents se excluye de copias iCloud/Finder al arrancar, antes de iniciar React Native; si falla, se detiene el inicio.
- Expo Updates deshabilitado. Sin cuentas, servidor de datos, sincronización ni dependencias de IA.

## Documentos y recuperación

Etapa 1 solo define metadatos y relaciones. No existe escritura/lectura de imágenes o archivos sensibles.
En Etapa 8, implementar un almacén de documentos con cifrado autenticado AES-256-GCM, nonce único por archivo,
clave independiente en SecureStore y rutas internas aleatorias, sin nombres de comercios. No guardar imágenes en
AsyncStorage ni galería sin decisión del usuario. Hash y metadatos permanecen en SQLite cifrado.
No conectar cámara/voz hasta validar procesamiento local y revisión manual.

Los respaldos manuales cifrados, recuperación, cambio/rotación de clave, bloqueo biométrico opcional y borrado
seguro integral son trabajo posterior. No existe respaldo automático. Desinstalar o perder el dispositivo/clave
puede impedir recuperar datos. La pantalla técnica no permite capturar información real todavía.
El cifrado en reposo no protege un dispositivo comprometido ni la memoria mientras la aplicación está abierta.

## Validación nativa pendiente

En cada plataforma: primera apertura, cerrar/reabrir, verificar cipher_version, comprobar que un lector SQLite sin clave
no abre una copia, probar clave incorrecta/ausente sin pérdida, bloqueo de dispositivo y exclusiones de backup.
Verificar ausencia de tráfico de datos en una compilación release en modo avión. No afirmar validación física por pasar
pruebas de SQLite de escritorio: esas pruebas no utilizan SQLCipher.
