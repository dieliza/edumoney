# Cheques y talonarios: categorías y porcentajes personalizados

Fecha: 2026-11-13. Versión web: 2026.11.13.9. Rama de aplicación: web-edumoney. Sin cambios en GitHub main.

## Funcionalidad

- Se amplían los componentes existentes; se conservan OCR local, captura de fotos, entrada manual, documentos, categorías originales y registros anteriores.
- Acciones Añadir deducción, Añadir categoría y Editar. Las categorías personalizadas conservan su identidad al cambiar de nombre. Los nombres originales se mantienen; sus reglas pueden configurarse.
- Pestañas Importe fijo y Porcentajes (%). El porcentaje nuevo empieza vacío, acompañado de %. Ninguna tasa se completa automáticamente. Una categoría con una regla guardada utiliza el porcentaje que su usuario ya introdujo.
- Porcentajes decimales (punto o coma, hasta seis decimales), de 0 a 100. Cálculo con BigInt y centavos enteros, redondeo de mitades hacia arriba por deducción. Sin dependencias nuevas.
- Bases: ingreso bruto, importe ajustado con definición, importe personalizado con definición y umbral por pagador/año en Servicios PR. Las reglas incompletas no se ejecutan. Las reglas desactivadas no se aplican a pagos nuevos.
- Resultado por deducción con categoría, porcentaje, base e importe. Se actualiza al modificar bruto, base o porcentaje. Neto según el desglose visible aunque todavía no se haya confirmado el neto impreso; opción de usar automáticamente bruto menos deducciones o conservar el neto impreso confirmado.
- Categoría Retención por servicios profesionales (PR), separada de gastos ordinarios y de Seguro Social/Medicare. No se prescribe tasa ni se certifica elegibilidad contributiva.
- Umbral: pagador legal, año natural, umbral, porcentaje y acumulado anterior NO registrado en la app. Se añaden los brutos de pagos guardados del mismo pagador/año hasta la fecha, con orden de registro dentro del día. No se incluye el propio cheque al editarlo, ni otros pagadores/años. Un bruto previo desconocido requiere confirmación. El guardado vuelve a comprobar el historial dentro de la transacción para evitar cálculos obsoletos.
- La evidencia de cada pago conserva bruto, neto, total de deducciones cuando se conoce, nombres usados, importes y copia completa de regla/base/porcentaje/acumulado aplicados. Editar una plantilla nunca altera pagos anteriores ni líneas ya abiertas.
- Editar este cheque modifica únicamente su desglose y sus documentos/movimiento vinculados en una transacción, conserva la foto original y registra revisiones. Detecta versiones obsoletas, referencias repetidas y deducciones duplicadas. Un fallo revierte toda la edición.
- Los datos siguen en la base cifrada de cada usuario. No se añade una tabla global compartida ni un nuevo mecanismo de identidad. El enlace privado de sincronización existente transporta también categorías, reglas y snapshots.

## Archivos modificados

- src/modules/income/IncomeDocumentsScreen.tsx: formularios, administración, cálculo inmediato, total/neto y edición individual.
- src/modules/income/DeductionRuleEditor.tsx (nuevo): editor reutilizable, pestaña porcentajes y bases.
- src/modules/income/calculation.ts (nuevo): reglas, validación y aritmética decimal exacta.
- src/modules/income/domain.ts: categoría Servicios PR y snapshots compatibles con registros anteriores.
- src/modules/income/store.ts: categorías/reglas, historial por pagador y edición transaccional con auditoría.
- src/modules/documents/store.ts: valida reglas/historial antes de crear el ingreso.
- src/storage/schemaV16.ts (nuevo), src/storage/migrate.ts: migración aditiva.
- src/modules/backup/store.ts, src/modules/backup/BackupScreen.tsx: transporte y restauración de esquema 16 y compatibilidad 9–15.
- src/ui/buildVersion.ts: identificador de esta entrega.
- tests/income-deduction-rules.test.ts (nuevo), tests/income-statements.test.ts, tests/web-sync-client.test.ts: comprobaciones de reglas, regresión y sincronización.

## Migración

Esquema 15 → 16, transaccional:

1. Nueva tabla income_deduction_rules: category_id, rule_json, updated_at. Admite categorías originales y personalizadas sin alterar las tablas existentes.
2. Nueva tabla income_statement_revisions: evidencia anterior de cada edición de un cheque.
3. PRAGMA user_version = 16.

Los JSON anteriores de talonarios siguen siendo válidos. Los campos de cálculo/total son aditivos y opcionales para documentos antiguos. Respaldos 9–15 continúan siendo restaurables; como antes, restaurar reemplaza los datos actuales tras confirmación y la pantalla avisa qué datos nuevos faltan. Para sincronizar estos datos, ambos dispositivos necesitan esta versión.

## Verificación

60 ejecuciones de casos aprobadas, incluidas repeticiones; límite 100 respetado. 35 casos distintos cubiertos. Todos los datos son ficticios.

- Primera selección: income-deduction-rules + income-statements: 25 aprobados.
- Sincronización web cifrada y respaldo: 6 aprobados. Se trasladó categoría con regla y cheque calculado entre dos bóvedas IndexedDB independientes usando el cliente real y un servidor/almacenamiento simulados; también se probaron conflictos.
- Selección tras ajustes: income-deduction-rules + income-statements: 27 aprobados.
- Selección final de exportación CPA/total y duplicados manuales: 2 aprobados (15 omitidos por filtro).
- TypeScript, ESLint y git diff --check: correctos.
- Compilación de producción web: correcta.

Casos destacados: $1,500 × 8% = $120; neto $1,380; 3.5% = $52.50; coma decimal; redondeo de medio centavo; límites de enteros seguros; cambios de porcentaje/bruto/base; fijo vs porcentual; reglas incompletas/desactivadas; duplicados; permanencia tras renombrar; migración de base 15; importación/exportación 15 y 16; edición aislada, rechazo de versión antigua y rollback; retención de $20 al segundo pago de $400 tras uno de $300, umbral ficticio $500 y tasa introducida 10%; exclusión de otro pagador/año y del propio cheque; exportación CPA conserva regla histórica original.

## Límites y pendientes

- No se ejecutó QA visual: el entorno Sites administrado no ofrece cua_repl.js; su skill indica omitir el navegador en ese caso. No se afirma haber probado físicamente Android/iOS ni haber generado un APK nuevo. La web compilada utiliza los mismos modelos y cálculos; las pruebas verifican datos/sincronización, no el comportamiento visual en dispositivos reales.
- La sincronización conserva su funcionamiento anterior, por enlace cifrado y acción del usuario; no se convierte en sincronización automática ni se modifica autenticación.
- Los umbrales son reglas del usuario, no una determinación oficial. Identifica consistentemente al pagador legal y evita incluir pagos de la app también en el acumulado manual.
- Corregir un pago anterior no recalcula los posteriores: revisarlos es una acción explícita. Se muestra esa advertencia en el editor de umbrales.
- El registro financiero conserva la regla existente de neto positivo. Si el neto es cero o negativo, debe revisarse antes de guardar como ingreso recibido.
- El cambio de contraseña/recuperación por correo pertenece a otro trabajo y no se modifica en esta entrega, conforme al alcance solicitado.
