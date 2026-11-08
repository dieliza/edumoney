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
puede impedir recuperar datos. Mi dinero permite registrar información local; la recuperación mediante respaldo manual todavía no está implementada.
El cifrado en reposo no protege un dispositivo comprometido ni la memoria mientras la aplicación está abierta.

## Validación nativa pendiente

En cada plataforma: primera apertura, cerrar/reabrir, verificar cipher_version, comprobar que un lector SQLite sin clave
no abre una copia, probar clave incorrecta/ausente sin pérdida, bloqueo de dispositivo y exclusiones de backup.
Verificar ausencia de tráfico de datos en una compilación release en modo avión. No afirmar validación física por pasar
pruebas de SQLite de escritorio: esas pruebas no utilizan SQLCipher.

## Evidencia actual de simuladores

La apertura y reapertura nativas ya pasaron en Android e iOS. En iOS se verificó además el archivo cifrado,
el rechazo de lectura sin clave y el atributo de exclusión de backup. Ver resultados y límites en
[Etapa 1](stages/01.md). Los puntos de la lista anterior que requieren dispositivos físicos, pérdida de clave,
restauración y tráfico de red siguen pendientes. El paquete iOS de CI usa firma local de Xcode con permisos
incorporados durante la compilación para simulador; no reutilizar esos permisos de prueba como perfil de distribución.

## Etapa 3

Los movimientos, campos salariales, categorías, presupuestos, programaciones y revisiones se guardan únicamente
en SQLCipher. AsyncStorage conserva solo la apariencia. No hay adaptador financiero web sin cifrado.
Las entradas SQL se parametrizan; las operaciones se serializan y se revierten ante errores. Los identificadores
se conservan durante correcciones y eliminación lógica. Los errores de validación usan mensajes revisados;
los errores internos de base de datos se ocultan en pantalla. Las pruebas utilizan datos sintéticos.

La [verificación de Etapa 3](stages/03.md) comprueba el recorrido financiero nativo y, en iOS, el archivo cifrado
después de registrar y corregir movimientos: rechazo de lectura sin clave, huella estable al reiniciar
y exclusión de respaldo. Se mantienen pendientes las comprobaciones físicas y de recuperación general.

## Etapa 4

Facturas, series, pagos y revisiones permanecen en SQLCipher. Todos los módulos comparten la cola de transacciones de la conexión cifrada.
Los avisos del SO no contienen proveedor, importe ni notas financieras. Se solicita permiso solo por acción del usuario;
se desactiva la capacidad de push remoto en iOS y la inicialización automática de mensajería Firebase en Android.
No se solicitan tokens ni se configura un servicio de envío remoto.
La copia opcional al calendario solo propone un evento genérico y requiere confirmación del usuario; el calendario elegido puede sincronizarse fuera de EduMoney.
