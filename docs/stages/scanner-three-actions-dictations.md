# Escáner y Mis dictados — 2026.11.15.13

## Implementación
- Tres botones Neon iguales en una fila: Tomar fotos, Buscar en fotos e Historial de documentos. Nuevo icono original de galería multicolor, con apariencia coherente con Home; mismos handlers y atributos de captura.
- Eliminados el botón Corregir con nuevo comprobante o texto y el estado/banner de corrección que dejaba el escáner mostrando un dictado.
- La lista y los detalles del escáner excluyen source=voice. Registros y vínculos permanecen almacenados; sin migraciones ni recálculos.
- Pantalla independiente /dictations, con acceso Mis dictados debajo del micrófono en Home. Reutiliza VoiceDraftList con editar, borrar y guardar. Se retira solo el acceso Mis dictados del formulario Gasto/Ingreso; conserva ambos historiales financieros y sus editores.
- Los enlaces existentes de notificaciones /documents?source=voice redirigen a /dictations conservando el ID. No se altera el guardado de dictados claros, ambiguos, notificaciones ni importes.

## Verificación
14 casos ejecutados, todos aprobados, sin repeticiones: separación de registros (1), navegación de compatibilidad (2), header/scanner (2), acciones Neon (1), formulario/historiales (4), Home y acceso independiente (4). Inferior al máximo de 100. No se ejecutó la suite general ni receipt-labels.
TypeScript, ESLint y build web/PWA correctos; diff sin errores. Revisión de efectos, limpieza de suscripciones al perder foco, controles accesibles y reutilización de componentes existentes.
Pendiente prueba visual/cámara en iPhone, iPad, Android y PWA instalada: este entorno no dispone de navegador o dispositivos físicos. No se afirma validación física.

## Alcance
Sin cambios en autenticación, permisos, claves, APIs, modelo Anthropic, cálculos, base de datos ni cobros. Reversión por commit; ningún dato eliminado.

## Publicación
Implementación f277c68, rama web-edumoney. Hosting cf15898bffd6a43d3e4f63f37b8737ec6061a46b. Sites versión 53, guardada como appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_bdd9332f15c08191bcb39f9ee3ee08db. Deployment appgdep_6af9bbcaab0c819191b6b89c0ec12516: succeeded. Revisión de entorno 1 conservada. URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
