# Visibilidad de actualizaciones — 2026-11-14

El propietario informó que seguía viendo el diseño anterior. Sites confirmó versión de alojamiento 31 activa; el código previo había sido verificado en el servidor, pero no en su dispositivo. Se solicitó la dirección que abre para distinguir enlaces/vistas anteriores. No se puede afirmar cuál es la causa exacta en su navegador sin esa respuesta.

Se identificaron dos defectos de distribución que pueden retener versiones: el registro del service worker tenía una URL estática que el propio worker cacheaba, y no avisaba ni ofrecía activar un worker en espera mientras la app permanecía abierta.

Corrección compatible en versión de aplicación 2026.11.14.14:

- Registro estático con parámetro de versión para evitar recuperar el registrador antiguo de la caché.
- Consulta de actualización sin caché del navegador.
- Aviso «Actualizar EduMoney» cuando existe una actualización; explica guardar primero el formulario abierto. No recarga automáticamente otra pestaña ni descarta formularios sin pulsación del usuario.
- Worker acepta activar la actualización solicitada y la pestaña que la solicitó recarga una sola vez. Se mantiene una caché estática previa para pestañas anteriores; no se toca IndexedDB, contraseñas ni registros financieros.
- Número de versión visible en el menú lateral y acceso local existente.

Cinco pruebas de pwa-update.test.ts aprobadas (simulación del ciclo de registro/actualización, sin navegador físico): aviso, activación y recarga única, otra pestaña, primera instalación/actualización posterior y desconexión. TypeScript, ESLint y compilación web aprobados. No se ejecutó la suite completa ni se repitieron las pruebas anteriores de rediseño.

Sin cambios de API, autenticación, lógica financiera o migraciones. Sin eliminación de datos de usuario. Pendiente confirmar el enlace y el comportamiento en el dispositivo del propietario; este entorno no dispone de navegador interactivo soportado.
