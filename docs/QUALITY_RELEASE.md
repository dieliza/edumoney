# Calidad y preparación de publicación

## Comprobaciones automatizadas disponibles

- Pruebas de lógica con importes enteros y casos límite; migraciones con rollback y referencias entre módulos.
- Navegación, temas, tamaños de pantalla y contraste web con Playwright/Axe.
- Recorridos nativos iOS/Android con datos ficticios; Android sin Wi-Fi ni datos.
- SQLCipher, rechazo de SQLite sin clave, persistencia y exclusión de respaldos automáticos en las pruebas iOS.
- Respaldo con contraseña, cifrado autenticado contrastado con WebCrypto, detección de alteraciones, validación de esquema y restauración atómica.
- En etapa 10 se registran memoria y arranque de la actividad Android en el simulador. Son mediciones técnicas de ese entorno, no promesas de rendimiento o batería en un teléfono real.

## Pruebas físicas pendientes antes de publicar

1. iPhone y Android reales de distintas capacidades: cámara, micrófono/modelos locales, calendario y avisos locales.
2. VoiceOver/TalkBack, tamaño máximo de letra, reducción de movimiento y contraste en pantallas reales.
3. Guardar un respaldo elegido en Archivos y recuperar en otra instalación; validar destinos reales de compartir PDF, CSV y JSON, cancelaciones y aplicaciones receptoras.
4. Arranque, listas grandes, uso prolongado y batería: misma carga inicial, brillo, tamaño de datos y escenario; comparar consumos en reposo y durante OCR/voz/respaldo. No extrapolar del simulador.
5. Revisar contratos de privacidad de las tiendas, permisos, documentación de recuperación, recursos gráficos oficiales y firma de compilaciones de distribución.
6. Validar mapa completo del PDF, redondeos oficiales y componentes contributivos que continúan fuera de alcance. La revisión puede registrarla el usuario; no se impone un CPA como bloqueo de cálculo.
7. Completar los recorridos nativos comerciales restantes (movimientos/recibos, IVU/contratistas y panel/escenarios) y su revisión física antes de dar por finalizada Negocio. Los formularios de nómina cuentan con seguimiento móvil específico. No publicar ni fusionar main durante estas etapas.

## Límites vigentes

No existe radicación automática ni certificación de Hacienda. Las compilaciones disponibles son para emulador Android x86_64 y simulador iOS; todavía no son paquetes firmados para teléfonos ni TestFlight. Las tablas 2025 no se aplican a 2026. La determinación de elegibilidad e importes de crédito por trabajo, contribución básica alterna y demás anejos no está automatizada. El saldo de la línea 31 sí se calcula con todos los componentes declarados; sus campos vacíos quedan pendientes. PDF de borrador y exportaciones son documentos legibles por elección del usuario; un respaldo de recuperación es un archivo distinto y cifrado.


## Seguimientos actuales de Negocio

| Área | Evidencia disponible | Pendiente |
| --- | --- | --- |
| Empleados y tasas patronales | Formularios guardados y reabiertos en simuladores Android/iOS | Dispositivos físicos, lectores de pantalla y casos patronales fuera del alcance |
| Pagos y depósitos de nómina | Importes reales separados del cálculo, depósitos parciales y reapertura comprobados en ambos simuladores | Conciliación con trámites y documentos reales del patrono |
| Exportación de nómina | CSV/PDF Android leídos por receptor local aislado; popovers iOS abiertos/cancelados; seis casos de lógica seleccionados | Destinos reales, impresión y formato de emisión oficial |
| Recuperación con Negocio y nómina | Prueba integrada de archivo cifrado hacia base SQLite vacía, imagen y relaciones; reapertura y continuación de depósitos | Selección/guardado desde Archivos y recuperación entre teléfonos físicos |
| IVU, contratistas y panel comercial | Dominio y almacenamiento implementados; informes propios con alcance y fuentes | Interacción nativa completa y pruebas físicas |

[Pagos móviles](stages/NEGOCIO-05-PAGOS-MOVIL.md) · [Tasas y exportaciones móviles](stages/NEGOCIO-05-TASAS-EXPORTACION-MOVIL.md) · [Recuperación integrada](stages/CIERRE-RESPALDO-NEGOCIO.md).

Los números de pruebas de los informes históricos corresponden a sus bloques anteriores. El límite vigente es de 100 casos por bloque, incluidas repeticiones y CI; se seleccionan pruebas relevantes y no se ejecuta la suite general.
