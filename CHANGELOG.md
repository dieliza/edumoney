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
