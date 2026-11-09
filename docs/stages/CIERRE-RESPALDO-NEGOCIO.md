# Cierre de calidad — recuperación integrada de Negocio y nómina

Rama `cierre-respaldo-negocio`, continuando las comprobaciones móviles de tasas y exportación. No se cambia código de aplicación ni dependencias. No se modifica main ni se publica.

## Resultado

Un respaldo esquema 14, creado con las funciones de cifrado de EduMoney y una contraseña ficticia UTF-8, se escribe en archivo y se recupera en otra base SQLite inicialmente vacía. Después de cerrar y reabrir el archivo de destino se conserva la igualdad de todas las tablas del caso.

El conjunto introduce mediante servicios reales un titular, DBA, dos proyectos, un gasto mixto de $55.00 repartido entre proyectos, copia de una imagen ficticia, tres reservas y una nómina confirmada con depósito parcial. Se comprueban:

- Gasto único de $55.00, parte comercial $20.63 y misma exportación por titular después de reabrir; imagen recuperada byte por byte.
- Un pago salarial, bruto $2,200.00 y neto $1,970.19; misma conciliación/exportación antes y después de reabrir. La nómina no crea otro movimiento financiero.
- Repetir la restauración conserva exactamente las tablas, sin añadir registros; se rechaza confirmar otra vez el pago ya confirmado.
- Después de recuperar se registra el depósito PR restante de $34.91, que junto a $20.00 deja $54.91 depositados y $0.00 pendiente.
- Contraseña incorrecta, archivo alterado o ausencia de RESTAURAR mantienen el destino intacto.
- Una referencia de depósito rota revierte toda la sustitución, incluidas imágenes, reservas, movimientos y nómina; se conserva incluso una reserva modificada después del respaldo.

No se publican contraseñas de usuario, bases, claves ni respaldos. Las frases y registros del código son exclusivamente ficticios; los archivos temporales se eliminan al terminar.

## Archivos

- `tests/business-recovery.test.ts`: tres casos de recuperación integrada con la implementación actual de respaldo y servicios SQLite.
- `docs/SECURITY.md`: se corrigen instrucciones antiguas que afirmaban que imágenes y respaldo no estaban implementados; se describe almacenamiento actual en SQLCipher y recuperación manual con contraseña.
- `docs/PRIVACY.md`, `docs/QUALITY_RELEASE.md` y README: estado vigente y separación de los recorridos móviles comprobados frente a lo pendiente.
- [Registro de ejecución](evidence/business-recovery/execution.json).

## Pruebas ejecutadas

`npm test -- tests/business-recovery.test.ts tests/backup.test.ts --reporter=verbose`: **8 casos aprobados** en dos archivos, una ejecución, 47.83 s. Incluye tres casos nuevos y cinco existentes de cifrado/recuperación; estos últimos contrastan AES-GCM/PBKDF2 con WebCrypto independiente y controlan estructura, parámetros, versiones y relaciones.

TypeScript y ESLint aprobados. No se ejecuta la suite completa, no se repiten casos aprobados y no se inicia CI. Total de este bloque: 8, inferior al límite de 100.

## Límites y siguiente revisión

Es una prueba de recuperación de archivo cifrado con SQLite de escritorio, no una verificación de SQLCipher o del almacén seguro de un teléfono. No prueba la selección del archivo desde Archivos ni la recuperación entre instalaciones físicas. La derivación nativa iOS/Android conserva su evidencia previa; no se vuelve a ejecutar en este bloque.

El caso contiene perfiles, movimiento mixto, documento, reservas y nómina; no introduce registros de IVU, contratistas o escenarios del panel. Esas funciones conservan sus pruebas específicas previas, sin atribuirles una nueva prueba integrada aquí. Sus recorridos nativos completos y accesibilidad física siguen pendientes.

No se detectó un fallo funcional en los ocho casos ejecutados. La revisión oficial de formularios contributivos, redondeos y distribución sigue pendiente; no se añade un bloqueo de CPA al cálculo autónomo. [Matriz actual de calidad](../QUALITY_RELEASE.md).
