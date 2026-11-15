# Menús compactos con selector flotante — 2026-11-15

Aplicación 2026.11.14.21.

El propietario mostró un menú que se extendía dentro del historial y pidió una lista flotante como el selector de su segunda imagen.

- SelectControl compartido sustituye los paneles insertados dentro de ActionMenu y Choices con presentación select.
- Web/PWA utiliza select/option nativos: el navegador abre su selector, mantiene la selección e implementa navegación por teclado, cierre al elegir y cancelación. Safari/iPad determina la apariencia exacta de su popover; no se imita una captura del sistema dentro de la página.
- El control cerrado tiene ancho máximo de 360 px, sin el panel exterior grande ni la lista de botones en el flujo del documento. ActionMenu no reserva espacio con flex:1 ni conserva la lista desplegada entre los registros.
- Los menús de acciones vuelven a su título después de ejecutar una opción, permitiendo elegir la misma acción otra vez. Se conservan IDs, etiquetas, callbacks y atributos de prueba de cada opción; no se retrasan los callbacks con temporizadores.
- En compilaciones nativas se proporciona un diálogo flotante limitado al ancho/alto, con marca de selección, desplazamiento, cierre al elegir, al tocar fuera o con la X. Requiere nueva compilación de APK para recibirlo.
- Las pestañas horizontales explícitas, el selector de categorías tipo rueda, la X de los formularios y el procesamiento de fotos permanecen intactos.
- Las validaciones mantienen missingField y aria-required/invalid, sin introducir required HTML que cambie el envío de formularios. No se selecciona ni guarda una opción desconocida automáticamente.

Sin migraciones, dependencias, cambios de API, autenticación, fórmulas o datos del usuario.

## Comprobaciones

Cuatro casos de native-select-control.test.ts aprobados: valor seleccionado/callback exacto, acción ejecutada una vez y repetible, validación/ID ajeno ignorado y estructura nativa con 300 opciones sin una lista de botones dentro de la página. TypeScript, ESLint y compilación Expo web/PWA correctos. No se ejecutó la suite completa.

Este entorno no dispone de navegador interactivo soportado ni iPad físico. No se afirma haber abierto el popover real de Safari ni probado la captura física de fotos desde una selección. El aspecto y los gestos del menú nativo deben comprobarse en el dispositivo.
