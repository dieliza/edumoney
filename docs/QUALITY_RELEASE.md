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
7. Completar y revisar Negocio antes de dar por finalizada la aplicación, según la instrucción del usuario. No publicar ni fusionar main durante estas etapas.

## Límites vigentes

No existe radicación automática ni certificación de Hacienda. Las compilaciones disponibles son para emulador Android x86_64 y simulador iOS; todavía no son paquetes firmados para teléfonos ni TestFlight. Las tablas 2025 no se aplican a 2026. La determinación de elegibilidad e importes de crédito por trabajo, contribución básica alterna y demás anejos no está automatizada. El saldo de la línea 31 sí se calcula con todos los componentes declarados; sus campos vacíos quedan pendientes. PDF de borrador y exportaciones son documentos legibles por elección del usuario; un respaldo de recuperación es un archivo distinto y cifrado.
