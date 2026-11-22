# Formulario y teclado web — 22 noviembre 2026

La grabación del usuario (4,1 s) muestra el formulario Nueva transacción desplazándose al enfocar Importe: teclado iOS aparece y Guardar/cerrar salen del área visible. No se observa ingreso de dígitos en la grabación; el problema visible ocurre al enfocar y abrir teclado.

Se ajusta exclusivamente el contenedor Sheet web a visualViewport.height/offsetTop, con resize/scroll agrupados por animationFrame, sin scrollIntoView, refocus, remount, recarga ni cambios financieros. Native mantiene KeyboardAvoidingView. Se eliminan listeners y frames al cerrar y se conserva el fallback cuando visualViewport no existe.

Base de publicación: versión 84, Worker recuperado del hosting; parche solo factory 797, demás factories y backend conservados. Recursos nuevos y caché keyboard-85-20261122, registro canónico /sw.js, manejadores push y activación segura preservados.

Validación: tres pruebas específicas aprobadas (apertura/cierre/pan, coalescencia/limpieza, fallback); TypeScript y ESLint aprobados. Se verifica por separado que los factories publicados ejecutan y que precache/aliases son válidos. No hay navegador iPhone disponible para repetir físicamente el recorrido; no se afirma validación visual en dispositivo.

Publicación: versión 85; commit de aplicación d6a8e4b; hosting 6905f7b04b3af473d56e1be9cdd33052f086e0ee. Verificador: 21 aliases de Sheet ejecutados, factories ajenos y backend sin cambios. Presupuesto consumido conservador: 3 pruebas unitarias + 21 ejecuciones de render + 1 comprobación de entrega = 25, sin suites generales.
