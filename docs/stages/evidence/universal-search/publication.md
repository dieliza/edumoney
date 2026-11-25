# Publicación autorizada — 2026-11-25

Autorización del usuario: «publica los cambios».

Aplicación: `9524ec8`. Paquete corregido: `universal-search-a0e20e746e99`, integrado sobre la versión pública 106, sin sobrescribir el checkout con trabajo ajeno.

Herramientas reproducibles: `web-enhancements/universal-search/package-search.cjs` y `check-packaged.cjs`. El empaquetador conserva las funciones financieras, premios, fuegos artificiales y métodos de pago ya publicados; mantiene los selectores web existentes. Añade enlaces a registros en los módulos de las pantallas existentes.

Verificación del paquete: seis casos aprobados con las factorías reales del artefacto (SQLite, lupa/opciones/navegación, contraste y exclusión de Negocio, apertura exacta, descripción/controles y preservación de los módulos financieros/premios). Un recorrido adicional del Worker compilado comprobó portada, 107 recursos, sintaxis JS, registro canónico y alias del service worker. Se conservaron los manejadores de push y de actualización segura; no se borran datos ni se recargan formularios automáticamente.

En este bloque nuevo de publicación autorizado por el usuario se ejecutaron 25 casos conservadoramente, incluidas repeticiones y dos fallos del montaje del nuevo caso de Goals. Sigue dentro del máximo de 100 por bloque. No se relanzó la suite completa. TypeScript aprobado. ESLint aprobado para las herramientas nuevas; el lint general solo conserva la advertencia previa de `req` sin usar en `scripts/patch-home-controls-site.cjs`.

La primera publicación (107) se retiró al detectar que el enlace de búsqueda se insertaba antes de inicializar el estado de Mis metas. Se restableció la versión 106 mediante `appgdep_6b06f6d15f508191baea0ea040530b54` (succeeded). El empaquetador ahora inserta la integración después de declarar el estado; se añadió un séptimo caso que ejecuta la función real de la pantalla Goals del artefacto, junto con su gancho de presupuesto previo. Se repitieron las verificaciones del paquete y de los 107 recursos tras la corrección. No se modificó la lógica financiera ni ningún registro.

No hubo revisión visual en un teléfono físico: no está disponible el controlador de navegador de Sites. Se mantuvo la adaptación de teclado/viewport ya existente. No se instaló ni usó un navegador alternativo.

También se conservaron las 34 rutas nuevas de recursos de la publicación intermedia, sin cambiar los scripts actuales, para que los clientes abiertos puedan actualizarse sin errores de recursos ausentes.

El código de recursos se distribuye en tres módulos CONTENT para respetar el límite de 32 MiB por archivo. La audiencia del sitio continúa pública.

Publicación final confirmada: **108**, estado **succeeded**, 2026-11-25 15:03:09 UTC.

- Fuente de alojamiento: `03a7449658b58361aa39ed3c9653cb34d2ade7e1`.
- Versión: `appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_ddba69512e0c81919f2d66b958dc9e8c`.
- Despliegue: `appgdep_6b06f86598288191baea44957cfb553c`.
- URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Audiencia pública conservada; build remoto utilizado por falta de espacio para empaquetar el tar localmente.
