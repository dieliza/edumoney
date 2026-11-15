# Encabezado y escaneo — 2026.11.15.12

## Cambios
- Cuatro controles en una fila: notificaciones, tema, gráficas, menú. En teléfonos se dedica una fila para no comprimir el título; se conservan acciones y seguridad.
- Tomar fotos e Historial de documentos comparten tamaño y componente visual NeonActionButton del Home. Buscar en fotos permanece disponible sin capture.
- Se retira el acceso duplicado Configurar lector del escáner; continúa en Configuración → API e IA.
- Primera cámara sin lector configurado conduce a configuración, con retorno explícito. Solo se guarda una preferencia de visita por espacio; no claves, fotos ni datos financieros. No se abre automáticamente la cámara al regresar: el siguiente toque activa el input sin espera asíncrona, para conservar el gesto requerido por Safari. Lectores ya configurados continúan directamente.
- Acción del detalle: Editar esta transacción; mismo editor y protecciones. Símbolo informativo amarillo en oscuro y azul en claro; enlace de privacidad azul contrastante y subrayado.

## Validación
- TypeScript y ESLint: correctos. Build web/PWA: correcto. git diff --check: correcto.
- 12 casos aprobados: reader-setup (5), header-scanner-layout (2), neon-button-actions (1), transaction-history-ui (4).
- Primera ejecución: 8 aprobados y una suite sin iniciar casos debido a un mock ausente de SVG/React Native. Se añadió el mock del botón al test SSR; sus cuatro casos pasaron después. Total ejecutado: 12 casos, sin repetir casos completados; inferior al límite de 100.
- Cobertura: orden horizontal, mismas acciones de tiles, galería conservada, primera visita, lector configurado, persistencia aislada por espacio, lecturas tardías, fallo de almacenamiento y limpieza al bloquear, formularios/historiales existentes.
- Pendiente en dispositivos físicos: Safari iPhone/iPad, PWA instalada, Chrome Android, cámara/cancelar/reintentar y contraste visual final. Entorno sin herramientas de navegador; no se afirma validación visual ni nativa.

## Compatibilidad
Sin migraciones ni dependencias nuevas. Sin cambios en cálculos, registros, autenticación, API/modelo Anthropic, autorización de fotos o facturación. Reversión mediante commits de esta etapa; la preferencia de onboarding es aditiva y puede ignorarse.
