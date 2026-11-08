# Arquitectura y decisiones

## Viabilidad

React Native + Expo SDK 58 soporta iOS y Android con una base compartida. Proyecto nuevo: no existe migración.
SQLite con SQLCipher requiere compilación nativa personalizada. La generación nativa comprueba la configuración;
no sustituye una compilación con Xcode/Gradle ni una prueba física. Identificadores de paquete provisionales: com.edumoney.app.

## Límites

- `src/core`: modelos, UUID v4 criptográficos e importes USD en centavos enteros seguros.
- `src/storage`: clave, apertura cifrada y migraciones versionadas atómicas.
- `src/modules/money`: casos de uso y repositorios locales, cálculo de flujo/presupuesto, historial y UI nativa.
- `src/modules/{bills,debts,goals,documents,tax,learning,progress}`: límites reservados para etapas futuras.
- `tests`: pruebas de dominio, clave y SQLite real en archivos temporales sin datos personales.
- `plugins/withLocalOnly.cjs`: exclusión de copias automáticas iOS/Android.

La UI llama al almacén de su módulo; este serializa operaciones sobre la conexión cifrada y coordina escrituras en transacciones explícitas.
Ningún módulo llama a servicios remotos. No se incorporan SDK de IA, analítica, autenticación ni sincronización.
No hay funciones de reconocimiento, simulación ni reglas contributivas implementadas todavía.

## Modelo y relaciones

`movements` es la fuente única de ingresos/gastos y movimientos. `kind` distingue transferencias, préstamos,
pagos de deuda y aportaciones; no sumar todos los movimientos como gastos. En etapas posteriores los casos de uso
aplicarán reglas de contabilización, principal/intereses y conciliación. Mi dinero calcula un disponible estimado mensual desde cero; no lo presenta como saldo bancario. Las compras a crédito cuentan como gasto/presupuesto y sus pagos solo reducen el flujo de efectivo.

`bill_payments`, `debt_payments`, `goal_contributions` referencian movimientos existentes mediante claves foráneas.
Una relación de cada clase por movimiento evita repetir el mismo pago en esa sección; varias aportaciones/pagos
parciales usan movimientos distintos. Una operación que afecte varias secciones reutilizará el mismo movimiento.
El ahorro acumulado se derivará de aportaciones, sin mantener otro total independiente.

UUID v4 identifica entidades; `idempotency_key` identifica la operación de guardado y se conserva al reintentar.
Reintentar la misma operación con datos idénticos devuelve el registro existente. Reutilizar la clave con datos distintos produce un error; no se alteran importes.
No se deduplican compras distintas solo por compartir comercio, fecha e importe.
`documents.sha256` detectará imágenes idénticas cuando se implemente la captura. Un documento corregido referencia
al anterior mediante `supersedes_id`; no se sobreescribe su procedencia.

Las eliminaciones de movimientos se preparan con `deleted_at` para conservar relaciones; el comportamiento de
edición y eliminación controlada ya conservan auditoría, exigen motivo y bloquean vínculos con otras secciones. No hay cascadas destructivas.

Los importes se parsean con BigInt y se almacenan como centavos enteros; se rechazan fracciones de centavo y
valores fuera del rango seguro. Intereses/redondeos requieren reglas determinísticas en sus etapas; no existen aún.
Fechas civiles usan YYYY-MM-DD; marcas de creación usan ISO UTC. Tasas desconocidas y datos salariales ausentes
permanecen NULL. Marcar revisión contributiva no implica deducibilidad. `use_kind` permite personal/comercial/mixto/desconocido.

## Evolución

Migraciones con `PRAGMA user_version`, transacción y rollback. Se rechaza una versión futura desconocida.
Cada etapa debe actualizar CHANGELOG y su informe, ejecutar pruebas relevantes y corregir errores antes de avanzar.
La navegación usa Expo Router, según AGENTS.md. Mi dinero nativo contiene registros reales; las demás pestañas y la web mantienen demostraciones identificadas.

## Esquema 2 — Etapa 3

Migración aditiva: categorías archivables, presupuestos mensuales, programación de ingresos, relación única
programación/fecha de cobro y revisiones de movimientos. La confirmación del cobro y el avance de su próxima
fecha ocurren en una misma transacción. Las eliminaciones no liberan la clave de idempotencia ni la fecha
de una ocurrencia; restaurar conserva el identificador original.

`UserInputError` delimita mensajes revisados para el usuario. Las excepciones internas del almacenamiento
se convierten en un mensaje genérico en pantalla. No se registran consultas, claves ni datos financieros.
