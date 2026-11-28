# Investigación contributiva mensual

La instrucción del propietario reemplaza la revisión semanal por investigación y revisión mensual de fuentes gubernamentales oficiales para jurisdicciones ya activadas. Se conserva la investigación inicial bajo demanda y la aprobación exclusiva del propietario antes de aplicar reglas nuevas o modificadas. No se investigan anticipadamente los 50 estados.

Se actualizó la misma automatización existente, sin duplicarla: día 1 de cada mes a las 08:00 America/Puerto_Rico, próxima fecha 2026-12-01. La automatización educativa permanece intacta.

El servidor reutiliza la investigación dentro del mismo mes calendario de Puerto Rico; ya no vence después de siete días. Se actualizaron la descripción de la herramienta y la regla permanente en AGENTS.md. Las evidencias anteriores de revisión semanal son históricas y quedan sustituidas por esta instrucción.

Validación: 9 casos del servicio de reglas, TypeScript, ESLint y sintaxis correctos. El empaquetado comprueba todos los módulos del cliente sin cambios y conserva los activos, los manejadores del service worker y todas sus rutas; solo renueva su nombre de caché para la publicación. No se cambian saldos, transferencias ni cálculos contributivos.

Este cambio de frecuencia no verifica ni declara resuelta la incidencia anterior del control de ejecución inmediata (404).

Publicado como versión 157, fuente `570bfa04e487c134a295bb076d3bbf179d25bcb1`, entorno 4 y audiencia pública conservados. Se comprobó el nuevo service worker en producción. El endpoint MCP sigue requiriendo autenticación (401); la descripción mensual se comprobó en el artefacto publicado. La primera comprobación HTTP esperaba incorrectamente metadatos MCP públicos y se corrigió esa expectativa. La programación mensual se confirmó tanto en Automations como en el Site, conservando la tarea educativa.
