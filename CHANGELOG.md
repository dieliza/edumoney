# Registro de cambios por etapa

## Etapa 1 — Base técnica y seguridad

- Inspección de repositorio vacío y selección de Expo/React Native con TypeScript.
- Modelos locales y esquema relacional versionado para movimientos, facturas, deudas, metas, documentos y revisión contributiva.
- Dinero en centavos, UUID, claves de idempotencia, referencias e índices únicos.
- Apertura SQLCipher con SecureStore, protección ante clave perdida y exclusión de copias automáticas.
- Pantalla técnica mínima, pruebas automáticas e instrucciones de validación nativa.
- Sin avance a Etapa 2 ni implementación de pantallas financieras.

### Seguimiento — compilación y pruebas nativas

- CI en GitHub Actions para Android e iOS sin publicación.
- Prueba Maestro de primera apertura y reapertura del almacenamiento cifrado.
- Capturas y compilaciones de simulador como evidencias descargables.

### Resultados de validación nativa

- Android compilado y apertura/reapertura sin Wi-Fi ni datos aprobadas en emulador.
- iOS compilado con firma local de Xcode y permisos de llavero; primera apertura/reapertura aprobadas en simulador.
- Verificación iOS directa de cabecera cifrada, rechazo de lectura sin clave, huella estable y exclusión de backup.
- Evidencias y resultados en docs/stages/01.md; pruebas físicas y recuperación siguen pendientes.

## Etapa 2 — Diseño visual y navegación

- Bienvenida con lema oficial y acceso a demostración sin cuenta.
- Cuatro pestañas y datos ficticios visibles en ambos temas.
- Temas claro/oscuro/automático con preferencia local persistente y controles accesibles.
- Tokens, componentes reutilizables, adaptación de anchos y pruebas de navegación/contraste.
- Conservación de apertura cifrada nativa; sin conexión de funciones financieras.
- Logo original pendiente de entrega; no se recrea el logo de los bocetos.

### Seguimiento de verificación visual

- 20 pruebas unitarias y 3 recorridos de navegador aprobados; TypeScript, ESLint y Expo Doctor sin errores.
- Navegación y persistencia verificadas en iOS/Android; capturas en docs/stages/evidence.
- Ajuste de barra de estado y apariencia nativa al cambiar de tema.
- Automatización adaptada a metadatos del selector iOS y avisos de Quickstep del emulador Android.
- Galería en Markdown para revisar ambos temas sin descargar ZIP.

## Etapa 3 — Mi dinero y presupuesto personal

- Libro nativo cifrado inicialmente vacío; vista web y otras pestañas conservan su demostración identificada.
- Ingresos manuales, extraordinarios y recurrentes con confirmación; gastos, transferencias, préstamos y pagos diferenciados.
- Historial filtrable, correcciones auditadas, eliminación reversible y prevención de duplicados.
- Categorías personalizables, presupuesto mensual y gráficas calculadas con datos registrados.
- Migración aditiva a esquema 2, controles de versión y protección de vínculos.
- Campos de revisión contributiva opcionales sin inferir deducibilidad ni calcular planillas.

### Verificación y presentación

- 34 pruebas de dominio/SQLite, TypeScript, ESLint y tres recorridos de navegador aprobados.
- Registro, reapertura, temas y corrección comprobados en Android e iOS; presupuesto y restante persistente comprobados también desde la interfaz Android.
- Archivo iOS cifrado y estable tras guardar movimientos y reiniciar; exclusión de respaldo comprobada.
- Formularios adaptados al teclado e importe grande con altura de línea suficiente.
- Galería y guía de uso en docs/stages/evidence/03 y docs/USAR_MI_DINERO.md.

## Etapa 4 — Facturas y recordatorios

- Facturas manuales y recurrentes, vistas Próximas/Pagadas/Calendario y próximas facturas reales en Mi dinero.
- Pagos completos/parciales vinculados atómicamente, opción de vincular movimientos previos y prevención de duplicados.
- Cambios de fecha auditados, reversión de pagos y anulación controlada del pendiente.
- Avisos locales genéricos, conciliación tras cambios, permisos opcionales y copia manual al calendario.
- Migración transaccional 2→3 y 18 pruebas adicionales de lógica/SQLite/avisos; registro de push remoto desactivado.

- Un gasto desvinculado por error puede vincularse a la factura correcta, conservando ambos registros históricos sin duplicar importes.

### Verificación final de Etapa 4

- 52 pruebas de lógica/SQLite, tipos y lint aprobados; tres pruebas de navegador sin regresiones.
- Recorridos completos aprobados en simuladores Android e iOS: pagos parciales, ambos temas, agenda, reapertura y aviso local cancelado al pagar.
- Cifrado, estabilidad al reabrir y exclusión de respaldo comprobados en iOS después de guardar facturas y pagos.
- Galería con datos ficticios y guía de uso publicadas; Etapa 5 sin iniciar.

## Etapa 5 — Deudas y Ordenar mis pagos

- Tarjetas, préstamos personales, de auto y otras obligaciones con saldos, condiciones conocidas y campos desconocidos conservados.
- Pagos completos/parciales, desglose opcional, movimientos compartidos con facturas y conciliaciones auditadas sin duplicar importes.
- Calendario, advertencias de mínimos/vencimientos, historial y archivo/reactivación controlados.
- Simulación determinística de bola de nieve y avalancha con presupuesto constante, aporte extra y cambios de tasa conocidos.
- Plan persistente de revisiones de 30 días; confirmar tareas no registra pagos.
- Migración transaccional 3→4 y 23 pruebas nuevas; 75 pruebas de lógica/SQLite aprobadas.

### Verificación final de Etapa 5

- Recorridos Android e iOS aprobados: pago compartido con factura, saldo persistente, calendario, simulación y plan de 30 días.
- 75 pruebas de lógica/SQLite, tipos, lint y tres pruebas de navegador aprobados.
- Android sin conexión; cifrado y exclusión de respaldo verificados en iOS después del recorrido.
- Contraste de títulos corregido sobre tarjetas claras del tema oscuro; capturas y guía disponibles en docs/stages/evidence/05.
- Etapa 6 pendiente de revisión; aplicación sin publicar.

## Etapa 6 — Mis metas y Mi progreso

- Metas editables, ahorro previo, aportaciones e historial con correcciones controladas.
- Movimientos únicos vinculados y reserva de flujo sin duplicar ingresos o gastos.
- Indicadores calculados desde registros reales y plan manual persistente de 90 días.
- Migración 4→5 preservando metas históricas; 19 pruebas nuevas, 94 en total.

### Verificación final de Etapa 6

- 94 pruebas de lógica/SQLite, tipos, lint y tres pruebas de navegador aprobados.
- Recorridos Android sin conexión e iOS aprobados: creación, aportación única, cambio de objetivo, progreso y plan persistentes al reabrir.
- Cifrado, rechazo de lectura sin clave y exclusión de respaldo comprobados en iOS.
- Galería de 20 capturas y guía de uso disponibles; etapa 7 sin iniciar y main sin modificar.

## Etapa 7 — Aprende y Antes de decidir

- Diez microlecciones con ejercicios, explicación y progreso versionado persistente.
- Seis simuladores locales: vehículo, vivienda, préstamo, gasto recurrente, ahorro y fondo de emergencia.
- Escenarios independientes con comparación, inputs y fórmula versionada, sin movimientos financieros.
- Lectura iOS con voz básica disponible; alternativa textual cuando no se puede verificar una voz local.
- Migración 5→6 y 23 pruebas nuevas; 117 pruebas totales aprobadas.

### Verificación final de Etapa 7

- 117 pruebas de lógica/SQLite, TypeScript, ESLint y tres pruebas de navegador aprobados.
- Android sin conexión e iOS: ejercicio, dos escenarios comparados, temas y reapertura persistente aprobados.
- Voz española disponible detectada en iOS, interfaz/parada comprobadas; Android conserva texto al no poder verificar el motor local. Audio físico pendiente.
- Cifrado, rechazo de SQLite sin clave, huella estable y exclusión de respaldo verificados en iOS.
- Galería de 18 capturas y guía disponibles. Etapa 8 pendiente de revisión; main sin cambios y Negocio reservado.

## Etapa 8 — Escaneo, voz y documentos

- Cámara/selector y OCR local, dictado con requisito local y alternativa manual.
- Revisión obligatoria y distinción entre recibo, ingreso, factura pendiente, adjunto y nota.
- Copia opcional dentro de SQLCipher, temporales eliminados, huella y protección de duplicados.
- Referencias de corrección y movimientos auditados con revisión documental pendiente.
- Migración 6→7 preservando documentos; 37 pruebas adicionales, 154 en total.

### Verificación final de Etapa 8

- 154 pruebas, TypeScript, ESLint y 3 recorridos de navegador aprobados.
- Android sin conexión e iOS: OCR real, revisión, copia cifrada, reinicio, eliminación de copia, duplicado bloqueado y factura pendiente aprobados.
- Cifrado, rechazo de SQLite sin clave, huella estable y exclusión de backup verificados en iOS con y sin copia.
- Galería de 20 capturas y guía de uso. Cámara y audio físicos pendientes de validación en dispositivos.
- Etapa 9 pendiente de revisión; main sin cambios, sin push y Negocio reservado.

## Etapa 9 — Para mi contable

- Perfil opcional por año, revisión de movimientos/documentos, uso mixto justificado y estados.
- Informativas versionadas, conciliación de bruto/retención/neto y pendientes/posibles duplicados.
- Exportación explícita JSON o CSV con copias por selección, revisión y limpieza de temporales.
- Migración 7→8 atómica; 20 pruebas adicionales (174 en total).
- Sin motor de planilla, sin push, main sin cambios y Negocio reservado.
