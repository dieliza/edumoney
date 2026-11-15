# Respaldo grande y aviso incorrecto — 2026.11.15.16

## Diagnóstico verificado
Los logs reales de producción muestran PUT /api/sync con Content-Length 7953007 y RangeError: Maximum call stack size exceeded en RegExp.test dentro de handleSync. Ejemplo: 2026-11-15T20:31:35.286Z, request cacb375b199e22f649982e4c2969e224. GET devolvía 404 porque el PUT fallaba antes de guardar. No era evidencia de falta de conexión: la petición llegaba al servidor y el fallo estaba en el validador de la copia cifrada.
La expresión regular /^[a-f0-9]{32,}$/ sobre varios MB puede agotar la pila de V8. Las pruebas anteriores solo usaban copias pequeñas y no detectaron este caso. El controlador convertía cualquier excepción en un aviso de conexión, que además desaparecía/reaparecía durante cada reintento.

## Corrección
- Validación equivalente del texto hexadecimal: longitud mínima comprobada por separado y búsqueda de caracteres inválidos sin repetición recursiva. Conserva el mismo formato, cifrado, permisos, precondiciones y capacidad de almacenamiento existente.
- Errores de sincronización tipados: servidor, red, tiempo, acceso, versión, tamaño, conflicto o preparación local. No se atribuyen todos a conexión ni se exponen mensajes internos o datos privados.
- El estado de error permanece estable durante reintentos idénticos, sin volver a anunciarlo ni parpadear; se retira únicamente tras confirmar éxito. Los reintentos y los registros locales se conservan.
- No se borran fotos, registros, claves, códigos privados o copias existentes. Sin cambios en Anthropic, sus cuotas/configuración, cálculos, autenticación ni facturación.

## Verificación
16 casos automatizados aprobados, sin repeticiones: servidor sync (7), controlador (6), diagnóstico (2), integración cliente cifrada de dos dispositivos (1). Incluyen almacenar/leer un respaldo con 8 MiB de texto cifrado, rechazar un carácter inválido al final de otro respaldo grande conservando la copia anterior, y mostrar diagnóstico correcto sin repetir el aviso antes de un éxito confirmado. Datos ficticios; sin llamadas reales a Anthropic.
TypeScript, ESLint y build web/PWA correctos. Sin suite general ni receipt-labels. Comprobación física Safari/iPad pendiente; no hay navegador de pruebas disponible.
Comprobación operativa prevista: un código aleatorio nuevo, un respaldo ficticio realmente cifrado de unos 8 MB, envío/lectura/verificación de descifrado y retirada condicional de esa copia de prueba. Nunca se lee ni modifica la copia privada del usuario.

## Publicación y comprobación real
Implementación e0d8faf, rama web-edumoney. Hosting 2f6bc556c253af9cb5ac3e940e83d5f7fd716d84. Sites versión 56, guardada appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_0b507fc44f208191ab581955ca59087d. Deployment appgdep_6afa1902ddc0819189aedda5e86cb626: succeeded. Entorno revisión 1 y acceso público conservados.
URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
Prueba real aislada aprobada: 8388845 bytes de sobre AES-256-GCM/PBKDF2 cifrado, PUT 204, GET 200, ETag confirmado y descifrado idéntico al contenido ficticio original, retirada condicional DELETE 204. Código y claves aleatorios solo en memoria; no se leyeron ni modificaron copias del usuario. Sin llamadas a Anthropic. El objeto de prueba queda retirado mediante el mecanismo de borrado lógico existente.
Total: 16 casos automatizados y un recorrido operativo; por debajo de 100. La consulta posterior de logs todavía no mostró eventos recientes del usuario; por ello no se afirma que SU respaldo ya esté confirmado. El servidor quedó comprobado y la app reintentará automáticamente al continuar/volver. No se ocultó un error pendiente sin confirmación de éxito.
