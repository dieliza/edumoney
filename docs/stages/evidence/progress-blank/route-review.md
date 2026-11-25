# Corrección de Mi progreso y revisión técnica de navegación

2026-11-25. Rama: fix/progress-blank-screen.

## Causa reproducida

La versión113 de ProgressScreen requería el módulo808 (goalPercent), localizado únicamente en el fragmento de Mis metas. Abrir Mi progreso directamente no registraba ese módulo. La prueba anterior precargaba todas las rutas y ocultaba el error. Se reprodujo la excepción antes de renderizar la pantalla usando exclusivamente los módulos del inicio y de la ruta solicitada.

La revisión de 31 fragmentos independientes detectó además que el componente compartido HomeBalancesAndCharts podía requerir ExpenseTopThree826, situado en el fragmento de Mi dinero. Se trasladaron808,809 y826 al fragmento común, conservando sus funciones originales sin cambios y eliminando sus definiciones del fragmento anterior. No existen definiciones duplicadas en el grafo activo.

## Cambios solicitados

- Retirados de Mi progreso el título, la introducción, el inicio, las tareas, las fechas y el resumen de Mi plan de 90 días.
- Retirada la referencia de ese plan en los términos de búsqueda de Mi progreso.
- Conservados los planes ya guardados, las metas y todos los registros financieros. No se ejecutaron borrados de datos, migraciones ni modificaciones de cálculos.

## Verificaciones completadas antes de publicar

- Revisión independiente de 31 fragmentos antes y después de la corrección: después no quedan las importaciones ausentes detectadas. Es una revisión de dependencias, no31 recorridos humanos en navegador.
- Reproducción del error808 con la carga directa real de la versión anterior.
- Protección de 1415 funciones de módulo no modificadas; solo Progress y las etiquetas de búsqueda cambian su código. Las tres funciones reubicadas permanecen idénticas.
- Tres pruebas del ciclo de vida del artefacto: carga inicial, actualización por aportaciones/reanudación y limpieza, y error de almacenamiento visible.
- Tres pruebas de renderizado de Progress, EducationPanel y los componentes UI reales: claro, oscuro y meta con 25%/fecha final junto a un plan anterior oculto. Solo se sustituyen fronteras de dispositivo, almacenamiento, navegación y controles de cabecera/formulario.
- 22 pruebas de tests/funds.test.ts y tests/goal-progress-ui.test.ts aprobadas. Cubren transferencias, integridad de balances, correcciones, reversión, duplicados, separación de cuentas, persistencia y progreso de metas.
- TypeScript, ESLint de los archivos fuente modificados y git diff --check aprobados.
- Compilación del Worker aprobada. Se conservan las rutas estáticas antiguas, los alias del service worker y su activación segura; nuevo identificador de caché.

Presupuesto del bloque:99 de100 casos, contando conservadoramente cada fragmento como un caso en cada pasada.92 antes de publicación;7 después: una comprobación HTTP incompleta (404 transitorio al activarse), una repetición de ese recurso (200), una comprobación conjunta de los recursos públicos (200) y cuatro renderizados de los componentes descargados de producción. No ejecutar más suites en este bloque.

Las cuatro comprobaciones públicas de renderizado pasan: Progress claro, Progress oscuro, meta con 25% y fecha final, y Top3 de categorías ordenadas por gasto acumulado. No quedan fallos detectados por estas comprobaciones.
## Alcance y límites

La revisión cubre las dependencias de las rutas publicadas y las pruebas financieras indicadas. No acredita cada interacción de cada pantalla, ni el acceso a dispositivos reales, notificaciones push, cámaras, micrófonos o sincronización entre dispositivos. El navegador de pruebas no está disponible en esta sesión. No se accedió a datos financieros del usuario ni se modificaron.

## Publicación

Fuente exacta enviada:0271a845abbfe45a9ef8aa15edf90ef20ae6dd10.
Versión114. Despliegue:appgdep_6b073a9da6808191b27966f7af9d6286.
Build:progress-route-288175f34fde.
Despliegue confirmado como succeeded el 2026-11-25T19:45:22Z, con revisión de entorno 4 preservada. La comprobación pública se registra en route-live-production.json cuando termina.
