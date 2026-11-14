# Educación financiera: implementación aprobada, 14 de noviembre de 2026

Alcance: ampliación de Aprende y Mi progreso; se mantienen las diez lecciones previas, Mis metas, lector de recibos, cálculos, autenticación local y registros contables. No se contratan servicios, planes ni recargas.

## Arquitectura y archivos

- `src/modules/education/{types,catalog,store,localStore}.ts`: catálogo verificado, caché privado, estados pendiente/leído/aprendido, intentos y premios permanentes. Cuenta lecciones anteriores acertadas incluso si se volvieron a marcar pendientes.
- `seed.json`: treinta consejos originales, ejemplos ficticios y preguntas; diez vigentes, diez de historial y diez revisados en reserva. Fuentes CFPB, fragmentos y fecha 2026-11-14. Revisión semántica de páginas impresas 29,32,34,36,39,43,45,50,61,67,78,82,85,87,91,94,100,103,108,125,131,132 del PDF oficial Your Money, Your Goals. Los enlaces usan la página PDF correspondiente (impresa + 1). No se reutiliza código de PR Budget ni se atribuyen tasas federales a Puerto Rico.
- `EducationPanel.tsx`: tarjetas, fuentes discretas, preguntas reintentables, barra de diez, historial, seis niveles, logros por metas, preferencia de animaciones y movimiento reducido. Celebración de 2.3 segundos que no bloquea navegación. Registro reclamado antes de mostrar; una vez por premio en la base local.
- `LearnScreen.tsx`, `ProgressScreen.tsx`: integración aditiva.
- `schemaV18.ts`, `migrate.ts`, `modules/backup/store.ts`: cinco tablas educativas nuevas; respaldo 18, lectura de respaldos 9–17. No se alteran tablas financieras. Migración transaccional. Una versión antigua de la app no debe abrir la base ya migrada; revertir requiere conservar una copia cifrada anterior. Restaurar un respaldo anterior al módulo restaura el estado educativo contenido en ese respaldo (no contiene premios nuevos).
- `web-server/education.mjs`: catálogo público sin datos personales, ciclo de 30 días, cola de conjuntos revisados, borradores, auditoría y alertas. Mantiene veinte consejos accesibles, archiva progresivamente el resto sin borrar progreso/premios privados.
- `EducationAdminScreen.web.tsx`, ruta `/education-admin`: configuración y revisión exclusivas del propietario. Reutiliza ApiKeyField para evitar el gestor de contraseñas. API existente recuperable del dispositivo solo mediante el botón explícito; copia del generador cifrada AES-256-GCM en R2, secreto maestro solo en entorno del servidor. Lector existente sin cambios.
- `/mcp`: `education_status` y `education_refresh`, autorizados mediante identidad de propietario validada por Sites. Actualización programada independiente del navegador. Endpoint de escritura HTTP también exige propietario; el público solo lee catálogo.
- `scripts/package-web-site.mjs`: empaqueta servicio y catálogo, sin secretos.

## IA y saldo

Anthropic `claude-haiku-5-5`, herramienta estándar no estricta, misma técnica compatible que el lector confirmado. Solo se mandan títulos y fragmentos públicos; nunca finanzas, fotos, talonarios ni progreso de personas. Un intento de generación por fecha de ciclo, reclamado con escritura condicional antes de llamar a la API. Máximo 8192 tokens de salida. No reintenta automáticamente un cargo fallido en el mismo ciclo. No llama APIs de facturación ni activa recargas. Estimación ilustrativa con la tarifa consultada: 50 mil tokens de entrada + 20 mil de salida ≈ $0.015; la cuenta real depende del consumo y tarifa del proveedor. El servidor no puede consultar ni garantizar el saldo disponible con la clave del lector.

La función se habilita desde ahora; el servidor inicial no tenía API configurada. El propietario debe abrir /education-admin desde el dispositivo que conserva su API y pulsar «Activar generación con mi API existente», o introducirla en ese formulario seguro. Nunca enviarla al chat. Esto no cambia la contraseña de EduMoney. El acceso editorial puede requerir la identidad propietaria de Sites, sin modificar el acceso local de los usuarios.

La IA solo propone. Para aprobar, el propietario revisa hechos, ejemplos, respuesta y respaldo documental de diez consejos. El servidor comprueba estructura, IDs de fuentes autorizadas y disponibilidad de enlaces, además de la confirmación semántica explícita. HTTP 200 por sí solo no declara exactitud. Si faltan revisión, saldo o API, conserva el catálogo vigente y muestra alertas administrativas.

## Automatización

Revisión diaria desde tarea de nube enlazada al Site. Invoca education_refresh y lee education_status; renueva solo si vencieron treinta días y hay diez consejos aprobados. No publica borradores. Los errores quedan en el panel editorial y la tarea informa los pendientes al propietario. No necesita email transaccional ni servicio de facturación. Confirmar conexión de la aplicación de herramientas del Site antes de declarar verificado el acceso desatendido.

## Límites que permanecen

- La sincronización cifrada existente intercambia bases completas por decisión del usuario. Incluye tablas educativas, pero no fusiona dos avances offline; elegir una copia antigua puede retroceder progreso. Garantizar premios/celebraciones exactamente una vez entre dispositivos offline exigiría coordinación adicional y no se modificó el módulo financiero para hacerlo.
- La revisión de nuevas propuestas requiere una persona. No se publican como verificadas por el solo hecho de generarlas.
- Sin navegador compartido disponible en este entorno: no se afirmarán pruebas físicas de Safari/PWA/Android ni animaciones visuales.
- El retiro de la clave del generador no retira la del lector; se administran de forma separada.

## Pruebas

Presupuesto máximo 100 ejecuciones. Primer lote: 65 casos, 64 correctos y un fallo en aislamiento de datos del catálogo de prueba. Se corrigió clonando la semilla para cada estado inicial. Repetición del archivo de servidor: 9/9 correctos. Consumo hasta entonces: 74 ejecuciones. Incluye aprendizaje, metas, respaldos, independencia entre bases, preservación de premios, rechazo de fuentes inventadas, fallos API, cifrado, autorización y actualización idempotente concurrente. Ver el registro final de comprobaciones y publicación al cerrar la etapa.

## Cierre de comprobaciones y publicación

- Casos automáticos distintos: 86. Ejecuciones automáticas totales: **96** (incluyen el fallo inicial corregido, repetición de nueve casos del servidor y una comprobación adicional del ciclo). Resultado final: todos los casos seleccionados correctos. El archivo de regresión del lector Anthropic expandió parámetros y ejecutó **21**, no doce; ya incluidos en el total. No ejecutar más suites de esta etapa.
- Se hicieron dos solicitudes de comprobación HTTP con urllib: el entorno devolvió 403 y no permitieron confirmar el comportamiento real del servidor. La comprobación posterior con curl confirmó **200**, diez consejos vigentes, diez históricos y 22 fuentes. Contabilidad conservadora incluyendo estas tres comprobaciones: **99 de 100**. No repetir recorridos.
- TypeScript, ESLint, `git diff --check`, compilación PWA y sintaxis del Worker empaquetado correctos. No se instalaron dependencias nuevas. No hubo llamada real facturada a Anthropic: las pruebas de generación usaron respuestas simuladas.
- No hay `cua_repl.js` en el entorno administrado; no se inició un servidor ni se instalaron navegadores para sustituirlo. Safari/iPhone/PWA, Android y la celebración visual requieren comprobación física posterior.
- PDF consultado SHA-256: `8436ebc592dfe2df560915d3454ad074cc9a3f995b3f3a199248ce32bc2c3c20`.
- Versión visible de app: **2026.11.14.07**. Hosting: versión **25**, commit `092d54dbd7925d3ec1ebe99fed86f3c35c7f9d6b`, versión guardada `appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_2834003b0d58819194f79bf3b57c8fb6`, despliegue `appgdep_6af7f72da3b8819185b56843451ec972`, **succeeded**, entorno revisión 1, audiencia pública conservada.
- Publicación: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Activación y revisión: https://edumoney-web.diegoluissantospabon.chatgpt.site/education-admin
- Tarea enlazada **Automation_b8e62d290afc8191a5fc79fcb79cf7ec**, habilitada, diaria a las **10:00 UTC** (06:00 Puerto Rico). Próxima ocurrencia guardada: 2026-11-14T10:00:00Z. La creación confirma calendario, **no una ejecución**.
- La publicación declara MCP y anuncia `/mcp`. Las herramientas educativas no aparecieron como conectadas en esta sesión y `get_site` solo devolvió URL MCP y recurso OAuth, sin ID de plugin que permita una instalación guiada. No se afirmó acceso desatendido verificado ni se eludió la autorización del propietario. La tarea informa este pendiente si continúa al ejecutarse. Puede requerir conectar la aplicación EduMoney del Site; la conexión editorial sigue pendiente de verificación.
- Estado IA: habilitada en servidor, secreto de cifrado y propietario configurados mediante secretos nativos, pero **la API financiada aún no está configurada en el servidor**. Solo existe en el dispositivo del usuario; se solicitó usar el botón administrativo para transferirla cifrada al generador. No se solicitan claves en chat ni se activan planes/recargas.
- GitHub `main` no se modificó. Cambios de aplicación en rama `web-edumoney`; `main` del repositorio separado de hosting contiene únicamente el despliegue aprobado.
