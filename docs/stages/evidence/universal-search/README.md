# Búsqueda universal, descripción y ayudas — 2026-11-25

Rama: `feat/universal-search-help` (basada en `42a5e7d`).

## Implementación

- Lupa compartida en HeaderActions. Ventana local con búsqueda por palabras, acentos, fechas ISO/DD-MM-AAAA/MM-DD-AA, mes, importe y categoría; filtros por sección y resultados paginados sin limitar la consulta a los 50 registros visibles.
- Índice temporal del perfil desbloqueado: transacciones, categorías, documentos/dictados, facturas, deudas, metas, programaciones, lecciones, escenarios y metadatos comerciales. Solo lecturas en la conexión existente. No envía consultas a servicios ni indexa claves, imágenes, perfiles familiares o identificadores del empleado.
- Opciones por resultado y enlaces al registro cuando existe soporte: editor personal, revisión comercial con su titular original, deuda, factura, meta, documento, dictado, lección y escenario. Otros resultados abren su sección. Las transacciones eliminadas se identifican y no ofrecen edición.
- Descripción opcional visible en ingresos/gastos. El gasto personal ahora persiste el texto escrito; si queda vacío utiliza la categoría. Se reutilizan las validaciones y la protección contra pulsaciones repetidas.
- «¿Qué significa?» desplegable por pantalla y junto a campos técnicos. Explica qué introducir, incluyendo tasa nominal anual, APR, principal, plazo, pronto y cobertura. Respeta Claro/Oscuro/Automático y excluye las rutas comerciales y su ayuda existente.

No se crearon tablas, APIs ni servicios. No se cambiaron cálculos, sincronización ni reglas de clasificación.

## Verificaciones

22 casos distintos aprobados; 28 ejecuciones incluyendo 6 fallos iniciales del montaje de pruebas (categoría ya sembrada e identificador de botón incorrecto), corregidos. El presupuesto conservador con el bloque anterior es 93/100.

- `tests/universal-search.test.ts`: 12 casos (10 iniciales, luego dos casos dirigidos para privacidad del empleado y revisión comercial).
- `tests/expense-description-ui.test.ts`: 3 casos, con MoneyStore y SQLite reales; guardar/editar descripción, texto opcional, búsqueda y pulsaciones duplicadas.
- `tests/universal-search-ui.test.ts`: 3 casos; lupa → buscar → opciones → navegación/cuenta, contraste de explicación en ambos temas y exclusión de Negocio.
- `tests/transaction-history-ui.test.ts`: 4 casos existentes aprobados.
- TypeScript sin errores; ESLint sin errores. Advertencia previa ajena al alcance en `scripts/patch-home-controls-site.cjs` (`req` sin usar).
- `git diff --check` sin errores.

Pendiente: revisión visual en Safari/iPhone, Android/iPad y empaquetado de esta nueva versión web. Estas funciones nuevas aún no se han publicado. No se usó un navegador alternativo al flujo de Sites.

## Publicación anterior autorizada

Se publicó la versión **106**, exclusivamente con crear métodos de pago en ingresos y registrar lectura al continuar. Fuente de la app: `42a5e7d`. Fuente de alojamiento: `404388d5dcfdfabfba486df69098092c1178d0a9`.

- Versión: `appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_0b6428d8b7f881919fcc209f44ac059c`.
- Despliegue: `appgdep_6b06f21187308191b496494822bd0884`, estado `succeeded`.
- URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Se conservó el acceso público y el trabajo ajeno sin confirmar en `/workspace/sites/edumoney-web`.
- El servidor rechazaba el Worker por superar 32 MiB por archivo. El mapa CONTENT se separó sin cambiar sus 129 recursos en `worker/content.js` (29.15 MB); el código queda en `worker/index.js` (4.64 MB). El build copia ambos módulos. Sintaxis y build aprobados; nuevo commit reemplazó el intento rechazado antes del push.
- No se suministró archivo tar por falta de espacio local; Sites completó el build remoto.
- Las herramientas de empaquetado anteriores que buscan CONTENT dentro de index.js deben adaptarse al módulo separado antes de reutilizarlas; no ejecutar ciegamente sobre v106.
