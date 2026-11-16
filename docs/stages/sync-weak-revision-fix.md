# Aviso persistente de respaldo — 2026.11.16.4

## Causa verificada en producción
El 16 de noviembre de 2026, PUT /api/sync devolvía 428 repetidamente aproximadamente cada 30 segundos (03:23:16 a 03:26:01 UTC). Ejemplo: request 413d8d14b9a3a3f3604abf47bec9a452, 03:26:01.139 UTC. El encabezado If-Match tenía el formato W/"<revisión hexadecimal>". El validador del servidor solo admitía la forma fuerte "<revisión>" y rechazaba la solicitud antes de escribir. El cliente traducía 428 al genérico local, de ahí el mensaje de la captura. No era evidencia de pérdida de datos locales ni fallo de Anthropic.

## Corrección acotada
- Cliente y servidor usan una revisión de objeto estable X-EduMoney-Sync-Version, independiente de cambios en ETag por representación/transporte. Se mantiene ETag para clientes anteriores.
- Compatibilidad de servidor para clientes existentes que ya envían W/: se valida estrictamente el identificador subyacente y se sigue pasando a la comparación condicional atómica de R2. Revisión antigua devuelve 412; nunca se omite onlyIf ni se acepta comodín/lista.
- GET y confirmaciones indican no-transform. Clientes nuevos prefieren la revisión estable, con respaldo compatible de ETag fuerte/débil.
- Upload, descarga confirmada, resolución de conflictos y eliminación explícita usan la misma revisión canónica. 428 se clasifica como fallo de versión, no como problema local genérico.
- No se oculta el aviso a ciegas ni se detienen reintentos: el controlador existente lo retira al confirmar éxito. No cambian autenticación, códigos, cifrado, límites, facturación, Anthropic, cálculos o datos del usuario.

## Validación local
20 casos correctos: servidor 9, integración cliente de dos dispositivos cifrados 1, controlador 6, diagnósticos 2 y revisión 2. Incluye ETag debilitado en la respuesta de descarga, compatibilidad de cliente anterior, escrituras y borrados obsoletos bloqueados, entradas mal formadas rechazadas, copias de varios MB, separación por secreto y ausencia de duplicados. Datos ficticios, sin llamadas a Anthropic. No se ejecutó suite general.
TypeScript, ESLint y compilación se registran al publicar. Prueba en Safari/iPad físico pendiente; el entorno no dispone de navegador/dispositivo para QA visual. La consulta de logs no leyó cuerpos, claves ni datos financieros privados.

## Publicación y prueba real
- TypeScript, ESLint sin avisos, diff --check, compilación web/PWA y sintaxis del Worker: correctos.
- Implementación fca7ee8, rama web-edumoney; hosting bc13aa099b258c560d34cdda9d7c5e3fb9bfe9e5.
- Sites versión 60: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_ebf2004403748191aaa9418a9a275464.
- Despliegue appgdep_6afa7959b0408191896ab2bea26f439f succeeded, configuración existente conservada, env_set_revision=1.
- URL https://edumoney-web.diegoluissantospabon.chatgpt.site, versión 2026.11.16.4.
- Prueba real aislada con código aleatorio nuevo y sobre AES-256-GCM/PBKDF2 ficticio: crear PUT204, leer GET200 con contenido idéntico y revisión estable, actualizar con W/ PUT204, reintento con revisión anterior PUT412, limpieza condicional DELETE204. Nunca se leyó ni modificó una copia de usuario.
- Primer arranque del ejecutor no importó TS por resolución local de extensión y terminó antes de realizar solicitudes. Se corrigió exclusivamente ese ejecutor usando WebCrypto estándar. Conteo conservador: 20 casos automatizados y 2 intentos de recorrido operativo, 22 en total.
- Los logs posteriores todavía no ofrecen confirmación de la copia específica del usuario. No se afirma que ya se haya completado su respaldo: el controlador sigue reintentando y retirará el aviso al confirmar éxito.
