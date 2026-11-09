# Arquitectura y decisiones

## Viabilidad

React Native + Expo SDK 58 soporta iOS y Android con una base compartida. Proyecto nuevo: no existe migración.
SQLite con SQLCipher requiere compilación nativa personalizada. La generación nativa comprueba la configuración;
no sustituye una compilación con Xcode/Gradle ni una prueba física. Identificadores de paquete provisionales: com.edumoney.app.

## Límites

- `src/core`: modelos, UUID v4 criptográficos e importes USD en centavos enteros seguros.
- `src/storage`: clave, apertura cifrada y migraciones versionadas atómicas.
- `src/modules/money`: casos de uso y repositorios locales, cálculo de flujo/presupuesto, historial y UI nativa.
- `src/modules/bills`: facturas concretas, series, pagos, revisiones y avisos locales.
- `src/modules/debts`: saldos, pagos, conciliación, simulación determinística y planes de revisión.
- `src/modules/{goals,documents,tax,learning,progress}`: límites reservados para etapas futuras.
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
Un único vínculo activo de factura por movimiento evita repetir su pago, conservando los vínculos revertidos; las demás clases mantienen una relación única por movimiento; varias aportaciones/pagos
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
La navegación usa Expo Router, según AGENTS.md. Las cuatro pestañas nativas usan registros locales reales; la web mantiene demostraciones identificadas.

## Esquema 2 — Etapa 3

Migración aditiva: categorías archivables, presupuestos mensuales, programación de ingresos, relación única
programación/fecha de cobro y revisiones de movimientos. La confirmación del cobro y el avance de su próxima
fecha ocurren en una misma transacción. Las eliminaciones no liberan la clave de idempotencia ni la fecha
de una ocurrencia; restaurar conserva el identificador original.

`UserInputError` delimita mensajes revisados para el usuario. Las excepciones internas del almacenamiento
se convierten en un mensaje genérico en pantalla. No se registran consultas, claves ni datos financieros.

## Esquema 3 — Etapa 4

`bill_series` conserva frecuencia, ancla y próxima fecha por generar. `bills` representa cada obligación concreta;
serie/fecha de origen es única y no cambia al corregir el vencimiento visible.
`bill_payments` vincula cada pago a un movimiento y reserva un único vínculo activo por movimiento mediante un índice parcial. La migración conserva todos los pagos previos al reconstruir esa tabla. `bill_payment_reversals` conserva la reversión sin eliminar el vínculo histórico.
`bill_revisions` guarda motivo y valores anteriores de cada cambio o anulación.
El libro y las facturas comparten la cola de `MoneyStore`, incluidas transacciones de pago y generación.
Los avisos se derivan de obligaciones pendientes y preferencias cifradas; el SO recibe solo un título genérico y una fecha.
La copia opcional al calendario también es genérica y requiere confirmación del usuario en el diálogo del SO.

## Esquema 4 — Etapa 5

Cada deuda conserva fecha del saldo base, revisión de conciliación, condiciones conocidas y eventos antes/después.
`debt_payments` conserva un único vínculo activo por movimiento y el efecto de cada pago sobre la revisión de saldo que existía al confirmarlo.
Una conciliación posterior fija una nueva referencia; no vuelve a restar pagos antiguos ni se deshace al revertir un registro histórico.
`bills.debt_id` permite confirmar deuda y factura con un único movimiento en la cola transaccional compartida.
El calendario no inventa fechas y la simulación es pura: no escribe pagos ni intereses reales.
`debt_plans` y `debt_plan_actions` guardan revisiones manuales, separadas de los eventos financieros.

## Esquema 5 — Etapa 6

`goals` conserva tipo, objetivo, base previa, fecha deseada, frecuencia, archivo y versión. `goal_contributions` mantiene un único vínculo activo por movimiento y reversos históricos; la migración conserva los vínculos anteriores.
Ahorro = base previa + aportaciones vigentes. La base no genera flujo; una nueva aportación crea un movimiento reservado una sola vez. Se protegen los movimientos con comprobantes al revertir.
`goal_events` conserva estados anteriores y motivos al editar objetivos/base/archivo. No se modifica el historial al recalcular cumplimiento.
`progress_plans` y `progress_actions` son revisiones manuales de 90 días independientes del plan de deudas de 30 días.
Los indicadores se leen en una sola operación de la cola compartida; no guardan totales ficticios ni escriben movimientos al confirmar tareas. Los importes y redondeos usan centavos y BigInt.

## Esquema 6 — Etapa 7

`lesson_progress` identifica finalización por lección y versión de contenido. `lesson_attempts` conserva respuestas/resultado sin crear logros por intentos incorrectos; ejercicio y finalización se guardan en una transacción.
`decision_scenarios` guarda inputs, nombre y versión de fórmula; los resultados se derivan sin escribir movimientos. La UI rechaza comparar versiones no soportadas.
Los motores de cuota, recurrencia, ahorro y fondo operan en centavos/BigInt. El margen de comparación es elegido manualmente y queda desconocido si se omite.
Las variantes nativas usan SQLCipher; el adaptador web conserva su demostración. La voz se limita a contenido editorial con voz española básica disponible en iOS, con parada por navegación/segundo plano. Android usa texto cuando no puede verificarse la ejecución local del motor.

## Esquema 7 — Etapa 8

`documents` conserva movimiento o factura, origen, datos confirmados, huella, estado, versión y referencia de corrección. La migración conserva las referencias anteriores sin inventar fechas, importes ni archivos.
`document_contents` guarda la representación de la imagen dentro de SQLCipher; no se crean copias permanentes sin cifrar. `document_events` conserva estados anteriores y motivos de eliminación/revisión.
Guardar un recibo nuevo inserta documento y movimiento en una única transacción; una factura pendiente no crea pago. Adjuntar no modifica ni duplica el registro existente.
La corrección financiera desde un documento vigente mantiene las protecciones de otros módulos, audita el movimiento y marca sus comprobantes pendientes conservando los originales.
Captura/OCR y voz usan adaptadores nativos; la web conserva una demostración. Los temporales propios se limpian tras procesar y al iniciar. Cámara/micrófono solo por acción; OCR con modelo incluido y dictado local obligatorio sin fallback remoto.
`prepare-local-recognition.mjs` aplica parches acotados a versiones fijadas y verificados en pruebas antes de compilar. El control de carga de la imagen sintética está condicionado al build de CI; no aparece en compilaciones normales.
