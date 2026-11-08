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
- Migración transaccional 3→4 y 22 pruebas nuevas; 74 pruebas de lógica/SQLite aprobadas.
